'use client'

import { useState, useEffect } from 'react'
import { X, Clock, Calendar, ChevronDown, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useBarberStats } from '@/hooks/useBarberStats'
import { BarberOvertimeInline } from './BarberOvertimeInline'

interface QuickOvertimeModalProps {
    onClose: () => void
}

export default function QuickOvertimeModal({ onClose }: QuickOvertimeModalProps) {
    const now = new Date()
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const [selectedMonth, setSelectedMonth] = useState(defaultMonth)
    const { stats, loading, refresh } = useBarberStats(selectedMonth) as any
    const [shopId, setShopId] = useState<string | null>(null)
    const [expandedBarber, setExpandedBarber] = useState<string | null>(null)

    useEffect(() => {
        const fetchShopId = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const { data } = await supabase.from('perfiles').select('id').eq('id', user.id).single()
            if (data) setShopId(data.id)
        }
        fetchShopId()
    }, [])

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4">
            <div className="bg-zinc-900 border-t md:border border-zinc-800 rounded-t-[2.5rem] md:rounded-3xl w-full max-w-lg shadow-2xl h-[92dvh] md:h-auto md:max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-4 md:zoom-in duration-300">

                {/* Header */}
                <div className="flex items-center justify-between p-4 md:p-6 shrink-0 border-b border-zinc-800/50">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-amber-500/10 flex items-center justify-center">
                            <Clock className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="font-black text-white text-base md:text-lg tracking-tight uppercase italic">Control de Horas</h2>
                            <p className="text-zinc-500 text-[10px] md:text-xs font-medium">Registro informativo por barbero</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-colors">
                        <X className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                </div>

                {/* Month Selector */}
                <div className="px-4 md:px-6 py-3 md:py-4 bg-zinc-900 shrink-0 border-b border-zinc-800/30">
                    <div className="flex items-center justify-between bg-zinc-800/50 p-2.5 md:p-3 rounded-xl md:rounded-2xl border border-zinc-700/30">
                        <div className="flex items-center gap-2 md:gap-3">
                            <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-zinc-500" />
                            <span className="text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Período de Control</span>
                        </div>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(e.target.value)}
                            className="bg-transparent border-none text-white text-xs md:text-sm font-bold outline-none cursor-pointer focus:ring-0 text-right pr-0"
                        />
                    </div>
                </div>

                {/* Barber List */}
                <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-3">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 rounded-xl bg-zinc-800 animate-pulse" />
                            ))}
                        </div>
                    ) : stats.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-zinc-600 text-sm font-medium">No hay actividad este mes.</p>
                        </div>
                    ) : (
                        stats.map((barber: any) => (
                            <div key={barber.id} className="bg-zinc-800/30 rounded-2xl border border-zinc-800 overflow-hidden">
                                <button
                                    onClick={() => setExpandedBarber(expandedBarber === barber.id ? null : barber.id)}
                                    className="w-full flex items-center justify-between p-3.5 md:p-4 hover:bg-zinc-800/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center font-black text-amber-500 text-[10px]">
                                            {barber.nombre.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-xs md:text-sm font-bold text-white uppercase">{barber.nombre}</span>
                                    </div>
                                    <div className="flex items-center gap-2 md:gap-3">
                                        {barber.totalExtraHours > 0 && (
                                            <span className="text-[9px] md:text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                                {barber.totalExtraHours.toFixed(1)}h Realizadas
                                            </span>
                                        )}
                                        {expandedBarber === barber.id ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
                                    </div>
                                </button>

                                {expandedBarber === barber.id && shopId && (
                                    <div className="px-3 md:px-4 pb-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <BarberOvertimeInline
                                            barberId={barber.id}
                                            barberiaId={shopId}
                                            month={selectedMonth}
                                            onChanged={() => refresh && refresh()}
                                        />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 md:p-6 shrink-0 border-t border-zinc-800 text-center">
                    <p className="text-[9px] md:text-[10px] text-zinc-600 uppercase font-black tracking-widest italic">Estas horas son informativas y no afectan a la liquidación económica</p>
                </div>
            </div>
        </div>
    )
}
