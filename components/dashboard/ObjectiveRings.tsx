"use client";

import React from 'react';
import {
    RadialBarChart,
    RadialBar,
    ResponsiveContainer,
    PolarAngleAxis
} from 'recharts';
import {
    DollarSign,
    Scissors,
    ShoppingBag,
    ChevronRight
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utility to merge tailwind classes */
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Metric {
    actual: number;
    objetivo: number;
    label: string;
}

interface ObjectiveRingsProps {
    ingresos: Metric;
    cortes: Metric;
    productos: Metric;
}

const ObjectiveRings: React.FC<ObjectiveRingsProps> = ({ ingresos, cortes, productos }) => {
    // Configuración de colores y radios para Recharts
    const data = [
        {
            name: 'Productos',
            value: Math.min((productos.actual / productos.objetivo) * 100, 100),
            fill: '#FF3B30', // Rojo (Inner)
        },
        {
            name: 'Cortes',
            value: Math.min((cortes.actual / cortes.objetivo) * 100, 100),
            fill: '#007AFF', // Azul Neón (Middle)
        },
        {
            name: 'Ingresos',
            value: Math.min((ingresos.actual / ingresos.objetivo) * 100, 100),
            fill: '#34C759', // Verde Lima (Outer)
        },
    ];

    const metrics = [
        {
            ...ingresos,
            color: 'text-[#34C759]',
            bgColor: 'bg-[#34C759]/10',
            icon: <DollarSign className="w-4 h-4" />,
            percentage: Math.round((ingresos.actual / ingresos.objetivo) * 100)
        },
        {
            ...cortes,
            color: 'text-[#007AFF]',
            bgColor: 'bg-[#007AFF]/10',
            icon: <Scissors className="w-4 h-4" />,
            percentage: Math.round((cortes.actual / cortes.objetivo) * 100)
        },
        {
            ...productos,
            color: 'text-[#FF3B30]',
            bgColor: 'bg-[#FF3B30]/10',
            icon: <ShoppingBag className="w-4 h-4" />,
            percentage: Math.round((productos.actual / productos.objetivo) * 100)
        },
    ];

    return (
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl md:rounded-[2rem] shadow-2xl p-4 md:p-6 border border-zinc-800 overflow-hidden">
            {/* Título pegado a la parte superior */}
            <h3 className="text-zinc-500 text-[11px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-3 md:mb-4 px-1 text-left">
                Objetivos del Día
            </h3>

            <div className="flex flex-row items-center gap-0 md:gap-8">
                {/* Leyenda y Datos (Izquierda) */}
                <div className="flex-1 w-full space-y-2 md:space-y-4 relative z-10">
                    <div className="grid grid-cols-1 gap-1 md:gap-2">
                        {metrics.map((metric, idx) => (
                            <div key={idx} className="group flex items-center justify-between p-1.5 md:p-3 rounded-lg md:rounded-xl hover:bg-zinc-800/40 transition-all border border-transparent hover:border-zinc-800">
                                <div className="flex items-center gap-1.5 md:gap-3">
                                    <div className={cn("p-1 md:p-2 rounded-lg flex items-center justify-center", metric.bgColor, metric.color)}>
                                        <div className="w-3.5 h-3.5 md:w-4 md:h-4 *:w-full *:h-full text-xs">
                                            {metric.icon}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-wider leading-tight">{metric.label}</p>
                                        <p className={cn("text-[14px] md:text-lg font-mono font-bold leading-none md:leading-normal", metric.color)}>
                                            {metric.actual}{metric.label.includes('Ingresos') ? '€' : ''}
                                            <span className="text-zinc-700 font-normal mx-0.5 md:mx-1">/</span>
                                            <span className="text-zinc-400">{metric.objetivo}{metric.label.includes('Ingresos') ? '€' : ''}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 md:gap-2">
                                    <span className={cn("hidden md:block font-mono font-black text-xl", metric.color)}>
                                        {metric.percentage}%
                                    </span>
                                    <ChevronRight size={12} className="hidden md:block text-zinc-700 md:w-3.5 md:h-3.5 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Gráfico Radial (Derecha) */}
                <div className="relative w-[160px] h-[160px] md:h-[240px] md:w-[240px] shrink-0 -ml-24 md:ml-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            cx="50%"
                            cy="50%"
                            innerRadius="30%"
                            outerRadius="100%"
                            barSize={12}
                            data={data}
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
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-zinc-800/40 rounded-full p-2 md:p-3 shadow-inner border border-zinc-700/50">
                            <TrendingUp size={18} className="text-zinc-500 md:w-6 md:h-6" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Icono auxiliar para el centro del gráfico
const TrendingUp = ({ size, className }: { size: number, className: string }) => (
    <svg
        width={size}
        height={size}
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

export default ObjectiveRings;
