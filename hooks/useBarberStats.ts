import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface BarberStat {
    id?: string
    nombre: string
    totalRevenue: number
    totalCuts: number
    salario_base?: number
    porcentaje_comision?: number
    totalExtraHoursAmount?: number
    totalExtraHours?: number
    isOwner?: boolean
}

/**
 * Fetches revenue and cut stats grouped by barber for a given month (YYYY-MM).
 * If no month is provided, defaults to the current month.
 */
export function useBarberStats(mes?: string) {
    const [stats, setStats] = useState<BarberStat[]>([])
    const [loading, setLoading] = useState(true)

    const targetMonth = mes || new Date().toISOString().substring(0, 7)

    const fetchStats = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase
                .from('perfiles')
                .select('id, nombre_barberia') // We need both: ID (UUID) and Name (Text)
                .eq('id', user.id)
                .single()

            if (!profile) return

            // UUID for barberos and horas_extra
            const barberiaUUID = profile.id
            // Text branding for citas table
            const barberiaName = profile.nombre_barberia

            const [year, m] = targetMonth.split('-').map(Number)
            const lastDay = new Date(year, m, 0).getDate()
            const startDate = `${targetMonth}-01`
            const endDate = `${targetMonth}-${String(lastDay).padStart(2, '0')}`

            // 1. Fetch barberos - Filter by UUID
            let { data: barberosData, error: barberosError } = await supabase
                .from('barberos')
                .select(`id, nombre, salario_base, porcentaje_comision, "jefe/dueño"`)
                .eq('barberia_id', barberiaUUID)

            if (barberosError) {
                console.warn('[useBarberStats] Fallback for barberos:', barberosError.message)
                const { data: basicBarberos, error: basicError } = await supabase
                    .from('barberos')
                    .select('id, nombre')
                    .eq('barberia_id', barberiaUUID)

                if (basicError) throw basicError
                barberosData = (basicBarberos || []).map(b => ({
                    ...b,
                    salario_base: 0,
                    porcentaje_comision: 0,
                    'jefe/dueño': false
                })) as any
            }

            // 2. Fetch citas - Filter by Text Name (legacy schema)
            const { data: citas, error: citasError } = await supabase
                .from('citas')
                .select('barbero, Precio, confirmada')
                .eq('barberia', barberiaName)
                .gte('Dia', startDate)
                .lte('Dia', endDate)

            if (citasError) throw citasError

            // 3. Fetch horas_extra - Filter by UUID if applicable, or by barber list
            let horasExtraData: any[] = []
            const barberIds = (barberosData || []).map(b => b.id)

            if (barberIds.length > 0) {
                const { data: hData, error: hError } = await supabase
                    .from('horas_extra')
                    .select('barbero_id, cantidad_horas, precio_hora_extra')
                    .in('barbero_id', barberIds)
                    .gte('fecha', startDate)
                    .lte('fecha', endDate)

                if (hError) {
                    console.warn('[useBarberStats] Could not fetch horas_extra:', hError.message)
                } else {
                    horasExtraData = hData || []
                }
            }

            const map: Record<string, BarberStat> = {}

            for (const b of (barberosData || [])) {
                map[b.nombre.trim()] = {
                    id: b.id,
                    nombre: b.nombre.trim(),
                    totalRevenue: 0,
                    totalCuts: 0,
                    salario_base: (b as any).salario_base || 0,
                    porcentaje_comision: (b as any).porcentaje_comision || 0,
                    totalExtraHoursAmount: 0,
                    totalExtraHours: 0,
                    isOwner: !!(b as any)['jefe/dueño']
                }
            }

            for (const cita of (citas || [])) {
                if (!cita.confirmada) continue
                const name = (cita.barbero as string)?.trim() || 'Sin asignar'
                if (!map[name]) {
                    map[name] = {
                        nombre: name,
                        totalRevenue: 0,
                        totalCuts: 0,
                        salario_base: 0,
                        porcentaje_comision: 0,
                        totalExtraHoursAmount: 0,
                        totalExtraHours: 0
                    }
                }
                map[name].totalRevenue += Number(cita.Precio) || 0
                map[name].totalCuts += 1
            }

            for (const h of horasExtraData) {
                const bMatch = barberosData?.find(b => b.id === h.barbero_id)
                if (bMatch) {
                    const name = bMatch.nombre.trim()
                    if (map[name]) {
                        const amount = Number(h.cantidad_horas) * Number(h.precio_hora_extra)
                        const hours = Number(h.cantidad_horas)
                        map[name].totalExtraHoursAmount = (map[name].totalExtraHoursAmount || 0) + amount
                        map[name].totalExtraHours = (map[name].totalExtraHours || 0) + hours
                    }
                }
            }

            const sorted = Object.values(map).sort((a, b) => b.totalRevenue - a.totalRevenue)
            setStats(sorted)
        } catch (err: any) {
            console.error('[useBarberStats] Critical Error:', err.message || err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStats()
    }, [targetMonth])

    return { stats, loading, refresh: fetchStats }
}
