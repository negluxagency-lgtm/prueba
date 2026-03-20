import React from "react";
import { Skeleton } from "./Skeleton";
import { cn } from "@/lib/utils";

/**
 * AgendaSkeleton: Imita la lista de citas del StaffDashboard
 */
export function AgendaSkeleton() {
    return (
        <div className="space-y-4 animate-in fade-in duration-500 w-full">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-4 w-full">
                    <div className="flex items-center justify-between mb-4 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl shrink-0" />
                            <div className="space-y-2 min-w-0">
                                <Skeleton className="w-28 max-w-[120px] h-4 rounded-lg" />
                                <Skeleton className="w-20 max-w-[80px] h-3 rounded-md" />
                            </div>
                        </div>
                        <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Skeleton className="w-20 h-8 rounded-xl" />
                        <Skeleton className="w-20 h-8 rounded-xl" />
                        <div className="ml-auto">
                            <Skeleton className="w-12 h-6 rounded-lg" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * ChartSkeleton: Imita la estructura de un gráfico de barras horizontal
 */
export function ChartSkeleton() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 w-full">
            {[1, 2].map((group) => (
                <div key={group} className="bg-zinc-900 border border-zinc-800 p-5 md:p-8 rounded-[2rem] w-full overflow-hidden">
                    <div className="mb-6 space-y-2">
                        <Skeleton className="w-2/5 h-7 rounded-xl" />
                        <Skeleton className="w-3/5 h-3 rounded-md" />
                    </div>
                    <div className="space-y-5">
                        {[1, 2, 3].map((bar) => (
                            <div key={bar} className="space-y-2">
                                <div className="flex justify-between">
                                    <Skeleton className="w-1/4 h-4 rounded-md" />
                                    <Skeleton className="w-1/6 h-4 rounded-md" />
                                </div>
                                <div className="flex gap-2 w-full">
                                    <Skeleton className="h-7 flex-1 rounded-r-lg" />
                                    <Skeleton className="h-7 w-1/5 rounded-r-lg bg-emerald-500/20" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * PerformanceSkeleton: Para la pestaña de Rendimiento
 */
export function PerformanceSkeleton() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 w-full">
            <div className="flex justify-between items-center mb-6 gap-3">
                <Skeleton className="w-1/3 h-7 rounded-xl" />
                <Skeleton className="w-28 h-10 rounded-full shrink-0" />
            </div>
            <div className="space-y-6 w-full">
                <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-[2rem] w-full">
                    <Skeleton className="w-2/5 h-4 rounded-md mb-5" />
                    <div className="p-4 bg-black/40 rounded-3xl border border-zinc-800/50 space-y-3">
                        <div className="flex justify-between">
                            <Skeleton className="w-1/3 h-3 rounded-md" />
                            <Skeleton className="w-4 h-4 rounded-full" />
                        </div>
                        <Skeleton className="w-24 h-10 rounded-xl" />
                        <Skeleton className="w-full h-2 rounded-full" />
                    </div>
                </div>
                <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-[2rem] space-y-5 w-full">
                    <Skeleton className="w-1/3 h-4 rounded-md" />
                    {[1, 2].map((i) => (
                        <div key={i} className="space-y-2">
                            <div className="flex justify-between">
                                <Skeleton className="w-1/4 h-3 rounded-md" />
                                <Skeleton className="w-1/6 h-3 rounded-md" />
                            </div>
                            <Skeleton className="w-full h-2 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * ObjectiveRingsSkeleton: Imita el componente de anillos de objetivos
 */
export function ObjectiveRingsSkeleton() {
    return (
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl lg:rounded-[2rem] p-5 md:p-6 border border-zinc-800 animate-in fade-in duration-500 w-full overflow-hidden">
            <Skeleton className="w-1/3 h-3 rounded-md mb-5" />
            <div className="flex flex-row items-center gap-4 md:gap-8 w-full">
                <div className="flex-1 space-y-3 min-w-0">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-2 md:p-3 gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <Skeleton className="w-7 h-7 md:w-8 md:h-8 rounded-lg shrink-0" />
                                <div className="space-y-1.5 min-w-0">
                                    <Skeleton className="w-16 md:w-20 h-2 rounded-md" />
                                    <Skeleton className="w-20 md:w-24 h-4 rounded-md" />
                                </div>
                            </div>
                            <Skeleton className="w-8 md:w-10 h-6 rounded-md shrink-0" />
                        </div>
                    ))}
                </div>
                {/* Ring — on mobile it shrinks, on desktop it stays fixed */}
                <div className="relative w-[120px] h-[120px] md:w-[180px] md:h-[180px] shrink-0">
                    <Skeleton className="w-full h-full rounded-full" />
                </div>
            </div>
        </div>
    );
}

/**
 * TableSkeleton: Imita una tabla de citas o productos
 */
export function TableSkeleton() {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2rem] p-4 md:p-6 space-y-4 animate-in fade-in duration-500 w-full overflow-hidden">
            <div className="flex justify-between items-center mb-4 gap-3">
                <Skeleton className="w-2/5 h-6 rounded-xl" />
                <Skeleton className="w-24 h-9 rounded-full shrink-0" />
            </div>
            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 md:p-4 border-b border-zinc-800/50 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <Skeleton className="w-9 h-9 md:w-10 md:h-10 rounded-xl shrink-0" />
                            <div className="space-y-1.5 min-w-0">
                                <Skeleton className="w-28 max-w-[140px] h-4 rounded-md" />
                                <Skeleton className="w-20 max-w-[100px] h-3 rounded-md" />
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <Skeleton className="w-16 md:w-20 h-8 rounded-lg" />
                            <Skeleton className="w-8 h-8 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
