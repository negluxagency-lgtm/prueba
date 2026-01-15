"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DailyRevenue, TimeRange } from '@/hooks/useTrends';

interface DetailedRevenueChartProps {
    data: DailyRevenue[];
    loading?: boolean;
    range: TimeRange;
    setRange: (range: TimeRange) => void;
}

export function DetailedRevenueChart({ data, loading, range, setRange }: DetailedRevenueChartProps) {
    if (loading) {
        return <div className="h-[450px] w-full bg-zinc-900/50 border border-zinc-800 rounded-[2rem] p-8 shadow-2xl backdrop-blur-sm animate-pulse flex items-center justify-center text-zinc-700 font-mono">Cargando Datos...</div>;
    }

    // Calculate generic trend (last vs first)
    const growth = data.length > 1
        ? ((data[data.length - 1].total - data[0].total) / data[0].total) * 100
        : 0;
    const growthFormatted = isNaN(growth) || !isFinite(growth) ? "0.0" : growth.toFixed(1);
    const isPositive = growth >= 0;

    const totalRevenue = data.reduce((acc, curr) => acc + curr.total, 0);

    return (
        <div className="h-[400px] md:h-[450px] w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl md:rounded-[2rem] p-5 md:p-8 shadow-2xl backdrop-blur-sm flex flex-col">
            <div className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 shrink-0">
                <div>
                    <h3 className="text-zinc-400 text-[10px] md:text-sm font-bold uppercase tracking-widest mb-1">Ingresos ({range === 'week' ? 'Semana' : range === 'month' ? 'Mes' : 'Año'})</h3>
                    <p className="text-2xl md:text-4xl font-black text-white">{totalRevenue}€ <span className={`text-sm md:text-lg font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>{isPositive ? '+' : ''}{growthFormatted}%</span></p>
                </div>
                <select
                    value={range}
                    onChange={(e) => setRange(e.target.value as TimeRange)}
                    className="w-full sm:w-auto bg-zinc-800 text-zinc-300 text-[10px] md:text-xs font-bold py-2 px-4 rounded-xl border border-zinc-700 outline-none hover:bg-zinc-700 cursor-pointer transition-colors"
                >
                    <option value="week">Esta Semana</option>
                    <option value="month">Mes Pasado</option>
                    <option value="year">Este Año</option>
                </select>
            </div>

            <div className="h-[300px] md:h-full md:flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 40, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#52525b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#52525b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}€`}
                            dx={-10}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                            itemStyle={{ color: '#f59e0b', fontWeight: 'bold' }}
                            labelStyle={{ color: '#a1a1aa', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px' }}
                            cursor={{ stroke: '#f59e0b', strokeWidth: 1, strokeDasharray: '5 5' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke="#f59e0b"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorTotal)"
                            activeDot={{ r: 8, strokeWidth: 0, fill: '#fff' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
