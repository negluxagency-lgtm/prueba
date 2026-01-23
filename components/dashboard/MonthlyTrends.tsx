"use client";

import React from 'react';
import { TrendingUp, DollarSign, Scissors, ShoppingBag, ArrowUpRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface TrendItemProps {
    label: string;
    actual: number;
    objetivo: number;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    barColor: string;
    unit?: string;
}

const TrendItem: React.FC<TrendItemProps> = ({
    label, actual, objetivo, icon, color, bgColor, barColor, unit = ''
}) => {
    const percentage = objetivo > 0 ? Math.min(Math.round((actual / objetivo) * 100), 100) : 0;
    const realPercentage = objetivo > 0 ? Math.round((actual / objetivo) * 100) : 0;

    return (
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4 transition-all active:scale-[0.98]">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-xl flex items-center justify-center", bgColor, color)}>
                        <div className="w-5 h-5 *:w-full *:h-full">
                            {icon}
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{label}</p>
                        <h4 className="text-xl font-bold text-white">
                            {actual.toLocaleString()}{unit}
                        </h4>
                    </div>
                </div>
                <div className={cn("flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800/50 font-bold text-xs", color)}>
                    <ArrowUpRight size={14} />
                    {realPercentage}%
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                    <span className="text-zinc-500">Progreso Mensual</span>
                    <span className="text-zinc-400">Meta: {objetivo.toLocaleString()}{unit}</span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className={cn("h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)]", barColor)}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

interface MonthlyTrendsProps {
    revenue: number;
    cuts: number;
    products: number;
    objRevenue?: number;
    objCuts?: number;
    objProducts?: number;
    loading?: boolean;
}

export const MonthlyTrends: React.FC<MonthlyTrendsProps> = ({
    revenue,
    cuts,
    products,
    objRevenue = 25000,
    objCuts = 1000,
    objProducts = 40,
    loading
}) => {
    return (
        <div className={cn(
            "space-y-4 mb-8 transition-opacity duration-300",
            loading ? "opacity-40 animate-pulse pointer-events-none" : "opacity-100"
        )}>
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-500/10 rounded-lg">
                        <TrendingUp size={16} className="text-amber-500" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">Tendencias del Mes</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TrendItem
                    label="Ingresos Totales"
                    actual={revenue}
                    objetivo={objRevenue}
                    unit="€"
                    icon={<DollarSign />}
                    color="text-[#34C759]"
                    bgColor="bg-[#34C759]/10"
                    barColor="bg-[#34C759]"
                />
                <TrendItem
                    label="Cortes Realizados"
                    actual={cuts}
                    objetivo={objCuts}
                    icon={<Scissors />}
                    color="text-[#007AFF]"
                    bgColor="bg-[#007AFF]/10"
                    barColor="bg-[#007AFF]"
                />
                <TrendItem
                    label="Productos Vendidos"
                    actual={products}
                    objetivo={objProducts}
                    icon={<ShoppingBag />}
                    color="text-[#FF3B30]"
                    bgColor="bg-[#FF3B30]/10"
                    barColor="bg-[#FF3B30]"
                />
            </div>
        </div>
    );
};
