"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartDataPoint, TimeRange, TrendsMetrics } from '@/hooks/useTrends';

export type MetricType = 'revenue' | 'clients' | 'avgTicket' | 'noShows';

interface DetailedRevenueChartProps {
    data: ChartDataPoint[];
    activeMetric: MetricType;
    loading?: boolean;
    range: TimeRange;
    setRange: (range: TimeRange) => void;
    metrics: TrendsMetrics;
    previousMetrics: TrendsMetrics | null;
}

const METRIC_LABELS: Record<MetricType, string> = {
    revenue: 'Ingresos',
    clients: 'Citas',
    avgTicket: 'Ticket Medio',
    noShows: 'No-Shows'
};

const METRIC_KEYS: Record<MetricType, keyof ChartDataPoint> = {
    revenue: 'revenue',
    clients: 'clients',
    avgTicket: 'avgTicket',
    noShows: 'noShows'
};

const METRIC_TO_METRICS_KEY: Record<MetricType, keyof TrendsMetrics> = {
    revenue: 'totalRevenue',
    clients: 'totalClients',
    avgTicket: 'avgTicket',
    noShows: 'noShows'
}

export function DetailedRevenueChart({ data, activeMetric, loading, range, setRange, metrics, previousMetrics }: DetailedRevenueChartProps) {
    if (loading) {
        return <div className="h-[400px] w-full bg-zinc-900/50 border border-zinc-800 rounded-[2rem] p-8 shadow-2xl backdrop-blur-sm animate-pulse flex items-center justify-center text-zinc-700 ">Cargando Datos...</div>;
    }

    const currentKey = METRIC_KEYS[activeMetric];
    const metricsKey = METRIC_TO_METRICS_KEY[activeMetric];

    // Calculate trend vs previous period
    const currentTotal = metrics?.[metricsKey] || 0;
    const previousTotal = previousMetrics?.[metricsKey] || 0;

    const growth = previousTotal !== 0
        ? ((currentTotal - previousTotal) / previousTotal) * 100
        : (currentTotal > 0 ? 100 : 0);

    const growthFormatted = isNaN(growth) || !isFinite(growth) ? "0.0" : growth.toFixed(1);
    const isPositive = growth >= 0;

    // Use passed metrics for total display to ensure consistency with top cards, 
    // fallback to data reduction if metrics missing for some reason
    const totalValue = currentTotal;
    const suffix = (activeMetric === 'revenue' || activeMetric === 'avgTicket') ? '€' : '';

    return (
        <div className="h-[420px] md:h-[450px] w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl md:rounded-[2rem] p-5 md:p-8 shadow-2xl backdrop-blur-sm flex flex-col overflow-hidden">
            <div className="mb-4 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 shrink-0">
                <div>
                    <h3 className="text-zinc-400 text-[10px] md:text-sm font-bold uppercase tracking-widest mb-1">
                        {METRIC_LABELS[activeMetric]} ({range === 'week' ? 'Semana' : range === 'month' ? 'Mes' : 'Año'})
                    </h3>
                    <p className="text-2xl md:text-4xl font-black text-white">
                        {activeMetric === 'avgTicket' ? Math.round(totalValue / (data.length || 1)) : totalValue}{suffix}
                        <span className={`text-sm md:text-lg font-medium ml-2 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                            {isPositive ? '+' : ''}{growthFormatted}%
                        </span>
                    </p>
                </div>
                <select
                    value={range}
                    onChange={(e) => setRange(e.target.value as TimeRange)}
                    className="w-full sm:w-auto bg-zinc-800 text-zinc-300 text-[10px] md:text-xs font-bold py-2 px-4 rounded-xl border border-zinc-700 outline-none hover:bg-zinc-700 cursor-pointer transition-colors"
                >
                    <option value="week">Esta Semana</option>
                    <option value="month">Este Mes</option>
                    <option value="year">Este Año</option>
                </select>
            </div>

            <div className="h-[280px] md:h-full md:flex-1 w-full overflow-visible">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                        <defs>
                            <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#52525b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                            ticks={range === 'month' ? ['5', '10', '15', '20', '25', '30'] : undefined}
                        />
                        <YAxis
                            stroke="#52525b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}${suffix}`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                            itemStyle={{ color: '#f59e0b', fontWeight: 'bold' }}
                            labelStyle={{ color: '#a1a1aa', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px' }}
                            cursor={{ stroke: '#f59e0b', strokeWidth: 1, strokeDasharray: '5 5' }}
                            formatter={(value) => [`${value}${suffix}`, METRIC_LABELS[activeMetric]]}
                        />
                        <Area
                            type="monotone"
                            dataKey={currentKey as string}
                            stroke="#f59e0b"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorMetric)"
                            activeDot={{ r: 8, strokeWidth: 0, fill: '#fff' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
