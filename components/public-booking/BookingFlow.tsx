'use client'

import { useState, useMemo, useEffect } from 'react'
import { format, addDays, isSameDay, startOfMonth, endOfMonth, getDay, isBefore, startOfDay, isAfter, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, User, Phone, CheckCircle2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Loader2 } from 'lucide-react'
import { bookGuestAppointment } from '@/app/actions/book-guest-appointment'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

// Types
type Service = {
    id: string
    nombre: string
    precio: number
    duracion: number
}

interface DaySchedule {
    dia_semana: number;
    hora_apertura: string;
    hora_cierre: string;
    esta_abierto: boolean;
    hora_inicio_pausa?: string | null;
    hora_fin_pausa?: string | null;
}

const DAY_NAMES_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function generateTimeSlots(
    selectedDate: Date,
    scheduleArray: DaySchedule[]
): { slots: string[]; isClosed: boolean; dayName: string } {
    const dayOfWeek = getDay(selectedDate); // 0=Sunday, 6=Saturday
    const dayName = DAY_NAMES_ES[dayOfWeek];
    const rule = scheduleArray.find(r => r.dia_semana === dayOfWeek);

    if (!rule || !rule.esta_abierto) {
        return { slots: [], isClosed: true, dayName };
    }

    // Parse times (handle "HH:MM:SS" or "HH:MM" formats)
    const [startHour, startMin] = rule.hora_apertura.split(':').map(Number);
    const [endHour, endMin] = rule.hora_cierre.split(':').map(Number);

    const slots: string[] = [];
    let currentHour = startHour;
    let currentMin = startMin;

    // Parse break times if they exist
    let breakStartTotalMins = -1;
    let breakEndTotalMins = -1;

    if (rule.hora_inicio_pausa && rule.hora_fin_pausa) {
        const [bsH, bsM] = rule.hora_inicio_pausa.split(':').map(Number);
        const [beH, beM] = rule.hora_fin_pausa.split(':').map(Number);
        breakStartTotalMins = bsH * 60 + bsM;
        breakEndTotalMins = beH * 60 + beM;
    }

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        const currentTotalMins = currentHour * 60 + currentMin;

        // Skip if inside break (Start <= current < End)
        // Example: Break 14:00 - 16:00. 
        // 14:00 is skipped. 15:30 is skipped. 16:00 is allowed.
        if (breakStartTotalMins !== -1 && currentTotalMins >= breakStartTotalMins && currentTotalMins < breakEndTotalMins) {
            // Inside break, skip adding
        } else {
            slots.push(`${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`);
        }

        currentMin += 30;
        if (currentMin >= 60) {
            currentMin = 0;
            currentHour++;
        }
    }

    return { slots, isClosed: false, dayName };
}

function filterPastSlots(slots: string[], selectedDate: Date): string[] {
    const now = new Date();
    if (!isSameDay(selectedDate, now)) return slots;

    const currentTime = now.getHours() * 60 + now.getMinutes();
    return slots.filter(slot => {
        const [h, m] = slot.split(':').map(Number);
        return (h * 60 + m) > currentTime;
    });
}

function filterFullSlots(
    slots: string[],
    appointmentTimes: string[],
    capacity: number
): string[] {
    return slots.filter(slot => {
        const count = appointmentTimes.filter(t => t === slot).length
        return count < capacity
    })
}

interface BookingFlowProps {
    services: Service[]
    slug: string
    shopName: string
    closingDates?: string[]
    schedule?: DaySchedule[]
    profileId: string
    capacidadSlots: number
}

type Step = 'SERVICE' | 'DATE' | 'FORM' | 'SUCCESS'

export default function BookingFlow({ services, slug, shopName, closingDates = [], schedule = [], profileId, capacidadSlots }: BookingFlowProps) {
    const [step, setStep] = useState<Step>('SERVICE')
    const [selectedService, setSelectedService] = useState<Service | null>(null)

    // Date & Time State
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedTime, setSelectedTime] = useState<string>('')

    const [guestName, setGuestName] = useState('')
    const [guestPhone, setGuestPhone] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Appointments for capacity check
    const [appointmentsForDate, setAppointmentsForDate] = useState<string[]>([])
    const [loadingSlots, setLoadingSlots] = useState(false)

    // Helper for local date string
    const formatDateLocal = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    // Fetch appointments when date changes
    useEffect(() => {
        if (!selectedDate || !profileId) {
            setAppointmentsForDate([])
            return
        }

        const fetchAppointments = async () => {
            setLoadingSlots(true)
            const dateString = formatDateLocal(selectedDate)

            const { data } = await supabase
                .from('citas')
                .select('Hora')
                .eq('barberia_id', profileId)
                .eq('Dia', dateString)

            const times = (data || []).map((c: any) => c.Hora?.slice(0, 5) || '')
            setAppointmentsForDate(times)
            setLoadingSlots(false)
        }

        fetchAppointments()
    }, [selectedDate, profileId])

    // Dynamic Time Slots based on schedule + capacity
    const { availableSlots, isClosed, dayName } = useMemo(() => {
        if (!selectedDate || schedule.length === 0) {
            return { availableSlots: [], isClosed: false, dayName: '' };
        }
        const result = generateTimeSlots(selectedDate, schedule);
        let filtered = filterPastSlots(result.slots, selectedDate);
        // Filter by capacity
        filtered = filterFullSlots(filtered, appointmentsForDate, capacidadSlots);
        return { availableSlots: filtered, isClosed: result.isClosed, dayName: result.dayName };
    }, [selectedDate, schedule, appointmentsForDate, capacidadSlots])

    // --- CALENDAR LOGIC ---

    // Constraints
    const today = startOfDay(new Date())
    const maxDate = addDays(today, 20)

    // Calendar Helpers
    const firstDayOfMonth = startOfMonth(currentMonth)
    const lastDayOfMonth = endOfMonth(currentMonth)
    const daysInMonth = Array.from({ length: lastDayOfMonth.getDate() }, (_, i) => addDays(firstDayOfMonth, i))

    // Padding for grid alignment (Mon = 0, Sun = 6 in our custom ordering if we want, but date-fns getDay returns Sun=0, Mon=1)
    // Let's use Mon=1 ... Sun=7 approach for easier grid or just map date-fns
    // Standard Grid: Mon, Tue, Wed, Thu, Fri, Sat, Sun
    // date-fns getDay: 0=Sun, 1=Mon, ..., 6=Sat
    // We want Monday first.
    const startingDayIndex = (getDay(firstDayOfMonth) + 6) % 7 // Shift so Monday is 0

    const handleBook = async () => {
        if (!selectedService || !selectedDate || !selectedTime || !guestName || !guestPhone) return

        setIsSubmitting(true)

        // Send Date (YYYY-MM-DD) and Time (HH:MM) separately
        const result = await bookGuestAppointment({
            slug,
            serviceId: selectedService.id,
            date: formatDateLocal(selectedDate), // Send "2026-02-01" local
            time: selectedTime,                  // Send "10:00"
            guestName,
            guestPhone
        })

        setIsSubmitting(false)

        if (result.success) {
            setStep('SUCCESS')
        } else {
            toast.error(result.error || 'Error al reservar')
        }
    }

    // Animation variants
    const variants = {
        enter: { x: 50, opacity: 0 },
        center: { x: 0, opacity: 1 },
        exit: { x: -50, opacity: 0 }
    }

    return (
        <div className="w-full max-w-2xl mx-auto pb-24 md:pb-0">

            {/* Steps Indicator (Optional visual cue) */}
            {step !== 'SUCCESS' && (
                <div className="flex items-center gap-2 mb-6 px-1">
                    <div className={cn("h-1.5 rounded-full flex-1 transition-all", step === 'SERVICE' ? "bg-amber-500" : "bg-amber-500/30")} />
                    <div className={cn("h-1.5 rounded-full flex-1 transition-all", step === 'DATE' ? "bg-amber-500" : (step === 'FORM' ? "bg-amber-500" : "bg-zinc-800"))} />
                    <div className={cn("h-1.5 rounded-full flex-1 transition-all", step === 'FORM' ? "bg-amber-500" : "bg-zinc-800")} />
                </div>
            )}

            <AnimatePresence mode='wait'>

                {/* STEP 1: SERVICES */}
                {step === 'SERVICE' && (
                    <motion.div
                        key="step1"
                        variants={variants} initial="enter" animate="center" exit="exit"
                        className="space-y-4"
                    >
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-black text-xs font-bold">1</span>
                            Selecciona un Servicio
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {services.map((service) => (
                                <button
                                    key={service.id}
                                    onClick={() => {
                                        setSelectedService(service)
                                        setStep('DATE')
                                    }}
                                    className="relative group flex flex-col items-start p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-amber-500/50 transition-all text-left active:scale-[0.98]"
                                >
                                    <div className="mb-3 p-2 rounded-lg bg-zinc-950 group-hover:bg-amber-500/10 transition-colors">
                                        <Check className="w-5 h-5 text-zinc-700 group-hover:text-amber-500" />
                                    </div>
                                    <h3 className="font-bold text-white text-sm md:text-base leading-tight mb-1">
                                        {service.nombre}
                                    </h3>
                                    <div className="mt-auto w-full pt-2 flex items-center justify-between">
                                        <span className="text-xs text-zinc-500">{service.duracion} min</span>
                                        <span className="text-sm font-bold text-amber-500">{service.precio}€</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* STEP 2: DATE & TIME */}
                {step === 'DATE' && (
                    <motion.div
                        key="step2"
                        variants={variants} initial="enter" animate="center" exit="exit"
                        className="space-y-6"
                    >
                        {/* Header with Back */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-black text-xs font-bold">2</span>
                                Fecha y Hora
                            </h2>
                            <button
                                onClick={() => setStep('SERVICE')}
                                className="text-xs font-medium text-zinc-500 hover:text-white flex items-center gap-1"
                            >
                                <ChevronLeft size={14} /> Cambiar Servicio
                            </button>
                        </div>

                        {/* --- MONTH VIEW CALENDAR --- */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 md:p-6 space-y-4">

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

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1 md:gap-2 text-center">
                                {/* Weekday Headers */}
                                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                                    <div key={d} className="text-[10px] md:text-xs font-bold text-zinc-500 py-2">
                                        {d}
                                    </div>
                                ))}

                                {/* Empty Slots */}
                                {Array.from({ length: startingDayIndex }).map((_, i) => (
                                    <div key={`empty-${i}`} className="aspect-square" />
                                ))}

                                {/* Days */}
                                {daysInMonth.map((date) => {
                                    // Use local strict formatting for closed dates check
                                    const dateStringLocal = formatDateLocal(date) // YYYY-MM-DD local

                                    const isSelected = selectedDate && isSameDay(date, selectedDate)
                                    const isPast = isBefore(date, today)
                                    const isTooFar = isAfter(date, maxDate)

                                    // Robust check: dateStringLocal must match one of the closing dates strings
                                    const isClosed = closingDates.includes(dateStringLocal)


                                    const isDisabled = isPast || isTooFar || isClosed

                                    return (
                                        <button
                                            key={dateStringLocal}
                                            onClick={() => !isDisabled && setSelectedDate(date)}
                                            disabled={isDisabled}
                                            className={cn(
                                                "aspect-square rounded-lg md:rounded-xl flex items-center justify-center text-sm font-bold transition-all relative",
                                                isSelected
                                                    ? "bg-amber-500 text-black shadow-lg scale-105 z-10"
                                                    : "bg-zinc-800/30 text-zinc-300 hover:bg-zinc-800",
                                                isDisabled && "opacity-20 cursor-not-allowed bg-transparent text-zinc-600 hover:bg-transparent"
                                            )}
                                        >
                                            {format(date, 'd')}
                                            {isSelected && <motion.div layoutId="selectedDay" className="absolute inset-0 border-2 border-white/20 rounded-lg md:rounded-xl" />}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>


                        {/* Time Slots Grid */}
                        <div className={`space-y-2 transition-all duration-300 ${selectedDate ? 'opacity-100' : 'opacity-50 blur-sm pointer-events-none'}`}>
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
                            ) : isClosed ? (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
                                    <p className="text-red-400 font-medium">
                                        Lo sentimos, la barbería no abre los {dayName}
                                    </p>
                                </div>
                            ) : availableSlots.length === 0 ? (
                                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-center">
                                    <p className="text-zinc-500">No hay horarios disponibles para hoy</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 gap-2 md:gap-3">
                                    {availableSlots.map((time: string) => (
                                        <button
                                            key={time}
                                            onClick={() => setSelectedTime(time)}
                                            className={cn(
                                                "py-2 md:py-3 rounded-lg text-xs md:text-sm font-bold border transition-all active:scale-[0.98]",
                                                selectedTime === time
                                                    ? "bg-white text-black border-white shadow-lg scale-[1.02]"
                                                    : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-amber-500/50 hover:text-amber-500"
                                            )}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* STEP 3: FORM */}
                {step === 'FORM' && (
                    <motion.div
                        key="step3"
                        variants={variants} initial="enter" animate="center" exit="exit"
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-black text-xs font-bold">3</span>
                                Finalizar
                            </h2>
                            <button
                                onClick={() => setStep('DATE')}
                                className="text-xs font-medium text-zinc-500 hover:text-white flex items-center gap-1"
                            >
                                <ChevronLeft size={14} /> Volver
                            </button>
                        </div>

                        {/* Resumen Card */}
                        <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800/80 space-y-3 shadow-xl">
                            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                                <div>
                                    <p className="text-xs text-zinc-500 font-bold uppercase">Servicio</p>
                                    <p className="text-white font-medium">{selectedService?.nombre}</p>
                                </div>
                                <p className="text-amber-500 font-bold text-lg">{selectedService?.precio}€</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-zinc-500 font-bold uppercase">Fecha y Hora</p>
                                    <p className="text-white font-medium capitalize">
                                        {selectedDate && format(selectedDate, 'EEEE d MMMM', { locale: es })}
                                    </p>
                                </div>
                                <p className="text-white font-bold text-lg bg-zinc-800 px-3 py-1 rounded-md">{selectedTime}</p>
                            </div>
                        </div>

                        {/* Form Input */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                                    <User size={12} /> Tu Nombre
                                </label>
                                <input
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    placeholder="Ej: Alex"
                                    className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all placeholder:text-zinc-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                                    <Phone size={12} /> Tu Teléfono
                                </label>
                                <input
                                    type="tel"
                                    value={guestPhone}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 9)
                                        setGuestPhone(val)
                                    }}
                                    placeholder="Ej: 600000000"
                                    className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all placeholder:text-zinc-700"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* SUCCESS SCREEN */}
                {step === 'SUCCESS' && (
                    <motion.div
                        key="success"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center justify-center py-12 text-center"
                    >
                        <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
                            <CheckCircle2 className="w-12 h-12 text-green-500" />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-2">¡Reservado!</h2>
                        <p className="text-zinc-400 max-w-xs mx-auto mb-8">
                            Tu cita ha sido confirmada correctamente. Te esperamos en <span className="text-white font-bold">{shopName}</span>.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-8 py-3 rounded-full bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition"
                        >
                            Hacer otra reserva
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Action Button */}
            {(step === 'DATE' || step === 'FORM') && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black to-transparent z-50 md:static md:bg-none md:p-0 md:mt-8">
                    <div className="max-w-2xl mx-auto">
                        <button
                            onClick={() => {
                                if (step === 'DATE') setStep('FORM')
                                if (step === 'FORM') handleBook()
                            }}
                            disabled={
                                (step === 'DATE' && (!selectedDate || !selectedTime)) ||
                                (step === 'FORM' && (!guestName || !guestPhone || isSubmitting))
                            }
                            className="w-full py-4 rounded-2xl bg-amber-500 text-black font-black text-lg uppercase tracking-wide shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {isSubmitting && <motion.div animate={{ rotate: 360 }} className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full" />}
                            {step === 'DATE' ? 'Continuar' : (isSubmitting ? 'Confirmando...' : 'Confirmar Reserva')}
                        </button>
                    </div>
                </div>
            )}

        </div>
    )
}
