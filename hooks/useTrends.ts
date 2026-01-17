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
    const [previousMetrics, setPreviousMetrics] = useState<TrendsMetrics>({
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

    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const calculateMetrics = (data: Appointment[]): TrendsMetrics => {
        const totalRev = data.reduce((sum, item) => sum + (item.confirmada ? (Number(item.Precio) || 0) : 0), 0);
        const totalCli = data.filter(a => a.confirmada).length;
        const totalCuts = data.filter(a => a.Servicio !== 'Venta de Producto' && a.confirmada).length;
        const totalProducts = data.filter(a => a.Servicio === 'Venta de Producto' && a.confirmada).length;
        const avgTkt = totalCli > 0 ? Math.round(totalRev / totalCli) : 0;
        const totalNoShows = data.filter(cita => cita.cancelada).length;

        return {
            totalRevenue: totalRev,
            totalClients: totalCli,
            totalCuts,
            totalProducts,
            avgTicket: avgTkt,
            retentionRate: 0,
            noShows: totalNoShows,
        };
    };

    const fetchTrends = async () => {
        try {
            setLoading(true);

            // 1. Current Period Dates
            const refDate = referenceDate ? new Date(referenceDate) : new Date();
            let startDate = new Date(refDate);
            let endDate = new Date(refDate);

            if (range === 'week') {
                startDate.setDate(refDate.getDate() - 7);
            }
            if (range === 'month') {
                startDate = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
                endDate = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0);
            }
            if (range === 'year') {
                startDate.setFullYear(refDate.getFullYear(), 0, 1);
                endDate.setFullYear(refDate.getFullYear(), 11, 31);
            }

            // 2. Previous Period Dates
            let prevStartDate = new Date(startDate);
            let prevEndDate = new Date(startDate);

            if (range === 'week') {
                prevStartDate.setDate(startDate.getDate() - 7);
                prevEndDate.setDate(startDate.getDate() - 1);
            }
            if (range === 'month') {
                prevStartDate.setMonth(startDate.getMonth() - 1);
                prevEndDate = new Date(startDate.getFullYear(), startDate.getMonth(), 0);
            }
            if (range === 'year') {
                prevStartDate.setFullYear(startDate.getFullYear() - 1);
                prevEndDate.setFullYear(startDate.getFullYear() - 1, 11, 31);
            }

            const currentStartStr = formatDate(startDate);
            const currentEndStr = range === 'week' ? formatDate(new Date()) : formatDate(endDate);
            const prevStartStr = formatDate(prevStartDate);
            const prevEndStr = formatDate(prevEndDate);

            // 3. Parallel Queries
            const currentQuery = supabase
                .from('citas')
                .select('*')
                .gte('Dia', currentStartStr)
                .lte('Dia', currentEndStr)
                .order('Dia', { ascending: true });

            const previousQuery = supabase
                .from('citas')
                .select('*')
                .gte('Dia', prevStartStr)
                .lte('Dia', prevEndStr);

            const [currentRes, prevRes] = await Promise.all([currentQuery, previousQuery]);

            if (currentRes.error) throw currentRes.error;
            if (prevRes.error) throw prevRes.error;

            // 4. Process
            if (currentRes.data) {
                processMetrics(currentRes.data as Appointment[], refDate);
            }
            if (prevRes.data) {
                setPreviousMetrics(calculateMetrics(prevRes.data as Appointment[]));
            }

        } catch (err) {
            console.error("Error fetching trends:", err);
        } finally {
            setLoading(false);
        }
    };

    const processMetrics = (appointments: Appointment[], refDate: Date) => {
        // Set Current Metrics
        setMetrics(calculateMetrics(appointments));

        // Prepare Chart Data (Filling Gaps)
        const dataMap: Record<string, { rev: number; cli: number; no: number; cuts: number; prods: number }> = {};
        const start = range === 'week' ? new Date(new Date(refDate).setDate(refDate.getDate() - 7))
            : range === 'month' ? new Date(refDate.getFullYear(), refDate.getMonth(), 1)
                : new Date(refDate.getFullYear(), 0, 1);

        const end = range === 'week' ? new Date(refDate)
            : range === 'month' ? new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0)
                : new Date(refDate.getFullYear(), 11, 31);

        const current = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
        const finalEnd = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()));

        appointments.forEach(app => {
            const groupKey = range === 'year' ? app.Dia.substring(0, 7) : app.Dia;
            if (!dataMap[groupKey]) dataMap[groupKey] = { rev: 0, cli: 0, no: 0, cuts: 0, prods: 0 };

            if (app.confirmada) {
                dataMap[groupKey].rev += (Number(app.Precio) || 0);
                dataMap[groupKey].cli += 1;
                if (app.Servicio !== 'Venta de Producto') dataMap[groupKey].cuts += 1;
                else dataMap[groupKey].prods += 1;
            }
            if (app.cancelada) dataMap[groupKey].no += 1;
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

    return { loading, chartData, metrics, previousMetrics, range, setRange };
}
