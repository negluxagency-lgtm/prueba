'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBookingStore, BookingService, BookingBarber } from '@/store/useBookingStore'
import ServiceStep from '@/components/booking/ServiceStep'
import DateStep from '@/components/booking/DateStep'
import FormStep from '@/components/booking/FormStep'

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface BookingFlowProps {
    services: BookingService[]
    slug: string
    shopName: string
    closingDates?: string[]
    profileId: string
    barbers?: BookingBarber[]
    plan?: string
}

// ──────────────────────────────────────────────
// Orchestrator — zero local state
// ──────────────────────────────────────────────

export default function BookingFlow({
    services,
    slug,
    shopName,
    closingDates = [],
    barbers = [],
    plan,
}: BookingFlowProps) {
    const step = useBookingStore((s) => s.step)
    const reset = useBookingStore((s) => s.reset)

    // Reset store when component unmounts (e.g. navigation away)
    useEffect(() => {
        return () => reset()
    }, [reset])

    return (
        <div className="w-full max-w-2xl mx-auto pb-24 md:pb-0">

            {/* Steps Progress Bar */}
            {step !== 'SUCCESS' && (
                <div className="flex items-center gap-2 mb-6 px-1">
                    <div className={cn('h-1.5 rounded-full flex-1 transition-all', step === 'SERVICE' ? 'bg-amber-500' : 'bg-amber-500/30')} />
                    <div className={cn('h-1.5 rounded-full flex-1 transition-all', step === 'DATE' ? 'bg-amber-500' : step === 'FORM' ? 'bg-amber-500' : 'bg-zinc-800')} />
                    <div className={cn('h-1.5 rounded-full flex-1 transition-all', step === 'FORM' ? 'bg-amber-500' : 'bg-zinc-800')} />
                </div>
            )}

            <AnimatePresence mode="wait">

                {step === 'SERVICE' && (
                    <ServiceStep key="service" services={services} />
                )}

                {step === 'DATE' && (
                    <DateStep
                        key="date"
                        slug={slug}
                        closingDates={closingDates}
                        barbers={barbers}
                        plan={plan}
                    />
                )}

                {step === 'FORM' && (
                    <FormStep key="form" slug={slug} shopName={shopName} barbers={barbers} />
                )}

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
                            Tu cita ha sido confirmada correctamente. Te esperamos en{' '}
                            <span className="text-white font-bold">{shopName}</span>.
                        </p>
                        <button
                            onClick={() => reset()}
                            className="px-8 py-3 rounded-full bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition"
                        >
                            Hacer otra reserva
                        </button>
                    </motion.div>
                )}

            </AnimatePresence>

            {/* Continue CTA — only for DATE step (FORM manages its own CTA) */}
            {step === 'DATE' && (
                <DateStepCTA />
            )}
        </div>
    )
}

// ──────────────────────────────────────────────
// Internal CTA for DATE step
// ──────────────────────────────────────────────

function DateStepCTA() {
    const selectedDate = useBookingStore((s) => s.selectedDate)
    const selectedTime = useBookingStore((s) => s.selectedTime)
    const setStep = useBookingStore((s) => s.setStep)

    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black to-transparent z-50 md:static md:bg-none md:p-0 md:mt-8">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={() => setStep('FORM')}
                    disabled={!selectedDate || !selectedTime}
                    className="w-full py-4 rounded-2xl bg-amber-500 text-black font-black text-lg uppercase tracking-wide shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-400 active:scale-[0.98] transition-all"
                >
                    Continuar
                </button>
            </div>
        </div>
    )
}
