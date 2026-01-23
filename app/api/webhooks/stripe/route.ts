import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { sendEmail } from '@/lib/resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// 🗺️ MAPEO DE PLANES (Vía Variables de Entorno)
// Esto permite cambiar de Test a Live solo cambiando el .env
const PLAN_MAPPING: Record<string, string> = {
    [process.env.STRIPE_PRICE_BASICO!]: 'Básico',
    [process.env.STRIPE_PRICE_PROFESIONAL!]: 'Profesional',
    [process.env.STRIPE_PRICE_PREMIUM!]: 'Premium',
};

export async function POST(req: Request) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') as string;

    let event: Stripe.Event;

    // 1. VERIFICACIÓN DE FIRMA
    try {
        if (!signature || !webhookSecret) {
            console.error('❌ Falta firma o secreto de webhook');
            return NextResponse.json({ error: 'Configuración de seguridad incompleta' }, { status: 400 });
        }
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`❌ Error de firma: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    const eventId = event.id;
    console.log(`🔔 Evento recibido: ${event.type} [ID: ${eventId}]`);

    // 2. CONTROL DE IDEMPOTENCIA
    try {
        const { error: idempotencyError } = await supabaseAdmin
            .from('stripe_procesados')
            .insert([{ id: eventId }]);

        if (idempotencyError) {
            if (idempotencyError.code === '23505') {
                console.warn(`⚠️ Evento ya procesado: ${eventId}. Omitiendo logic de negocio.`);
                return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
            }
            throw idempotencyError;
        }
    } catch (err: any) {
        console.error(`❌ Error chequeando idempotencia: ${err.message}`);
        return NextResponse.json({ error: 'Error interno al validar idempotencia' }, { status: 500 });
    }

    // 3. LÓGICA DE NEGOCIO SEGÚN EVENTO
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.client_reference_id;
                const customerEmail = session.customer_details?.email;
                const customerName = session.customer_details?.name || 'Barbero';

                // 🔍 Identificar el plan comprado
                const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
                const priceId = lineItems.data[0]?.price?.id;
                const planName = priceId ? (PLAN_MAPPING[priceId] || 'Básico') : 'Básico';

                console.log(`💰 Pago completado: Plan [${planName}] para Usuario ID [${userId}] (${customerEmail})`);

                if (userId) {
                    const { error: updateError } = await supabaseAdmin
                        .from('perfiles')
                        .update({
                            estado: 'pagado',
                            plan: planName
                        })
                        .eq('id', userId);

                    if (updateError) throw updateError;
                } else if (customerEmail) {
                    // Fallback por email si el ID no vino en el client_reference_id
                    const { error: updateError } = await supabaseAdmin
                        .from('perfiles')
                        .update({
                            estado: 'pagado',
                            plan: planName
                        })
                        .eq('email', customerEmail);

                    if (updateError) throw updateError;
                }

                // 📧 EMAIL DE BIENVENIDA (Non-blocking)
                if (customerEmail) {
                    try {
                        console.log(`📧 Enviando email de bienvenida a ${customerEmail}...`);
                        await sendEmail({
                            to: customerEmail,
                            subject: `¡Bienvenido a Nelux! Tu plan ${planName} ya está activo`,
                            html: `
                                <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; color: #ffffff; padding: 40px; border-radius: 16px; border: 1px solid #333;">
                                    <div style="text-align: center; margin-bottom: 30px;">
                                        <h1 style="color: #f59e0b; font-size: 24px; text-transform: uppercase; font-style: italic; margin: 0;">Nelux <span style="color: #fff;">Barbershop</span></h1>
                                    </div>
                                    
                                    <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 20px;">¡Tu Imperio Comienza Ahora, ${customerName}! 🚀</h2>
                                    
                                    <p style="color: #a1a1aa; line-height: 1.6; margin-bottom: 20px;">
                                        Recibimos correctamente tu pago. Tu suscripción al <strong>Plan ${planName}</strong> ya está activa y lista para potenciar tu barbería.
                                    </p>
                                    
                                    <div style="background-color: #18181b; padding: 20px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #27272a;">
                                        <p style="margin: 0; color: #fff; font-size: 14px;"><strong>Estado:</strong> <span style="color: #10b981;">Activo ✅</span></p>
                                        <p style="margin: 5px 0 0 0; color: #fff; font-size: 14px;"><strong>Plan:</strong> ${planName}</p>
                                    </div>
                                    
                                    <div style="text-align: center; margin-top: 40px;">
                                        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://app.nelux.es'}" style="background-color: #f59e0b; color: #000; padding: 14px 28px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block; text-transform: uppercase; font-size: 14px;">
                                            Ir a mi Dashboard
                                        </a>
                                    </div>
                                    
                                    <p style="color: #52525b; font-size: 12px; text-align: center; margin-top: 40px; border-top: 1px solid #333; padding-top: 20px;">
                                        Si tienes alguna duda, responde a este correo. Estamos aquí para ayudarte a crecer.
                                    </p>
                                </div>
                            `
                        });
                        console.log('✅ Email de bienvenida enviado correctamente.');
                    } catch (emailErr) {
                        console.error('⚠️ Error enviando email de bienvenida (No crítico):', emailErr);
                        // No lanzamos error para no reintentar todo el webhook
                    }
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
                const email = customer.email;

                console.log(`🛑 Suscripción cancelada para: ${email}`);

                if (email) {
                    const { error: updateError } = await supabaseAdmin
                        .from('perfiles')
                        .update({ estado: 'impago' })
                        .eq('email', email);

                    if (updateError) throw updateError;
                }
                break;
            }

            default:
                console.log(`ℹ️ Evento no manejado explícitamente: ${event.type}`);
        }

        return NextResponse.json({ received: true }, { status: 200 });

    } catch (err: any) {
        console.error(`❌ Error procesando lógica de negocio: ${err.message}`);
        // IMPORTANTE: Borramos el flag de idempotencia para que el reintento de Stripe pueda volver a entrar
        await supabaseAdmin.from('stripe_procesados').delete().eq('id', eventId);
        return NextResponse.json({ error: 'Error procesando el evento. Reintentando...' }, { status: 500 });
    }
}
