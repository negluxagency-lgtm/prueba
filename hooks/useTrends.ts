import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Appointment } from "@/types";

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
    totalProducts: number;
    avgTicket: number;
    retentionRate: number;
    noShows: number;
}

export type TimeRange = 'week' | 'month' | 'year';

export function useTrends(referenceDate?: string) {
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [range, setRange] = useState<TimeRange>('month');
    const [metrics, setMetrics] = useState<TrendsMetrics>({
        totalRevenue: 0,
        totalClients: 0,
        totalCuts: 0,
        totalProducts: 0,
        avgTicket: 0,
        retentionRate: 0,
        noShows: 0,
    });

    const getLabel = (dateString: string, currentRange: TimeRange) => {
        if (!dateString) return '';

        // Parsing robusto asumiendo formato YYYY-MM-DD procedente de la DB
        const parts = dateString.split('-');
        if (parts.length < 3) return dateString; // Fallback si el formato no es estándar

        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Meses 0-indexados
        const day = parseInt(parts[2], 10);

        // Usamos UTC para evitar que la hora local afecte al día de la semana
        const date = new Date(Date.UTC(year, month, day));

        if (currentRange === 'week') {
            const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            return days[date.getUTCDay()];
        }
        if (currentRange === 'month') {
            return date.getUTCDate().toString();
        }
        if (currentRange === 'year') {
            const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            return months[date.getUTCMonth()];
        }
        return dateString;
    };

    const fetchTrends = async () => {
        try {
            setLoading(true);

            // Usar la fecha de referencia si existe, de lo contrario usar hoy
            const refDate = referenceDate ? new Date(referenceDate) : new Date();
            let startDate = new Date(refDate);

            if (range === 'week') startDate.setDate(refDate.getDate() - 7);
            if (range === 'month') startDate = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
            if (range === 'year') startDate.setFullYear(refDate.getFullYear(), 0, 1); // From Jan 1st

            let query = supabase
                .from('citas')
                .select('*')
                .order('Dia', { ascending: true });

            if (range === 'month') {
                const lastDay = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0);
                query = query
                    .gte('Dia', startDate.toISOString().split('T')[0])
                    .lte('Dia', lastDay.toISOString().split('T')[0]);
            } else if (range === 'week') {
                query = query.gte('Dia', startDate.toISOString().split('T')[0]);
            }

            const { data, error } = await query;

            if (error) throw error;

            if (data) processMetrics(data as Appointment[], refDate);
        } catch (err) {
            console.error("Error fetching trends:", err);
        } finally {
            setLoading(false);
        }
    };

    const processMetrics = (appointments: Appointment[], refDate: Date) => {
        // 1. Calculate General Metrics (based on selected range)
        const totalRev = appointments.reduce((sum, item) => sum + (item.confirmada ? (Number(item.Precio) || 0) : 0), 0);
        const totalCli = appointments.filter(a => a.confirmada).length;
        const totalCuts = appointments.filter(a => a.Servicio !== 'Venta de Producto' && a.confirmada).length;
        const totalProducts = appointments.filter(a => a.Servicio === 'Venta de Producto' && a.confirmada).length;
        const avgTkt = totalCli > 0 ? Math.round(totalRev / totalCli) : 0;

        const totalNoShows = appointments.filter(cita => cita.cancelada).length;

        setMetrics({
            totalRevenue: totalRev,
            totalClients: totalCli,
            totalCuts,
            totalProducts,
            avgTicket: avgTkt,
            retentionRate: 0,
            noShows: totalNoShows,
        });

        // 2. Prepare Chart Data (Filling Gaps)
        const dataMap: Record<string, { rev: number; cli: number; no: number; cuts: number; prods: number }> = {};

        const start = new Date(refDate);
        let end = new Date(refDate);

        if (range === 'week') {
            start.setDate(refDate.getDate() - 7);
        }
        if (range === 'month') {
            start.setFullYear(refDate.getFullYear(), refDate.getMonth(), 1);
            end = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0); // Último día del mes
        }

        const current = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
        const finalEnd = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()));

        appointments.forEach(app => {
            const groupKey = range === 'year' ? app.Dia.substring(0, 7) : app.Dia;
            if (!dataMap[groupKey]) dataMap[groupKey] = { rev: 0, cli: 0, no: 0, cuts: 0, prods: 0 };

            if (app.confirmada) {
                dataMap[groupKey].rev += (Number(app.Precio) || 0);
                dataMap[groupKey].cli += 1;

                if (app.Servicio !== 'Venta de Producto') {
                    dataMap[groupKey].cuts += 1;
                } else {
                    dataMap[groupKey].prods += 1;
                }
            }

            if (app.cancelada) {
                dataMap[groupKey].no += 1;
            }
        });

        const finalData: ChartDataPoint[] = [];

        if (range === 'year') {
            const startOfYear = new Date(refDate.getFullYear(), 0, 1);
            const iterDate = new Date(startOfYear);

            while (iterDate.getFullYear() === refDate.getFullYear()) {
                const monthKey = iterDate.toISOString().substring(0, 7);
                const item = dataMap[monthKey] || { rev: 0, cli: 0, no: 0, cuts: 0, prods: 0 };

                finalData.push({
                    name: getLabel(`${monthKey}-01`, 'year'),
                    date: monthKey,
                    revenue: item.rev,
                    clients: item.cli,
                    cuts: item.cuts,
                    products: item.prods,
                    avgTicket: item.cli > 0 ? Math.round(item.rev / item.cli) : 0,
                    noShows: item.no
                });

                iterDate.setMonth(iterDate.getMonth() + 1);
                if (iterDate.getFullYear() > refDate.getFullYear()) break;
            }
        } else {
            while (current <= finalEnd) {
                const isoDate = current.toISOString().split('T')[0];
                const item = dataMap[isoDate] || { rev: 0, cli: 0, no: 0, cuts: 0, prods: 0 };

                finalData.push({
                    name: getLabel(isoDate, range),
                    date: isoDate,
                    revenue: item.rev,
                    clients: item.cli,
                    cuts: item.cuts,
                    products: item.prods,
                    avgTicket: item.cli > 0 ? Math.round(item.rev / item.cli) : 0,
                    noShows: item.no
                });

                current.setDate(current.getDate() + 1);
            }
        }

        setChartData(finalData);
    };

    useEffect(() => {
        fetchTrends();

        // Suscripción en tiempo real
        const channel = supabase
            .channel('trends-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'citas' }, () => {
                fetchTrends();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [range, referenceDate]); // Refetch when range OR referenceDate changes

    return { loading, chartData, metrics, range, setRange };
}
