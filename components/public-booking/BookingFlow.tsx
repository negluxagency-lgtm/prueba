'use client'

import { useEffect } from 'react'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Link2, Copy, Check, ExternalLink } from 'lucide-react'
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
    previewMode?: boolean
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
    previewMode = false,
}: BookingFlowProps) {
    const step = useBookingStore((s) => s.step)
    const bookingUuid = useBookingStore((s) => s.bookingUuid)
    const reset = useBookingStore((s) => s.reset)

    const [copied, setCopied] = useState(false)

    const bookingLink = bookingUuid ? `https://app.nelux.es/cita/${bookingUuid}` : null

    const handleCopy = async () => {
        if (!bookingLink) return
        await navigator.clipboard.writeText(bookingLink).catch(() => { })
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
    }

    // Reset store when component unmounts (e.g. navigation away)
    useEffect(() => {
        return () => reset()
    }, [reset])

    return (
        <div className="w-full max-w-2xl mx-auto pb-24 md:pb-0">

            {/* Steps Progress Bar */}
            {step !== 'SUCCESS' && (
                <div className="flex items-center gap-2 mb-6 px-1">
                    <div className="h-1.5 rounded-full flex-1 transition-all" style={{ backgroundColor: step === 'SERVICE' ? 'var(--color-secondary, #f59e0b)' : 'color-mix(in srgb, var(--color-secondary, #f59e0b) 30%, transparent)' }} />
                    <div className="h-1.5 rounded-full flex-1 transition-all" style={{ backgroundColor: (step === 'DATE' || step === 'FORM') ? 'var(--color-secondary, #f59e0b)' : '#3f3f46' }} />
                    <div className="h-1.5 rounded-full flex-1 transition-all" style={{ backgroundColor: step === 'FORM' ? 'var(--color-secondary, #f59e0b)' : '#3f3f46' }} />
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
                    <FormStep key="form" slug={slug} shopName={shopName} barbers={barbers} previewMode={previewMode} />
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
                        <p className="text-zinc-400 max-w-xs mx-auto mb-6">
                            Tu cita ha sido confirmada correctamente. Te esperamos en{' '}
                            <span className="text-white font-bold">{shopName}</span>.
                        </p>

                        {bookingLink && (
                            <div className="w-full max-w-sm mt-2 space-y-3">
                                <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                                    <Link2 className="w-3 h-3" />
                                    Enlace para cancelar / gestionar tu cita
                                </div>
                                <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-400 text-xs font-mono truncate">
                                    {bookingLink}
                                </div>
                                <div className="flex flex-col gap-2 w-full">
                                    <button
                                        onClick={handleCopy}
                                        className={cn(
                                            'w-full py-3 rounded-xl font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.98]',
                                            copied
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                : 'bg-zinc-800 text-white hover:bg-zinc-700'
                                        )}
                                    >
                                        {copied ? <><Check className="w-3.5 h-3.5" />¡Copiado!</> : <><Copy className="w-3.5 h-3.5" />Copiar enlace</>}
                                    </button>

                                    <a
                                        href={bookingLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-3 rounded-xl font-black text-black bg-amber-500 hover:bg-amber-400 text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        Guardar en una nueva pestaña
                                    </a>
                                </div>
                                <p className="text-zinc-700 text-[10px] text-center">El enlace caduca automáticamente tras la fecha de tu cita.</p>
                            </div>
                        )}
                    </motion.div>
                )}

            </AnimatePresence>

            {/* Continue CTA — only for DATE step (FORM manages its own CTA) */}
            {step === 'DATE' && (
                <DateStepCTA previewMode={previewMode} />
            )}
        </div>
    )
}

// ──────────────────────────────────────────────
// Internal CTA for DATE step
// ──────────────────────────────────────────────

function DateStepCTA({ previewMode = false }: { previewMode?: boolean }) {
    const selectedDate = useBookingStore((s) => s.selectedDate)
    const selectedTime = useBookingStore((s) => s.selectedTime)
    const setStep = useBookingStore((s) => s.setStep)

    return (
        <div className="fixed bottom-0 left-0 right-0 px-4 pt-4 pb-8 bg-gradient-to-t from-black via-black to-transparent z-50 md:static md:bg-none md:p-0 md:mt-8">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={() => setStep('FORM')}
                    disabled={!selectedDate || !selectedTime}
                    className="w-full py-4 rounded-2xl text-black font-black text-lg uppercase tracking-wide shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
                    style={{ backgroundColor: 'var(--color-secondary, #f59e0b)' }}
                >
                    Continuar
                </button>
            </div>
        </div>
    )
}
