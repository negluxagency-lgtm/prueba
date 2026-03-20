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
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
        console.log(`🚀 [Booking] Starting process for slug: ${slug}, service: ${serviceId}, barber: ${barberId || 'Auto'}`);

        // 2. Buscar el ID de la barbería usando el Slug
        const { data: profile, error: profileError } = await supabase
            .from('perfiles')
            .select('id')
            .eq('slug', slug)
            .single()

        if (profileError || !profile) {
            console.error('❌ [Booking] Profile not found:', profileError);
            return { success: false, error: 'La barbería no existe o el enlace es inválido.' }
        }

        // 3. Validación básica
        if (!guestName || !guestPhone || !date || !time) {
            return { success: false, error: 'Faltan datos requeridos.' }
        }

        // 3.5 Bloqueo de duplicados
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
                if (apt.cancelada === true) return false
                const dbPhone = String(apt.Telefono || '').replace(/\D/g, '')
                if (dbPhone.length >= 9 && cleanTargetPhone.length >= 9) {
                    return dbPhone.endsWith(cleanTargetPhone) || cleanTargetPhone.endsWith(dbPhone)
                }
                return dbPhone === cleanTargetPhone
            })

            if (hasDuplicate) {
                return {
                    success: false,
                    error: 'Ya tienes una cita pendiente, si crees que se debe a un error contacta con la barbería.'
                }
            }
        }

        // 4. Obtener el precio del servicio seleccionado
        const { data: serviceData, error: serviceError } = await supabase
            .from('servicios')
            .select('precio, duracion')
            .eq('id', serviceId)
            .single()

        if (serviceError || !serviceData) {
            console.error('❌ [Booking] Service error:', serviceError);
            return { success: false, error: 'El servicio seleccionado no es válido.' }
        }

        const serviceDuration = serviceData.duracion || 30

        // 6. Get Barber Name (Legacy Compatibility)
        let barberName: string | null = null
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
        if (barberId) {
            const targetId = String(barberId).trim().toLowerCase()

            const { data: dayAppointments } = await supabase
                .from('citas')
                .select('Hora, duracion, barbero, barbero_id, Dia, id, cancelada')
                .eq('barberia_id', profile.id)
                .eq('Dia', date)

            if (dayAppointments && dayAppointments.length > 0) {
                const conflictingAppointments = dayAppointments.filter((apt: any) => {
                    if (apt.cancelada) return false;
                    const dbId = String(apt.barbero_id || '').trim().toLowerCase()
                    return dbId === targetId;
                })

                const hasConflict = conflictingAppointments.some((apt: any) => {
                    const [requestedHour, requestedMin] = time.split(':').map(Number)
                    const requestedStartMin = requestedHour * 60 + requestedMin
                    const requestedEndMin = requestedStartMin + serviceDuration

                    const [aptHour, aptMin] = String(apt.Hora).split(':').map(Number)
                    const aptStartMin = aptHour * 60 + aptMin
                    const aptDuration = apt.duracion || serviceDuration || 30
                    const aptEndMin = aptStartMin + aptDuration

                    return requestedStartMin < aptEndMin && requestedEndMin > aptStartMin
                })

                if (hasConflict) {
                    return {
                        success: false,
                        error: 'Este barbero ya tiene una cita en este horario. Por favor, selecciona otro horario o barbero.'
                    }
                }
            }
        }

        // 7. Insertar la Cita
        const appointmentData: any = {
            barberia_id: profile.id,
            Servicio_id: serviceId,
            Dia: date,
            Hora: time,
            Nombre: guestName,
            Telefono: guestPhone,
            Precio: serviceData.precio,
            duracion: serviceDuration,
            confirmada: false,
            cancelada: false,
            Automatica: true,
            ip_address: ip
        }

        // Handle Barber Assignment
        let finalBarberId = barberId

        if (!finalBarberId) {
            const { data: shopBarbers } = await supabase
                .from('barberos')
                .select('id, nombre')
                .eq('barberia_id', profile.id)

            if (shopBarbers && shopBarbers.length > 0) {
                const [reqHour, reqMin] = time.split(':').map(Number)
                const reqStartMin = reqHour * 60 + reqMin
                const reqEndMin = reqStartMin + serviceDuration

                const { data: allAppointments } = await supabase
                    .from('citas')
                    .select('barbero, barbero_id, Hora, duracion')
                    .eq('barberia_id', profile.id)
                    .eq('Dia', date)
                    .eq('cancelada', false)

                const availableBarbers = shopBarbers.filter((barber: any) => {
                    const hasConflict = allAppointments?.some((apt: any) => {
                        const dbId = String(apt.barbero_id || '').trim().toLowerCase()
                        const targetId = String(barber.id || '').trim().toLowerCase()

                        if (!targetId || dbId !== targetId) return false;

                        // Check time overlap
                        const [aptHour, aptMin] = apt.Hora.split(':').map(Number)
                        const aptStartMin = aptHour * 60 + aptMin
                        const aptDuration = apt.duracion || serviceDuration
                        const aptEndMin = aptStartMin + aptDuration

                        return reqStartMin < aptEndMin && reqEndMin > aptStartMin
                    })
                    return !hasConflict
                })

                if (availableBarbers.length > 0) {
                    const randomBarber = availableBarbers[Math.floor(Math.random() * availableBarbers.length)]
                    finalBarberId = String(randomBarber.id)
                    barberName = randomBarber.nombre
                } else {
                    return {
                        success: false,
                        error: 'No hay barberos disponibles en este horario. Por favor, selecciona otro.'
                    }
                }
            }
        }

        const barberValueToStore = barberName || (finalBarberId ? String(finalBarberId) : null)
        if (barberValueToStore) appointmentData.barbero = barberValueToStore
        if (finalBarberId) appointmentData.barbero_id = finalBarberId

        console.log('📦 [Booking] Final payload:', JSON.stringify(appointmentData));

        const { data: insertedData, error: insertError } = await supabase
            .from('citas')
            .insert(appointmentData)
            .select('*')
            .single()

        if (insertError) {
            console.error('❌ [Booking] Insert error:', insertError);
            if (insertError.message?.includes('Límite de citas excedido') || insertError.message?.includes('rate_limit')) {
                return { success: false, error: 'Has superado el límite de reservas por hora.' }
            }
            return { success: false, error: 'No se pudo completar la reserva: ' + insertError.message }
        }

        if (insertedData) {
            console.log('✅ [Booking] Success! UUID:', insertedData.uuid);
            
            // Check if barber columns were correctly saved
            if ((appointmentData.barbero && !insertedData.barbero) || (appointmentData.barbero_id && !insertedData.barbero_id)) {
                console.warn('⚠️ [Booking] Database ignored barber columns. Retrying update...');
                await supabase
                    .from('citas')
                    .update({ 
                        barbero: appointmentData.barbero,
                        barbero_id: appointmentData.barbero_id
                    })
                    .eq('id', insertedData.id)
            }
        }

        revalidatePath(`/${slug}`)
        return { success: true, uuid: insertedData?.uuid }

    } catch (error: any) {
        console.error('❌ [Booking] Unexpected error:', error)
        return { success: false, error: 'Ha ocurrido un error inesperado: ' + (error.message || 'Desconocido') }
    }
}
