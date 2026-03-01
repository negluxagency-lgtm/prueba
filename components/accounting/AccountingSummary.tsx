'use client'

import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Wallet, DollarSign, Loader2, ArrowUpRight, ArrowDownRight, Percent } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useBarberStats } from '@/hooks/useBarberStats'
import { cn } from '@/lib/utils'
import { FileText, Download, Calendar as CalendarIcon, Receipt, Calculator } from 'lucide-react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { AccountingDetailPDF } from './AccountingDetailPDF'
import { PaymentDetailPDF } from './PaymentDetailPDF'
import { PaymentReportModal } from './PaymentReportModal'
import { Banknote, CreditCard, Smartphone, MoreHorizontal } from 'lucide-react'

interface AccountingSummaryProps {
    selectedMonth?: string // YYYY-MM
    onNetIncomeCalculated?: (netIncome: number) => void
}

export default function AccountingSummary({ selectedMonth, onNetIncomeCalculated }: AccountingSummaryProps) {
    const targetMonth = selectedMonth || new Date().toISOString().substring(0, 7)
    const { stats, loading: loadingStats } = useBarberStats(targetMonth)
    const [expensesData, setExpensesData] = useState({ total: 0, deducible: 0 })
    const [loadingExpenses, setLoading] = useState(true)
    const [reportEntries, setReportEntries] = useState<any[]>([])
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const [shopName, setShopName] = useState('Mi Barbería')
    const [isPreparingReport, setIsPreparingReport] = useState(false)

    useEffect(() => {
        fetchExpenses()
    }, [targetMonth])

    const fetchExpenses = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get Shop Name
            const { data: profile } = await supabase.from('perfiles').select('nombre_barberia').eq('id', user.id).single()
            if (profile?.nombre_barberia) setShopName(profile.nombre_barberia)

            const [year, month] = targetMonth.split('-').map(Number)
            const startOfMonth = `${targetMonth}-01`
            const nextMonthDate = new Date(year, month, 1) // First day of next month
            const endDate = nextMonthDate.toISOString().split('T')[0]

            // 1. Fetch Summary Expenses
            const { data: gastos, error: gastosErr } = await supabase
                .from('gastos')
                .select('*')
                .eq('user_id', user.id)
                .gte('fecha', startOfMonth)
                .lt('fecha', endDate)
                .order('fecha', { ascending: true })

            if (gastosErr) throw gastosErr

            const totals = (gastos || []).reduce((acc, current) => {
                acc.total += Number(current.monto)
                if (current.deducible) acc.deducible += Number(current.monto)
                return acc
            }, { total: 0, deducible: 0 })

            setExpensesData(totals)

            // 2. Fetch Detailed Income (for reports)
            const { data: citas, error: citasErr } = await supabase
                .from('citas')
                .select('Dia, Precio, Nombre, servicio, pago')
                .eq('barberia_id', user.id)
                .eq('confirmada', true)
                .gte('Dia', startOfMonth)
                .lt('Dia', endDate)

            if (citasErr) throw citasErr

            // Group income by day
            const dailyIncome: Record<string, number> = {}
            citas?.forEach(c => {
                dailyIncome[c.Dia] = (dailyIncome[c.Dia] || 0) + (Number(c.Precio) || 0)
            })

            // Combine into entries
            const entries: any[] = []

            // Get all unique dates from income and expenses
            const allDates = Array.from(new Set([
                ...Object.keys(dailyIncome),
                ...(gastos || []).map(g => g.fecha)
            ])).sort()

            allDates.forEach(date => {
                const dayIncome = dailyIncome[date] || 0
                const dayExpenses = (gastos || []).filter(g => g.fecha === date)

                if (dayExpenses.length === 0) {
                    // Solo ingresos
                    if (dayIncome > 0) {
                        entries.push({
                            date: date.split('-').reverse().join('/'),
                            income: dayIncome,
                            expense: 0,
                            reason: '',
                            deductible: false
                        })
                    }
                } else {
                    // Hay gastos, poner el ingreso en la primera fila de gastos del día
                    dayExpenses.forEach((g, index) => {
                        entries.push({
                            date: date.split('-').reverse().join('/'),
                            income: index === 0 ? dayIncome : 0,
                            expense: Number(g.monto),
                            reason: g.concepto,
                            deductible: g.deducible
                        })
                    })
                }
            })

            setReportEntries(entries)
        } catch (err) {
            console.error('Error fetching summary expenses:', err)
        } finally {
            setLoading(false)
        }
    }

    const totalIncome = stats.reduce((sum, barber) => sum + barber.totalRevenue, 0)
    const totalExpenses = expensesData.total
    const balance = totalIncome - totalExpenses
    const deductibleAmount = expensesData.deducible

    useEffect(() => {
        if (!loadingStats && !loadingExpenses && onNetIncomeCalculated) {
            onNetIncomeCalculated(balance)
        }
    }, [balance, loadingStats, loadingExpenses, onNetIncomeCalculated])

    const isLoading = loadingStats || loadingExpenses

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-zinc-900/50 border border-zinc-800 rounded-[2rem] animate-pulse" />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6 mb-10">
            {/* Header with Download Action */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/50 border border-zinc-800 p-4 md:p-6 rounded-[2rem]">
                <div>
                    <h3 className="text-white font-black uppercase italic tracking-tight flex items-center gap-2">
                        <FileText className="w-5 h-5 text-amber-500" />
                        Informe Mensual de Gastos e Ingresos
                    </h3>
                    <p className="text-zinc-500 text-[10px] font-medium mt-1">Exportación completa del libro diario del período {targetMonth}</p>
                </div>

                <PDFDownloadLink
                    document={
                        <AccountingDetailPDF
                            data={{
                                shopName,
                                month: targetMonth,
                                entries: reportEntries,
                                totalIncome,
                                totalExpenses,
                                totalDeductible: deductibleAmount,
                                timestamp: new Date().toLocaleString('es-ES')
                            }}
                        />
                    }
                    fileName={`Informe_Contabilidad_${targetMonth}.pdf`}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                        "bg-amber-500 text-black hover:bg-amber-400 active:scale-95 shadow-lg shadow-amber-500/10"
                    )}
                >
                    {({ loading }) => (
                        <>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            <span>{loading ? 'Preparando...' : 'Descargar Libro Diario'}</span>
                        </>
                    )}
                </PDFDownloadLink>
            </div>

            {/* INFORME POR PAGOS */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/50 border border-zinc-800 p-4 md:p-6 rounded-[2rem]">
                <div>
                    <h3 className="text-white font-black uppercase italic tracking-tight flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-emerald-500" />
                        Informe Mensual Por Pagos
                    </h3>
                    <p className="text-zinc-500 text-[10px] font-medium mt-1">Genera un PDF detallado filtrando por método de pago y mes</p>
                </div>

                <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    className={cn(
                        "flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all",
                        "bg-zinc-800 text-white hover:bg-zinc-700 hover:text-amber-500 active:scale-95 border border-zinc-700 hover:border-amber-500/30 shadow-xl"
                    )}
                >
                    <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-700 group-hover:border-amber-500/30 transition-all">
                        <Calculator className="w-4 h-4 text-amber-500" />
                    </div>
                    Configurar y Descargar
                </button>
            </div>

            <PaymentReportModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                initialMonth={targetMonth}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {/* INGRESOS */}
                <div className="relative overflow-hidden group bg-zinc-900 border border-zinc-800 p-6 rounded-[2.5rem] hover:border-emerald-500/30 transition-all shadow-xl">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <TrendingUp className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/10">
                            <ArrowUpRight className="w-3 h-3" />
                            Ingresos
                        </div>
                    </div>
                    <div>
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Bruto mensual</p>
                        <h2 className="text-3xl font-black text-white tabular-nums tracking-tighter">
                            {totalIncome.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
                        </h2>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-emerald-500/5 blur-3xl rounded-full" />
                </div>

                {/* GASTOS */}
                <div className="relative overflow-hidden group bg-zinc-900 border border-zinc-800 p-6 rounded-[2.5rem] hover:border-red-500/30 transition-all shadow-xl">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                            <TrendingDown className="w-6 h-6 text-red-500" />
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1 text-[10px] font-black text-red-500 uppercase bg-red-500/10 px-2 py-1 rounded-full border border-red-500/10">
                                <ArrowDownRight className="w-3 h-3" />
                                Gastos
                            </div>
                            <span className="text-[9px] font-bold text-zinc-500 mt-1 uppercase">Deducible: {deductibleAmount.toFixed(0)}€</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Gasto mensual</p>
                        <h2 className="text-3xl font-black text-white tabular-nums tracking-tighter">
                            {totalExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
                        </h2>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-red-500/5 blur-3xl rounded-full" />
                </div>

                {/* BALANCE */}
                <div className="relative overflow-hidden group bg-zinc-900 border border-zinc-800 p-6 rounded-[2.5rem] hover:border-zinc-700 transition-all shadow-xl">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center border border-zinc-700/50">
                            <Wallet className="w-6 h-6 text-zinc-500 group-hover:text-amber-500 transition-colors" />
                        </div>
                        <div className={cn(
                            "text-[10px] font-black uppercase px-2 py-1 rounded-full border",
                            balance >= 0
                                ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/10"
                                : "text-red-500 bg-red-500/10 border-red-500/10"
                        )}>
                            Neto Total
                        </div>
                    </div>
                    <div>
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">
                            Balance mensual
                        </p>
                        <h2 className={cn(
                            "text-3xl font-black tabular-nums tracking-tighter transition-colors",
                            balance >= 0 ? "text-white group-hover:text-emerald-500" : "text-white group-hover:text-red-500"
                        )}>
                            {balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
                        </h2>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-zinc-500/5 blur-3xl rounded-full" />
                </div>
            </div>
        </div>
    )
}
