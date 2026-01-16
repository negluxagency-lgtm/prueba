"use client";

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { Target, TrendingUp } from 'lucide-react';

interface MonthlyStatsProps {
    revenue: number;
    cuts: number;
    products: number;
}

const MonthlyStats: React.FC<MonthlyStatsProps> = ({ revenue, cuts, products }) => {
    const data = [
        {
            name: 'Cortes',
            actual: cuts,
            objetivo: 300,
            color: '#007AFF', // Azul
            suffix: ''
        },
        {
            name: 'Ingresos',
            actual: revenue,
            objetivo: 5000,
            color: '#34C759', // Verde
            suffix: '€'
        },
        {
            name: 'Productos',
            actual: products,
            objetivo: 15,
            color: '#FF3B30', // Rojo
            suffix: ''
        }
    ];

    // Calcular el progreso porcentual para la visualización (0-100)
    const chartData = data.map(item => ({
        ...item,
        progress: Math.min((item.actual / item.objetivo) * 100, 100)
    }));

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            return (
                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl shadow-2xl">
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">{item.name}</p>
                    <p className="text-lg font-mono font-bold" style={{ color: item.color }}>
                        {item.actual}{item.suffix}
                        <span className="text-zinc-600 text-sm font-normal mx-1">/</span>
                        <span className="text-zinc-400 text-sm">{item.objetivo}{item.suffix}</span>
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                        {Math.round((item.actual / item.objetivo) * 100)}% del objetivo mensual
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl md:rounded-[2rem] border border-zinc-800 p-4 md:p-6 shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between mb-3 md:mb-4 px-2">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="bg-amber-500/10 p-1.5 rounded-lg">
                        <Target className="text-amber-500 w-3.5 h-3.5 md:w-4 md:h-4" />
                    </div>
                    <div>
                        <h3 className="text-zinc-100 font-bold text-sm md:text-base text-center md:text-left">Objetivos Mensuales</h3>
                    </div>
                </div>
            </div>

            <div className="h-[60px] md:h-[90px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#27272a" />
                        <XAxis
                            type="number"
                            hide
                            domain={[0, 100]}
                        />
                        <YAxis
                            dataKey="name"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#71717a', fontSize: 8, fontWeight: 700, textAnchor: 'start', dx: -70 }}
                            width={70}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                        <Bar
                            dataKey="progress"
                            radius={[0, 2, 2, 0]}
                            barSize={8}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default MonthlyStats;
