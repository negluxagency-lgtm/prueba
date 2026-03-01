'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Banknote, CreditCard, Smartphone, MoreHorizontal, X } from 'lucide-react'
import { createPortal } from 'react-dom'

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'bizum' | 'otra'

interface PaymentMethodModalProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (method: PaymentMethod) => void
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

export const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({ isOpen, onClose, onSelect }) => {
    if (typeof document === 'undefined') return null

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
                        className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-white font-black text-lg uppercase tracking-tighter italic">Método de Pago</h3>
                                <p className="text-zinc-500 text-xs font-medium mt-0.5">Selecciona cómo ha pagado el cliente</p>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-full text-zinc-600 hover:text-white hover:bg-zinc-800 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {METHODS.map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => { onSelect(method.id); onClose(); }}
                                    className={`flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl border transition-all active:scale-95 ${method.bg}`}
                                >
                                    <span className={method.color}>{method.icon}</span>
                                    <span className={`text-sm font-black uppercase tracking-tighter ${method.color}`}>{method.label}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    )
}
