import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/resend'; // Si tienes esto, déjalo. Si da error, coméntalo.

// ------------------------------------------------------
// 1. CONFIGURACIÓN (Iniciamos aquí para evitar fallos de importación)
// ------------------------------------------------------

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16', // Ponemos versión estable estándar
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// CLIENTE SUPABASE ADMIN (Para saltar seguridad RLS)
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

// Mapeo seguro (si no hay variables, usa strings por defecto para no crashear)
const PLAN_MAPPING: Record<string, string> = {
    [process.env.STRIPE_PRICE_BASICO || 'price_basico_dummy']: 'Básico',
    [process.env.STRIPE_PRICE_PROFESIONAL || 'price_pro_dummy']: 'Profesional',
    [process.env.STRIPE_PRICE_PREMIUM || 'price_premium_dummy']: 'Premium',
};

// ------------------------------------------------------
// 2. EL WEBHOOK
// ------------------------------------------------------

export async function POST(req: Request) {
    console.log('--- [SISTEMA] Petición POST recibida en /api/webhooks/stripe ---');

    const body = await req.text();
    const signature = req.headers.get('stripe-signature') as string;

    console.log(`--- [SISTEMA] Firma presente: ${!!signature} ---`);

    let event: Stripe.Event;

    // 1. VERIFICACIÓN DE FIRMA
    try {
        if (!signature || !webhookSecret) {
            console.error('❌ Falta firma o secreto de webhook');
            return NextResponse.json({ error: 'Configuración incompleta' }, { status: 400 });
        }
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`❌ Error de firma: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    const eventId = event.id;

    // 2. CONTROL DE IDEMPOTENCIA
    try {
        const { error: idempotencyError } = await supabaseAdmin
            .from('stripe_procesados')
            .insert([{ id: eventId }]);

        if (idempotencyError && idempotencyError.code === '23505') {
            console.warn(`⚠️ Evento ya procesado: ${eventId}. Omitiendo.`);
            return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
        }
    } catch (err: any) {
        console.warn('⚠️ No se pudo verificar duplicados (tabla no existe?), seguimos...');
    }

    // 3. LÓGICA DE NEGOCIO
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                console.log('--- 🟢 INICIO PROCESAMIENTO CHECKOUT ---');
                const sessionEvent = event.data.object as Stripe.Checkout.Session;

                // Recuperar sesión completa
                const session = await stripe.checkout.sessions.retrieve(sessionEvent.id, {
                    expand: ['line_items']
                });

                const userId = session.client_reference_id;
                const customerEmail = session.customer_details?.email;
                const stripeCustomerId = session.customer as string;
                const priceId = session.line_items?.data[0]?.price?.id;

                // Mapeo o fallback
                const planName = (priceId && PLAN_MAPPING[priceId]) ? PLAN_MAPPING[priceId] : 'Profesional';

                console.log(`💰 Procesando pago para: ${customerEmail} - Plan: ${planName}`);

                let dbUpdated = false;

                // 4A. Intento por ID (userId)
                if (userId) {
                    const { data, error } = await supabaseAdmin
                        .from('perfiles')
                        .update({
                            estado: 'pagado',
                            plan: planName,
                            stripe_customer_id: stripeCustomerId,
                            ultimo_pago: new Date().toISOString() // <--- ✅ AÑADIDO
                        })
                        .eq('id', userId)
                        .select();

                    if (!error && data && data.length > 0) dbUpdated = true;
                }

                // 4B. Fallback por EMAIL (Usando columna 'correo')
                if (!dbUpdated && customerEmail) {
                    console.log(`🔄 Intentando fallback por CORREO: ${customerEmail}`);

                    // OJO AQUÍ: Cambiado 'email' por 'correo'
                    const { data, error } = await supabaseAdmin
                        .from('perfiles')
                        .update({
                            estado: 'pagado',
                            plan: planName,
                            stripe_customer_id: stripeCustomerId,
                            ultimo_pago: new Date().toISOString() // <--- ✅ AÑADIDO
                        })
                        .eq('correo', customerEmail) // <--- ✅ CORREGIDO NOMBRE COLUMNA
                        .select();

                    if (!error && data && data.length > 0) dbUpdated = true;
                    else if (error) console.error('Error DB:', error);
                }

                if (dbUpdated) {
                    console.log(`✅ [ÉXITO] Perfil actualizado para ${customerEmail}`);

                    // Email Bienvenida (Protegido con try/catch)
                    if (customerEmail) {
                        try {
                            await sendEmail({
                                to: customerEmail,
                                subject: `Bienvenido a Nelux - Plan ${planName}`,
                                html: `<p>Tu cuenta ya está activa. ¡Gracias!</p>`
                            });
                        } catch (e) { console.warn('No se envió email (no crítico)'); }
                    }
                } else {
                    console.error('❌ NO se actualizó ningún perfil. Verifica si el correo coincide exactamente.');
                }
                break;
            }

            // CASO RENOVACIÓN MENSUAL (Importante para actualizar la fecha mes a mes)
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                if (invoice.billing_reason === 'subscription_cycle') {
                    const stripeCustomerId = invoice.customer as string;
                    await supabaseAdmin
                        .from('perfiles')
                        .update({ ultimo_pago: new Date().toISOString() })
                        .eq('stripe_customer_id', stripeCustomerId);
                    console.log(`✅ Renovación registrada para cliente Stripe: ${stripeCustomerId}`);
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

        return NextResponse.json({ received: true }, { status: 200 });

    } catch (err: any) {
        console.error(`❌ [ERROR CRÍTICO] ${err.message}`);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}