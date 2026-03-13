'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    format,
    addDays,
    isSameDay,
    startOfMonth,
    endOfMonth,
    getDay,
    isBefore,
    startOfDay,
    isAfter,
    addMonths,
    subMonths,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Clock, Loader2, User, CalendarDays, CheckCircle2, X, ChevronRight as ChevronRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAvailableSlots } from '@/app/actions/get-available-slots'
import { updateAppointmentDate } from '@/app/actions/update-appointment-date'
import { toast } from 'sonner'
import { getProxiedUrl } from '@/utils/url-helper'

interface Barber {
    id: string;
    nombre: string;
    foto?: string;
    horario_semanal?: any[];
}

interface RescheduleFlowProps {
    uuid: string;
    currentDia: string;
    currentHora: string;
    currentBarberId?: string;
    slug: string;
    closingDates: string[];
    barbers: Barber[];
    plan?: string;
    serviceDuration: number;
}

export default function RescheduleFlow({
    uuid,
    currentDia,
    currentHora,
    currentBarberId,
    slug,
    closingDates,
    barbers,
    plan,
    serviceDuration
}: RescheduleFlowProps) {
    const [status, setStatus] = useState<'idle' | 'open' | 'loading' | 'done' | 'error'>('idle')
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(currentDia + 'T12:00:00'))
    const [selectedTime, setSelectedTime] = useState<string>(currentHora.substring(0, 5))
    const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null)
    
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [availableSlots, setAvailableSlots] = useState<string[]>([])
    const [loadingSlots, setLoadingSlots] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    const today = startOfDay(new Date())
    const maxDate = addDays(today, 30)

    // ── Helpers ──────────────────────────────────────────────────────────────

    const formatDateLocal = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const isBarberAvailable = useCallback((barber: Barber, date: Date | null) => {
        if (!date || !barber.horario_semanal) return true
        const dayOfWeek = getDay(date)
        const daySchedule = barber.horario_semanal.find((d: any) => d.dia === dayOfWeek)
        return daySchedule?.activo && (daySchedule.turnos?.length || 0) > 0
    }, [])

    // ── Fetch slots ─────────────────────────

    useEffect(() => {
        if (status !== 'open') return

        const dateString = selectedDate ? formatDateLocal(selectedDate) : ''
        const isClosed = closingDates.includes(dateString)

        // Limpiar estados previos inmediatamente para evitar parpadeos de "No hay horarios"
        setAvailableSlots([])
        setErrorMsg('')

        if (!selectedDate || isClosed) {
            return
        }

        const fetchSlots = async () => {
            setLoadingSlots(true)
            try {
                const slots = await getAvailableSlots({
                    slug,
                    date: dateString,
                    serviceDuration: serviceDuration,
                    selectedBarberId,
                })
                setAvailableSlots(slots)
            } catch {
                setErrorMsg('Error al cargar horarios disponibles. Inténtalo de nuevo.')
                setAvailableSlots([])
            } finally {
                setLoadingSlots(false)
            }
        }

        fetchSlots()
    }, [selectedDate, selectedBarberId, slug, serviceDuration, status, closingDates])

    const handleSubmit = async () => {
        if (!selectedDate || !selectedTime) return
        setStatus('loading')
        
        const dateStr = formatDateLocal(selectedDate)
        const barberName = barbers.find(b => b.id === selectedBarberId)?.nombre

        const result = await updateAppointmentDate(uuid, dateStr, selectedTime, selectedBarberId || undefined, barberName)
        
        if (result.success) {
            setStatus('done')
            toast.success('Cita reprogramada con éxito')
        } else {
            setStatus('error')
            setErrorMsg(result.error || 'Error al actualizar la cita')
        }
    }

    // ── Calendar Config ────────────────

    const firstDayOfMonth = startOfMonth(currentMonth)
    const lastDayOfMonth = endOfMonth(currentMonth)
    const daysInMonth = Array.from({ length: lastDayOfMonth.getDate() }, (_, i) =>
        addDays(firstDayOfMonth, i)
    )
    const startingDayIndex = (getDay(firstDayOfMonth) + 6) % 7 // Monday first

    if (status === 'done') {
        return (
            <div className="flex flex-col items-center gap-2 py-6 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <p className="text-white text-xl font-black uppercase tracking-tight">¡Fecha Actualizada!</p>
                <p className="text-zinc-500 text-sm max-w-[250px]">Tu cita ha sido reprogramada. Quedará pendiente de confirmación.</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="mt-4 text-amber-500 text-xs font-bold uppercase tracking-widest hover:underline"
                >
                    Ver detalles actualizados
                </button>
            </div>
        )
    }

    if (status === 'open' || status === 'loading' || status === 'error') {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 mt-6 border-t border-zinc-900 pt-6"
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em]">Selecciona Nueva Fecha</h3>
                    <button
                        onClick={() => setStatus('idle')}
                        className="text-zinc-600 hover:text-white transition-colors p-1"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* CALENDAR */}
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            disabled={isBefore(startOfMonth(subMonths(currentMonth, 1)), startOfMonth(today))}
                            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-500 disabled:opacity-10"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-sm font-bold text-white capitalize">
                            {format(currentMonth, 'MMMM yyyy', { locale: es })}
                        </span>
                        <button
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            disabled={isAfter(startOfMonth(addMonths(currentMonth, 1)), startOfMonth(maxDate))}
                            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-500 disabled:opacity-10"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                            <div key={d} className="text-[10px] font-bold text-zinc-600">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: startingDayIndex }).map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square" />
                        ))}
                        {daysInMonth.map(date => {
                            const dateStr = formatDateLocal(date)
                            const isSelected = selectedDate && isSameDay(date, selectedDate)
                            const isPast = isBefore(date, today)
                            const isClosed = closingDates.includes(dateStr)
                            const isDisabled = isPast || isClosed

                            return (
                                <button
                                    key={dateStr}
                                    onClick={() => {
                                        if (!isDisabled) {
                                            setSelectedDate(date);
                                            setSelectedTime('');
                                        }
                                    }}
                                    disabled={isDisabled}
                                    className={cn(
                                        "aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all",
                                        isSelected ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "text-zinc-400 hover:bg-zinc-800",
                                        isDisabled && "opacity-10 cursor-not-allowed"
                                    )}
                                >
                                    {format(date, 'd')}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* BARBER SELECT */}
                {barbers.length > 0 && ['premium', 'profesional'].includes((plan || '').toLowerCase()) && (
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <User size={12} className="text-amber-500" /> Barbero
                        </p>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                            <button
                                onClick={() => { setSelectedBarberId(null); setSelectedTime(''); }}
                                className={cn(
                                    "flex-shrink-0 flex flex-col items-center p-3 rounded-xl border transition-all min-w-[80px]",
                                    selectedBarberId === null ? "bg-amber-500/10 border-amber-500 text-amber-500" : "bg-zinc-900 border-zinc-800 text-zinc-500"
                                )}
                            >
                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center mb-1">
                                    <User size={14} />
                                </div>
                                <span className="text-[9px] font-bold">Cualquiera</span>
                            </button>
                            {barbers.map(barber => (
                                <button
                                    key={barber.id}
                                    onClick={() => { setSelectedBarberId(barber.id); setSelectedTime(''); }}
                                    className={cn(
                                        "flex-shrink-0 flex flex-col items-center p-3 rounded-xl border transition-all min-w-[80px]",
                                        selectedBarberId === barber.id ? "bg-amber-500/10 border-amber-500 text-amber-500" : "bg-zinc-900 border-zinc-800 text-zinc-500"
                                    )}
                                >
                                    {barber.foto ? (
                                        <img src={getProxiedUrl(barber.foto)} alt={barber.nombre} className="w-8 h-8 rounded-full object-cover mb-1" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center mb-1 text-[10px] font-bold">
                                            {barber.nombre.charAt(0)}
                                        </div>
                                    )}
                                    <span className="text-[9px] font-bold truncate w-14 text-center">{barber.nombre}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* SLOTS */}
                <div className="space-y-3">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={12} className="text-amber-500" /> Horario
                    </p>
                    {loadingSlots ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                        </div>
                    ) : availableSlots.length === 0 ? (
                        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-center">
                            <p className="text-red-400/70 text-[10px] font-bold uppercase tracking-wider">No hay horarios este día</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-2">
                            {availableSlots.map(time => (
                                <button
                                    key={time}
                                    onClick={() => setSelectedTime(time)}
                                    className={cn(
                                        "py-2.5 rounded-xl text-xs font-bold border transition-all",
                                        selectedTime === time ? "bg-white text-black border-white shadow-lg" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                                    )}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {errorMsg && <p className="text-red-400 text-[10px] font-bold bg-red-400/10 p-3 rounded-lg border border-red-400/20">{errorMsg}</p>}

                <button
                    onClick={handleSubmit}
                    disabled={status === 'loading' || !selectedDate || !selectedTime}
                    className="w-full py-4 rounded-2xl bg-amber-500 text-black font-black text-sm uppercase tracking-widest shadow-xl shadow-amber-500/10 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                    {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRightIcon className="w-4 h-4" />}
                    {status === 'loading' ? 'Procesando...' : 'Confirmar Reprogramación'}
                </button>
            </motion.div>
        )
    }

    return (
        <button
            onClick={() => setStatus('open')}
            className="w-full py-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/30 text-zinc-400 hover:text-amber-500 font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 group"
        >
            <CalendarDays className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Cambiar Fecha y Hora
        </button>
    )
}
