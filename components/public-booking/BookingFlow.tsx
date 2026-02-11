'use client'

import { useState, useMemo, useEffect } from 'react'
import { format, addDays, isSameDay, startOfMonth, endOfMonth, getDay, isBefore, startOfDay, isAfter, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, User, Phone, CheckCircle2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Loader2 } from 'lucide-react'
import { bookGuestAppointment } from '@/app/actions/book-guest-appointment'
import { getAvailableSlots } from '@/app/actions/get-available-slots'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Types
import { WeeklySchedule, TimeRange } from '@/types'

type Service = {
    id: string
    nombre: string
    precio: number
    duracion: number
}

// Keep legacy for Barber if needed, but BookingFlow main schedule is now WeeklySchedule
interface ShopDaySchedule {
    dia: number
    abierto: boolean
    franjas: { inicio: string, fin: string }[]
}

interface Barber {
    id: string
    barberia_id: string
    nombre: string
    foto?: string
    horario_semanal?: ShopDaySchedule[] // Still using old format for barbers for now or need update? 
    // The prompt implies we are refactoring SHOP schedule first. 
    // Barber schedule might still be in old format or we should update it later. 
    // For now, let's stick to Shop Schedule update.
}

// Removed local slot generation helpers - now using server action getAvailableSlots

interface BookingFlowProps {
    services: Service[]
    slug: string
    shopName: string
    closingDates?: string[]
    profileId: string
    barbers?: Barber[]
    plan?: string // 'basico' | 'profesional' | 'premium'
}

type Step = 'SERVICE' | 'DATE' | 'FORM' | 'SUCCESS'

export default function BookingFlow({ services, slug, shopName, closingDates = [], profileId, barbers = [], plan }: BookingFlowProps) {
    const [step, setStep] = useState<Step>('SERVICE')
    const [selectedService, setSelectedService] = useState<Service | null>(null)
    const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null) // null = Cualquiera

    // Date & Time State
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedTime, setSelectedTime] = useState<string>('')

    const [guestName, setGuestName] = useState('')
    const [guestPhone, setGuestPhone] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Available slots from server
    const [availableSlots, setAvailableSlots] = useState<string[]>([])
    const [loadingSlots, setLoadingSlots] = useState(false)

    // Fetch available slots when date or service changes
    useEffect(() => {
        if (!selectedDate || !selectedService) {
            setAvailableSlots([])
            return
        }

        const fetchSlots = async () => {
            setLoadingSlots(true)
            try {
                const slots = await getAvailableSlots({
                    slug,
                    date: format(selectedDate, 'yyyy-MM-dd'), // Pass string to avoid timezone shifts
                    serviceDuration: selectedService.duracion,
                    selectedBarberId
                })
                setAvailableSlots(slots)
            } catch (error) {
                console.error('Error fetching slots:', error)
                toast.error('Error al cargar horarios disponibles')
                setAvailableSlots([])
            } finally {
                setLoadingSlots(false)
            }
        }

        fetchSlots()
    }, [selectedDate, selectedService, selectedBarberId, slug])

    // --- CALENDAR LOGIC ---
    console.log('🧑‍💼 [BookingFlow] Barbers prop:', barbers, 'Length:', barbers.length)

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

    // Helper for local date string formatting
    const formatDateLocal = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

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
            guestPhone,
            barberId: selectedBarberId || undefined // Pass selected barber (or undefined for 'Cualquiera')
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

                        {/* Barber Selection (Premium Only) */}
                        {barbers.length > 0 && (plan || '').toLowerCase() === 'premium' && (
                            <div className="space-y-3">
                                <p className="text-xs font-bold uppercase text-zinc-500 tracking-wider flex items-center gap-2">
                                    <User size={12} className="text-amber-500" />
                                    Selecciona tu Barbero
                                </p>

                                <div className="grid grid-cols-2 gap-2">
                                    {/* Cualquiera (No Preference) */}
                                    <button
                                        onClick={() => setSelectedBarberId(null)}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-2 relative",
                                            selectedBarberId === null
                                                ? "bg-amber-500 text-black border-amber-500 shadow-lg"
                                                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                                        )}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs font-bold text-center">Cualquiera</span>
                                        <span className="text-[10px] opacity-70">Me es indiferente</span>
                                    </button>

                                    {/* Individual Barbers */}
                                    {barbers.map((barber) => (
                                        <button
                                            key={barber.id}
                                            onClick={() => setSelectedBarberId(barber.id)}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-2 relative",
                                                selectedBarberId === barber.id
                                                    ? "bg-amber-500 text-black border-amber-500 shadow-lg"
                                                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                                            )}
                                        >
                                            {barber.foto ? (
                                                <img src={barber.foto} alt={barber.nombre} className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg font-bold">
                                                    {barber.nombre.charAt(0)}
                                                </div>
                                            )}
                                            <span className="text-xs font-bold text-center truncate w-full px-1">{barber.nombre}</span>
                                            <span className="text-[10px] opacity-70">Disponible</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

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
                            ) : availableSlots.length === 0 ? (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
                                    <p className="text-red-400 font-medium">
                                        Lo sentimos, no hay horarios disponibles este día
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
                            {barbers.length > 0 && (
                                <div className="flex justify-between items-center pt-3 border-t border-zinc-800">
                                    <div>
                                        <p className="text-xs text-zinc-500 font-bold uppercase">Barbero</p>
                                        <p className="text-white font-medium">
                                            {selectedBarberId === null
                                                ? 'Cualquiera (asignación automática)'
                                                : barbers.find(b => b.id === selectedBarberId)?.nombre || 'Cualquiera'}
                                        </p>
                                    </div>
                                </div>
                            )}
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
