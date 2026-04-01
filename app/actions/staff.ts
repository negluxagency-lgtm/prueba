'use server'

import supabaseAdmin from '@/lib/supabaseAdmin'
import { getRequiredSession } from '@/lib/auth-utils';

// Simple definition to keep the response typed
type ActionResponse = {
    success: boolean
    error?: string
}

export async function setBarberPin(barberId: string, pin: string): Promise<ActionResponse> {
    if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
        return { success: false, error: 'El PIN debe ser de 4 dígitos' }
    }

    try {
        const supabase = supabaseAdmin

        const { data: barber, error: fetchError } = await supabase
            .from('barberos')
            .select('pin')
            .eq('id', barberId)
            .single()

        if (fetchError || !barber) {
            return { success: false, error: 'Barbero no encontrado' }
        }

        if (barber.pin) {
            return { success: false, error: 'Este barbero ya tiene un PIN asignado' }
        }

        const { error: updateError } = await supabase
            .from('barberos')
            .update({ pin })
            .eq('id', barberId)

        if (updateError) {
            return { success: false, error: 'Error al guardar el PIN en la base de datos' }
        }

        return { success: true }
    } catch (err: any) {
        return { success: false, error: 'Error interno del servidor' }
    }
}

export async function getStaffAgenda(shopId: string, barberName: string, dateStr: string, showAll: boolean = false, barberId?: string) {
    const supabase = supabaseAdmin

    console.log(`[getStaffAgenda] Fetching for shop: "${shopId}", barber: "${barberName}", barberId: "${barberId}", date: "${dateStr}"`)

    // 1. Fetch TOTAL appointments for this shop and date for diagnostic purposes
    const { data: allAppointments } = await supabase
        .from('citas')
        .select('barbero')
        .eq('barberia_id', shopId)
        .eq('Dia', dateStr)

    // 2. Build filtered query
    let query = supabase
        .from('citas')
        .select('*')
        .eq('barberia_id', shopId)
        .eq('Dia', dateStr)

    if (!showAll) {
        if (barberId) {
             // 1. Matched by ID OR (legacy fallback by name AND no ID assigned) OR unassigned
             query = query.or(`barbero_id.eq."${barberId}",and(barbero_id.is.null,barbero.eq."${barberName}"),barbero.eq.Cualquiera`)
        } else {
             console.warn('[getStaffAgenda] WARNING: Executing legacy name match. Missing barberId!')
             // 2. Fallback for systems without barber IDs
             query = query.or(`barbero.eq."${barberName}",barbero.eq.Cualquiera`)
        }
    }

    const { data, error } = await query.order('Hora', { ascending: true })

    if (error) {
        console.error('[getStaffAgenda] Supabase error:', error)
        return { data: [], debug: { error: error.message } }
    }

    return {
        data: data || [],
        debug: {
            totalInShop: allAppointments?.length || 0,
            barbersFound: allAppointments ? Array.from(new Set(allAppointments.map(a => a.barbero))) : []
        }
    }
}

export async function getStaffCuts(shopId: string, barberName: string, monthStr: string, barberId?: string) {
    const supabase = supabaseAdmin

    const [year, m] = monthStr.split('-').map(Number)
    const lastDay = new Date(year, m, 0).getDate()
    const startDate = `${monthStr}-01`
    const endDate = `${monthStr}-${String(lastDay).padStart(2, '0')}`

    let query = supabase
        .from('citas')
        .select('servicio, Precio')
        .eq('barberia_id', shopId)
        .eq('cancelada', false)
        .gte('Dia', startDate)
        .lte('Dia', endDate)

    if (barberId) {
        query = query.eq('barbero_id', barberId)
    } else {
        console.warn('[getStaffCuts] WARNING: Executing legacy name match. Missing barberId!')
        query = query.eq('barbero', barberName)
    }

    const { data, error } = await query

    // Fetch shop targets and barber count
    const { data: shopProfile } = await supabase
        .from('perfiles')
        .select('id, objetivo_ingresos, objetivo_cortes')
        .eq('id', shopId)
        .single()

    const { count: barberCount } = await supabase
        .from('barberos')
        .select('*', { count: 'exact', head: true })
        .eq('barberia_id', shopId)

    const divisor = barberCount || 1

    if (error) {
        console.error('getStaffCuts error:', error)
        return { total: 0, distribution: {}, targets: { revenue: 0, cuts: 0 }, revenue: 0 }
    }

    const distribution: Record<string, number> = {}
    let totalRevenue = 0
    data?.forEach(cita => {
        const srv = cita.servicio || 'Otros'
        distribution[srv] = (distribution[srv] || 0) + 1
        totalRevenue += Number(cita.Precio || 0)
    })

    return {
        total: data?.length || 0,
        distribution,
        revenue: totalRevenue,
        targets: {
            revenue: Math.round((shopProfile?.objetivo_ingresos || 0) / divisor),
            cuts: Math.round((shopProfile?.objetivo_cortes || 0) / divisor)
        }
    }
}

export async function logStaffOvertime(barberId: string, shopId: string, hours: number, dateStr: string): Promise<ActionResponse> {
    const supabase = supabaseAdmin

    const { data: barber } = await supabase.from('barberos').select('user_id').eq('id', barberId).single()
    const adminUserId = barber?.user_id || shopId

    const { error } = await supabase.from('horas_extra').insert({
        barbero_id: barberId,
        user_id: adminUserId,
        fecha: dateStr,
        cantidad_horas: hours,
        precio_hora_extra: 0
    })

    if (error) {
        console.error('logStaffOvertime error:', error)
        return { success: false, error: 'Error al registrar horas extra.' }
    }
    return { success: true }
}

export async function updateStaffAppointmentStatus(
    id: number,
    status: 'pendiente' | 'confirmada' | 'cancelada',
    barberName?: string,
    pago?: string,
    barberId?: string
): Promise<ActionResponse> {
    const supabase = supabaseAdmin

    let dbValues: any = { confirmada: null, cancelada: null }
    if (status === 'confirmada') {
        dbValues = { confirmada: true, cancelada: false }
        if (barberName) dbValues.barbero = barberName
        if (barberId) dbValues.barbero_id = barberId
        if (pago) dbValues.pago = pago
    }
    if (status === 'cancelada') dbValues = { confirmada: false, cancelada: true }

    const { error } = await supabase
        .from('citas')
        .update(dbValues)
        .eq('id', id)

    if (error) {
        console.error('[updateStaffAppointmentStatus] Error:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

export async function deleteStaffAppointment(id: number): Promise<ActionResponse> {
    const supabase = supabaseAdmin

    const { error } = await supabase
        .from('citas')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('[deleteStaffAppointment] Error:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

export async function saveStaffAppointment(data: any, editingId: number | null, shopId: string): Promise<ActionResponse> {
    const supabase = supabaseAdmin

    const appointmentData = {
        Nombre: data.Nombre,
        servicio: data.servicio,
        Servicio_id: data.Servicio_id,
        Dia: data.Dia,
        Hora: data.Hora,
        Telefono: data.Telefono,
        Precio: data.Precio,
        confirmada: data.confirmada ?? false,
        barbero: data.barbero || null,
        barbero_id: data.barbero_id || null,
        barberia_id: shopId,
        pago: data.pago || null
    }

    let error
    if (editingId) {
        const { error: updateError } = await supabase
            .from('citas')
            .update(appointmentData)
            .eq('id', editingId)
        error = updateError
    } else {
        const { error: insertError } = await supabase
            .from('citas')
            .insert([appointmentData])
        error = insertError
    }

    if (error) {
        console.error('[saveStaffAppointment] Error:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

export async function getShopServices(shopId: string) {
    const supabase = supabaseAdmin

    const { data, error } = await supabase
        .from('servicios')
        .select('id, nombre, precio')
        .eq('barberia_id', shopId)

    if (error) {
        console.error('[getShopServices] Error:', error)
        return []
    }

    return data || []
}

export async function updateBarberPhoto(barberId: string, photoUrl: string): Promise<ActionResponse> {
    try {
        const supabase = supabaseAdmin

        const { error: updateError } = await supabase
            .from('barberos')
            .update({ foto: photoUrl })
            .eq('id', barberId)

        if (updateError) {
            console.error('[updateBarberPhoto] Error:', updateError)
            return { success: false, error: 'Error al actualizar la foto en la base de datos' }
        }

        return { success: true }
    } catch (err: any) {
        return { success: false, error: 'Error interno del servidor' }
    }
}

export async function verifyBarberPin(barberId: string, enteredPin: string): Promise<ActionResponse> {
    try {
        const supabase = supabaseAdmin

        const { data, error } = await supabase
            .from('barberos')
            .select('pin, intentos_fallidos, bloqueado_hasta')
            .eq('id', barberId)
            .single()

        if (error || !data) {
            console.error('[verifyBarberPin] Error:', error)
            return { success: false, error: 'No se pudo verificar el PIN' }
        }

        // Check for lockout
        if (data.bloqueado_hasta) {
            const now = new Date()
            const blockUntil = new Date(data.bloqueado_hasta)
            if (blockUntil > now) {
                const diffMs = blockUntil.getTime() - now.getTime()
                const diffMin = Math.ceil(diffMs / (1000 * 60))
                return { 
                    success: false, 
                    error: `Bloqueo de seguridad activo. Intenta en ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}.` 
                }
            }
        }

        const dbPin = data.pin ? String(data.pin).trim() : null
        const trimmedEnteredPin = enteredPin.trim()

        if (dbPin === trimmedEnteredPin) {
            // Success: Reset failures
            if (data.intentos_fallidos > 0 || data.bloqueado_hasta) {
                await supabase
                    .from('barberos')
                    .update({ intentos_fallidos: 0, bloqueado_hasta: null })
                    .eq('id', barberId)
            }
            return { success: true }
        } else {
            // Failure: Increment and Lock
            const newIntentos = (data.intentos_fallidos || 0) + 1
            let lockMinutes = 0
            
            if (newIntentos === 3) lockMinutes = 5
            else if (newIntentos === 4) lockMinutes = 20
            else if (newIntentos > 4) lockMinutes = 60 * (newIntentos - 4)

            const newBlockUntil = lockMinutes > 0 ? new Date() : null
            if (newBlockUntil) {
                newBlockUntil.setMinutes(newBlockUntil.getMinutes() + lockMinutes)
            }

            await supabase
                .from('barberos')
                .update({ 
                    intentos_fallidos: newIntentos, 
                    bloqueado_hasta: newBlockUntil ? newBlockUntil.toISOString() : null 
                })
                .eq('id', barberId)

            if (lockMinutes > 0) {
                return { 
                    success: false, 
                    error: `Múltiples intentos fallidos. Bloqueo de seguridad: ${lockMinutes} min. Si has olvidado tu PIN, ponte en contacto con el dueño/jefe de tu barbería.` 
                }
            } else {
                return {
                    success: false,
                    error: `PIN incorrecto (${newIntentos}/3 antes del bloqueo).`
                }
            }
        }
    } catch (err: any) {
        console.error('[verifyBarberPin] Unexpected error:', err)
        return { success: false, error: 'Error del servidor al verificar el PIN' }
    }
}

/**
 * Permite al dueño/administrador cambiar el PIN de un barbero y resetear sus intentos fallidos.
 */
export async function updateBarberPinByAdmin(barberId: string, newPin: string): Promise<ActionResponse> {
    const user = await getRequiredSession();
    try {
        const { error } = await supabaseAdmin
            .from('barberos')
            .update({ 
                pin: newPin,
                intentos_fallidos: 0,
                bloqueado_hasta: null
            })
            .eq('id', barberId)

        if (error) throw error;
        return { success: true }
    } catch (error: any) {
        console.error('[updateBarberPinByAdmin] Error:', error)
        return { success: false, error: error.message }
    }
}

export async function getBarberAbsences(barberId: string): Promise<string[]> {
    const supabase = supabaseAdmin
    const { data } = await supabase
        .from('barberos')
        .select('fechas_cierre')
        .eq('id', barberId)
        .single()

    if (!data?.fechas_cierre) return []
    return Array.isArray(data.fechas_cierre) ? data.fechas_cierre : []
}

export async function markBarberAbsence(barberId: string, date: string, remove = false): Promise<ActionResponse> {
    try {
        const supabase = supabaseAdmin

        const { data, error: fetchError } = await supabase
            .from('barberos')
            .select('fechas_cierre')
            .eq('id', barberId)
            .single()

        if (fetchError) return { success: false, error: 'No se pudo obtener el barbero' }

        const current: string[] = Array.isArray(data?.fechas_cierre) ? data.fechas_cierre : []
        const updated = remove
            ? current.filter(d => d !== date)
            : current.includes(date) ? current : [...current, date]

        const { error: updateError } = await supabase
            .from('barberos')
            .update({ fechas_cierre: updated })
            .eq('id', barberId)

        if (updateError) return { success: false, error: 'No se pudo guardar la ausencia' }
        return { success: true }
    } catch (err: any) {
        return { success: false, error: 'Error del servidor' }
    }
}
