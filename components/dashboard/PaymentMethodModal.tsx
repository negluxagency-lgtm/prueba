import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Banknote, CreditCard, Smartphone, MoreHorizontal, X, User } from 'lucide-react'
import { createPortal } from 'react-dom'

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'bizum' | 'otra'

interface PaymentMethodModalProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (method: PaymentMethod, barberId?: string, barberName?: string) => void
    requireBarber?: boolean
    barbers?: any[]
}

const METHODS: { id: PaymentMethod; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
    {
        id: 'efectivo',
        label: 'Efectivo',
        icon: <Banknote className="w-6 h-6" />,
        color: 'text-green-400',
        bg: 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20 hover:border-green-500/40'
    },
    {
        id: 'tarjeta',
        label: 'Tarjeta',
        icon: <CreditCard className="w-6 h-6" />,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40'
    },
    {
        id: 'bizum',
        label: 'Bizum',
        icon: <Smartphone className="w-6 h-6" />,
        color: 'text-purple-400',
        bg: 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40'
    },
    {
        id: 'otra',
        label: 'Otra',
        icon: <MoreHorizontal className="w-6 h-6" />,
        color: 'text-zinc-400',
        bg: 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600'
    }
]

export const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({ isOpen, onClose, onSelect, requireBarber = false, barbers = [] }) => {
    const [step, setStep] = useState<'barber' | 'payment'>('payment')
    const [selectedBarber, setSelectedBarber] = useState<{ id: string; name: string } | null>(null)

    useEffect(() => {
        if (isOpen) {
            setStep(requireBarber ? 'barber' : 'payment')
            setSelectedBarber(null)
        }
    }, [isOpen, requireBarber])

    if (typeof document === 'undefined') return null

    const handleBarberSelect = (id: string, name: string) => {
        setSelectedBarber({ id, name })
        setStep('payment')
    }

    const handlePaymentSelect = (methodId: PaymentMethod) => {
        onSelect(methodId, selectedBarber?.id, selectedBarber?.name)
        onClose()
    }

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-md z-[10100] flex items-end md:items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-white font-black text-lg uppercase tracking-tighter italic">
                                    {step === 'barber' ? 'Seleccionar Barbero' : 'Método de Pago'}
                                </h3>
                                <p className="text-zinc-500 text-xs font-medium mt-0.5">
                                    {step === 'barber' ? '¿Quién realizó este servicio?' : 'Selecciona cómo ha pagado el cliente'}
                                </p>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-full text-zinc-600 hover:text-white hover:bg-zinc-800 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <AnimatePresence mode="wait">
                            {step === 'barber' && (
                                <motion.div
                                    key="step-barber"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-2 max-h-[60vh] overflow-y-auto pr-1"
                                >
                                    {barbers.length > 0 ? (
                                        barbers.map(barber => (
                                            <button
                                                key={barber.id}
                                                onClick={() => handleBarberSelect(String(barber.id), barber.nombre)}
                                                className="w-full flex items-center gap-3 p-4 bg-zinc-950 hover:bg-amber-500/10 border border-zinc-800 hover:border-amber-500/30 rounded-2xl transition-all group"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                                                    {barber.foto ? (
                                                        <img src={barber.foto} alt={barber.nombre} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-5 h-5 text-zinc-500 group-hover:text-amber-500 transition-colors" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col text-left">
                                                    <span className="text-sm font-bold text-white group-hover:text-amber-500 transition-colors uppercase tracking-tight">{barber.nombre}</span>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="text-center p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                                            <p className="text-xs text-zinc-500 font-medium">No hay barberos registrados</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {step === 'payment' && (
                                <motion.div
                                    key="step-payment"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="grid grid-cols-2 gap-3"
                                >
                                    {METHODS.map((method) => (
                                        <button
                                            key={method.id}
                                            onClick={() => handlePaymentSelect(method.id)}
                                            className={`flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl border transition-all active:scale-95 ${method.bg}`}
                                        >
                                            <span className={method.color}>{method.icon}</span>
                                            <span className={`text-sm font-black uppercase tracking-tighter ${method.color}`}>{method.label}</span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    )
}
