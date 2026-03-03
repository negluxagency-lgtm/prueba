'use client'

import { Users, Clock, CheckCircle2 as Check, Calculator } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const BARBERS = [
    { name: 'Alex', status: 'Trabajando', time: '09:00 - 18:00', active: true, color: 'emerald' },
    { name: 'Dani', status: 'Pausa', time: '10:00 - 19:30', active: false, color: 'amber' },
    { name: 'Marc', status: 'Trabajando', time: '09:00 - 14:00', active: true, color: 'emerald' },
]

export default function DemoStaffVisual() {
    return (
        <div className="relative w-full max-w-lg mx-auto">
            {/* Background Glow */}
            <div className="absolute -inset-4 bg-indigo-500/5 blur-3xl rounded-[3rem]" />

            <div className="relative bg-zinc-900/80 border border-zinc-800 rounded-[2.5rem] p-6 shadow-2xl backdrop-blur-sm">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h4 className="text-white font-black uppercase italic tracking-tighter text-lg leading-none">Mi Equipo</h4>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Estado en tiempo real</p>
                    </div>
                    <div className="bg-zinc-800/50 px-3 py-1.5 rounded-xl border border-zinc-700/50 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[10px] font-black text-white tabular-nums">12:45 PM</span>
                    </div>
                </div>

                <div className="space-y-3">
                    {BARBERS.map((barber, i) => (
                        <motion.div
                            key={barber.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-4 flex items-center justify-between group hover:border-indigo-500/30 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center border font-black text-xs",
                                    barber.active ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-zinc-800 border-zinc-700 text-zinc-500"
                                )}>
                                    {barber.name[0]}
                                </div>
                                <div>
                                    <h5 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{barber.name}</h5>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", barber.active ? "bg-emerald-500" : "bg-amber-500")} />
                                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{barber.status}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-0.5">Jornada</span>
                                <span className="text-xs font-black text-white tabular-nums">{barber.time}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Payroll Insight Sidebar (Floating) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="absolute -right-4 md:-right-8 -bottom-4 bg-indigo-600 border border-indigo-500 p-4 rounded-3xl shadow-xl shadow-indigo-600/20 max-w-[160px]"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Calculator className="w-4 h-4 text-white" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Liquidación</span>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold text-indigo-100/70 uppercase">
                            <span>Comisiones</span>
                            <span>+45€</span>
                        </div>
                        <div className="flex justify-between text-[9px] font-bold text-indigo-100/70 uppercase border-b border-indigo-500/50 pb-1">
                            <span>Horas Extra</span>
                            <span>+12.5€</span>
                        </div>
                        <div className="flex justify-between text-xs font-black text-white pt-1">
                            <span>TOTAL</span>
                            <span>157.5€</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
