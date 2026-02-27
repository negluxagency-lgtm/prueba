'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { User, Phone, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useBookingStore, BookingBarber } from '@/store/useBookingStore'
import { bookGuestAppointment } from '@/app/actions/book-guest-appointment'

interface FormStepProps {
    slug: string
    shopName: string
    barbers: BookingBarber[]
}

export default function FormStep({ slug, shopName, barbers }: FormStepProps) {
    // Only subscribes to form-related state — calendar never re-renders
    const selectedService = useBookingStore((s) => s.selectedService)
    const selectedDate = useBookingStore((s) => s.selectedDate)
    const selectedTime = useBookingStore((s) => s.selectedTime)
    const selectedBarberId = useBookingStore((s) => s.selectedBarberId)
    const guestName = useBookingStore((s) => s.guestName)
    const guestPhone = useBookingStore((s) => s.guestPhone)
    const isSubmitting = useBookingStore((s) => s.isSubmitting)
    const setGuestName = useBookingStore((s) => s.setGuestName)
    const setGuestPhone = useBookingStore((s) => s.setGuestPhone)
    const setIsSubmitting = useBookingStore((s) => s.setIsSubmitting)
    const setStep = useBookingStore((s) => s.setStep)

    // Honeypot — must always be empty. Bots fill it, humans never see it.
    const [honeypot, setHoneypot] = useState('')

    const formatDateLocal = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const handleBook = async () => {
        if (!selectedService || !selectedDate || !selectedTime || !guestName || !guestPhone) return

        setIsSubmitting(true)

        const result = await bookGuestAppointment({
            slug,
            serviceId: selectedService.id,
            date: formatDateLocal(selectedDate),
            time: selectedTime,
            guestName,
            guestPhone,
            barberId: selectedBarberId || undefined,
            address_confirm: honeypot, // honeypot: si no está vacío, Zod lo rechaza
        })

        setIsSubmitting(false)

        if (result.success) {
            setStep('SUCCESS')
        } else {
            toast.error(result.error || 'Error al reservar')
        }
    }

    return (
        <motion.div
            key="step3"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-black text-xs font-bold">
                        3
                    </span>
                    Finalizar
                </h2>
                <button
                    onClick={() => setStep('DATE')}
                    className="text-xs font-medium text-zinc-500 hover:text-white flex items-center gap-1"
                >
                    <ChevronLeft size={14} /> Volver
                </button>
            </div>

            {/* Booking Summary Card */}
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
                    <p className="text-white font-bold text-lg bg-zinc-800 px-3 py-1 rounded-md">
                        {selectedTime}
                    </p>
                </div>
                {barbers.length > 0 && (
                    <div className="flex justify-between items-center pt-3 border-t border-zinc-800">
                        <div>
                            <p className="text-xs text-zinc-500 font-bold uppercase">Barbero</p>
                            <p className="text-white font-medium">
                                {selectedBarberId === null
                                    ? 'Cualquiera (asignación automática)'
                                    : barbers.find((b) => b.id === selectedBarberId)?.nombre || 'Cualquiera'}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Form Inputs */}
            <div className="space-y-4">
                {/* Honeypot — invisible to humans, bots fill it automatically */}
                <input
                    type="text"
                    aria-hidden="true"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    className="hidden"
                />
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

            {/* CTA Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black to-transparent z-50 md:static md:bg-none md:p-0 md:mt-8">
                <div className="max-w-2xl mx-auto">
                    <button
                        onClick={handleBook}
                        disabled={!guestName || !guestPhone || isSubmitting}
                        className="w-full py-4 rounded-2xl bg-amber-500 text-black font-black text-lg uppercase tracking-wide shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {isSubmitting && (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                                className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full"
                            />
                        )}
                        {isSubmitting ? 'Confirmando...' : 'Confirmar Reserva'}
                    </button>
                </div>
            </div>
        </motion.div>
    )
}
