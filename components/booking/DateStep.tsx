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
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Clock, Loader2, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBookingStore, BookingBarber } from '@/store/useBookingStore'
import { getAvailableSlots } from '@/app/actions/get-available-slots'
import { toast } from 'sonner'
import { getProxiedUrl } from '@/utils/url-helper'

interface DateStepProps {
    slug: string
    closingDates?: string[]
    barbers?: BookingBarber[]
    plan?: string
}

export default function DateStep({ slug, closingDates = [], barbers = [], plan }: DateStepProps) {
    // Read only the slices this component needs
    const selectedService = useBookingStore((s) => s.selectedService)
    const selectedDate = useBookingStore((s) => s.selectedDate)
    const selectedTime = useBookingStore((s) => s.selectedTime)
    const selectedBarberId = useBookingStore((s) => s.selectedBarberId)
    const setStep = useBookingStore((s) => s.setStep)
    const setDate = useBookingStore((s) => s.setDate)
    const setTime = useBookingStore((s) => s.setTime)
    const setBarberId = useBookingStore((s) => s.setBarberId)

    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [availableSlots, setAvailableSlots] = useState<string[]>([])
    const [loadingSlots, setLoadingSlots] = useState(false)

    // ── Helpers ──────────────────────────────────────────────────────────────

    const formatDateLocal = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const isBarberAvailable = useCallback((barber: BookingBarber, date: Date | null) => {
        if (!date || !barber.horario_semanal) return true
        const dayOfWeek = getDay(date)
        const daySchedule = barber.horario_semanal.find((d) => d.dia === dayOfWeek)
        return daySchedule?.activo && (daySchedule.turnos?.length || 0) > 0
    }, [])

    // ── Calendar config ───────────────────────────────────────────────────────

    const today = startOfDay(new Date())
    const maxDate = addDays(today, 25)
    const firstDayOfMonth = startOfMonth(currentMonth)
    const lastDayOfMonth = endOfMonth(currentMonth)
    const daysInMonth = Array.from({ length: lastDayOfMonth.getDate() }, (_, i) =>
        addDays(firstDayOfMonth, i)
    )
    const startingDayIndex = (getDay(firstDayOfMonth) + 6) % 7 // Monday first

    // ── Fetch slots on date / service / barber change ─────────────────────────

    useEffect(() => {
        const dateString = selectedDate ? formatDateLocal(selectedDate) : ''
        const isClosed = closingDates.includes(dateString)

        if (!selectedDate || !selectedService || isClosed) {
            setAvailableSlots([])
            return
        }

        // Auto-reset barber if not available on new date
        if (selectedBarberId) {
            const currentBarber = barbers.find((b) => b.id === selectedBarberId)
            if (currentBarber && !isBarberAvailable(currentBarber, selectedDate)) {
                setBarberId(null)
            }
        }

        const fetchSlots = async () => {
            setLoadingSlots(true)
            try {
                const slots = await getAvailableSlots({
                    slug,
                    date: formatDateLocal(selectedDate),
                    serviceDuration: selectedService.duracion,
                    selectedBarberId,
                })
                setAvailableSlots(slots)
            } catch {
                toast.error('Error al cargar horarios disponibles')
                setAvailableSlots([])
            } finally {
                setLoadingSlots(false)
            }
        }

        fetchSlots()
    }, [selectedDate, selectedService, selectedBarberId, slug])

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <motion.div
            key="step2"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-black text-xs font-bold">
                        2
                    </span>
                    Fecha y Hora
                </h2>
                <button
                    onClick={() => setStep('SERVICE')}
                    className="text-xs font-medium text-zinc-500 hover:text-white flex items-center gap-1"
                >
                    <ChevronLeft size={14} /> Cambiar Servicio
                </button>
            </div>

            {/* Calendar */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-4 md:p-6 space-y-4">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-2">
                    <button
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        disabled={isBefore(startOfMonth(subMonths(currentMonth, 1)), startOfMonth(today))}
                        className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <h3 className="text-lg font-black text-white capitalize">
                        {format(currentMonth, 'MMMM yyyy', { locale: es })}
                    </h3>
                    <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        disabled={isAfter(startOfMonth(addMonths(currentMonth, 1)), startOfMonth(maxDate))}
                        className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-1 md:gap-2 text-center">
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
                        <div key={d} className="text-[10px] md:text-xs font-bold text-zinc-500 py-2">
                            {d}
                        </div>
                    ))}
                    {Array.from({ length: startingDayIndex }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square" />
                    ))}
                    {daysInMonth.map((date) => {
                        const dateStr = formatDateLocal(date)
                        const isSelected = selectedDate && isSameDay(date, selectedDate)
                        const isPast = isBefore(date, today)
                        const isTooFar = isAfter(date, maxDate)
                        const isClosed = closingDates.includes(dateStr)
                        const isDisabled = isPast || isTooFar || isClosed

                        return (
                            <button
                                key={dateStr}
                                onClick={() => !isDisabled && setDate(date)}
                                disabled={isDisabled}
                                className={cn(
                                    'aspect-square rounded-lg md:rounded-xl flex items-center justify-center text-sm font-bold transition-all relative',
                                    isSelected
                                        ? 'bg-amber-500 text-black shadow-lg scale-105 z-10'
                                        : 'bg-zinc-800/30 text-zinc-300 hover:bg-zinc-800',
                                    isDisabled &&
                                    'opacity-20 cursor-not-allowed bg-transparent text-zinc-600 hover:bg-transparent'
                                )}
                            >
                                {format(date, 'd')}
                                {isSelected && (
                                    <motion.div
                                        layoutId="selectedDay"
                                        className="absolute inset-0 border-2 border-white/20 rounded-lg md:rounded-xl"
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Barber Selection (Premium and Profesional) */}
            {barbers.length > 0 && ['premium', 'profesional'].includes((plan || '').toLowerCase()) && (
                <div className="space-y-3">
                    <p className="text-xs font-bold uppercase text-zinc-500 tracking-wider flex items-center gap-2">
                        <User size={12} className="text-amber-500" />
                        Selecciona tu Barbero
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setBarberId(null)}
                            className={cn(
                                'flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-2 backdrop-blur-sm',
                                selectedBarberId === null
                                    ? 'bg-amber-500/90 text-black border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                                    : 'bg-zinc-900/40 border-zinc-800/50 text-zinc-400 hover:bg-zinc-800/60'
                            )}
                        >
                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                                <User className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-center">Cualquiera</span>
                            <span className="text-[10px] opacity-70">Me es indiferente</span>
                        </button>

                        {barbers
                            .filter((b) => !selectedDate || isBarberAvailable(b, selectedDate))
                            .map((barber) => (
                                <button
                                    key={barber.id}
                                    onClick={() => setBarberId(barber.id)}
                                    className={cn(
                                        'flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-2 backdrop-blur-sm',
                                        selectedBarberId === barber.id
                                            ? 'bg-amber-500/90 text-black border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                                            : 'bg-zinc-900/40 border-zinc-800/50 text-zinc-400 hover:bg-zinc-800/60'
                                    )}
                                >
                                    {barber.foto ? (
                                        <img
                                            src={getProxiedUrl(barber.foto)}
                                            alt={barber.nombre}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg font-bold">
                                            {barber.nombre.charAt(0)}
                                        </div>
                                    )}
                                    <span className="text-xs font-bold text-center truncate w-full px-1">
                                        {barber.nombre}
                                    </span>
                                    <span className="text-[10px] opacity-70">
                                        {selectedDate ? 'Disponible' : 'Selecciona fecha'}
                                    </span>
                                </button>
                            ))}
                    </div>
                </div>
            )}

            {/* Time Slots */}
            <div
                className={`space-y-2 transition-all duration-300 ${selectedDate ? 'opacity-100' : 'opacity-50 blur-sm pointer-events-none'
                    }`}
            >
                <p className="text-xs font-bold uppercase text-zinc-500 tracking-wider flex items-center gap-2">
                    <Clock size={12} className="text-amber-500" />
                    Horas Disponibles
                </p>
                {!selectedDate ? (
                    <div className="h-20 flex items-center justify-center text-zinc-600 text-xs md:text-sm border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
                        Selecciona un día para ver horas
                    </div>
                ) : loadingSlots ? (
                    <div className="h-20 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                    </div>
                ) : availableSlots.length === 0 ? (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
                        <p className="text-red-400 font-medium">
                            Lo sentimos, no hay horarios disponibles este día
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-4 gap-2 md:gap-3">
                        {availableSlots.map((time) => (
                            <button
                                key={time}
                                onClick={() => setTime(time)}
                                className={cn(
                                    'py-2 md:py-3 rounded-lg text-xs md:text-sm font-bold border transition-all active:scale-[0.98]',
                                    selectedTime === time
                                        ? 'bg-white text-black border-white shadow-lg scale-[1.02]'
                                        : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-amber-500/50 hover:text-amber-500'
                                )}
                            >
                                {time}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    )
}
