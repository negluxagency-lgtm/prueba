'use client'

import { Scissors, TrendingUp } from 'lucide-react'
import { BarberStat } from '@/hooks/useBarberStats'

interface BarberRankingCardProps {
    stats: BarberStat[]
    loading: boolean
    globalCutsGoal: number
}

export default function BarberRankingCard({ stats, loading, globalCutsGoal }: BarberRankingCardProps) {
    // Sort by cuts for this specific view (volume of work)
    const sortedByCuts = [...stats].sort((a, b) => b.totalCuts - a.totalCuts)

    // Per-barber goal calculation
    const numBarbers = stats.length || 1
    const perBarberGoal = Math.max(Math.floor(globalCutsGoal / numBarbers), 1)

    return (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl md:rounded-3xl p-5 md:p-7">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-base md:text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                        <Scissors className="w-4 h-4 text-amber-500" />
                        Rendimiento por Barbero
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5 whitespace-nowrap">Meta individual: <span className="text-amber-500 font-bold">{perBarberGoal} cortes</span></p>
                </div>
                <div className="text-right">
                    <TrendingUp className="w-5 h-5 text-zinc-600 ml-auto mb-1" />
                    <p className="text-[8px] text-zinc-600 uppercase font-black tracking-widest leading-none">Global: {globalCutsGoal}</p>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-14 rounded-xl bg-zinc-800 animate-pulse" />
                    ))}
                </div>
            ) : sortedByCuts.length === 0 ? (
                <p className="text-zinc-600 text-sm text-center py-6">
                    No hay datos de barberos para este período.
                </p>
            ) : (
                <div className="space-y-4">
                    {sortedByCuts.map((barber, idx) => {
                        const progressPct = Math.min(Math.round((barber.totalCuts / perBarberGoal) * 100), 100)
                        const realPct = Math.round((barber.totalCuts / perBarberGoal) * 100)

                        return (
                            <div key={barber.nombre} className="flex items-center gap-4">
                                {/* Position badge */}
                                <span className={`text-xs font-black w-5 text-center shrink-0 ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-zinc-300' : 'text-zinc-600'}`}>
                                    #{idx + 1}
                                </span>

                                {/* Avatar */}
                                <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                                    <span className="text-sm font-black text-amber-500">
                                        {barber.nombre.charAt(0).toUpperCase()}
                                    </span>
                                </div>

                                {/* Bar + name */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-white truncate">{barber.nombre}</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${realPct >= 100 ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'
                                                }`}>
                                                {barber.totalCuts} / {perBarberGoal} ({realPct}%)
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden relative">
                                        {/* Meta Marker at 100% */}
                                        <div
                                            className="h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                                            style={{
                                                width: `${progressPct}%`,
                                                backgroundColor: realPct >= 100 ? '#22c55e' : '#f59e0b'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
