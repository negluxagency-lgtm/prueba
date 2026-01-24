¡Ah, vale! Si no existe el archivo, es normal que estuviéramos dando vueltas.Significa que(o lo borraste, o nunca llegamos a crearlo físicamente en el proyecto y solo estabas viendo los logs de Stripe).

Sin este archivo, tu web es sorda: Stripe le grita "¡Eh, te han pagado!", pero nadie escucha.

Vamos a crear el cerebro de tus cobros.

📍 Dónde ponerlo
En tu carpeta de Next.js(App Router), crea esta ruta de carpetas exacta: app -> api -> webhooks -> stripe -> route.ts

👨‍💻 El Código Maestro(Copia y Pega)
Este código es una joya: maneja el primer pago(Checkout) y las renovaciones mensuales(Invoice), y actualiza tu base de datos automáticamente.

Dile a tu IA que genere este archivo con el siguiente contenido(o cópialo tú):

TypeScript
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// 1. Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16', // O la versión que te sugiera la terminal
});

// 2. Inicializar Supabase ADMIN (Para saltarse las reglas de seguridad RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
    const body = await req.text();
    const sig = headers().get('stripe-signature') as string;

    let event: Stripe.Event;

    // 3. Verificar que la llamada viene REALMENTE de Stripe
    try {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
        console.error(`❌ Error de firma: ${err.message}`);
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // 4. Manejar los eventos
    try {
        switch (event.type) {

            // CASO A: PRIMERA COMPRA (Checkout completado)
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;

                // Datos clave
                const customerEmail = session.customer_details?.email;
                const stripeCustomerId = session.customer as string;
                // Aquí asumimos que mapeas el precio al nombre del plan, o lo sacas de metadata
                // Por simplicidad, si pagan 75€/100€ asumimos que es 'profesional' o lo que definas
                // Lo ideal es mirar session.amount_total o el ID del precio

                if (customerEmail) {
                    // Actualizamos el perfil buscando por email
                    const { error } = await supabaseAdmin
                        .from('perfiles')
                        .update({
                            stripe_customer_id: stripeCustomerId, // Guardamos el ID para futuros cobros
                            plan: 'profesional', // Ojo: Aquí deberías detectar qué plan es según el precio
                            estado: 'active',
                            ultimo_pago: new Date().toISOString() // FECHA ACTUALIZADA ✅
                        })
                        .eq('correo', customerEmail); // Buscamos por el email del cliente

                    if (error) console.error('Error actualizando perfil:', error);
                    else console.log(`✅ Usuario ${customerEmail} activado.`);
                }
                break;
            }

            // CASO B: RENOVACIÓN MENSUAL (Pago de factura exitoso)
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                const stripeCustomerId = invoice.customer as string;

                // Buscamos al usuario por su ID de Stripe (que guardamos en el paso A)
                const { error } = await supabaseAdmin
                    .from('perfiles')
                    .update({
                        estado: 'active',
                        ultimo_pago: new Date().toISOString() // FECHA ACTUALIZADA EN RENOVACIÓN ✅
                    })
                    .eq('stripe_customer_id', stripeCustomerId);

                if (error) console.error('Error renovando suscripción:', error);
                else console.log(`✅ Renovación procesada para ${stripeCustomerId}`);
                break;
            }

            // CASO C: PAGO FALLIDO (Tarjeta caducada, sin fondos...)
            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                const stripeCustomerId = invoice.customer as string;

                await supabaseAdmin
                    .from('perfiles')
                    .update({ estado: 'past_due' }) // Marcamos como moroso
                    .eq('stripe_customer_id', stripeCustomerId);
                break;
            }
        }
    } catch (error) {
        console.error('Error procesando webhook:', error);
        return new NextResponse('Error interno', { status: 500 });
    }

    return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
}