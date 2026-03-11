'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, User, Scissors, Check, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const StaticBookingPreview = () => {
    // Mock data for the static preview
    const barbers = [
        { id: 1, name: 'Kevin', initial: 'K', selected: false },
        { id: 2, name: 'Oscar', initial: 'O', selected: true },
        { id: 3, name: 'Dani', initial: 'D', selected: false },
    ]

    const slots = ['16:00', '16:45', '17:30', '18:15', '19:00', '19:45']
    const selectedTime = '17:30'

    return (
        <div className="w-full max-w-xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-3xl overflow-hidden shadow-2xl"
            >
                {/* Header / Step Indicator */}
                <div className="p-6 border-b border-zinc-800/50">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 text-black text-sm font-black">
                            2
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Fecha y Hora</h3>
                            <p className="text-zinc-500 text-xs">Paso actual del proceso de reserva</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* Calendar Section Mockup */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-amber-500" />
                                Octubre 2026
                            </h4>
                        </div>
                        <div className="grid grid-cols-7 gap-2 text-center">
                            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                                <div key={d} className="text-[10px] font-bold text-zinc-600">{d}</div>
                            ))}
                            {/* Simplified row of days */}
                            {[11, 12, 13, 14, 15, 16, 17].map((d) => (
                                <div
                                    key={d}
                                    className={cn(
                                        "aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all",
                                        d === 12 ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "text-zinc-500 border border-zinc-800/50"
                                    )}
                                >
                                    {d}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Barbers Row */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <User className="w-4 h-4 text-amber-500" />
                            Selecciona Barbero
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                            {barbers.map((barber) => (
                                <div
                                    key={barber.id}
                                    className={cn(
                                        "flex flex-col items-center p-3 rounded-2xl border transition-all gap-2",
                                        barber.selected
                                            ? "bg-amber-500/10 border-amber-500/50 text-white"
                                            : "bg-zinc-950/50 border-zinc-800 text-zinc-500"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
                                        barber.selected ? "bg-amber-500 text-black" : "bg-zinc-800"
                                    )}>
                                        {barber.initial}
                                    </div>
                                    <span className="text-xs font-bold">{barber.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Time Slots Grid */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-500" />
                            Horas Disponibles
                        </h4>
                        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                            {slots.map((time) => (
                                <div
                                    key={time}
                                    className={cn(
                                        "py-2 rounded-lg text-xs font-bold border text-center transition-all",
                                        time === selectedTime
                                            ? "bg-white text-black border-white shadow-xl shadow-white/5"
                                            : "bg-zinc-950 border-zinc-800 text-zinc-500"
                                    )}
                                >
                                    {time}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-4">
                        <div className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-lg uppercase tracking-tight shadow-xl shadow-amber-500/10 transition-all cursor-default">
                            Continuar Reserva
                            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                        </div>
                    </div>
                </div>

                {/* Bottom decorative bar */}
                <div className="h-1 bg-gradient-to-r from-amber-500/0 via-amber-500/50 to-amber-500/0" />
            </motion.div>
        </div>
    )
}

export default StaticBookingPreview
