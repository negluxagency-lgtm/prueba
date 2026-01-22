"use client";

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
import { TrendingUp } from 'lucide-react';

const DemoGrowthChart: React.FC = () => {
    // Hardcoded 6-day upward trend data (Lunes-Sábado, cerrado Domingo)
    const data = [
        { name: 'Lun', revenue: 420 },
        { name: 'Mar', revenue: 580 },
        { name: 'Mié', revenue: 460 },
        { name: 'Jue', revenue: 520 },
        { name: 'Vie', revenue: 610 },
        { name: 'Sáb', revenue: 850 },
    ];

    const totalRevenue = data.reduce((acc, day) => acc + day.revenue, 0);
    const growth = 47.5; // Hardcoded impressive growth

    return (
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl md:rounded-[2rem] shadow-2xl p-6 border border-zinc-800 relative overflow-hidden">
            {/* Subtle glow effect */}
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
                <div>
                    <h3 className="text-zinc-500 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] mb-1">
                        Tendencia Semanal
                    </h3>
                    <p className="text-2xl md:text-3xl font-black text-white">
                        {totalRevenue.toLocaleString()}€
                        <span className="text-sm md:text-lg font-medium ml-2 text-green-500">
                            +{growth}%
                        </span>
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-3 py-2 rounded-xl">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-bold">En alza</span>
                </div>
            </div>

            <div className="h-[160px] md:h-[240px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="demoColorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#52525b"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#52525b"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}€`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#18181b',
                                borderColor: '#27272a',
                                borderRadius: '12px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                            }}
                            itemStyle={{ color: '#f59e0b', fontWeight: 'bold' }}
                            labelStyle={{
                                color: '#a1a1aa',
                                marginBottom: '4px',
                                textTransform: 'uppercase',
                                fontSize: '10px',
                                letterSpacing: '1px'
                            }}
                            cursor={{ stroke: '#f59e0b', strokeWidth: 1, strokeDasharray: '5 5' }}
                            formatter={(value) => [`${value}€`, 'Ingresos']}
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#f59e0b"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#demoColorRevenue)"
                            animationBegin={0}
                            animationDuration={1500}
                            animationEasing="ease-out"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default DemoGrowthChart;
