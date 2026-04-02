'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { User, Plus, Clock, Calculator, Settings, ChevronRight, UserCircle, Trash2, Shield, Save, Loader2, X, AlertTriangle, ChevronLeft, Calendar, Check, ChevronDown, ChevronUp, Minus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import AttendanceReportModal from '@/components/accounting/AttendanceReportModal'
import SalaryCalculatorModal from '@/components/trends/SalaryCalculatorModal'
import { BarberManager } from './BarberManager'
import { TimePicker24h } from '@/components/ui/TimePicker24h'

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

interface Barber {
    id: string
    nombre: string
    foto?: string
    horario_semanal?: any
    salario_base?: number
    porcentaje_comision?: number
    'jefe/dueño'?: boolean
}

const getDefaultBarberSchedule = () => {
    return Array.from({ length: 7 }, (_, index) => ({
        dia: index,
        activo: index !== 0, // Inician activos todos menos el domingo (0)
        turnos: index !== 0 ? [{ inicio: '09:00', fin: '20:00' }] : []
    }));
};

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
 
    useEffect(() => {
        if (initialMonth) {
            setMonth(initialMonth)
        }
    }, [initialMonth])

    // Add Barber state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [addStep, setAddStep] = useState<'name' | 'schedule'>('name')
    const [newBarberName, setNewBarberName] = useState('')
    const [newBarberSchedule, setNewBarberSchedule] = useState<any[]>(getDefaultBarberSchedule())
    const [expandedDaysAdd, setExpandedDaysAdd] = useState<number[]>([]) // Indices de días expandidos
    const [isSubmitting, setIsSubmitting] = useState(false)

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

    const handleAddBarber = async () => {
        if (!newBarberName.trim()) {
            toast.error('El nombre es obligatorio')
            return
        }
        setIsSubmitting(true)
        try {
            const { data, error } = await supabase
                .from('barberos')
                .insert({
                    nombre: newBarberName,
                    barberia_id: perfilId,
                    horario_semanal: newBarberSchedule,
                    salario_base: 0,
                    porcentaje_comision: 0
                })
                .select()
                .single()

            if (error) throw error

            toast.success('Barbero registrado correctamente')
            setNewBarberName('')
            setNewBarberSchedule(getDefaultBarberSchedule())
            setAddStep('name')
            setIsAddModalOpen(false)

            // Refresh list and select the new one
            await fetchBarbers()
            setSelectedBarberId(data.id)
        } catch (error: any) {
            toast.error('Error al registrar: ' + error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const updateScheduleDay = (idx: number, field: string, value: any) => {
        const updated = [...newBarberSchedule]
        if (field === 'activo' && value === true && updated[idx].turnos.length === 0) {
            updated[idx] = { ...updated[idx], [field]: value, turnos: [{ inicio: '09:00', fin: '20:00' }] }
        } else {
            updated[idx] = { ...updated[idx], [field]: value }
        }
        setNewBarberSchedule(updated)
    }

    const updateScheduleTurn = (dayIdx: number, turnIdx: number, field: 'inicio' | 'fin', value: string) => {
        const updated = [...newBarberSchedule]
        const turnos = [...updated[dayIdx].turnos]
        turnos[turnIdx] = { ...turnos[turnIdx], [field]: value }
        updated[dayIdx] = { ...updated[dayIdx], turnos }
        setNewBarberSchedule(updated)
    }

    const toggleAddDayExpansion = (idx: number) => {
        setExpandedDaysAdd(prev =>
            prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
        )
    }

    const addTurnToNewBarber = (dayIdx: number) => {
        const updated = [...newBarberSchedule]
        if (!updated[dayIdx].activo || updated[dayIdx].turnos.length >= 2) return
        
        // Automatizar primera jornada a horario de mañana
        updated[dayIdx].turnos[0] = { inicio: '09:00', fin: '14:00' }
        // Añadir segunda jornada de tarde
        updated[dayIdx].turnos = [...updated[dayIdx].turnos, { inicio: '17:00', fin: '21:00' }]
        
        setNewBarberSchedule(updated)
    }

    const removeTurnFromNewBarber = (dayIdx: number, turnIdx: number) => {
        const updated = [...newBarberSchedule]
        if (updated[dayIdx].turnos.length <= 1) return
        const turnos = [...updated[dayIdx].turnos]
        turnos.splice(turnIdx, 1)
        updated[dayIdx].turnos = turnos
        setNewBarberSchedule(updated)
    }

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
                        onClick={() => setIsAddModalOpen(true)}
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
                                            onClose={() => { }}
                                            month={month}
                                            inline
                                            barberId={selectedBarberId}
                                        />
                                    )}

                                    {activeSubTab === 'liquidacion' && selectedBarberId && (
                                        <SalaryCalculatorModal
                                            onClose={() => { }}
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

            {/* Modal Añadir Barbero */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4"
                        onClick={() => setIsAddModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className={cn(
                                "bg-zinc-950 border border-zinc-800 rounded-[2.5rem] shadow-2xl relative overflow-hidden transition-all duration-300",
                                addStep === 'name' ? 'w-full max-w-sm p-8' : 'w-full max-w-xl p-6 lg:p-10'
                            )}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Progresión de Pasos */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-900">
                                <motion.div
                                    className="h-full bg-amber-500"
                                    animate={{ width: addStep === 'name' ? '50%' : '100%' }}
                                />
                            </div>

                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                        {addStep === 'name' ? <Plus className="w-5 h-5 text-amber-500" /> : <Calendar className="w-5 h-5 text-amber-500" />}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-black text-xl uppercase italic tracking-tighter">
                                            {addStep === 'name' ? 'Nuevo Barbero' : 'Configurar Horario'}
                                        </h3>
                                        <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-widest">
                                            {addStep === 'name' ? 'Paso 1: Identificación' : 'Paso 2: Disponibilidad Semanal'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="p-2 text-zinc-600 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <AnimatePresence mode="wait">
                                {addStep === 'name' ? (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-zinc-500 ml-2 tracking-widest">Nombre del Barbero</label>
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="Ej: Pablo"
                                                value={newBarberName}
                                                onChange={(e) => setNewBarberName(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && setAddStep('schedule')}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:border-amber-500 outline-none transition-all placeholder:text-zinc-700 font-bold"
                                            />
                                        </div>

                                        <button
                                            onClick={() => {
                                                if (!newBarberName.trim()) return toast.error('Escribe su nombre primero');
                                                setAddStep('schedule');
                                            }}
                                            className="w-full py-5 bg-white text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 hover:bg-zinc-200"
                                        >
                                            Siguiente Paso
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                            {newBarberSchedule.map((day, idx) => {
                                                const isExpanded = expandedDaysAdd.includes(idx)
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="bg-zinc-900/60 rounded-xl border border-zinc-800/60 overflow-hidden"
                                                    >
                                                        <div
                                                            onClick={() => day.activo && toggleAddDayExpansion(idx)}
                                                            className={cn(
                                                                "px-4 py-3 flex items-center justify-between",
                                                                day.activo && "cursor-pointer hover:bg-zinc-800/40 transition-colors"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-sm font-bold text-white w-20">{DAY_NAMES[idx]}</span>
                                                                <span className={cn(
                                                                    "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider",
                                                                    day.activo ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-800 text-zinc-500"
                                                                )}>
                                                                    {day.activo ? 'Activo' : 'Libre'}
                                                                </span>
                                                                {day.activo && !isExpanded && day.turnos.length > 0 && (
                                                                    <span className="text-[9px] text-zinc-500 font-medium">
                                                                        {day.turnos.map((t: any) => `${t.inicio}-${t.fin}`).join(' · ')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); updateScheduleDay(idx, 'activo', !day.activo); }}
                                                                    className={cn(
                                                                        "w-9 h-5 rounded-full transition-all flex items-center px-0.5",
                                                                        day.activo ? "bg-amber-500" : "bg-zinc-800"
                                                                    )}
                                                                >
                                                                    <div className={cn("w-4 h-4 bg-white rounded-full transition-all shadow-sm", day.activo && "translate-x-4")} />
                                                                </button>
                                                                {day.activo && (
                                                                    isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />
                                                                )}
                                                            </div>
                                                        </div>

                                                        {day.activo && isExpanded && (
                                                            <div className="px-4 pb-3 pt-2 border-t border-zinc-800/40 animate-in slide-in-from-top-1 duration-200">
                                                                <div className="space-y-3">
                                                                    {day.turnos.map((turno: any, tIdx: number) => (
                                                                        <div key={tIdx} className="flex items-center gap-3">
                                                                            <div className="flex-1">
                                                                                <TimePicker24h
                                                                                    value={turno.inicio}
                                                                                    onChange={(val) => updateScheduleTurn(idx, tIdx, 'inicio', val)}
                                                                                />
                                                                            </div>
                                                                            <div className="w-4 h-[1px] bg-zinc-800 shrink-0" />
                                                                            <div className="flex-1">
                                                                                <TimePicker24h
                                                                                    value={turno.fin}
                                                                                    onChange={(val) => updateScheduleTurn(idx, tIdx, 'fin', val)}
                                                                                />
                                                                            </div>
                                                                            {day.turnos.length > 1 && (
                                                                                <button
                                                                                    onClick={() => removeTurnFromNewBarber(idx, tIdx)}
                                                                                    className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                                                                                >
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    ))}

                                                                    {day.turnos.length < 2 && (
                                                                        <button
                                                                            onClick={() => addTurnToNewBarber(idx)}
                                                                            className="w-full py-2 border border-dashed border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-amber-500 hover:border-amber-500/30 transition-all flex items-center justify-center gap-2"
                                                                        >
                                                                            <Plus className="w-3.5 h-3.5" />
                                                                            Añadir Turno
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setAddStep('name')}
                                                className="flex-1 py-5 bg-zinc-900 text-zinc-500 font-black text-xs uppercase tracking-[0.2em] rounded-2xl border border-zinc-800 hover:text-white transition-all flex items-center justify-center gap-2"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                                Nombre
                                            </button>
                                            <button
                                                onClick={handleAddBarber}
                                                disabled={isSubmitting}
                                                className="flex-[2] py-5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                            >
                                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                                Finalizar Alta
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
