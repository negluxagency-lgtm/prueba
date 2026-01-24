import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------
// 1. CONFIGURACIÓN
// ------------------------------------------------------

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
    typescript: true,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// CLIENTE SUPABASE ADMIN
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

// Mapeo de planes (con seguridad por si faltan variables)
const PLAN_MAPPING: Record<string, string> = {
    [process.env.STRIPE_PRICE_BASICO || 'price_dummy_1']: 'Básico',
    [process.env.STRIPE_PRICE_PROFESIONAL || 'price_dummy_2']: 'Profesional',
    [process.env.STRIPE_PRICE_PREMIUM || 'price_dummy_3']: 'Premium',
};

// ------------------------------------------------------
// 2. EL WEBHOOK
// ------------------------------------------------------

export async function POST(req: Request) {
    console.log('--- [SISTEMA] Webhook recibido ---');

    const body = await req.text();
    const signature = req.headers.get('stripe-signature') as string;

    let event: Stripe.Event;

    // A. VALIDAR FIRMA
    try {
        if (!signature || !webhookSecret) {
            return NextResponse.json({ error: 'Falta firma/secreto' }, { status: 400 });
        }
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`❌ Error de firma: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // B. EVITAR DUPLICADOS (Idempotencia)
    try {
        const { error } = await supabaseAdmin
            .from('stripe_procesados')
            .insert([{ id: event.id }]);

        if (error && error.code === '23505') {
            console.log('⚠️ Evento duplicado. Saltando...');
            return NextResponse.json({ received: true }, { status: 200 });
        }
    } catch (e) {
        // Ignoramos error si la tabla no existe para que no pare el cobro
    }

    // C. LÓGICA DE NEGOCIO
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const sessionEvent = event.data.object as Stripe.Checkout.Session;

                // Expandimos para ver productos
                const session = await stripe.checkout.sessions.retrieve(sessionEvent.id, {
                    expand: ['line_items']
                });

                const userId = session.client_reference_id;
                const customerEmail = session.customer_details?.email;
                const stripeCustomerId = session.customer as string;
                const priceId = session.line_items?.data[0]?.price?.id;

                const planName = (priceId && PLAN_MAPPING[priceId]) ? PLAN_MAPPING[priceId] : 'Profesional';

                console.log(`💰 Pago de: ${customerEmail} - Plan: ${planName}`);

                let dbUpdated = false;

                // 1. Intento por ID
                if (userId) {
                    const { data, error } = await supabaseAdmin
                        .from('perfiles')
                        .update({
                            estado: 'pagado',
                            plan: planName,
                            stripe_customer_id: stripeCustomerId,
                            ultimo_pago: new Date().toISOString()
                        })
                        .eq('id', userId)
                        .select();

                    if (!error && data && data.length > 0) dbUpdated = true;
                }

                // 2. Fallback por Correo (columna 'correo')
                if (!dbUpdated && customerEmail) {
                    const { data, error } = await supabaseAdmin
                        .from('perfiles')
                        .update({
                            estado: 'pagado',
                            plan: planName,
                            stripe_customer_id: stripeCustomerId,
                            ultimo_pago: new Date().toISOString()
                        })
                        .eq('correo', customerEmail) // <--- Confirma que tu columna es 'correo'
                        .select();

                    if (!error && data && data.length > 0) dbUpdated = true;
                }

                if (dbUpdated) console.log('✅ Base de datos actualizada.');
                else console.error('❌ No se encontró usuario para actualizar.');

                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                if (invoice.billing_reason === 'subscription_cycle') {
                    await supabaseAdmin
                        .from('perfiles')
                        .update({ ultimo_pago: new Date().toISOString() })
                        .eq('stripe_customer_id', invoice.customer as string);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await supabaseAdmin
                    .from('perfiles')
                    .update({ estado: 'impago' })
                    .eq('stripe_customer_id', subscription.customer as string);
                break;
            }
        }

        return NextResponse.json({ received: true });

    } catch (err: any) {
        console.error(`❌ Error Interno: ${err.message}`);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}