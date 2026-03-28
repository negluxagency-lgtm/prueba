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

// Función auxiliar para obtener el nombre del plan de forma robusta
async function getPlanName(priceId: string | undefined): Promise<string> {
    if (!priceId) return 'Básico';

    // 1. Intentar mapeo local (rápido)
    if (PLAN_MAPPING[priceId]) return PLAN_MAPPING[priceId];

    // 2. Fallback: Consultar Stripe para ver metadatos del producto
    try {
        console.log(`🔍 Consultando metadatos en Stripe para PriceID: ${priceId}`);
        const price = await stripe.prices.retrieve(priceId, { expand: ['product'] });
        const product = price.product as Stripe.Product;
        
        if (product.metadata && product.metadata.plan) {
            console.log(`✅ Plan detectado en metadatos: ${product.metadata.plan}`);
            return product.metadata.plan;
        }
    } catch (e) {
        console.error('⚠️ Error al recuperar producto de Stripe:', e);
    }

    // 3. Fallback final: Básico (más seguro que Profesional)
    console.warn(`⚠️ No se pudo determinar el plan para ${priceId}. Usando 'Básico' por defecto.`);
    return 'Básico';
}

// ------------------------------------------------------
// 2. EL WEBHOOK
// ------------------------------------------------------

export async function POST(req: Request) {
    console.log('--- [SISTEMA] Webhook de Stripe recibido ---');

    const body = await req.text();
    const headers = await req.headers;
    const signature = headers.get('stripe-signature') as string;

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

                const userId = session.client_reference_id; // UUID de Supabase Auth
                const customerEmail = session.customer_details?.email;
                const stripeCustomerId = session.customer as string;
                const customerName = session.customer_details?.name || 'Barbero';
                const priceId = session.line_items?.data[0]?.price?.id;

                const planName = await getPlanName(priceId);

                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('💰 [STRIPE] checkout.session.completed');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('📧 Email:', customerEmail);
                console.log('🆔 User ID (UUID):', userId);
                console.log('🏷️  Plan:', planName);
                console.log('💳 Stripe Customer ID:', stripeCustomerId);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                let dbUpdated = false;
                let profileData = null;

                // 1. PRIORIDAD: Búsqueda por UUID (método más confiable)
                if (userId) {
                    console.log(`🔍 [1] Buscando perfil por UUID: ${userId}`);

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

                    if (error) {
                        console.error('❌ Error al buscar por UUID:', error.message);
                        console.error('   Código:', error.code);
                    } else if (data && data.length > 0) {
                        console.log('✅ Perfil encontrado y actualizado por UUID');
                        dbUpdated = true;
                        profileData = data[0];
                    } else {
                        console.warn('⚠️ No se encontró perfil con ese UUID');
                    }
                }

                // 2. FALLBACK: Búsqueda por Email
                if (!dbUpdated && customerEmail) {
                    console.log(`🔍 [2] Fallback: Buscando por correo: ${customerEmail}`);

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

                    if (error) {
                        console.error('❌ Error al buscar por correo:', error.message);
                        console.error('   Código:', error.code);
                        console.error('   Detalles:', error.details);
                    } else if (data && data.length > 0) {
                        console.log('✅ Perfil encontrado y actualizado por correo');
                        dbUpdated = true;
                        profileData = data[0];
                    } else {
                        console.warn('⚠️ No se encontró perfil con ese correo');
                    }
                }

                if (dbUpdated && profileData) {
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('✅ ÉXITO: Base de datos actualizada');
                    console.log('   Barbería:', profileData.nombre_barberia);
                    console.log('   Estado:', profileData.estado);
                    console.log('   Plan:', profileData.plan);
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                    // Email de Bienvenida (Fire-and-forget para no bloquear a Stripe)
                    if (customerEmail) {
                        sendEmail({
                            to: customerEmail,
                            subject: `¡Bienvenido a Nelux! Tu plan ${planName} ya está activo`,
                            html: `<h1>¡Bienvenido a Nelux, ${customerName}!</h1><p>Tu imperio comienza ahora. Tu suscripción al <strong>Plan ${planName}</strong> ya está activa.</p>`
                        }).then(() => {
                            console.log('📧 Email de bienvenida enviado (Async)');
                        }).catch((e) => {
                            console.error('⚠️ Error envíando email bienvenida (Async):', e);
                        });
                    }
                } else {
                    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.error('❌ FALLO CRÍTICO: No se pudo actualizar el perfil');
                    console.error('   UUID buscado:', userId);
                    console.error('   Email buscado:', customerEmail);
                    console.error('   Acción: Verifica que el usuario exista en la tabla "perfiles"');
                    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                }
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                console.log(`💰 Pago de factura confirmado: ${invoice.id} (Razón: ${invoice.billing_reason})`);
                
                // Siempre actualizamos ultimo_pago si es un éxito
                const stripeCustomerId = invoice.customer as string;
                
                // Intentamos extraer el plan de los items de la factura para mantenerlo sincronizado
                const priceId = (invoice.lines.data[0] as any)?.price?.id;
                const currentPlan = await getPlanName(priceId);

                const { data, error } = await supabaseAdmin
                    .from('perfiles')
                    .update({
                        ultimo_pago: new Date().toISOString(),
                        estado: 'pagado',
                        plan: currentPlan // Aseguramos que el plan esté actualizado tras la renovación o cambio
                    })
                    .eq('stripe_customer_id', stripeCustomerId)
                    .select();

                if (error) {
                    console.error('❌ Error al actualizar tras pago de factura:', error);
                } else if (data && data.length > 0) {
                    console.log(`✅ Perfil actualizado tras pago de factura para: ${stripeCustomerId}`);
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                console.log(`🔄 Suscripción actualizada: ${subscription.id}`);

                const stripeCustomerId = subscription.customer as string;
                const priceId = subscription.items.data[0]?.price?.id;
                const currentPlan = await getPlanName(priceId);
                
                const status = (subscription.status === 'active' || subscription.status === 'trialing') 
                    ? 'pagado' 
                    : (subscription.status === 'past_due' ? 'impago' : 'vencido');

                const { error } = await supabaseAdmin
                    .from('perfiles')
                    .update({
                        plan: currentPlan,
                        estado: status
                    })
                    .eq('stripe_customer_id', stripeCustomerId);

                if (error) console.error('❌ Error al sincronizar cambio de suscripción:', error);
                else console.log(`✅ Plan sincronizado en actualización de suscripción: ${currentPlan}`);
                
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                console.log(`🛑 Suscripción eliminada: ${subscription.id}`);

                const { data, error } = await supabaseAdmin
                    .from('perfiles')
                    .update({ estado: 'impago' })
                    .eq('stripe_customer_id', subscription.customer as string)
                    .select();

                if (error) {
                    console.error('❌ Error al marcar impago:', error);
                } else if (data && data.length > 0) {
                    console.log(`✅ Perfil marcado como impago: ${subscription.customer}`);
                }
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
