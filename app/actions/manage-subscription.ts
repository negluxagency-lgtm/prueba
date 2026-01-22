'use server'

import { redirect } from 'next/navigation'
import Stripe from 'stripe'
import { headers } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover',
})

export async function manageSubscription(email: string) {
    try {
        // Buscar cliente en Stripe por email
        const customers = await stripe.customers.list({
            email: email,
            limit: 1
        })

        if (customers.data.length === 0) {
            // Si no tiene cliente stripe (ej: está en periodo de prueba sin tarjeta)
            throw new Error("No hay suscripción activa asociada a este email.")
        }

        // Obtener el header referer de forma segura
        const headersList = await headers()
        const referer = headersList.get('referer')

        // Crear sesión del portal de facturación
        const session = await stripe.billingPortal.sessions.create({
            customer: customers.data[0].id,
            return_url: referer || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        })

        // Redirigir al portal de Stripe
        redirect(session.url)
    } catch (error) {
        console.error('Error al crear sesión de Stripe:', error)
        throw error
    }
}
