'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useBookingStore, BookingService } from '@/store/useBookingStore'

interface ServiceStepProps {
    services: BookingService[]
}

const variants = {
    enter: { x: 50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 },
}

export default function ServiceStep({ services }: ServiceStepProps) {
    const setService = useBookingStore((s) => s.setService)
    const setStep = useBookingStore((s) => s.setStep)

    const handleSelect = (service: BookingService) => {
        setService(service)
        setStep('DATE')
    }

    return (
        <motion.div
            key="step1"
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="space-y-4"
        >
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-black text-xs font-bold">
                    1
                </span>
                Selecciona un Servicio
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {services.map((service) => (
                    <button
                        key={service.id}
                        onClick={() => handleSelect(service)}
                        className="relative group flex flex-col items-start p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-amber-500/50 transition-all text-left active:scale-[0.98]"
                    >
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
    )
}
