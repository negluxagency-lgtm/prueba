'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

// Define types for inputs
interface BookingData {
    slug: string
    serviceId: string
    date: string // YYYY-MM-DD
    time: string // HH:MM
    guestName: string
    guestPhone: string
}

interface ActionResponse {
    success: boolean
    error?: string
}

export async function bookGuestAppointment(data: BookingData): Promise<ActionResponse> {
    const { slug, serviceId, date, time, guestName, guestPhone } = data

    // 1. Get Client IP
    const headersList = await headers()
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')

    // Robust extraction: Forwarded first item > Real IP > Localhost fallback
    const ip = forwardedFor?.split(',')[0].trim() || realIp || '127.0.0.1'

    // Initialize Admin Client (Service Role)
    // NECESARIO para saltarse las políticas RLS si las hay, o para asegurar la inserción desde el servidor
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
        // 2. RATE LIMITING CHECK (Seguridad Anti-Spam)
        // Permitimos máx 3 citas por IP en la última hora
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

        const { count, error: countError } = await supabase
            .from('citas')
            .select('*', { count: 'exact', head: true })
            .eq('ip_address', ip)
            .gt('created_at', oneHourAgo)

        if (countError) {
            console.error('Error rate limit:', countError)
            // No bloqueamos si falla la comprobación técnica, pero lo logueamos
        }

        if (count !== null && count >= 3) {
            return {
                success: false,
                error: 'Demasiados intentos. Por favor espera una hora antes de volver a reservar.'
            }
        }

        // 3. Buscar el ID de la barbería usando el Slug
        const { data: profile, error: profileError } = await supabase
            .from('perfiles')
            .select('id')
            .eq('slug', slug)
            .single()

        if (profileError || !profile) {
            return { success: false, error: 'La barbería no existe o el enlace es inválido.' }
        }

        // 4. Validación básica
        // 4. Validación básica
        if (!guestName || !guestPhone || !date || !time) {
            return { success: false, error: 'Faltan datos requeridos.' }
        }

        // 4b. Obtener el precio del servicio seleccionado
        const { data: serviceData, error: serviceError } = await supabase
            .from('servicios')
            .select('precio')
            .eq('id', serviceId)
            .single()

        if (serviceError || !serviceData) {
            return { success: false, error: 'El servicio seleccionado no es válido.' }
        }

        // 5. Insertar la Cita
        // IMPORTANTE: No enviamos 'cliente_id' porque la columna no existe.
        // Mapeamos guestName -> nombre y guestPhone -> telefono
        // Columnas fecha -> Dia, Hora (User Request)
        const { error: insertError } = await supabase
            .from('citas')
            .insert({
                barberia_id: profile.id,
                Servicio_id: serviceId,
                Dia: date,            // YYYY-MM-DD
                Hora: time,           // HH:MM
                Nombre: guestName,    // Usamos las columnas existentes
                Telefono: guestPhone, // Usamos las columnas existentes
                Precio: serviceData.precio, // Auto-fill precio
                Automatica: true,     // Flag para distinguir reservas automáticas
                ip_address: ip        // Guardamos la IP para seguridad futura
            })

        if (insertError) {
            console.error('Error inserting appointment:', insertError)
            return { success: false, error: 'Error Supabase: ' + insertError.message }
        }

        // 6. Revalidar para que se actualice el calendario si alguien lo está viendo
        revalidatePath(`/${slug}`)

        return { success: true }

    } catch (error) {
        console.error('Unexpected error:', error)
        return { success: false, error: 'Ha ocurrido un error inesperado.' }
    }
}
