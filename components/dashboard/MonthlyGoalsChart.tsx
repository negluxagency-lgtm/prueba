import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Target } from 'lucide-react';
import { ChartDataPoint } from '@/hooks/useTrends';

interface MonthlyGoalsChartProps {
    data: ChartDataPoint[];
    loading?: boolean;
}

const MonthlyGoalsChart: React.FC<MonthlyGoalsChartProps> = ({ data, loading }) => {
    // Definición de métricas y sus colores
    const metrics = [
        { key: 'revenue', name: 'Ingresos', color: '#22c55e', gradientId: 'gradIngresos', suffix: '€', yAxisId: 'left' }, // Verde
        { key: 'cuts', name: 'Cortes', color: '#3b82f6', gradientId: 'gradCortes', suffix: 'u', yAxisId: 'right' },      // Azul
        { key: 'products', name: 'Productos', color: '#ef4444', gradientId: 'gradProds', suffix: 'u', yAxisId: 'right' },    // Rojo
    ];

    if (loading) {
        return (
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl md:rounded-[2rem] border border-zinc-800 p-6 shadow-2xl w-full h-full flex flex-col animate-pulse">
                <div className="h-6 w-48 bg-zinc-800 rounded mb-8"></div>
                <div className="flex-1 bg-zinc-800/50 rounded-xl"></div>
            </div>
        );
    }

    return (
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl md:rounded-[2rem] border border-zinc-800 py-6 px-0 shadow-2xl w-full h-full flex flex-col">
            {/* Encabezado */}
            <div className="flex items-center gap-3 mb-6 px-6 shrink-0">
                <div className="bg-amber-500/10 p-2 rounded-lg">
                    <Target className="text-amber-500 w-5 h-5" />
                </div>
                <h3 className="text-zinc-100 font-bold text-base md:text-lg uppercase tracking-tight">Rendimiento Mensual</h3>
            </div>

            {/* Gráfico */}
            <div className="flex-1 w-full min-h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            {metrics.map(m => (
                                <linearGradient key={m.gradientId} id={m.gradientId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={m.color} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={m.color} stopOpacity={0} />
                                </linearGradient>
                            ))}
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.5} />

                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#71717a', fontSize: 10, fontWeight: 600 }}
                            dy={10}
                            ticks={['5', '10', '15', '20', '25', '30']}
                        />

                        {/* Eje Izquierdo para Ingresos */}
                        <YAxis
                            yAxisId="left"
                            orientation="left"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#71717a', fontSize: 9, fontWeight: 'bold' }}
                            tickFormatter={(val) => `${val}€`}
                            width={65}
                            domain={[0, 1000]}
                            allowDataOverflow={false}
                        />

                        {/* Eje Derecho para Unidades (Cortes y Productos) */}
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#71717a', fontSize: 9 }}
                            tickFormatter={(val) => `${val}`}
                            width={35}
                            domain={[0, 60]}
                        />

                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#09090b',
                                border: '1px solid #27272a',
                                borderRadius: '16px',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                            }}
                            itemStyle={{ fontSize: '11px', fontWeight: 'bold', padding: '1px 0' }}
                            labelStyle={{ color: '#71717a', fontSize: '10px', textTransform: 'uppercase', fontWeight: '800', marginBottom: '8px', letterSpacing: '0.05em' }}
                            cursor={{ stroke: '#27272a', strokeWidth: 2 }}
                            formatter={(value: any, name: any, props: any) => {
                                const metric = metrics.find(m => m.name === name);
                                return [`${value}${metric?.suffix || ''}`, name];
                            }}
                        />

                        {metrics.map(m => (
                            <Area
                                key={m.key}
                                yAxisId={m.yAxisId}
                                type="monotone"
                                dataKey={m.key}
                                name={m.name}
                                stroke={m.color}
                                strokeWidth={3}
                                fillOpacity={1}
                                fill={`url(#${m.gradientId})`}
                                activeDot={{ r: 5, strokeWidth: 0, fill: '#fff' }}
                                animationDuration={1500}
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Leyenda Simple */}
            <div className="flex gap-4 mt-4 pl-[38px]">
                {metrics.map(m => (
                    <div key={m.key} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }}></div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{m.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MonthlyGoalsChart;
