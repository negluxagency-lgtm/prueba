import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------
// 1. CONFIGURACIÓN
// ------------------------------------------------------

// ⚠️ CAMBIO CLAVE: Quitamos 'apiVersion' para que detecte la automática y no falle.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    typescript: true,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

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

// Mapeo seguro
const PLAN_MAPPING: Record<string, string> = {
    [process.env.STRIPE_PRICE_BASICO || 'dummy_basic']: 'Básico',
    [process.env.STRIPE_PRICE_PROFESIONAL || 'dummy_pro']: 'Profesional',
    [process.env.STRIPE_PRICE_PREMIUM || 'dummy_premium']: 'Premium',
};

// ------------------------------------------------------
// 2. EL WEBHOOK
// ------------------------------------------------------

export async function POST(req: Request) {
    console.log('--- [SISTEMA] Iniciando Webhook (Modo Auto) ---');

    const body = await req.text();
    const signature = req.headers.get('stripe-signature') as string;

    let event: Stripe.Event;

    // A. VALIDAR FIRMA
    try {
        if (!signature || !webhookSecret) {
            console.error('❌ Falta firma o secreto');
            return NextResponse.json({ error: 'Falta firma/secreto' }, { status: 400 });
        }
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`❌ Error de firma: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // B. EVITAR DUPLICADOS
    try {
        const { error } = await supabaseAdmin
            .from('stripe_procesados')
            .insert([{ id: event.id }]);

        if (error && error.code === '23505') {
            console.log('⚠️ Evento duplicado. Saltando...');
            return NextResponse.json({ received: true }, { status: 200 });
        }
    } catch (e) {
        // Ignoramos la falta de tabla para no bloquear el cobro
    }

    // C. LÓGICA DE NEGOCIO
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const sessionEvent = event.data.object as Stripe.Checkout.Session;

                // Expandir items
                const session = await stripe.checkout.sessions.retrieve(sessionEvent.id, {
                    expand: ['line_items']
                });

                const userId = session.client_reference_id;
                const customerEmail = session.customer_details?.email;
                const stripeCustomerId = session.customer as string;
                const priceId = session.line_items?.data[0]?.price?.id;

                const planName = (priceId && PLAN_MAPPING[priceId]) ? PLAN_MAPPING[priceId] : 'Profesional';

                console.log(`💰 Pago procesado para: ${customerEmail}`);

                let dbUpdated = false;

                // Intento 1: ID
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

                // Intento 2: Correo (Buscando en columna 'correo')
                if (!dbUpdated && customerEmail) {
                    const { data, error } = await supabaseAdmin
                        .from('perfiles')
                        .update({
                            estado: 'pagado',
                            plan: planName,
                            stripe_customer_id: stripeCustomerId,
                            ultimo_pago: new Date().toISOString()
                        })
                        .eq('correo', customerEmail)
                        .select();

                    if (!error && data && data.length > 0) dbUpdated = true;
                }

                if (dbUpdated) console.log('✅ Base de datos actualizada con éxito.');
                else console.error('❌ ERROR: No se encontró el usuario en Supabase.');

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