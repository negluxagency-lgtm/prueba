import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Appointment } from "@/types";

export interface DailyRevenue {
    name: string;
    total: number;
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
    const [chartData, setChartData] = useState<DailyRevenue[]>([]);
    const [range, setRange] = useState<TimeRange>('week');
    const [metrics, setMetrics] = useState<TrendsMetrics>({
        totalRevenue: 0,
        totalClients: 0,
        avgTicket: 0,
        retentionRate: 0,
        noShows: 0,
    });

    const getDayName = (dateString: string) => {
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return days[new Date(dateString).getDay()];
    };

    const fetchTrends = async () => {
        try {
            setLoading(true);

            const now = new Date();
            let startDate = new Date();

            if (range === 'week') startDate.setDate(now.getDate() - 7);
            if (range === 'month') startDate.setDate(now.getDate() - 30);
            if (range === 'year') startDate.setFullYear(now.getFullYear(), 0, 1); // From Jan 1st

            const { data, error } = await supabase
                .from('citas')
                .select('*')
                .gte('Dia', startDate.toISOString().split('T')[0])
                .order('Dia', { ascending: true });

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

        const totalNoShows = appointments.filter(cita => !cita.confirmada).length;

        setMetrics({
            totalRevenue: totalRev,
            totalClients: totalCli,
            avgTicket: avgTkt,
            retentionRate: 0,
            noShows: totalNoShows,
        });

        // 2. Prepare Chart Data
        // Group by Date
        const grouped: Record<string, number> = {};
        appointments.forEach(app => {
            grouped[app.Dia] = (grouped[app.Dia] || 0) + (Number(app.Precio) || 0);
        });

        // Sort dates
        const sortedDates = Object.keys(grouped).sort();
        const finalData = sortedDates.map(date => ({
            name: getDayName(date),
            date: date,
            total: grouped[date]
        }));

        setChartData(finalData);
    };

    useEffect(() => {
        fetchTrends();
    }, [range]); // Refetch when range changes

    return { loading, chartData, metrics, range, setRange };
}
