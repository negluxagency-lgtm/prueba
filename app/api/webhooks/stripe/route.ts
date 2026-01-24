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
    console.log('--- [SISTEMA] Petición POST recibida en /api/webhooks/stripe ---');

    const body = await req.text();
    const signature = req.headers.get('stripe-signature') as string;

    console.log(`--- [SISTEMA] Firma presente: ${!!signature} | Body length: ${body.length} ---`);

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
                console.log('--- 🟢 INICIO PROCESAMIENTO CHECKOUT ---');
                const sessionEvent = event.data.object as Stripe.Checkout.Session;

                // 1. Recuperar sesión completa con line_items expandidos
                // IMPORTANTE: Esto evita que line_items sea undefined
                const session = await stripe.checkout.sessions.retrieve(sessionEvent.id, {
                    expand: ['line_items']
                });

                const userId = session.client_reference_id;
                const customerEmail = session.customer_details?.email;
                const customerName = session.customer_details?.name || 'Barbero';

                console.log(`[Paso 1] Datos Sesión extraídos: userId=${userId}, email=${customerEmail}`);

                // 🔍 Identificar el plan comprado
                // Ahora usamos session.line_items directamente porque lo hemos expandido
                const priceId = session.line_items?.data[0]?.price?.id;

                console.log(`[Paso 2] Price ID obtenido: ${priceId}`);

                if (!priceId) {
                    console.error("❌ ERROR CRÍTICO: No se encontró priceId en lineItems");
                    return NextResponse.json({
                        error: "No se encontró priceId en lineItems (array vacío)",
                        details: "Stripe Session no devolvió productos. ¿Posible fallo de expansión?"
                    }, { status: 400 });
                }

                const planName = PLAN_MAPPING[priceId];
                console.log(`[Paso 3] Plan Mapeado: ${planName}`);

                if (!planName) {
                    const errorMsg = `ID de precio no reconocido: ${priceId}`;
                    console.error(`❌ ERROR CRÍTICO: ${errorMsg}`);
                    // Devolvemos el error al Dashboard de Stripe para que el usuario lo vea
                    return NextResponse.json({
                        error: errorMsg,
                        received_id: priceId,
                        expected_ids: Object.keys(PLAN_MAPPING),
                        solution: "Añade este ID a tu .env.local mapeado al plan correcto."
                    }, { status: 400 });
                }

                console.log(`💰 Pago completado: Plan [${planName}] para Usuario ID [${userId}] (${customerEmail})`);

                let dbUpdated = false;

                // 4A. Intento principal por USER ID
                if (userId) {
                    console.log(`[Paso 4A] Intentando actualizar por USER ID: ${userId}`);
                    const { error: updateError, data: updateData } = await supabaseAdmin
                        .from('perfiles')
                        .update({
                            estado: 'pagado',
                            plan: planName
                        })
                        .eq('id', userId)
                        .select(); // Select nos deja ver si realmente se actualizó alguna fila

                    if (updateError) {
                        console.error(`❌ [ERROR DB ID] Fallo actualizando por ID: ${updateError.message}`);
                        // No lanzamos error aun, intentamos por email
                    } else if (!updateData || updateData.length === 0) {
                        console.warn(`⚠️ [WARN DB ID] Supabase no devolvió filas actualizadas para ID: ${userId}. Posiblemente no existe o UUID incorrecto.`);
                    } else {
                        console.log(`✅ [ÉXITO] Perfil actualizado exitosamente por ID:`, updateData[0]);
                        dbUpdated = true;
                    }
                }

                // 4B. Fallback por EMAIL (si falló ID o no venía)
                if (!dbUpdated && customerEmail) {
                    console.log(`[Paso 4B] USER ID falló o nulo. Intentando fallback por EMAIL: ${customerEmail}`);
                    const { error: updateError, data: updateData } = await supabaseAdmin
                        .from('perfiles')
                        .update({
                            estado: 'pagado',
                            plan: planName
                        })
                        .eq('email', customerEmail)
                        .select();

                    if (updateError) {
                        console.error(`❌ [ERROR DB EMAIL] Fallo actualizando por Email: ${updateError.message}`);
                        throw updateError; // Si falla aquí también, lanzamos error total
                    }

                    if (!updateData || updateData.length === 0) {
                        console.warn(`⚠️ [WARN DB EMAIL] Fallback Email: No filas actualizadas para ${customerEmail}`);
                        throw new Error(`No se pudo actualizar perfil ni por ID ni por Email: ${customerEmail}`);
                    } else {
                        console.log(`✅ [ÉXITO] Perfil actualizado exitosamente vía EMAIL.`);
                        dbUpdated = true;
                    }
                }

                if (!dbUpdated) {
                    throw new Error("Fallo total: No se pudo actualizar el perfil del usuario (Ni por ID ni por Email)");
                }

                // 📧 EMAIL DE BIENVENIDA (Non-blocking)
                if (customerEmail) {
                    try {
                        console.log(`[Paso 5] Enviando email de bienvenida a ${customerEmail}...`);
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
        console.error(`❌ [WEBHOOK FATAL ERROR] ${err.message}`);

        // Intento de limpiar flag de idempotencia (protegido para evitar crash en cadena)
        try {
            await supabaseAdmin.from('stripe_procesados').delete().eq('id', eventId);
        } catch (cleanupErr) {
            console.warn('⚠️ No se pudo borrar el flag de idempotencia (posiblemente la tabla no existe).');
        }

        return NextResponse.json({
            error: 'Error CRÍTICO en la lógica del webhook',
            details: err.message,
            stack: err.stack ? err.stack.substring(0, 200) : 'No stack'
        }, { status: 500 });
    }
}
