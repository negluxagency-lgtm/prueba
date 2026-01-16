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
        avgTicket: 0,
        retentionRate: 0,
        noShows: 0,
    });

    const getLabel = (dateString: string, currentRange: TimeRange) => {
        const date = new Date(dateString + "T12:00:00");
        if (currentRange === 'week') {
            const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            return days[date.getDay()];
        }
        if (currentRange === 'month') {
            return date.getDate().toString();
        }
        if (currentRange === 'year') {
            const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            return months[date.getMonth()];
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
        const totalRev = appointments.reduce((sum, item) => sum + (Number(item.Precio) || 0), 0);
        const totalCli = appointments.length;
        const avgTkt = totalCli > 0 ? Math.round(totalRev / totalCli) : 0;

        const nowAtProcessing = new Date();
        const totalNoShows = appointments.filter(cita => {
            // Solo cuenta si NO está confirmada
            if (cita.confirmada) return false;
            // Y solo si la cita YA PASÓ (comparando fecha y hora)
            const appointmentDate = new Date(`${cita.Dia}T${cita.Hora}`);
            return appointmentDate < nowAtProcessing;
        }).length;

        setMetrics({
            totalRevenue: totalRev,
            totalClients: totalCli,
            avgTicket: avgTkt,
            retentionRate: 0,
            noShows: totalNoShows,
        });

        // 2. Prepare Chart Data
        const dataMap: Record<string, { rev: number; cli: number; no: number }> = {};

        appointments.forEach(app => {
            // Clave de agrupamiento: Por día para semana/mes, por mes para año
            const groupKey = range === 'year' ? app.Dia.substring(0, 7) : app.Dia;

            if (!dataMap[groupKey]) dataMap[groupKey] = { rev: 0, cli: 0, no: 0 };

            dataMap[groupKey].rev += (Number(app.Precio) || 0);
            dataMap[groupKey].cli += 1;

            // Lógica de No-Show
            const appDate = new Date(`${app.Dia}T${app.Hora}`);
            if (!app.confirmada && appDate < nowAtProcessing) {
                dataMap[groupKey].no += 1;
            }
        });

        const sortedKeys = Object.keys(dataMap).sort();
        const finalData: ChartDataPoint[] = sortedKeys.map(key => {
            const item = dataMap[key];
            return {
                name: getLabel(range === 'year' ? `${key}-01` : key, range),
                date: key,
                revenue: item.rev,
                clients: item.cli,
                avgTicket: item.cli > 0 ? Math.round(item.rev / item.cli) : 0,
                noShows: item.no
            };
        });

        setChartData(finalData);
    };

    useEffect(() => {
        fetchTrends();
    }, [range]); // Refetch when range changes

    return { loading, chartData, metrics, range, setRange };
}
