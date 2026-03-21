'use server'

import { createClient } from '@/utils/supabase/server'
import { getRequiredSession } from '@/lib/auth-utils';

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
    await getRequiredSession();
    try {
        const supabase = await createClient()

        const [year, m] = month.split('-').map(Number)
        const lastDay = new Date(year, m, 0).getDate()
        const startDate = `${month}-01`
        const endDate = `${month}-${String(lastDay).padStart(2, '0')}`

        const { data, error } = await supabase
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
 * OPTIMIZED: Single batch query instead of N+1 per barber.
 */
export async function getAllBarbersOvertimeFromSchedule(
    barberiaId: string,
    month: string
): Promise<BarberOvertimeResult[]> {
    await getRequiredSession();
    try {
        const supabase = await createClient()

        const [year, m] = month.split('-').map(Number)
        const lastDay = new Date(year, m, 0).getDate()
        const startDate = `${month}-01`
        const endDate = `${month}-${String(lastDay).padStart(2, '0')}`

        // Step 1: Get all barber IDs for this shop
        const { data: barberos, error: barbError } = await supabase
            .from('barberos')
            .select('id')
            .eq('barberia_id', barberiaId)

        if (barbError || !barberos || barberos.length === 0) return []

        const barberIds = barberos.map(b => b.id)

        // Step 2: Single batch query for ALL barbers instead of N+1
        const { data, error } = await supabase
            .from('horas_extra')
            .select('*')
            .in('barbero_id', barberIds)
            .gte('fecha', startDate)
            .lte('fecha', endDate)
            .gt('minutos_extra', 0)
            .order('barbero_id')
            .order('fecha', { ascending: true })

        if (error) {
            console.error('[getAllBarbersOvertimeFromSchedule]', error)
            return []
        }

        // Step 3: Group rows by barbero_id in-memory
        const grouped: Record<string, HorasExtraRow[]> = {}
        for (const row of (data || []) as HorasExtraRow[]) {
            const key = String(row.barbero_id)
            if (!grouped[key]) grouped[key] = []
            grouped[key].push(row)
        }

        // Step 4: Build result per barber
        return barberIds.map(id => {
            const key = String(id)
            const rows = grouped[key] || []
            const totalMinutos = rows.reduce((acc, r) => acc + (r.minutos_extra || 0), 0)
            return {
                barberoId: id,
                totalMinutos,
                totalHoras: Math.round((totalMinutos / 60) * 100) / 100,
                dias: rows
            }
        })
    } catch (err) {
        console.error('[getAllBarbersOvertimeFromSchedule] Error:', err)
        return []
    }
}
