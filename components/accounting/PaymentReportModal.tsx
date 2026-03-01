'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar as CalendarIcon, Download, Loader2, Banknote, CreditCard, Smartphone, MoreHorizontal } from 'lucide-react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { PaymentDetailPDF } from './PaymentDetailPDF'
import { cn } from '@/lib/utils'

interface PaymentReportModalProps {
    isOpen: boolean
    onClose: () => void
    initialMonth?: string
}

export const PaymentReportModal: React.FC<PaymentReportModalProps> = ({ isOpen, onClose, initialMonth }) => {
    const [selectedMonth, setSelectedMonth] = useState(initialMonth || new Date().toISOString().substring(0, 7))
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('efectivo')
    const [loading, setLoading] = useState(false)
    const [reportData, setReportData] = useState<any[]>([])
    const [shopName, setShopName] = useState('Mi Barbería')

    const fetchReportData = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get Shop Name
            const { data: profile } = await supabase.from('perfiles').select('nombre_barberia').eq('id', user.id).single()
            if (profile?.nombre_barberia) setShopName(profile.nombre_barberia)

            const [year, month] = selectedMonth.split('-').map(Number)
            const startOfMonth = `${selectedMonth}-01`
            const nextMonthDate = new Date(year, month, 1)
            const endDate = nextMonthDate.toISOString().split('T')[0]

            const { data: citas, error } = await supabase
                .from('citas')
                .select('Dia, Precio, Nombre, servicio, pago')
                .eq('barberia_id', user.id)
                .eq('confirmada', true)
                .eq('pago', selectedPaymentMethod)
                .gte('Dia', startOfMonth)
                .lt('Dia', endDate)
                .order('Dia', { ascending: true })

            if (error) throw error

            const entries = (citas || []).map(c => ({
                date: c.Dia.split('-').reverse().join('/'),
                client: c.Nombre,
                service: c.servicio || 'Sin servicio',
                amount: Number(c.Precio) || 0
            }))

            setReportData(entries)
        } catch (err) {
            console.error('Error fetching payment report data:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen) {
            fetchReportData()
        }
    }, [isOpen, selectedMonth, selectedPaymentMethod])

    if (typeof document === 'undefined') return null

    const methods = [
        { id: 'efectivo', icon: Banknote, color: 'text-green-500', label: 'Efectivo' },
        { id: 'tarjeta', icon: CreditCard, color: 'text-blue-500', label: 'Tarjeta' },
        { id: 'bizum', icon: Smartphone, color: 'text-purple-500', label: 'Bizum' },
        { id: 'otra', icon: MoreHorizontal, color: 'text-zinc-500', label: 'Otra' }
    ]

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-md z-[10100] flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-white font-black text-2xl uppercase tracking-tighter italic italic">Generar Informe</h3>
                                <p className="text-zinc-500 text-xs font-medium">Selecciona el mes y método de pago</p>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-full text-zinc-600 hover:text-white hover:bg-zinc-800 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Mes */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Mes del Informe</label>
                                <div className="relative bg-zinc-800 border border-zinc-700 rounded-2xl p-4 flex items-center gap-3">
                                    <CalendarIcon className="w-5 h-5 text-amber-500" />
                                    <input
                                        type="month"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="bg-transparent border-none text-white font-bold outline-none flex-1 focus:ring-0 [&::-webkit-calendar-picker-indicator]:invert"
                                    />
                                </div>
                            </div>

                            {/* Metodo de Pago */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Método de Pago</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {methods.map((method) => (
                                        <button
                                            key={method.id}
                                            onClick={() => setSelectedPaymentMethod(method.id)}
                                            className={cn(
                                                "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all active:scale-95",
                                                selectedPaymentMethod === method.id
                                                    ? "bg-amber-500/10 border-amber-500 text-amber-500 shadow-lg shadow-amber-500/5"
                                                    : "bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:border-zinc-600"
                                            )}
                                        >
                                            <method.icon className={cn("w-6 h-6", selectedPaymentMethod === method.id ? "text-amber-500" : method.color)} />
                                            <span className="text-[10px] font-black uppercase tracking-tighter italic">{method.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4">
                                <PDFDownloadLink
                                    document={
                                        <PaymentDetailPDF
                                            data={{
                                                shopName,
                                                month: selectedMonth,
                                                paymentMethod: selectedPaymentMethod,
                                                entries: reportData,
                                                totalAmount: reportData.reduce((sum, e) => sum + e.amount, 0),
                                                timestamp: new Date().toLocaleString('es-ES')
                                            }}
                                        />
                                    }
                                    fileName={`Informe_Pagos_${selectedPaymentMethod}_${selectedMonth}.pdf`}
                                    className={cn(
                                        "w-full flex items-center justify-center gap-3 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all",
                                        loading
                                            ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                                            : "bg-amber-500 text-black hover:bg-amber-400 active:scale-95 shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                                    )}
                                >
                                    {({ loading: pdfLoading }) => (
                                        <>
                                            {(loading || pdfLoading) ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                                            <span>{(loading || pdfLoading) ? 'Procesando Datos...' : 'Descargar Informe PDF'}</span>
                                        </>
                                    )}
                                </PDFDownloadLink>
                            </div>
                        </div>

                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-500/10 blur-[80px] rounded-full" />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    )
}
