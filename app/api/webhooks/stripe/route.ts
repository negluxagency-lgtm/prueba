import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { sendEmail } from '@/lib/resend';

// ------------------------------------------------------
// 1. CONFIGURACIÓN
// ------------------------------------------------------

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover', // Versión compatible con el SDK actual
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const PLAN_MAPPING: Record<string, string> = {
    [process.env.STRIPE_PRICE_BASICO || 'price_dummy_1']: 'Básico',
    [process.env.STRIPE_PRICE_PROFESIONAL || 'price_dummy_2']: 'Profesional',
    [process.env.STRIPE_PRICE_PREMIUM || 'price_dummy_3']: 'Premium',
};

// ------------------------------------------------------
// 2. EL WEBHOOK
// ------------------------------------------------------

export async function POST(req: Request) {
    console.log('--- [SISTEMA] Webhook de Stripe recibido ---');

    const body = await req.text();
    const signature = req.headers.get('stripe-signature') as string;

    let event: Stripe.Event;

    // A. VALIDAR FIRMA
    try {
        if (!signature || !webhookSecret) {
            console.error('❌ Falta firma o secreto de webhook');
            return NextResponse.json({ error: 'Falta firma/secreto' }, { status: 400 });
        }
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`❌ Webhook Error (Firma): ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    const eventId = event.id;

    // B. EVITAR DUPLICADOS (Idempotencia)
    try {
        const { error: idempotencyError } = await supabaseAdmin
            .from('stripe_procesados')
            .insert([{ id: eventId }]);

        if (idempotencyError) {
            if (idempotencyError.code === '23505') {
                console.log(`⚠️ Evento duplicado omitido: ${eventId}`);
                return NextResponse.json({ received: true }, { status: 200 });
            }
            throw idempotencyError;
        }
    } catch (e: any) {
        console.warn('⚠️ No se pudo verificar duplicados (¿falta tabla stripe_procesados?)');
    }

    // C. LÓGICA DE NEGOCIO
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const sessionEvent = event.data.object as Stripe.Checkout.Session;

                // Expandimos para ver productos vendidos
                const session = await stripe.checkout.sessions.retrieve(sessionEvent.id, {
                    expand: ['line_items']
                });

                const userId = session.client_reference_id;
                const customerEmail = session.customer_details?.email;
                const stripeCustomerId = session.customer as string;
                const customerName = session.customer_details?.name || 'Barbero';
                const priceId = session.line_items?.data[0]?.price?.id;

                const planName = (priceId && PLAN_MAPPING[priceId]) ? PLAN_MAPPING[priceId] : 'Profesional';

                console.log(`💰 Procesando pago: ${customerEmail} | Plan: ${planName}`);

                let dbUpdated = false;

                // 1. Intento por ID de Usuario
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

                // 2. Fallback por Correo (Arquitectura Nelux: columna 'correo')
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

                if (dbUpdated) {
                    console.log('✅ Base de datos actualizada con éxito.');

                    // Email de Bienvenida
                    if (customerEmail) {
                        try {
                            await sendEmail({
                                to: customerEmail,
                                subject: `¡Bienvenido a Nelux! Tu plan ${planName} ya está activo`,
                                html: `<h1>¡Bienvenido a Nelux, ${customerName}!</h1><p>Tu imperio comienza ahora. Tu suscripción al <strong>Plan ${planName}</strong> ya está activa.</p>`
                            });
                        } catch (e) {
                            console.error('⚠️ No se pudo enviar el email de bienvenida.');
                        }
                    }
                } else {
                    console.error('❌ Fallo crítico: No se encontró perfil para actualizar.', { userId, customerEmail });
                }
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                if (invoice.billing_reason === 'subscription_cycle') {
                    await supabaseAdmin
                        .from('perfiles')
                        .update({
                            ultimo_pago: new Date().toISOString(),
                            estado: 'pagado'
                        })
                        .eq('stripe_customer_id', invoice.customer as string);

                    console.log(`✅ Renovación registrada para: ${invoice.customer}`);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                // Al cancelar, pasamos a 'impago' (según useSubscription.ts)
                await supabaseAdmin
                    .from('perfiles')
                    .update({ estado: 'impago' })
                    .eq('stripe_customer_id', subscription.customer as string);

                console.log(`🛑 Suscripción cancelada: ${subscription.customer}`);
                break;
            }

            default:
                console.log(`ℹ️ Evento no manejado: ${event.type}`);
        }

        return NextResponse.json({ received: true }, { status: 200 });

    } catch (err: any) {
        console.error(`❌ [WEBHOOK FATAL ERROR] ${err.message}`);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
