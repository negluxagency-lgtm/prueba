'use server'

import { createClient } from '@supabase/supabase-js' // Use direct client for Service Role access
import { WeeklySchedule, TimeRange } from '@/types'
import { format, isSameDay } from 'date-fns'

interface GetAvailableSlotsParams {
    slug: string
    date: Date | string // Accept both Date object or YYYY-MM-DD string
    serviceDuration: number
    selectedBarberId?: string | null
}

interface Appointment {
    Hora: string
    barbero: string
    barbero_id?: string
    duracion?: number
}

/**
 * Convert time string "HH:MM" to minutes since midnight
 * Example: "09:30" -> 570
 */
function toMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
}

/**
 * Check if a slot overlaps with any existing appointments
 * @param slotStart - Start time "HH:MM"
 * @param slotDuration - Duration in minutes
 * @param appointments - List of appointments for this barber
 * @param defaultDuration - Fallback duration if appointment doesn't have one
 */
function hasOverlap(
    slotStart: string,
    slotDuration: number,
    appointments: Appointment[],
    barberId: string,
    defaultDuration: number
): boolean {
    const slotStartMin = toMinutes(slotStart)
    const slotEndMin = slotStartMin + slotDuration

    return appointments.some(app => {
        // Robust comparison: Check against ID exclusively
        const dbBarberId = String(app.barbero_id || '').trim().toLowerCase()
        const targetId = String(barberId || '').trim().toLowerCase()

        // Match if ID matches
        if (!targetId || dbBarberId !== targetId) return false

        const appStartMin = toMinutes(app.Hora)
        const appDuration = app.duracion || defaultDuration
        const appEndMin = appStartMin + appDuration

        // Overlap: slotStart < appEnd AND slotEnd > appStart
        const isOverlapping = slotStartMin < appEndMin && slotEndMin > appStartMin

        if (isOverlapping) {
            console.log(`    ⛔ COLLISION: Slot ${slotStartMin}-${slotEndMin} overlaps with App ${appStartMin}-${appEndMin} (${dbBarberId})`)
        }

        return isOverlapping
    })
}

export async function getAvailableSlots({
    slug,
    date,
    serviceDuration,
    selectedBarberId
}: GetAvailableSlotsParams): Promise<string[]> {
    // ⚠️ CRITICAL: Use Service Role Key to bypass RLS and see ALL appointments
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔍 [getAvailableSlots] Input:', { slug, date, serviceDuration, selectedBarberId })

    // 0. Normalize date to string YYYY-MM-DD (Timezone Safe)
    let dateString: string
    if (typeof date === 'string') {
        // Assume YYYY-MM-DD coming from client (e.g. "2026-02-11")
        dateString = date.split('T')[0]
    } else {
        // Fallback for Legacy Date
        // Risk: toISOString() uses UTC. If server is UTC and date is Local 00:00, it becomes previous day 23:00
        // We really want client to send strings.
        dateString = date.toISOString().split('T')[0]
    }

    // Standard JS indexing: 0=Sunday, 1=Monday, ..., 6=Saturday
    const targetDate = new Date(dateString + 'T00:00:00')
    const dayOfWeek = targetDate.getDay()

    const DAY_KEYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
    const dayKey = DAY_KEYS[dayOfWeek]

    console.log('📅 [getAvailableSlots] Date Info:', { dateString, dayOfWeek, dayKey })

    // 1. Get Shop ID and Closing Dates
    const { data: profile } = await supabase
        .from('perfiles')
        .select('id, fechas_cierre')
        .eq('slug', slug)
        .single()

    if (!profile) {
        console.error('❌ [getAvailableSlots] Profile not found for slug:', slug)
        return []
    }

    // 1.1 Check if date is a closing date
    const closingDates: string[] = Array.isArray(profile.fechas_cierre)
        ? profile.fechas_cierre
        : []

    if (closingDates.includes(dateString)) {
        console.log(`🚫 [getAvailableSlots] Date ${dateString} is marked as CLOSED. Returning empty slots.`)
        return []
    }

    console.log('✅ [getAvailableSlots] Profile found:', profile.id)

    // 2. Get Relevant Barbers
    let barbersQuery = supabase
        .from('barberos')
        .select('id, nombre, horario_semanal, fechas_cierre')
        .eq('barberia_id', profile.id)

    // Filter by specific barber if selected
    if (selectedBarberId) {
        barbersQuery = barbersQuery.eq('id', selectedBarberId)
    }

    const { data: barbers } = await barbersQuery
    if (!barbers || barbers.length === 0) {
        console.error('❌ [getAvailableSlots] No barbers found for shop:', profile.id)
        return []
    }

    console.log(`👥 [getAvailableSlots] Found ${barbers.length} barber(s):`, barbers.map(b => ({ id: b.id, nombre: b.nombre, hasSchedule: !!b.horario_semanal })))

    const barberIds = barbers.map(b => b.id)

    // 3. Get Existing Appointments
    const { data: rawAppointments, error: appointmentError } = await supabase
        .from('citas')
        .select('Hora, barbero, barbero_id, duracion, Dia, cancelada')
        .eq('barberia_id', profile.id)
        .eq('Dia', dateString) // Cambiado a .eq para mayor precisión si el tipo es DATE o string exacto

    // DEBUG: Log raw fetch count
    console.log(`🔍 [getAvailableSlots] SQL fetched: ${rawAppointments?.length} for shop ${profile.id} on ${dateString}`)

    if (appointmentError) {
        console.error('❌ [getAvailableSlots] DB Error fetching appointments:', appointmentError)
    }

    // Filter in Javascript solo para ignorar las citas canceladas
    const appointmentList = (rawAppointments || []).filter((app: any) => {
        // Treat NULL cancelada as FALSE (Active)
        if (app.cancelada === true) return false;
        return true;
    })

    console.log(`📋 [getAvailableSlots] Filtered active appointments: ${appointmentList.length}`)
    if (appointmentList.length > 0) {
        console.log('   Appts:', appointmentList.map(a => `${a.Hora} (${a.duracion}m) - ${a.barbero}`))
    }

    console.log(`📋 [getAvailableSlots] Found ${appointmentList.length} active appointment(s) for ${dateString}`)
    if (appointmentList.length > 0) {
        console.log('   First 3 matching appointments:', appointmentList.slice(0, 3))
    }

    // 4. Generate Available Slots
    // For "Any Barber" mode: collect slots where AT LEAST ONE barber is free
    const slotAvailability = new Map<string, Set<string>>() // slotTime -> Set of available barberIds

    barbers.forEach(barber => {
        console.log(`\n🔧 [getAvailableSlots] Processing barber: ${barber.nombre} (${barber.id})`)

        const schedule = barber.horario_semanal as WeeklySchedule

        // Skip this barber if they have marked this date as an absence
        const barberAbsences: string[] = Array.isArray((barber as any).fechas_cierre) ? (barber as any).fechas_cierre : []
        if (barberAbsences.includes(dateString)) {
            console.log(`🚫 [getAvailableSlots] Barber ${barber.nombre} is absent on ${dateString}. Skipping.`)
            return
        }

        if (!schedule || typeof schedule !== 'object') {
            console.warn(`⚠️ [getAvailableSlots] Barber ${barber.nombre} has no schedule or invalid format:`, schedule)
            return
        }

        console.log(`📊 [getAvailableSlots] Barber schedule type:`, Array.isArray(schedule) ? 'ARRAY' : 'OBJECT')
        console.log(`📊 [getAvailableSlots] Full schedule:`, JSON.stringify(schedule, null, 2))

        // Get time ranges for this day (supports split shifts)
        let ranges: TimeRange[] = []

        if (Array.isArray(schedule)) {
            // ARRAY FORMAT: [{ dia: number, activo: boolean, turnos: [{inicio, fin}] }]
            const daySchedule = schedule.find((d: any) => d.dia === dayOfWeek)
            console.log(`🔎 [getAvailableSlots] Found day schedule for ${dayKey} (dia=${dayOfWeek}):`, daySchedule)

            if (daySchedule && daySchedule.activo && daySchedule.turnos) {
                // Convert turnos to TimeRange format: {inicio, fin} -> {desde, hasta}
                ranges = daySchedule.turnos.map((t: any) => ({
                    desde: t.inicio,
                    hasta: t.fin
                }))
            }
        } else {
            // OBJECT FORMAT: { lunes: [{desde, hasta}], martes: [...] }
            ranges = schedule[dayKey] || []
        }

        if (ranges.length === 0) {
            console.warn(`⚠️ [getAvailableSlots] No time ranges for ${dayKey} (dia=${dayOfWeek}) in barber ${barber.nombre}`)
            return
        }

        console.log(`⏰ [getAvailableSlots] Time ranges for ${dayKey}:`, ranges)

        let slotsGenerated = 0

        // Generate slots for each time range
        ranges.forEach((range, rangeIdx) => {
            const rangeStartMin = toMinutes(range.desde)
            const rangeEndMin = toMinutes(range.hasta)

            console.log(`  📍 Range ${rangeIdx + 1}: ${range.desde}-${range.hasta} (${rangeStartMin}-${rangeEndMin} min)`)

            // Generate slots at serviceDuration intervals
            let currentMin = rangeStartMin

            while (currentMin < rangeEndMin) {
                const slotEndMin = currentMin + serviceDuration

                // Only include slot if entire service fits within range
                if (slotEndMin <= rangeEndMin) {
                    const slotTime = `${String(Math.floor(currentMin / 60)).padStart(2, '0')}:${String(currentMin % 60).padStart(2, '0')}`

                    // Check if this barber has a collision at this slot
                    const hasCollision = hasOverlap(
                        slotTime,
                        serviceDuration,
                        appointmentList,
                        String(barber.id),
                        serviceDuration
                    )

                    if (!hasCollision) {
                        // Add this barber as available for this slot
                        if (!slotAvailability.has(slotTime)) {
                            slotAvailability.set(slotTime, new Set())
                        }
                        slotAvailability.get(slotTime)!.add(barber.id)
                        slotsGenerated++
                    } else {
                        console.log(`    ⛔ Slot ${slotTime} blocked (collision)`)
                    }
                }

                currentMin += serviceDuration
            }
        })

        console.log(`  ✅ Generated ${slotsGenerated} slot(s) for ${barber.nombre}`)
    })

    // 5. Filter slots: only include if at least one barber is available
    let availableSlots = Array.from(slotAvailability.keys())
        .filter(slot => slotAvailability.get(slot)!.size > 0)
        .sort()

    console.log(`\n🎯 [getAvailableSlots] Total unique slots before filtering:`, availableSlots.length)

    // 6. Filter past times if date is today
    // 6. Filter past times if date is today
    const now = new Date()
    // Compare date strings to avoid time issues or use targetDate
    if (isSameDay(targetDate, now)) {
        const currentMinutes = now.getHours() * 60 + now.getMinutes()
        const beforeFilter = availableSlots.length
        availableSlots = availableSlots.filter(slot => toMinutes(slot) > currentMinutes)
        console.log(`⏰ [getAvailableSlots] Filtered ${beforeFilter - availableSlots.length} past slot(s)`)
    }

    console.log(`\n✨ [getAvailableSlots] Final result: ${availableSlots.length} slot(s)`, availableSlots)

    return availableSlots
}
