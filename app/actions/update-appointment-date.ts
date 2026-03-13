'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function toMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
}

export async function updateAppointmentDate(
    uuid: string,
    newDia: string,
    newHora: string,
    newBarberId?: string,
    newBarberName?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data: cita, error: fetchError } = await supabase
            .from('citas')
            .select('id, Dia, Hora, cancelada, barberia_id, barbero_id, barbero, duracion')
            .eq('uuid', uuid)
            .single()

        if (fetchError || !cita) return { success: false, error: 'Cita no encontrada.' }
        if (cita.cancelada) return { success: false, error: 'La cita está cancelada.' }

        // Don't allow editing past appointments
        const today = new Date().toISOString().split('T')[0]
        if (cita.Dia < today) return { success: false, error: 'Este enlace ha expirado.' }

        // New date must be in the future too
        if (newDia < today) return { success: false, error: 'La nueva fecha debe ser futura.' }

        let finalBarberId = newBarberId
        let finalBarberName = newBarberName

        // Si no se especifica un nuevo barbero (modo "Cualquiera"), 
        // comprobamos si el actual está libre en el nuevo horario.
        if (!finalBarberId) {
            const requestedStartMin = toMinutes(newHora)
            const serviceDuration = cita.duracion || 30
            const requestedEndMin = requestedStartMin + serviceDuration

            // Obtener citas del día para validar colisiones
            const { data: dayAppointments } = await supabase
                .from('citas')
                .select('Hora, duracion, barbero, barbero_id, cancelada')
                .eq('barberia_id', cita.barberia_id)
                .eq('Dia', newDia)
                .eq('cancelada', false)

            const isCurrentBarberFree = !dayAppointments?.some(apt => {
                const dbId = String(apt.barbero_id || '').trim().toLowerCase()
                const originalId = String(cita.barbero_id || '').trim().toLowerCase()
                if (dbId !== originalId) return false

                const [aptHour, aptMin] = apt.Hora.split(':').map(Number)
                const aptStartMin = aptHour * 60 + aptMin
                const aptDuration = apt.duracion || 30
                const aptEndMin = aptStartMin + aptDuration

                return requestedStartMin < aptEndMin && requestedEndMin > aptStartMin
            })

            if (isCurrentBarberFree && cita.barbero_id) {
                // Mantenemos al actual
                finalBarberId = cita.barbero_id
                finalBarberName = cita.barbero
            } else {
                // Auto-asignación: buscar a alguien libre
                const { data: shopBarbers } = await supabase
                    .from('barberos')
                    .select('id, nombre')
                    .eq('barberia_id', cita.barberia_id)

                const busyIds = new Set()
                dayAppointments?.forEach(apt => {
                    const [aptHour, aptMin] = apt.Hora.split(':').map(Number)
                    const aptStartMin = aptHour * 60 + aptMin
                    const aptDuration = apt.duracion || 30
                    const aptEndMin = aptStartMin + aptDuration
                    if (requestedStartMin < aptEndMin && requestedEndMin > aptStartMin) {
                        if (apt.barbero_id) busyIds.add(String(apt.barbero_id))
                    }
                })

                const freeBarbers = shopBarbers?.filter(b => !busyIds.has(String(b.id)))
                if (freeBarbers && freeBarbers.length > 0) {
                    const randomB = freeBarbers[Math.floor(Math.random() * freeBarbers.length)]
                    finalBarberId = String(randomB.id)
                    finalBarberName = randomB.nombre
                } else if (!isCurrentBarberFree) {
                    return { success: false, error: 'No hay barberos disponibles en este nuevo horario.' }
                }
            }
        }

        const updateData: any = { 
            Dia: newDia, 
            Hora: newHora, 
            confirmada: false,
            barbero_id: finalBarberId,
            barbero: finalBarberName
        }

        const { error: updateError } = await supabase
            .from('citas')
            .update(updateData)
            .eq('uuid', uuid)

        if (updateError) throw updateError

        revalidatePath(`/cita/${uuid}`)
        return { success: true }
    } catch (err: any) {
        return { success: false, error: err.message || 'Error desconocido.' }
    }
}
