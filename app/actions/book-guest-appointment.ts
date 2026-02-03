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
        // 2. Buscar el ID de la barbería usando el Slug
        const { data: profile, error: profileError } = await supabase
            .from('perfiles')
            .select('id')
            .eq('slug', slug)
            .single()

        if (profileError || !profile) {
            return { success: false, error: 'La barbería no existe o el enlace es inválido.' }
        }

        // 3. Validación básica
        if (!guestName || !guestPhone || !date || !time) {
            return { success: false, error: 'Faltan datos requeridos.' }
        }

        // 4. Obtener el precio del servicio seleccionado
        const { data: serviceData, error: serviceError } = await supabase
            .from('servicios')
            .select('precio')
            .eq('id', serviceId)
            .single()

        if (serviceError || !serviceData) {
            return { success: false, error: 'El servicio seleccionado no es válido.' }
        }

        // 5. Insertar la Cita
        // CRÍTICO: El trigger de DB valida automáticamente el rate limiting (5 citas/hora por IP)
        // La IP se envía en el campo ip_address para que el trigger funcione correctamente
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
                ip_address: ip        // 🔒 CRÍTICO: IP requerida para rate limiting del trigger
            })

        if (insertError) {
            console.error('Error inserting appointment:', insertError)

            // Capturar específicamente el error del trigger de rate limiting
            if (insertError.message?.includes('Límite de citas excedido') ||
                insertError.message?.includes('rate_limit')) {
                return {
                    success: false,
                    error: 'Has superado el límite de reservas por hora. Por favor, inténtalo más tarde.'
                }
            }

            // Error genérico para otros casos
            return { success: false, error: 'No se pudo completar la reserva. Inténtalo de nuevo.' }
        }

        // 6. Revalidar para que se actualice el calendario si alguien lo está viendo
        revalidatePath(`/${slug}`)

        return { success: true }

    } catch (error) {
        console.error('Unexpected error:', error)
        return { success: false, error: 'Ha ocurrido un error inesperado.' }
    }
}
