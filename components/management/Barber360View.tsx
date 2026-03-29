'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { User, Plus, Clock, Calculator, Settings, ChevronRight, UserCircle, Trash2, Shield, Save, Loader2, X, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import AttendanceReportModal from '@/components/accounting/AttendanceReportModal'
import SalaryCalculatorModal from '@/components/trends/SalaryCalculatorModal'
import { BarberManager } from './BarberManager'

interface Barber {
    id: string
    nombre: string
    foto?: string
    horario_semanal?: any
    salario_base?: number
    porcentaje_comision?: number
    'jefe/dueño'?: boolean
}

interface Barber360ViewProps {
    perfilId: string
    initialMonth?: string
}

export function Barber360View({ perfilId, initialMonth }: Barber360ViewProps) {
    const [barbers, setBarbers] = useState<Barber[]>([])
    const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null)
    const [activeSubTab, setActiveSubTab] = useState<'asistencia' | 'liquidacion' | 'configuracion'>('asistencia')
    const [loading, setLoading] = useState(true)
    const [month, setMonth] = useState(initialMonth || new Date().toISOString().substring(0, 7))

    const fetchBarbers = useCallback(async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('barberos')
                .select('*')
                .eq('barberia_id', perfilId)
                .order('nombre', { ascending: true })

            if (error) throw error
            setBarbers(data || [])
            if (data && data.length > 0 && !selectedBarberId) {
                setSelectedBarberId(data[0].id)
            }
        } catch (error: any) {
            toast.error('Error al cargar equipo: ' + error.message)
        } finally {
            setLoading(false)
        }
    }, [perfilId, selectedBarberId])

    useEffect(() => {
        fetchBarbers()
    }, [fetchBarbers])

    const selectedBarber = barbers.find(b => b.id === selectedBarberId)

    const subTabs = [
        { id: 'asistencia', label: 'Asistencia', icon: Clock },
        { id: 'liquidacion', label: 'Liquidación', icon: Calculator },
        { id: 'configuracion', label: 'Configuración', icon: Settings },
    ] as const

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Iniciando sistemas de gestión...</p>
        </div>
    )

    return (
        <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
            {/* ── SIDEBAR SELECTION ────────────────────────────────────────── */}
            <aside className="w-full lg:w-64 shrink-0 space-y-4">
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2rem] p-4 flex flex-col gap-2">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2 mb-2 italic">Equipo de Barbería</p>
                    <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-hide">
                        {barbers.map(barber => {
                            const isSelected = selectedBarberId === barber.id
                            return (
                                <button
                                    key={barber.id}
                                    onClick={() => setSelectedBarberId(barber.id)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all shrink-0 lg:w-full group",
                                        isSelected 
                                            ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20 scale-[1.02]" 
                                            : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-colors overflow-hidden",
                                        isSelected ? "bg-black/20" : "bg-zinc-800 group-hover:bg-zinc-700"
                                    )}>
                                        {barber.foto ? (
                                            <img src={barber.foto} alt={barber.nombre} className="w-full h-full object-cover" />
                                        ) : (
                                            barber.nombre.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex flex-col items-start min-w-0">
                                        <span className="truncate text-sm leading-none">{barber.nombre}</span>
                                        <span className={cn(
                                            "text-[9px] font-black uppercase tracking-tighter mt-1",
                                            isSelected ? "text-black/60" : "text-zinc-600"
                                        )}>
                                            {barber['jefe/dueño'] ? 'Encargado' : 'Barbero'}
                                        </span>
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    <button
                        onClick={() => {/* TODO: Logic to add barber from page.tsx or here */}}
                        className="mt-2 w-full flex items-center justify-center gap-2 py-3 border border-dashed border-zinc-800 hover:border-amber-500/40 text-zinc-600 hover:text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Añadir Barbero
                    </button>
                </div>
            </aside>

            {/* ── MAIN DETAIL PANEL ────────────────────────────────────────── */}
            <main className="flex-1 min-w-0 bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl">
                {selectedBarber ? (
                    <div className="flex flex-col h-full">
                        {/* Header Ficha */}
                        <div className="px-6 py-6 border-b border-zinc-800/50 bg-gradient-to-br from-zinc-900 to-black">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/10 rotate-3 group-hover:rotate-0 transition-transform overflow-hidden">
                                        {selectedBarber.foto ? (
                                            <img src={selectedBarber.foto} alt={selectedBarber.nombre} className="w-full h-full object-cover" />
                                        ) : (
                                            <UserCircle className="w-8 h-8 text-black" />
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">{selectedBarber.nombre}</h2>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Activo
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="hidden sm:flex items-center gap-2">
                                    {subTabs.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveSubTab(tab.id)}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                activeSubTab === tab.id
                                                    ? "bg-white text-black shadow-xl"
                                                    : "text-zinc-500 hover:text-white hover:bg-zinc-800"
                                            )}
                                        >
                                            <tab.icon className="w-3.5 h-3.5" />
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Mobile subtabs */}
                            <div className="flex sm:hidden items-center gap-1 mt-6 bg-black/40 p-1 rounded-xl border border-zinc-800/50">
                                {subTabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveSubTab(tab.id)}
                                        className={cn(
                                            "flex-1 flex items-center justify-center py-2.5 rounded-lg transition-all",
                                            activeSubTab === tab.id
                                                ? "bg-amber-500 text-black shadow-lg"
                                                : "text-zinc-500"
                                        )}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Contenido Dinámico */}
                        <div className="flex-1 p-6 lg:p-8 overflow-y-auto custom-scrollbar">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeSubTab + selectedBarberId}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="h-full"
                                >
                                    {activeSubTab === 'asistencia' && selectedBarberId && (
                                        <AttendanceReportModal
                                            onClose={() => {}}
                                            month={month}
                                            inline
                                            barberId={selectedBarberId}
                                        />
                                    )}

                                    {activeSubTab === 'liquidacion' && selectedBarberId && (
                                        <SalaryCalculatorModal
                                            onClose={() => {}}
                                            inline
                                            barberId={selectedBarberId}
                                            initialMonth={month}
                                        />
                                    )}

                                    {activeSubTab === 'configuracion' && selectedBarberId && (
                                        <div className="space-y-8">
                                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                                                <h3 className="text-sm font-black text-white uppercase italic mb-6">Ajustes de Perfil</h3>
                                                <BarberManager perfilId={perfilId} inlineBarberId={selectedBarberId} />
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                        <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-6">
                            <User className="w-10 h-10 text-zinc-700" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase italic">Selecciona un barbero</h3>
                        <p className="text-zinc-500 text-sm max-w-xs mt-2 font-medium">Elige un miembro del equipo para ver su ficha 360, asistencia y liquidación.</p>
                    </div>
                )}
            </main>
        </div>
    )
}
