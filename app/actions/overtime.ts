'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface HorasExtraRow {
    id: string
    barbero_id: number | string
    fecha: string             // YYYY-MM-DD
    minutos_esperados: number
    minutos_reales: number
    minutos_extra: number
    created_at: string
}

export interface BarberOvertimeResult {
    barberoId: number | string
    totalMinutos: number
    totalHoras: number
    dias: HorasExtraRow[]
}

/**
 * Lee las horas extra de un barbero para un mes desde la tabla horas_extra de Supabase.
 * El cálculo lo hace una función/trigger en Supabase, aquí solo leemos.
 */
export async function getBarberOvertimeFromSchedule(
    barberoId: number | string,
    month: string // YYYY-MM
): Promise<BarberOvertimeResult | null> {
    try {
        const [year, m] = month.split('-').map(Number)
        const startDate = `${month}-01`
        const endDate = new Date(year, m, 0).toISOString().split('T')[0]

        const { data, error } = await supabaseAdmin
            .from('horas_extra')
            .select('*')
            .eq('barbero_id', barberoId)
            .gte('fecha', startDate)
            .lte('fecha', endDate)
            .gt('minutos_extra', 0)
            .order('fecha', { ascending: true })

        if (error) {
            console.error('[getBarberOvertimeFromSchedule]', error)
            return null
        }

        const rows = (data || []) as HorasExtraRow[]
        const totalMinutos = rows.reduce((acc, r) => acc + (r.minutos_extra || 0), 0)

        return {
            barberoId,
            totalMinutos,
            totalHoras: Math.round((totalMinutos / 60) * 100) / 100,
            dias: rows
        }
    } catch (err) {
        console.error('[getBarberOvertimeFromSchedule] Unexpected error:', err)
        return null
    }
}

/**
 * Lee las horas extra de TODOS los barberos de una barbería para un mes dado.
 */
export async function getAllBarbersOvertimeFromSchedule(
    barberiaId: string,
    month: string
): Promise<BarberOvertimeResult[]> {
    try {
        const { data: barberos, error } = await supabaseAdmin
            .from('barberos')
            .select('id, nombre')
            .eq('barberia_id', barberiaId)

        if (error || !barberos) return []

        const results = await Promise.all(
            barberos.map(b => getBarberOvertimeFromSchedule(b.id, month))
        )

        return results.filter(Boolean) as BarberOvertimeResult[]
    } catch (err) {
        console.error('[getAllBarbersOvertimeFromSchedule] Error:', err)
        return []
    }
}
