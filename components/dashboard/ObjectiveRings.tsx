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
    ShoppingBag
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
    loading?: boolean;
}

const ObjectiveRings: React.FC<ObjectiveRingsProps> = ({ ingresos, cortes, productos, loading }) => {
    const [barThickness, setBarThickness] = React.useState(8);

    React.useEffect(() => {
        const checkSize = () => {
            const w = window.innerWidth;
            if (w < 640) setBarThickness(8); // < sm
            else if (w < 1024) setBarThickness(14); // sm & md (ocupa toda la fila)
            else if (w < 1280) setBarThickness(10); // lg (comparte espacio con sidebar y otra columna)
            else setBarThickness(14); // xl
        };
        checkSize();
        window.addEventListener('resize', checkSize);
        return () => window.removeEventListener('resize', checkSize);
    }, []);

    // Configuración de colores y radios para Recharts
    const data = [
        {
            name: 'Productos',
            value: productos.objetivo > 0 ? Math.min((productos.actual / productos.objetivo) * 100, 100) : 0,
            fill: '#FF3B30', // Rojo (Inner)
        },
        {
            name: 'Cortes',
            value: cortes.objetivo > 0 ? Math.min((cortes.actual / cortes.objetivo) * 100, 100) : 0,
            fill: '#007AFF', // Azul Neón (Middle)
        },
        {
            name: 'Ingresos',
            value: ingresos.objetivo > 0 ? Math.min((ingresos.actual / ingresos.objetivo) * 100, 100) : 0,
            fill: '#34C759', // Verde Lima (Outer)
        },
    ];

    const metrics = [
        {
            ...ingresos,
            color: 'text-[#34C759]',
            bgColor: 'bg-[#34C759]/10',
            barColor: '#34C759',
            icon: <DollarSign className="w-4 h-4" />,
            percentage: ingresos.objetivo > 0 ? Math.round((ingresos.actual / ingresos.objetivo) * 100) : 0
        },
        {
            ...cortes,
            color: 'text-[#007AFF]',
            bgColor: 'bg-[#007AFF]/10',
            barColor: '#007AFF',
            icon: <Scissors className="w-4 h-4" />,
            percentage: cortes.objetivo > 0 ? Math.round((cortes.actual / cortes.objetivo) * 100) : 0
        },
        {
            ...productos,
            color: 'text-[#FF3B30]',
            bgColor: 'bg-[#FF3B30]/10',
            barColor: '#FF3B30',
            icon: <ShoppingBag className="w-4 h-4" />,
            percentage: productos.objetivo > 0 ? Math.round((productos.actual / productos.objetivo) * 100) : 0
        },
    ];

    return (
        <div className={cn(
            "bg-zinc-900/50 backdrop-blur-sm rounded-xl lg:rounded-[2rem] shadow-2xl pl-2 pr-3 py-4 lg:p-6 border border-zinc-800 overflow-visible mr-[20px] lg:mr-0 transition-opacity duration-300",
            loading ? "opacity-40 animate-pulse pointer-events-none" : "opacity-100"
        )}>
            {/* Título */}
            <h3 className="text-zinc-500 text-[9px] sm:text-[10px] lg:text-[9px] xl:text-[10px] font-black uppercase tracking-[0.2em] mb-4 pl-2 text-left">
                Objetivos del Día
            </h3>

            <div className="flex flex-row items-center gap-0 lg:gap-4 xl:gap-8">
                {/* Leyenda y Datos (Izquierda) */}
                <div className="flex-1 w-full space-y-2 lg:space-y-4 relative z-10">
                    <div className="grid grid-cols-1 gap-2 lg:gap-3">
                        {metrics.map((metric, idx) => {
                            const progressWidth = Math.min(metric.percentage, 100);
                            return (
                                <div key={idx} className="group flex items-center justify-between p-1.5 lg:p-3 rounded-xl hover:bg-zinc-800/40 transition-all border border-transparent hover:border-zinc-800/50">
                                    <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
                                        {/* Icono solo desktop */}
                                        <div className={cn("hidden lg:flex p-2 rounded-xl items-center justify-center shadow-sm", metric.bgColor, metric.color)}>
                                            <div className="w-4 h-4 *:w-full *:h-full">
                                                {metric.icon}
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] lg:text-[10px] text-zinc-500 font-bold uppercase tracking-wider leading-tight mb-0.5">{metric.label}</p>
                                            <div className="flex items-baseline gap-1.5">
                                                <p className={cn("text-sm lg:text-xl font-black leading-none", metric.color)}>
                                                    {metric.actual}{metric.label.toLowerCase().includes('ingresos') ? '€' : ''}
                                                </p>
                                                <span className="text-zinc-700 font-bold text-[10px] lg:text-sm">/</span>
                                                <p className="text-zinc-400 text-[10px] lg:text-sm font-bold">
                                                    {metric.objetivo}{metric.label.toLowerCase().includes('ingresos') ? '€' : ''}
                                                </p>
                                            </div>
                                            
                                            {/* Mini barra de progreso (Solo Mobile) */}
                                            <div className="lg:hidden mt-2 h-[3px] bg-zinc-800/50 rounded-full overflow-hidden w-full max-w-[120px]">
                                                <div 
                                                    className="h-full rounded-full transition-all duration-1000 ease-out"
                                                    style={{ width: `${progressWidth}%`, backgroundColor: metric.barColor }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Porcentaje Badge (Solo Desktop) */}
                                    <div className={cn("hidden lg:block px-2 py-0.5 rounded-md text-sm font-black bg-zinc-950/50 border border-current opacity-80 group-hover:opacity-100 transition-opacity shrink-0 ml-2", metric.color)}>
                                        {metric.percentage}%
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Gráfico Radial (Derecha) */}
                <div className="relative w-[150px] h-[150px] sm:w-[160px] sm:h-[160px] lg:w-[200px] lg:h-[200px] xl:w-[240px] xl:h-[240px] shrink-0 transform -translate-x-6 lg:translate-x-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            cx="50%"
                            cy="50%"
                            innerRadius="30%"
                            outerRadius="100%"
                            barSize={barThickness}
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
                                background={{ fill: '#18181b', stroke: '#27272a', strokeWidth: 0.5 }}
                                dataKey="value"
                                cornerRadius={10}
                                animationBegin={0}
                                animationDuration={1500}
                                animationEasing="ease-out"
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-zinc-800/20 backdrop-blur-sm rounded-full p-2 lg:p-4 shadow-2xl border border-zinc-700/30">
                            <TrendingUp size={16} className="text-zinc-500 lg:w-8 lg:h-8" />
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
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
        <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
);

export default ObjectiveRings;
