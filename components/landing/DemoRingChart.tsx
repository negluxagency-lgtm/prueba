"use client";

import React from 'react';
import {
    RadialBarChart,
    RadialBar,
    ResponsiveContainer,
    PolarAngleAxis
} from 'recharts';
import { DollarSign, Scissors, ShoppingBag } from 'lucide-react';

const DemoRingChart: React.FC = () => {
    // Hardcoded demo data matching real ObjectiveRings style
    const metrics = [
        {
            label: 'Ingresos',
            actual: 850,
            objetivo: 1100,
            color: 'text-[#34C759]',
            bgColor: 'bg-[#34C759]/10',
            icon: <DollarSign className="w-4 h-4" />,
            suffix: '€'
        },
        {
            label: 'Cortes',
            actual: 12,
            objetivo: 15,
            color: 'text-[#007AFF]',
            bgColor: 'bg-[#007AFF]/10',
            icon: <Scissors className="w-4 h-4" />,
            suffix: ''
        },
        {
            label: 'Productos',
            actual: 3,
            objetivo: 5,
            color: 'text-[#FF3B30]',
            bgColor: 'bg-[#FF3B30]/10',
            icon: <ShoppingBag className="w-4 h-4" />,
            suffix: ''
        },
    ];

    // Chart data for 3 concentric rings
    const chartData = [
        {
            name: 'Productos',
            value: Math.min((metrics[2].actual / metrics[2].objetivo) * 100, 100),
            fill: '#FF3B30', // Red (Inner)
        },
        {
            name: 'Cortes',
            value: Math.min((metrics[1].actual / metrics[1].objetivo) * 100, 100),
            fill: '#007AFF', // Blue (Middle)
        },
        {
            name: 'Ingresos',
            value: Math.min((metrics[0].actual / metrics[0].objetivo) * 100, 100),
            fill: '#34C759', // Green (Outer)
        },
    ];

    return (
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl md:rounded-[2rem] shadow-2xl p-6 border border-zinc-800 relative overflow-hidden">
            {/* Subtle glow effect */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-green-500/10 rounded-full blur-3xl" />

            <h3 className="text-zinc-500 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] mb-4 relative z-10">
                Objetivos del Día
            </h3>

            <div className="flex flex-row items-center gap-4 md:gap-8 relative z-10">
                {/* Metrics Legend (Left) */}
                <div className="flex-1 space-y-2">
                    {metrics.map((metric, idx) => {
                        const percentage = Math.round((metric.actual / metric.objetivo) * 100);
                        return (
                            <div
                                key={idx}
                                className="group flex items-center justify-between p-2 md:p-3 rounded-lg md:rounded-xl hover:bg-zinc-800/40 transition-all border border-transparent hover:border-zinc-800"
                            >
                                <div className="flex items-center gap-2 md:gap-3">
                                    <div className={`p-1.5 md:p-2 rounded-lg flex items-center justify-center ${metric.bgColor} ${metric.color}`}>
                                        {metric.icon}
                                    </div>
                                    <div>
                                        <p className="text-[9px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-wider leading-tight">
                                            {metric.label}
                                        </p>
                                        <p className={`text-sm md:text-lg font-bold leading-none md:leading-normal ${metric.color}`}>
                                            {metric.actual}{metric.suffix}
                                            <span className="text-zinc-700 font-normal mx-1">/</span>
                                            <span className="text-zinc-400">{metric.objetivo}{metric.suffix}</span>
                                        </p>
                                    </div>
                                </div>
                                <span className={`hidden md:inline font-black text-lg md:text-xl ${metric.color}`}>
                                    {percentage}%
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Radial Chart (Right) */}
                <div className="relative w-[130px] h-[130px] md:w-[180px] md:h-[180px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            cx="50%"
                            cy="50%"
                            innerRadius="30%"
                            outerRadius="100%"
                            barSize={10}
                            data={chartData}
                            startAngle={90}
                            endAngle={450}
                        >
                            <PolarAngleAxis
                                type="number"
                                domain={[0, 100]}
                                angleAxisId={0}
                                tick={false}
                            />
                            <RadialBar
                                background={{ fill: '#27272a' }}
                                dataKey="value"
                                cornerRadius={10}
                                animationBegin={0}
                                animationDuration={1500}
                                animationEasing="ease-out"
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>

                    {/* Center Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-zinc-800/40 rounded-full p-2 md:p-3 shadow-inner border border-zinc-700/50">
                            <TrendingUpIcon className="w-4 h-4 md:w-5 md:h-5 text-zinc-500" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Trending Up Icon (same as ObjectiveRings)
const TrendingUpIcon = ({ className }: { className?: string }) => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
        <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
);

export default DemoRingChart;
