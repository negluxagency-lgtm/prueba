import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Appointment } from "@/types";

export interface ChartDataPoint {
    name: string;
    revenue: number;
    clients: number;
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

export function useTrends() {
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [range, setRange] = useState<TimeRange>('week');
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

            const now = new Date();
            let startDate = new Date();

            if (range === 'week') startDate.setDate(now.getDate() - 7);
            if (range === 'month') startDate.setDate(now.getDate() - 30);
            if (range === 'year') startDate.setFullYear(now.getFullYear(), 0, 1); // From Jan 1st

            let query = supabase
                .from('citas')
                .select('*')
                .order('Dia', { ascending: true });

            if (range !== 'year') {
                query = query.gte('Dia', startDate.toISOString().split('T')[0]);
            }

            const { data, error } = await query;

            if (error) throw error;

            if (data) processMetrics(data as Appointment[]);
        } catch (err) {
            console.error("Error fetching trends:", err);
        } finally {
            setLoading(false);
        }
    };

    const processMetrics = (appointments: Appointment[]) => {
        // 1. Calculate General Metrics (based on selected range)
        // Solo sumamos ingresos de citas CONFIRMADAS
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
        const dataMap: Record<string, { rev: number; cli: number; no: number }> = {};

        // Find min/max range based on SELECTION, not data
        const now = new Date();
        const start = new Date();

        if (range === 'week') start.setDate(now.getDate() - 7);
        if (range === 'month') start.setDate(now.getDate() - 30);

        // Convertir a formato YYYY-MM-DD local para el bucle
        // Ojo: Usamos UTC para iterar consistentemente
        const current = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
        const end = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

        appointments.forEach(app => {
            const groupKey = range === 'year' ? app.Dia.substring(0, 7) : app.Dia;
            if (!dataMap[groupKey]) dataMap[groupKey] = { rev: 0, cli: 0, no: 0 };

            // Solo sumamos al gráfico si está confirmada
            if (app.confirmada) {
                dataMap[groupKey].rev += (Number(app.Precio) || 0);
                dataMap[groupKey].cli += 1;
            }

            if (app.cancelada) {
                dataMap[groupKey].no += 1;
            }
        });

        const finalData: ChartDataPoint[] = [];

        if (range === 'year') {
            // Para año no rellenamos dias, sino meses (logic complex, keeping simple for now or iterating months)
            // Manteniendo logica simple de ordenamiento para año por ahora
            const sortedKeys = Object.keys(dataMap).sort();
            sortedKeys.forEach(key => {
                const item = dataMap[key];
                finalData.push({
                    name: getLabel(`${key}-01`, range),
                    date: key,
                    revenue: item.rev,
                    clients: item.cli,
                    avgTicket: item.cli > 0 ? Math.round(item.rev / item.cli) : 0,
                    noShows: item.no
                });
            });
        } else {
            // Para semana/mes: Rellenar huecos diarios usando el rango estricto
            while (current <= end) {
                const isoDate = current.toISOString().split('T')[0];
                const item = dataMap[isoDate] || { rev: 0, cli: 0, no: 0 };

                finalData.push({
                    name: getLabel(isoDate, range),
                    date: isoDate,
                    revenue: item.rev,
                    clients: item.cli,
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
    }, [range]); // Refetch when range changes

    return { loading, chartData, metrics, range, setRange };
}
