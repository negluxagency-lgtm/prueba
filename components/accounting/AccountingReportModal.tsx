'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar as CalendarIcon, Download, Loader2, FileText } from 'lucide-react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { AccountingDetailPDF } from './AccountingDetailPDF'
import { cn } from '@/lib/utils'

interface AccountingReportModalProps {
    isOpen: boolean
    onClose: () => void
    initialMonth?: string
    shopName: string
}

export const AccountingReportModal: React.FC<AccountingReportModalProps> = ({ isOpen, onClose, initialMonth, shopName }) => {
    const [selectedMonth, setSelectedMonth] = useState(initialMonth || new Date().toISOString().substring(0, 7))
    const [loading, setLoading] = useState(false)
    const [entries, setEntries] = useState<any[]>([])
    const [income, setIncome] = useState(0)
    const [expenses, setExpenses] = useState(0)
    const [deductible, setDeductible] = useState(0)
    const [ready, setReady] = useState(false)

    const prepareData = async () => {
        setLoading(true)
        setReady(false)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const [year, month] = selectedMonth.split('-').map(Number)
            const lastDay = new Date(year, month, 0).getDate()
            const startOfMonth = `${selectedMonth}-01`
            const endDate = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`

            const [{ data: gastos }, { data: diarias }] = await Promise.all([
                supabase.from('gastos').select('*').eq('barberia_id', user.id).gte('fecha', startOfMonth).lte('fecha', endDate).order('fecha'),
                supabase.from('metricas_diarias').select('dia, ingresos').eq('barberia_id', user.id).gte('dia', startOfMonth).lte('dia', endDate).order('dia')
            ])

            const totals = (gastos || []).reduce((a, c) => {
                a.total += +c.monto; if (c.deducible) a.deducible += +c.monto; return a
            }, { total: 0, deducible: 0 })
            setExpenses(totals.total)
            setDeductible(totals.deducible)

            const dailyIncome: Record<string, number> = {}
            diarias?.forEach(d => { 
                if (Number(d.ingresos) > 0) dailyIncome[d.dia] = Number(d.ingresos) 
            })

            const totalInc = Object.values(dailyIncome).reduce((s, v) => s + v, 0)
            setIncome(totalInc)

            const allDates = Array.from(new Set([
                ...Object.keys(dailyIncome), 
                ...(gastos || []).map(g => g.fecha)
            ])).sort()

            const built: any[] = []
            allDates.forEach(date => {
                const dayInc = dailyIncome[date] || 0
                const dayExp = (gastos || []).filter(g => g.fecha === date)
                
                if (!dayExp.length) { 
                    if (dayInc > 0) built.push({ 
                        date: date.split('-').reverse().join('/'), 
                        income: dayInc, 
                        expense: 0, 
                        reason: 'Ingresos del día (Citas + Ventas)', 
                        deductible: false 
                    }) 
                }
                else {
                    dayExp.forEach((g, i) => built.push({ 
                        date: date.split('-').reverse().join('/'), 
                        income: i === 0 ? dayInc : 0, 
                        expense: +g.monto, 
                        reason: g.concepto, 
                        deductible: g.deducible 
                    }))
                }
            })
            setEntries(built)
            setReady(true)
        } catch (err) {
            console.error('Error preparing accounting report data:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen) {
            prepareData()
        }
    }, [isOpen, selectedMonth])

    if (typeof document === 'undefined') return null

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
                        className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-white font-black text-2xl uppercase tracking-tighter italic">Libro Diario</h3>
                                <p className="text-zinc-500 text-xs font-medium">Gastos / Ingresos</p>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-full text-zinc-600 hover:text-white hover:bg-zinc-800 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Mes del Informe</label>
                                <div className="relative bg-zinc-800 border border-zinc-700 rounded-2xl p-4 flex items-center gap-3">
                                    <CalendarIcon className="w-5 h-5 text-amber-500" />
                                    <input
                                        type="month"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="bg-transparent border-none text-white font-bold outline-none flex-1 min-w-0 max-w-full focus:ring-0 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert"
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                {ready ? (
                                    <PDFDownloadLink
                                        document={
                                            <AccountingDetailPDF
                                                data={{
                                                    shopName,
                                                    month: selectedMonth,
                                                    entries,
                                                    totalIncome: income,
                                                    totalExpenses: expenses,
                                                    totalDeductible: deductible,
                                                    timestamp: new Date().toLocaleString('es-ES')
                                                }}
                                            />
                                        }
                                        fileName={`Libro_Diario_${selectedMonth}.pdf`}
                                        className="w-full flex items-center justify-center gap-3 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all bg-amber-500 text-black hover:bg-amber-400 active:scale-95 shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                                    >
                                        {({ loading: pdfLoading }) => (
                                            <>
                                                {pdfLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                                                <span>{pdfLoading ? 'Generando PDF...' : 'Descargar PDF'}</span>
                                            </>
                                        )}
                                    </PDFDownloadLink>
                                ) : (
                                    <div className="w-full flex items-center justify-center gap-3 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all bg-zinc-800 text-zinc-600 border border-zinc-700">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Procesando Datos...</span>
                                    </div>
                                )}
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
