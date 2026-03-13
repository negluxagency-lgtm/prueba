import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getAllBarbersOvertimeFromSchedule } from '@/app/actions/overtime'

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
 * OPTIMIZED: all independent queries run in parallel with Promise.all.
 * Auto hours fetched via server action (admin client, bypasses RLS).
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
                .select('id, nombre_barberia')
                .eq('id', user.id)
                .single()

            if (!profile) return

            const barberiaUUID = profile.id
            const barberiaName = profile.nombre_barberia

            const [year, m] = targetMonth.split('-').map(Number)
            const lastDay = new Date(year, m, 0).getDate()
            const startDate = `${targetMonth}-01`
            const endDate = `${targetMonth}-${String(lastDay).padStart(2, '0')}`

            // 1. Fetch barberos first (needed for IDs used in subsequent queries)
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

            const barberIds = (barberosData || []).map(b => b.id)

            // 2. Run all remaining queries IN PARALLEL
            const [
                citasResult,
                manualHorasResult,
                autoResults
            ] = await Promise.all([
                // Citas (appointments)
                supabase
                    .from('citas')
                    .select('barbero, barbero_id, Precio, confirmada')
                    .eq('barberia_id', barberiaUUID)
                    .gte('Dia', startDate)
                    .lte('Dia', endDate),

                // Manual extra hours (client SDK, RLS applied, cantidad_horas > 0)
                barberIds.length > 0
                    ? supabase
                        .from('horas_extra')
                        .select('barbero_id, cantidad_horas, precio_hora_extra')
                        .in('barbero_id', barberIds)
                        .gte('fecha', startDate)
                        .lte('fecha', endDate)
                        .gt('cantidad_horas', 0)
                    : Promise.resolve({ data: [], error: null }),

                // Automatic overtime via server action (admin client, bypasses RLS)
                barberIds.length > 0
                    ? getAllBarbersOvertimeFromSchedule(barberiaUUID, targetMonth).catch(e => {
                        console.warn('[useBarberStats] Could not fetch auto overtime:', e)
                        return []
                    })
                    : Promise.resolve([]),

                // Product sales (ventas_productos)
                supabase
                    .from('ventas_productos')
                    .select('precio, cantidad')
                    .eq('barberia_id', barberiaUUID)
                    .gte('created_at', `${startDate} 00:00:00`)
                    .lte('created_at', `${endDate} 23:59:59`)
            ])

            if (citasResult.error) throw citasResult.error
            if (manualHorasResult.error) {
                console.warn('[useBarberStats] Could not fetch manual horas_extra:', manualHorasResult.error.message)
            }
            const productSalesResult = autoResults.pop() as any; 
            const realAutoResults = autoResults; 

            const citas = citasResult.data || []
            const manualHorasData = manualHorasResult.data || []
            const productSalesData = productSalesResult?.data || []

            // Build auto overtime lookup: barberoId -> totalHoras
            const autoOvertimeMap: Record<string, number> = {}
            for (const result of realAutoResults) {
                autoOvertimeMap[String(result.barberoId)] = result.totalHoras
            }

            // 3. Build stats map
            const map: Record<string, BarberStat> = {}

            // Add a virtual barber for product sales to track separately in stats
            if (productSalesData.length > 0) {
                map['Ventas de Productos'] = {
                    nombre: 'Ventas de Productos',
                    totalRevenue: 0,
                    totalCuts: 0,
                    salario_base: 0,
                    porcentaje_comision: 0,
                    totalExtraHoursAmount: 0,
                    totalExtraHours: 0
                }
                for (const sale of productSalesData) {
                    map['Ventas de Productos'].totalRevenue += Number(sale.precio)
                }
            }

            for (const b of (barberosData || [])) {
                map[b.nombre.trim()] = {
                    id: b.id,
                    nombre: b.nombre.trim(),
                    totalRevenue: 0,
                    totalCuts: 0,
                    salario_base: (b as any).salario_base || 0,
                    porcentaje_comision: (b as any).porcentaje_comision || 0,
                    totalExtraHoursAmount: 0,
                    totalExtraHours: autoOvertimeMap[String(b.id)] || 0, // seed with auto hours
                    isOwner: !!(b as any)['jefe/dueño']
                }
            }

            for (const cita of citas) {
                if (!cita.confirmada) continue
                
                // Prioritize grouping by barbero_id
                let key = cita.barbero_id ? String(cita.barbero_id) : (cita.barbero as string)?.trim() || 'Sin asignar'
                
                // If it's an ID, try to find the barber name from barberosData
                if (cita.barbero_id) {
                    const found = barberosData?.find(b => String(b.id) === String(cita.barbero_id))
                    if (found) {
                        key = found.nombre.trim()
                    }
                }

                if (!map[key]) {
                    map[key] = {
                        nombre: key,
                        totalRevenue: 0,
                        totalCuts: 0,
                        salario_base: 0,
                        porcentaje_comision: 0,
                        totalExtraHoursAmount: 0,
                        totalExtraHours: 0
                    }
                }
                map[key].totalRevenue += Number(cita.Precio) || 0
                map[key].totalCuts += 1
            }

            // 4. Accumulate manual extra hours on top of auto hours
            for (const h of manualHorasData) {
                const bMatch = barberosData?.find(b => b.id === h.barbero_id)
                if (bMatch) {
                    const name = bMatch.nombre.trim()
                    if (map[name]) {
                        const manualHours = Number(h.cantidad_horas) || 0
                        const amount = manualHours * Number(h.precio_hora_extra || 0)
                        map[name].totalExtraHoursAmount = (map[name].totalExtraHoursAmount || 0) + amount
                        map[name].totalExtraHours = (map[name].totalExtraHours || 0) + manualHours
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
