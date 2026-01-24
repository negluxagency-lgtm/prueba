import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/resend';

// ------------------------------------------------------
// 1. CONFIGURACIÓN
// ------------------------------------------------------

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
    typescript: true,
});

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

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const PLAN_MAPPING: Record<string, string> = {
    [process.env.STRIPE_PRICE_BASICO!]: 'Básico',
    [process.env.STRIPE_PRICE_PROFESIONAL!]: 'Profesional',
    [process.env.STRIPE_PRICE_PREMIUM!]: 'Premium',
};

// ------------------------------------------------------
// 2. EL WEBHOOK
// ------------------------------------------------------

export async function POST(req: Request) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        if (!signature || !webhookSecret) {
            return NextResponse.json({ error: 'Falta la firma o el secreto' }, { status: 400 });
        }
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`❌ Error de firma: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // CONTROL DE IDEMPOTENCIA
    try {
        const { error } = await supabaseAdmin
            .from('stripe_procesados')
            .insert([{ id: event.id }]);

        if (error && error.code === '23505') {
            console.log('⚠️ Evento ya procesado. Saltando...');
            return NextResponse.json({ received: true }, { status: 200 });
        }
    } catch (e) {
        console.warn('⚠️ No se pudo verificar duplicados (¿falta tabla stripe_procesados?)');
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
                    expand: ['line_items']
                });

                const userId = expandedSession.client_reference_id;
                const customerEmail = expandedSession.customer_details?.email;
                const stripeCustomerId = expandedSession.customer as string;
                const priceId = expandedSession.line_items?.data[0]?.price?.id;
                const customerName = expandedSession.customer_details?.name || 'Barbero';

                const planName = priceId ? PLAN_MAPPING[priceId] : 'Profesional';

                let updated = false;

                // 1. Intento por ID de Usuario (Más seguro)
                if (userId) {
                    const { data, error } = await supabaseAdmin
                        .from('perfiles')
                        .update({
                            plan: planName,
                            estado: 'pagado',
                            stripe_customer_id: stripeCustomerId,
                            ultimo_pago: new Date().toISOString()
                        })
                        .eq('id', userId)
                        .select();

                    if (!error && data && data.length > 0) updated = true;
                }

                // 2. Fallback por Correo
                if (!updated && customerEmail) {
                    const { data, error } = await supabaseAdmin
                        .from('perfiles')
                        .update({
                            plan: planName,
                            estado: 'pagado',
                            stripe_customer_id: stripeCustomerId,
                            ultimo_pago: new Date().toISOString()
                        })
                        .eq('correo', customerEmail)
                        .select();

                    if (!error && data && data.length > 0) updated = true;
                }

                if (updated) {
                    console.log(`✅ Usuario ${customerEmail || userId} activado con plan ${planName}`);

                    // Email de Bienvenida
                    if (customerEmail) {
                        try {
                            await sendEmail({
                                to: customerEmail,
                                subject: `¡Bienvenido a Nelux! Tu plan ${planName} ya está activo`,
                                html: `<h1>¡Bienvenido a Nelux, ${customerName}!</h1><p>Tu plan <strong>${planName}</strong> ya está activo.</p>`
                            });
                        } catch (e) {
                            console.error('⚠️ No se pudo enviar el email de bienvenida');
                        }
                    }
                } else {
                    console.error('❌ No se encontró el perfil para actualizar:', { userId, customerEmail });
                }
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                const stripeCustomerId = invoice.customer as string;

                if (invoice.billing_reason === 'subscription_cycle') {
                    await supabaseAdmin
                        .from('perfiles')
                        .update({
                            ultimo_pago: new Date().toISOString(),
                            estado: 'pagado'
                        })
                        .eq('stripe_customer_id', stripeCustomerId);

                    console.log(`✅ Renovación registrada para ${stripeCustomerId}`);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await supabaseAdmin
                    .from('perfiles')
                    .update({ estado: 'impago' })
                    .eq('stripe_customer_id', subscription.customer as string);

                console.log(`🛑 Suscripción cancelada para ${subscription.customer}`);
                break;
            }
        }

        return NextResponse.json({ received: true }, { status: 200 });

    } catch (err: any) {
        console.error('❌ Error interno del servidor:', err.message);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}