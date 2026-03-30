'use client'

import { Scissors, TrendingUp } from 'lucide-react'
import { BarberStat } from '@/hooks/useBarberStats'

interface BarberRankingCardProps {
    stats: BarberStat[]
    loading: boolean
    globalCutsGoal: number
    selectedMonthText?: string
}

export default function BarberRankingCard({ stats, loading, globalCutsGoal, selectedMonthText }: BarberRankingCardProps) {
    // Sort by cuts for this specific view (volume of work)
    const sortedByCuts = [...stats].sort((a, b) => b.totalCuts - a.totalCuts)

    // Per-barber goal calculation
    const numBarbers = stats.length || 1
    const perBarberGoal = Math.max(Math.floor(globalCutsGoal / numBarbers), 1)

    return (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl md:rounded-3xl p-5 md:p-7">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
                    <h2 className="text-sm font-black uppercase tracking-widest text-white">Rendimiento Equipo</h2>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Meta Indv:</span>
                        <span className="text-xs font-black text-amber-500">{perBarberGoal}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Meta Global:</span>
                        <span className="text-[10px] font-black text-zinc-400">{globalCutsGoal}</span>
                    </div>
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
                <div className="space-y-3">
                    {sortedByCuts.map((barber, idx) => {
                        const progressPct = Math.min(Math.round((barber.totalCuts / perBarberGoal) * 100), 100);
                        const realPct = Math.round((barber.totalCuts / perBarberGoal) * 100);
                        const key = barber.id || barber.nombre;

                        const isFirst = idx === 0;
                        const isSecond = idx === 1;
                        const isThird = idx === 2;

                        let badgeColor = 'bg-zinc-800 text-zinc-400 border-zinc-700';
                        if (isFirst) badgeColor = 'bg-amber-400 text-black border-amber-300';
                        else if (isSecond) badgeColor = 'bg-zinc-300 text-black border-zinc-200';
                        else if (isThird) badgeColor = 'bg-[#cd7f32] text-white border-[#b8732d]';

                        let cardClasses = 'bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-3.5 transition-all';
                        if (isFirst) {
                            cardClasses = 'bg-zinc-900/60 border border-amber-500/30 rounded-xl p-3.5 shadow-[0_0_15px_rgba(245,158,11,0.1)] relative overflow-hidden transition-all';
                        }

                        return (
                            <div key={key} className={cardClasses}>
                                {/* First Place Glow Effect */}
                                {isFirst && <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />}
                                
                                <div className="flex items-center gap-3 sm:gap-4 relative z-10">
                                    {/* Avatar with absolute badge directly integrated */}
                                    <div className="relative shrink-0">
                                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
                                            {barber.foto ? (
                                                <img src={barber.foto} alt={barber.nombre} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-sm font-black text-amber-500">
                                                    {barber.nombre.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className={`absolute -bottom-1 -right-1 w-[22px] h-[22px] flex items-center justify-center rounded-full border-[1.5px] text-[10px] font-black shadow-sm ${badgeColor}`}>
                                            {idx + 1}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        {/* Top line: Name + % */}
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-bold text-white truncate">{barber.nombre}</span>
                                            <span className={`text-[11px] font-black uppercase tracking-widest ${realPct >= 100 ? 'text-green-500' : 'text-amber-500'}`}>
                                                {realPct}%
                                            </span>
                                        </div>
                                        
                                        {/* Progress Bar */}
                                        <div className="h-2 bg-zinc-950 rounded-full overflow-hidden shadow-inner w-full mb-1.5 border border-zinc-800/50">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                                    realPct >= 100 
                                                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
                                                        : 'bg-gradient-to-r from-orange-600 to-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                                                }`}
                                                style={{ width: `${progressPct}%` }}
                                            />
                                        </div>
                                        
                                        {/* Bottom Data */}
                                        <div className="text-right mt-0.5">
                                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                                                {barber.totalCuts} / {perBarberGoal} cortes
                                            </span>
                                        </div>
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
