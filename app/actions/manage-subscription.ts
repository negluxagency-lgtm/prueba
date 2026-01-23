'use server'

import { redirect } from 'next/navigation'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover',
})

export async function manageSubscription(requestedEmail: string) {
    try {
        // 🛡️ SEGURIDAD: Verificar que el email solicitado sea el del usuario logueado
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || user.email !== requestedEmail) {
            console.error('Intento de acceso a Stripe no autorizado de:', user?.email, 'hacia:', requestedEmail)
            throw new Error("No estás autorizado para gestionar esta suscripción.")
        }

        // Buscar cliente en Stripe por email
        const customers = await stripe.customers.list({
            email: requestedEmail,
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
