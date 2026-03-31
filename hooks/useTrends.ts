import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import useSWR from "swr";
import { getLocalISOString } from "@/utils/date-helper";

export interface ChartDataPoint {
    name: string;
    revenue: number;
    clients: number;
    cuts: number;
    products: number;
    avgTicket: number;
    noShows: number;
    date: string;
}

export interface TrendsMetrics {
    totalRevenue: number;
    totalClients: number;
    totalCuts: number;
    revenueCuts: number;
    totalProducts: number;
    revenueProducts: number;
    avgTicket: number;
    retentionRate: number;
    noShows: number;
}

export type TimeRange = 'week' | 'month' | 'year';

const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const EMPTY_METRICS: TrendsMetrics = {
    totalRevenue: 0,
    totalClients: 0,
    totalCuts: 0,
    revenueCuts: 0,
    totalProducts: 0,
    revenueProducts: 0,
    avgTicket: 0,
    retentionRate: 0,
    noShows: 0,
};

export function useTrends(userId: string | null, referenceDate?: string, initialRange: TimeRange = 'month') {
    const [range, setRange] = useState<TimeRange>(initialRange);

    const { 
        data, 
        error, 
        isLoading, 
        mutate 
    } = useSWR(
        userId ? ['trends', range, referenceDate, userId] : null,
        async () => {
            const refDate = (range === 'week' || !referenceDate) ? new Date() : new Date(referenceDate + 'T12:00:00');
            const fmt = (d: Date) => getLocalISOString(d);

            let result = {
                chartData: [] as ChartDataPoint[],
                metrics: { ...EMPTY_METRICS },
                previousMetrics: { ...EMPTY_METRICS }
            };

            // === WEEKLY VIEW ===
            if (range === 'week') {
                const endDate = new Date(refDate);
                const startDate = new Date(refDate);
                startDate.setDate(startDate.getDate() - 6);

                const { data: diarias } = await supabase
                    .from('metricas_diarias')
                    .select('dia, ingresos, cortes, productos, citas, no_shows')
                    .eq('barberia_id', userId)
                    .gte('dia', fmt(startDate))
                    .lte('dia', fmt(endDate))
                    .order('dia', { ascending: true });

                const dataMap: Record<string, any> = {};
                (diarias || []).forEach(r => { dataMap[r.dia] = r; });

                const cursor = new Date(startDate);
                while (cursor <= endDate) {
                    const key = fmt(cursor);
                    const d = dataMap[key] || {};
                    const rev = Number(d.ingresos) || 0;
                    const cuts = Number(d.cortes) || 0;
                    const prods = Number(d.productos) || 0;
                    const citas = Number(d.citas) || 0;
                    const noShows = Number(d.no_shows) || 0;

                    result.metrics.totalRevenue += rev;
                    result.metrics.totalCuts += cuts;
                    result.metrics.totalProducts += prods;
                    result.metrics.totalClients += citas;
                    result.metrics.noShows += noShows;

                    result.chartData.push({
                        name: DAYS_SHORT[cursor.getDay()],
                        date: key,
                        revenue: rev,
                        clients: citas,
                        cuts,
                        products: prods,
                        avgTicket: cuts > 0 ? Math.round(rev / cuts) : 0,
                        noShows,
                    });
                    cursor.setDate(cursor.getDate() + 1);
                }
                result.metrics.avgTicket = result.metrics.totalCuts > 0 ? Math.round(result.metrics.totalRevenue / result.metrics.totalCuts) : 0;
            }

            // === MONTHLY VIEW ===
            else if (range === 'month') {
                const year = refDate.getFullYear();
                const month = refDate.getMonth();
                const mesStr = `${year}-${String(month + 1).padStart(2, '0')}`;
                const lastDay = new Date(year, month + 1, 0).getDate();
                const prevMes = month === 0 ? `${year - 1}-12` : `${year}-${String(month).padStart(2, '0')}`;

                const [
                    { data: diarias }, 
                    { data: currentMensual },
                    { data: prevMensual },
                    { data: currentContabilidad }
                ] = await Promise.all([
                    supabase.from('metricas_diarias')
                        .select('dia, ingresos, cortes, productos, citas, no_shows')
                        .eq('barberia_id', userId)
                        .gte('dia', `${mesStr}-01`)
                        .lte('dia', `${mesStr}-${String(lastDay).padStart(2, '0')}`)
                        .order('dia', { ascending: true }),
                    supabase.from('metricas_mensuales')
                        .select('ingresos, cortes, productos, citas, ticket_medio, no_shows')
                        .eq('barberia_id', userId)
                        .eq('mes', mesStr)
                        .single(),
                    supabase.from('metricas_mensuales')
                        .select('ingresos, cortes, productos, citas, ticket_medio, no_shows')
                        .eq('barberia_id', userId)
                        .eq('mes', prevMes)
                        .single(),
                    supabase.from('metricas_contabilidad_mensual')
                        .select('ingresos_servicios, ingresos_productos')
                        .eq('barberia_id', userId)
                        .eq('mes', mesStr)
                        .maybeSingle(),
                ]);

                // 1. Usar métricas oficiales del mes si existen (KPI Cards)
                if (currentMensual) {
                    result.metrics = {
                        totalRevenue: Number(currentMensual.ingresos) || 0,
                        totalCuts: Number(currentMensual.cortes) || 0,
                        revenueCuts: Number(currentContabilidad?.ingresos_servicios) || 0,
                        totalProducts: Number(currentMensual.productos) || 0,
                        revenueProducts: Number(currentContabilidad?.ingresos_productos) || 0,
                        totalClients: Number(currentMensual.citas) || 0,
                        avgTicket: Number(currentMensual.ticket_medio) || 0,
                        retentionRate: 0,
                        noShows: Number(currentMensual.no_shows) || 0,
                    };
                }

                // 2. Mapear datos diarios para el gráfico
                const dataMap: Record<string, any> = {};
                (diarias || []).forEach(r => {
                    dataMap[r.dia] = r;
                    // Solo sumamos si no tenemos record mensual (fallback)
                    if (!currentMensual) {
                        result.metrics.totalRevenue += Number(r.ingresos) || 0;
                        result.metrics.totalCuts += Number(r.cortes) || 0;
                        result.metrics.totalProducts += Number(r.productos) || 0;
                        result.metrics.totalClients += Number(r.citas) || 0;
                        result.metrics.noShows += Number(r.no_shows) || 0;
                    }
                });

                for (let d = 1; d <= lastDay; d++) {
                    const key = `${mesStr}-${String(d).padStart(2, '0')}`;
                    const item = dataMap[key] || {};
                    result.chartData.push({
                        name: String(d),
                        date: key,
                        revenue: Number(item.ingresos) || 0,
                        clients: Number(item.citas) || 0,
                        cuts: Number(item.cortes) || 0,
                        products: Number(item.productos) || 0,
                        avgTicket: Number(item.cortes) > 0 ? Math.round(Number(item.ingresos) / Number(item.cortes)) : 0,
                        noShows: Number(item.no_shows) || 0,
                    });
                }

                if (!currentMensual) {
                    result.metrics.avgTicket = result.metrics.totalCuts > 0 ? Math.round(result.metrics.totalRevenue / result.metrics.totalCuts) : 0;
                }

                if (prevMensual) {
                    result.previousMetrics = {
                        totalRevenue: Number(prevMensual.ingresos) || 0,
                        totalClients: Number(prevMensual.citas) || 0,
                        totalCuts: Number(prevMensual.cortes) || 0,
                        revenueCuts: 0,
                        totalProducts: Number(prevMensual.productos) || 0,
                        revenueProducts: 0,
                        avgTicket: Number(prevMensual.ticket_medio) || 0,
                        retentionRate: 0,
                        noShows: Number(prevMensual.no_shows) || 0,
                    };
                }
            }


            // === YEARLY VIEW ===
            else if (range === 'year') {
                const year = refDate.getFullYear();
                const prevYear = year - 1;

                const [{ data: anuales }, { data: anualesPrev }] = await Promise.all([
                    supabase.from('metricas_anuales')
                        .select('mes, ingresos, citas, ticket_medio, no_shows')
                        .eq('barberia_id', userId)
                        .gte('mes', `${year}-01`)
                        .lte('mes', `${year}-12`)
                        .order('mes', { ascending: true }),
                    supabase.from('metricas_anuales')
                        .select('ingresos, citas, ticket_medio, no_shows')
                        .eq('barberia_id', userId)
                        .gte('mes', `${prevYear}-01`)
                        .lte('mes', `${prevYear}-12`),
                ]);

                const dataMap: Record<string, any> = {};
                (anuales || []).forEach(r => {
                    dataMap[r.mes] = r;
                    result.metrics.totalRevenue += Number(r.ingresos) || 0;
                    result.metrics.totalClients += Number(r.citas) || 0;
                    result.metrics.noShows += Number(r.no_shows) || 0;
                });

                for (let m = 1; m <= 12; m++) {
                    const mesKey = `${year}-${String(m).padStart(2, '0')}`;
                    const item = dataMap[mesKey] || {};
                    result.chartData.push({
                        name: MONTHS_SHORT[m - 1],
                        date: mesKey,
                        revenue: Number(item.ingresos) || 0,
                        clients: Number(item.citas) || 0,
                        cuts: Number(item.citas) || 0,
                        products: 0,
                        avgTicket: Number(item.ticket_medio) || 0,
                        noShows: Number(item.no_shows) || 0,
                    });
                }
                result.metrics.totalCuts = result.metrics.totalClients;
                result.metrics.avgTicket = result.metrics.totalClients > 0 ? Math.round(result.metrics.totalRevenue / result.metrics.totalClients) : 0;


                const prevTotals = (anualesPrev || []).reduce((acc, r) => ({
                    rev: acc.rev + (Number(r.ingresos) || 0),
                    cli: acc.cli + (Number(r.citas) || 0),
                    no: acc.no + (Number(r.no_shows) || 0),
                }), { rev: 0, cli: 0, no: 0 });

                result.previousMetrics = {
                    totalRevenue: prevTotals.rev,
                    totalClients: prevTotals.cli,
                    totalCuts: prevTotals.cli,
                    revenueCuts: 0,
                    totalProducts: 0,
                    revenueProducts: 0,
                    avgTicket: prevTotals.cli > 0 ? Math.round(prevTotals.rev / prevTotals.cli) : 0,
                    retentionRate: 0,
                    noShows: prevTotals.no,
                };
            }

            return result;
        },
        {
            onError: (err) => {
                console.error("Error fetching trends:", err);
                toast.error("Error al cargar las tendencias del negocio");
            }
        }
    );

    // Realtime Sync
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`trends-${userId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'metricas_diarias', filter: `barberia_id=eq.${userId}` }, () => mutate())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'metricas_mensuales', filter: `barberia_id=eq.${userId}` }, () => mutate())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'metricas_anuales', filter: `barberia_id=eq.${userId}` }, () => mutate())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, mutate]);

    return { 
        loading: isLoading, 
        chartData: data?.chartData || [], 
        metrics: data?.metrics || EMPTY_METRICS, 
        previousMetrics: data?.previousMetrics || EMPTY_METRICS, 
        range, 
        setRange 
    };
}

