import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia', // Best practice: explicit version
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.text()
  const headerList = await headers()
  const signature = headerList.get('stripe-signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error(`Webhook signature verification failed. ${err.message}`)
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Retrieve userId from metadata
        const userId = session.metadata?.userId
        const customerId = session.customer as string

        if (!userId) {
          console.error('Webhook Error: No userId in session metadata')
          return new NextResponse('Webhook Error: Missing userId', { status: 400 })
        }

        console.log(`Processing subscription for user ${userId}`)

        const { error } = await supabase
          .from('perfiles')
          .update({
            is_subscribed: true,
            estado: 'activo',
            stripe_customer_id: customerId,
          })
          .eq('id', userId)

        if (error) {
          console.error('Error updating profile (checkout):', error)
          return new NextResponse('Database Update Failed', { status: 500 })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        console.log(`Processing cancellation for customer ${customerId}`)

        const { error } = await supabase
          .from('perfiles')
          .update({
            estado: 'impago',
            is_subscribed: false,
          })
          .eq('stripe_customer_id', customerId)

        if (error) {
          console.error('Error updating profile (cancellation):', error)
          return new NextResponse('Database Update Failed', { status: 500 })
        }
        break
      }

      default:
        console.log(`Unhandled event type ${event.type}`)
    }
  } catch (err: any) {
    console.error('Webhook handler failed:', err)
    return new NextResponse('Webhook Handler Error', { status: 500 })
  }

  return NextResponse.json({ received: true })
}
