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
import { Target } from 'lucide-react';

interface MonthlyStatsProps {
    revenue: number;
    cuts: number;
    products: number;
}

const MonthlyStats: React.FC<MonthlyStatsProps> = ({ revenue, cuts, products }) => {
    // Datos y objetivos estáticos (puedes parametrizarlos si lo deseas)
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

    // Calculamos porcentaje visual para la barra (tope 100%)
    const chartData = data.map(item => ({
        ...item,
        progress: Math.min((item.actual / item.objetivo) * 100, 100)
    }));

    // Tooltip personalizado
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
                        {Math.round((item.actual / item.objetivo) * 100)}% del objetivo
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl md:rounded-[2rem] border border-zinc-800 p-6 shadow-2xl w-full h-full flex flex-col">
            {/* Encabezado */}
            <div className="flex items-center gap-3 mb-6 shrink-0">
                <div className="bg-amber-500/10 p-2 rounded-lg">
                    <Target className="text-amber-500 w-5 h-5" />
                </div>
                <h3 className="text-zinc-100 font-bold text-base md:text-lg">Objetivos Mensuales</h3>
            </div>

            {/* Gráfico */}
            <div className="flex-1 w-full min-h-[210px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                        barSize={32}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#27272a" />
                        <XAxis type="number" hide domain={[0, 100]} />
                        <YAxis
                            dataKey="name"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 600, textAnchor: 'end', dx: -10 }}
                            width={80}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 8 }}
                        />
                        <Bar
                            dataKey="progress"
                            radius={[0, 6, 6, 0] as any}
                            background={{ fill: '#18181b', radius: [0, 6, 6, 0] }}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default MonthlyStats;
