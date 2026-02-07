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

    const calculateMetrics = (appointments: Appointment[], productSales: any[]): TrendsMetrics => {
        // Caja Real: Solo citas confirmadas
        const appointmentRevenue = appointments.reduce((sum, item) =>
            sum + (item.confirmada ? (Number(item.Precio) || 0) : 0), 0
        );

        // Ingresos de productos
        const productRevenue = productSales.reduce((sum, sale) =>
            sum + (Number(sale.precio) || 0), 0
        );

        const totalRev = appointmentRevenue + productRevenue;

        // Clientes: Solo citas confirmadas
        const totalCli = appointments.filter(a => a.confirmada).length;

        // Total Cuts: SOLO citas confirmadas (no productos)
        const totalCuts = appointments.filter(a => a.confirmada).length;

        // Products: Sumar cantidad de productos vendidos
        const totalProducts = productSales.reduce((sum, sale) =>
            sum + (Number(sale.cantidad) || 0), 0
        );

        const avgTkt = totalCli > 0 ? Math.round(totalRev / totalCli) : 0;
        const totalNoShows = appointments.filter(cita => cita.cancelada).length;

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

            // 0. SEGURIDAD: Obtener ID Barbería
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return; // Silent fail o manejar error

            const { data: profile } = await supabase
                .from('perfiles')
                .select('nombre_barberia')
                .eq('id', user.id)
                .single();

            const barberiaId = profile?.nombre_barberia;
            if (!barberiaId) return;

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

            // 3. Parallel Queries (CITAS + VENTAS_PRODUCTOS)
            const currentCitasQuery = supabase
                .from('citas')
                .select('*')
                .eq('barberia', barberiaId)
                .gte('Dia', currentStartStr)
                .lte('Dia', currentEndStr)
                .order('Dia', { ascending: true });

            const previousCitasQuery = supabase
                .from('citas')
                .select('*')
                .eq('barberia', barberiaId)
                .gte('Dia', prevStartStr)
                .lte('Dia', prevEndStr);

            // Fetch product sales for current period
            const currentSalesQuery = supabase
                .from('ventas_productos')
                .select('*')
                .eq('barberia_id', user.id)
                .gte('created_at', currentStartStr + ' 00:00:00')
                .lte('created_at', currentEndStr + ' 23:59:59');

            // Fetch product sales for previous period
            const previousSalesQuery = supabase
                .from('ventas_productos')
                .select('*')
                .eq('barberia_id', user.id)
                .gte('created_at', prevStartStr + ' 00:00:00')
                .lte('created_at', prevEndStr + ' 23:59:59');

            const [currentCitasRes, prevCitasRes, currentSalesRes, prevSalesRes] = await Promise.all([
                currentCitasQuery,
                previousCitasQuery,
                currentSalesQuery,
                previousSalesQuery
            ]);

            if (currentCitasRes.error) throw currentCitasRes.error;
            if (prevCitasRes.error) throw prevCitasRes.error;

            // 4. Map ventas_productos to Appointment format and merge
            const mapSalesToAppointments = (sales: any[]): Appointment[] => {
                return sales.map((venta: any) => ({
                    id: venta.id,
                    created_at: venta.created_at,
                    Nombre: venta.nombre_producto,
                    Servicio: venta.nombre_producto,
                    Dia: venta.created_at.split('T')[0], // Extract YYYY-MM-DD
                    Hora: venta.created_at.split('T')[1]?.substring(0, 5) || '00:00',
                    Telefono: String(venta.cantidad),
                    Precio: venta.precio,
                    confirmada: true,
                    _isProductSale: true, // Internal marker
                } as any));
            };

            // DON'T merge sales with appointments - keep them separate!
            const currentAppointments = currentCitasRes.data || [];
            const previousAppointments = prevCitasRes.data || [];
            const currentSales = currentSalesRes.data || [];
            const prevSales = prevSalesRes.data || [];

            // 5. Process metrics with separate data
            if (currentAppointments) {
                processMetrics(currentAppointments as Appointment[], currentSales, refDate);
            }
            if (previousAppointments) {
                setPreviousMetrics(calculateMetrics(previousAppointments as Appointment[], prevSales));
            }

        } catch (err) {
            console.error("Error fetching trends:", err);
        } finally {
            setLoading(false);
        }
    };

    const processMetrics = (appointments: Appointment[], productSales: any[], refDate: Date) => {
        // Set Current Metrics
        setMetrics(calculateMetrics(appointments, productSales));

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

        // Process appointments (citas)
        appointments.forEach(app => {
            const groupKey = range === 'year' ? app.Dia.substring(0, 7) : app.Dia;
            if (!dataMap[groupKey]) dataMap[groupKey] = { rev: 0, cli: 0, no: 0, cuts: 0, prods: 0 };

            if (app.confirmada) {
                // Solo contar citas confirmadas
                dataMap[groupKey].cuts += 1;
                dataMap[groupKey].rev += (Number(app.Precio) || 0);
                dataMap[groupKey].cli += 1;
            }
            if (app.cancelada) dataMap[groupKey].no += 1;
        });

        // Process product sales separately
        productSales.forEach(sale => {
            const dateStr = sale.created_at.split('T')[0];
            const groupKey = range === 'year' ? dateStr.substring(0, 7) : dateStr;
            if (!dataMap[groupKey]) dataMap[groupKey] = { rev: 0, cli: 0, no: 0, cuts: 0, prods: 0 };

            // Sumar ingresos de productos
            dataMap[groupKey].rev += (Number(sale.precio) || 0);
            // Sumar cantidad de productos vendidos
            dataMap[groupKey].prods += (Number(sale.cantidad) || 0);
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
        let channel: any;

        const setupRealtime = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('perfiles')
                .select('nombre_barberia')
                .eq('id', user.id)
                .single();

            const barberiaId = profile?.nombre_barberia;
            if (!barberiaId) return;

            fetchTrends();

            // Suscripción FILTRADA para citas 🔒
            channel = supabase
                .channel('trends-realtime')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'citas',
                    filter: `barberia=eq.${barberiaId}`
                }, () => {
                    fetchTrends();
                })
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'ventas_productos',
                    filter: `barberia_id=eq.${user.id}`
                }, () => {
                    fetchTrends();
                })
                .subscribe();
        };

        setupRealtime();

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [range, referenceDate]); // Refetch when range OR referenceDate changes

    return { loading, chartData, metrics, previousMetrics, range, setRange };
}
