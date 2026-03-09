'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { BookingSchema } from '@/schemas/booking'

// Define types for inputs
interface BookingData {
    slug: string
    serviceId: string
    date: string // YYYY-MM-DD
    time: string // HH:MM
    guestName: string
    guestPhone: string
    barberId?: string // Optional: ID of the selected barber
    address_confirm?: string // Honeypot: must be empty
}

interface ActionResponse {
    success: boolean
    error?: string
    uuid?: string
}

export async function bookGuestAppointment(data: BookingData): Promise<ActionResponse> {
    // ── Zod Validation ─────────────────────────────────────────
    const parsed = BookingSchema.safeParse(data)
    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message || 'Datos de reserva inválidos.'
        return { success: false, error: firstError }
    }
    // ───────────────────────────────────────────────────────────

    const { slug, serviceId, date, time, guestName, guestPhone, barberId } = parsed.data

    // 0. Interceptar reservas para el perfil Demo
    if (slug.toLowerCase() === 'demo') {
        console.log('🤖 [Demo Mode] Interceptando reserva para el perfil demo. Simulando carga...');
        // Simulamos un tiempo de carga realista para la UX
        await new Promise(resolve => setTimeout(resolve, 800));
        console.log('🤖 [Demo Mode] Reserva simulada con éxito. No se guardó nada en DB.');
        return { success: true };
    }

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

        // 3.5 CRITICAL: Bloqueo de duplicados (Corte de Energía - Take 4)
        // Buscamos TODAS las citas futuras para esta barbería para filtrar con precisión quirúrgica
        const today = new Date().toISOString().split('T')[0]
        const cleanTargetPhone = guestPhone.replace(/\D/g, '')

        const { data: allFutureAppointments, error: pendingError } = await supabase
            .from('citas')
            .select('id, Telefono, cancelada')
            .eq('barberia_id', profile.id)
            .gte('Dia', today)

        if (pendingError) {
            console.error('Error fetching future appointments for validation:', pendingError)
        }

        if (allFutureAppointments && allFutureAppointments.length > 0) {
            const hasDuplicate = allFutureAppointments.some(apt => {
                // Si la cita está explícitamente cancelada, la ignoramos
                if (apt.cancelada === true) return false

                // Normalizamos el teléfono de la DB para comparar
                const dbPhone = String(apt.Telefono || '').replace(/\D/g, '')

                // Verificamos si coinciden (mismo número o uno contiene al otro, min 9 dígitos)
                if (dbPhone.length >= 9 && cleanTargetPhone.length >= 9) {
                    return dbPhone.endsWith(cleanTargetPhone) || cleanTargetPhone.endsWith(dbPhone)
                }
                return dbPhone === cleanTargetPhone
            })

            if (hasDuplicate) {
                return {
                    success: false,
                    error: 'Ya detectamos una cita activa para este número de teléfono hoy o en una fecha futura. Por favor, revisa tus citas o contacta con la barbería.'
                }
            }
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

        // 5. Get Service Duration for overlap check
        const { data: fullServiceData } = await supabase
            .from('servicios')
            .select('duracion')
            .eq('id', serviceId)
            .single()

        const serviceDuration = fullServiceData?.duracion || 30 // Default 30min

        // 6. Get Barber Name (Legacy Compatibility)
        // System historically stores barber NAME in 'barbero' column, not ID.
        let barberName = null
        if (barberId) {
            const { data: bData } = await supabase
                .from('barberos')
                .select('nombre')
                .eq('id', barberId)
                .single()
            if (bData) {
                barberName = bData.nombre
            }
        }

        // 7. CRITICAL: Validate no duplicate booking
        // STRATEGY CHANGE: Fetch ALL appointments for the day and filter in JS to avoid SQL mismatches
        const validationBarber = barberName || (barberId ? String(barberId) : null)

        if (validationBarber) {
            console.log('🔒 [Duplicate Check] Validating for:', validationBarber, 'on', date, 'at', time)

            // Fetch everything for this day/shop
            const { data: dayAppointments } = await supabase
                .from('citas')
                .select('Hora, duracion, barbero, Dia, id, cancelada')
                .eq('barberia_id', profile.id)
                .eq('Dia', date) // Only filter by day

            console.log(`🔍 [Duplicate Check] Verify logic: Found ${dayAppointments?.length || 0} total appointments for this day.`)

            if (dayAppointments && dayAppointments.length > 0) {
                // Filter in JS
                const conflictingAppointments = dayAppointments.filter((apt: any) => {
                    // 1. Check Cancellation
                    if (apt.cancelada) return false;

                    // 2. Check Barber (Case insensitive, trim)
                    const dbBarber = String(apt.barbero || '').trim().toLowerCase()
                    const targetBarber = String(validationBarber).trim().toLowerCase()

                    // Also check against ID just in case
                    const targetID = String(barberId || '').trim()

                    // Match Name OR ID
                    const isBarberMatch = (dbBarber === targetBarber) || (dbBarber === targetID)

                    if (!isBarberMatch) return false;

                    return true;
                })

                console.log(`🔍 [Duplicate Check] After JS Filter: Found ${conflictingAppointments.length} appointments for this barber.`)

                // Check for time overlap
                const hasConflict = conflictingAppointments.some((apt: any) => {
                    const [requestedHour, requestedMin] = time.split(':').map(Number)
                    const requestedStartMin = requestedHour * 60 + requestedMin
                    const requestedEndMin = requestedStartMin + serviceDuration

                    const [aptHour, aptMin] = String(apt.Hora).split(':').map(Number) // Handle HH:MM:SS
                    const aptStartMin = aptHour * 60 + aptMin

                    // Robust duration: DB duration > Service duration > Default 30
                    const aptDuration = apt.duracion || serviceDuration || 30
                    const aptEndMin = aptStartMin + aptDuration

                    const overlaps = requestedStartMin < aptEndMin && requestedEndMin > aptStartMin

                    if (overlaps) {
                        console.log(`  🚨 CONFLICT DETECTED with apt ${apt.id}: ${apt.Hora} (${aptStartMin}-${aptEndMin}) vs Requested (${requestedStartMin}-${requestedEndMin})`)
                    }
                    return overlaps
                })

                if (hasConflict) {
                    return {
                        success: false,
                        error: 'Este barbero ya tiene una cita en este horario. Por favor, selecciona otro horario o barbero.'
                    }
                }
            }
        } else {
            console.log('⚠️ [Duplicate Check] No barberId provided, skipping specific barber validation')
        }

        // 7. Insertar la Cita
        // CRÍTICO: El trigger de DB valida automáticamente el rate limiting (5 citas/hora por IP)
        // La IP se envía en el campo ip_address para que el trigger funcione correctamente
        const appointmentData: any = {
            barberia_id: profile.id,
            Servicio_id: serviceId,
            Dia: date,            // YYYY-MM-DD
            Hora: time,           // HH:MM
            Nombre: guestName,    // Usamos las columnas existentes
            Telefono: guestPhone, // Usamos las columnas existentes
            Precio: serviceData.precio, // Auto-fill precio
            duracion: serviceDuration, // Store service duration for future overlap checks
            confirmada: false,    // 🔒 Inicialización explícita para evitar NULLs
            cancelada: false,     // 🔒 Inicialización explícita para evitar NULLs
            Automatica: true,     // Flag para distinguir reservas automáticas
            ip_address: ip        // 🔒 CRÍTICO: IP requerida para rate limiting del trigger
        }

        // Handle Barber Assignment
        let finalBarberId = barberId

        // If no specific barber selected, try to auto-assign an available one
        if (!finalBarberId) {
            // 1. Get all barbers for this shop
            const { data: shopBarbers } = await supabase
                .from('barberos')
                .select('id, nombre') // Fetch name for legacy storage
                .eq('barberia_id', profile.id)

            if (shopBarbers && shopBarbers.length > 0) {
                // 2. Get bookings for this specific slot to find who is busy (with overlap check)
                const [reqHour, reqMin] = time.split(':').map(Number)
                const reqStartMin = reqHour * 60 + reqMin
                const reqEndMin = reqStartMin + serviceDuration

                const { data: allAppointments } = await supabase
                    .from('citas')
                    .select('barbero, Hora, duracion')
                    .eq('barberia_id', profile.id)
                    .eq('Dia', date)
                    .eq('cancelada', false)
                    .not('barbero', 'is', null)

                // Find barbers with conflicting appointments
                const busyBarberIds = new Set<string>()
                allAppointments?.forEach((apt: any) => {
                    const [aptHour, aptMin] = apt.Hora.split(':').map(Number)
                    const aptStartMin = aptHour * 60 + aptMin
                    const aptDuration = apt.duracion || serviceDuration
                    const aptEndMin = aptStartMin + aptDuration

                    // Check overlap
                    if (reqStartMin < aptEndMin && reqEndMin > aptStartMin) {
                        busyBarberIds.add(apt.barbero)
                    }
                })

                // 3. Filter available
                const availableBarbers = shopBarbers.filter((b: any) => !busyBarberIds.has(b.id))

                if (availableBarbers.length > 0) {
                    // 4. Randomly assign one
                    const randomBarber = availableBarbers[Math.floor(Math.random() * availableBarbers.length)]
                    finalBarberId = randomBarber.id
                    // Update barberName for storage
                    barberName = randomBarber.nombre
                } else {
                    return {
                        success: false,
                        error: 'No hay barberos disponibles en este horario. Por favor, selecciona otro.'
                    }
                }
            }
        }

        // Add barber ID to appointment if one was selected or assigned
        // Add barber Name (legacy) or ID (fallback) to appointment
        // Logic: If barberName exists (either from original selection or auto-assignment), use it.
        // Otherwise fallback to ID (shouldn't happen if name fetch works, but safe fallback).
        const barberValueToStore = barberName || (finalBarberId ? String(finalBarberId) : null)

        if (barberValueToStore) {
            appointmentData.barbero = barberValueToStore
            // Removed incorrect capitalized 'Barbero' key
        }

        console.log('📦 [Insert Debug] Final payload:', appointmentData)

        const { data: insertedData, error: insertError } = await supabase
            .from('citas')
            .insert(appointmentData)
            .select('*')
            .single()

        if (insertedData) {
            console.log('📦 [Post-Insert Debug] Saved record:', insertedData)

            // FORCE UPDATE if the database ignored our barber column (Trigger? Ghost column?)
            // We check if we sent a barber but it came back null
            if (appointmentData.barbero && !insertedData.barbero) {
                console.log('⚠️ [CRITICAL] Database ignored barbero column on INSERT. Attempting FORCE UPDATE...')

                const { error: updateError } = await supabase
                    .from('citas')
                    .update({ barbero: appointmentData.barbero })
                    .eq('id', insertedData.id)

                if (updateError) {
                    console.error('❌ Force update failed:', updateError)
                } else {
                    console.log('✅ Force update SUCCESS. Barber saved.')
                }
            }
        }

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

        return { success: true, uuid: insertedData?.uuid as string | undefined }

    } catch (error) {
        console.error('Unexpected error:', error)
        return { success: false, error: 'Ha ocurrido un error inesperado.' }
    }
}
