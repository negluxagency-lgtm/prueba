import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import useSWR from 'swr'

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

export function useBarberStats(mes?: string) {
    const [userId, setUserId] = useState<string | null>(null)
    const targetMonth = mes || new Date().toISOString().substring(0, 7)

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) setUserId(data.user.id)
        })
    }, [])

    const { 
        data: stats = [], 
        error, 
        isLoading, 
        mutate 
    } = useSWR(
        userId ? ['barber-stats', targetMonth, userId] : null,
        async () => {
            // 1. Obtener la lista de barberos
            const { data: barberosData, error: barberosError } = await supabase
                .from('barberos')
                .select(`id, nombre, salario_base, porcentaje_comision, "jefe/dueño"`)
                .eq('barberia_id', userId)

            if (barberosError) throw barberosError

            const [year, m] = targetMonth.split('-').map(Number)
            const startOfMonth = `${targetMonth}-01`
            // Calculate end date (first day of next month)
            const endDate = new Date(year, m, 1).toISOString().split('T')[0]

            // 2. Obtener las métricas diarias del mes
            const { data: metricsData, error: metricsError } = await supabase
                .from('metricas_barberos')
                .select('barbero_id, ingresos, cortes, horas_extra')
                .eq('barberia_id', userId)
                .gte('dia', startOfMonth)
                .lt('dia', endDate)

            if (metricsError) throw metricsError

            const map: Record<string, BarberStat> = {}

            // Inicializar barberos
            for (const b of (barberosData || [])) {
                map[String(b.id)] = {
                    id: String(b.id),
                    nombre: b.nombre?.trim() || 'Desconocido',
                    totalRevenue: 0,
                    totalCuts: 0,
                    salario_base: Number((b as any).salario_base) || 0,
                    porcentaje_comision: Number((b as any).porcentaje_comision) || 0,
                    totalExtraHoursAmount: 0,
                    totalExtraHours: 0,
                    isOwner: !!(b as any)['jefe/dueño']
                }
            }

            // Sumar métricas
            for (const m of (metricsData || [])) {
                const bId = String(m.barbero_id)
                if (map[bId]) {
                    map[bId].totalRevenue += Number(m.ingresos) || 0
                    map[bId].totalCuts += Number(m.cortes) || 0
                    map[bId].totalExtraHours = (map[bId].totalExtraHours || 0) + (Number(m.horas_extra) || 0)
                }
            }

            return Object.values(map).sort((a, b) => b.totalRevenue - a.totalRevenue)
        },
        {
            onError: (err) => {
                console.error('[useBarberStats] Error:', err)
                toast.error('Error al cargar las estadísticas de los barberos')
            }
        }
    )

    return { 
        stats, 
        loading: isLoading, 
        refresh: () => mutate() 
    }
}

