'use client'

import React, { useState, useEffect } from 'react'
import { BarChart3, Clock, FileText, Filter, X, DollarSign, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

// ── Existing components ────────────────────────────────────────────────────────
import ExpensesSection from '@/components/accounting/ExpensesSection'
import InvoicesSection from '@/components/accounting/InvoicesSection'
import AccountingSummary from '@/components/accounting/AccountingSummary'
import AttendanceReportModal from '@/components/accounting/AttendanceReportModal'
import SalaryCalculatorModal from '@/components/trends/SalaryCalculatorModal'
import { PaymentReportModal } from '@/components/accounting/PaymentReportModal'
import { AccountingDetailPDF } from '@/components/accounting/AccountingDetailPDF'
import AutonomoGuide from '@/components/accounting/AutonomoGuide'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { Loader2, Download, Receipt, Calculator, BookOpen } from 'lucide-react'

// ── Tab definitions ────────────────────────────────────────────────────────────
const TABS = [
    { id: 'financiera', label: 'Gestión Financiera', icon: BarChart3 },
    { id: 'jornadas', label: 'Jornadas y Salarios', icon: Clock },
    { id: 'facturas', label: 'Facturas e Informes', icon: FileText },
] as const

type TabId = typeof TABS[number]['id']

export default function AccountingPage() {
    const [activeTab, setActiveTab] = useState<TabId>('financiera')
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7))

    const [isAutonomo, setIsAutonomo] = useState(false)
    const [barberCount, setBarberCount] = useState(0)
    const [plan, setPlan] = useState<string>('')
    const [netIncome, setNetIncome] = useState(0)
    const [shopName, setShopName] = useState('Mi Barbería')

    const [reportEntries, setReportEntries] = useState<any[]>([])
    const [totalIncome, setTotalIncome] = useState(0)
    const [totalExpenses, setTotalExpenses] = useState(0)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const [loadingReportData, setLoadingReportData] = useState(false)

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase
                .from('perfiles')
                .select('Autonomo, nombre_barberia, plan')
                .eq('id', user.id)
                .single()

            if (profile) {
                setIsAutonomo(!!profile.Autonomo)
                setShopName(profile.nombre_barberia || 'Mi Barbería')
                setPlan(profile.plan || '')
            }


            const { count } = await supabase
                .from('barberos')
                .select('*', { count: 'exact', head: true })
                .eq('barberia_id', user.id)

            setBarberCount(count || 0)
        }
        fetchUserData()
    }, [])

    // Ensure we don't stay on 'jornadas' if it's hidden
    useEffect(() => {
        const isJornadasHidden = barberCount <= 1 || plan === 'Básico'
        if (isJornadasHidden && activeTab === 'jornadas') {
            setActiveTab('financiera')
        }
    }, [barberCount, plan, activeTab])


    return (
        <main className="flex-1 p-2 md:p-10 max-w-4xl md:max-w-6xl mx-auto w-full pb-24 md:pb-10">

            {/* ── Header ────────────────────────────────────────────────────── */}
            <header className="mb-6 flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl md:text-4xl font-black italic tracking-tighter uppercase leading-none">
                        Accounting <span className="text-amber-500">Center</span>
                    </h1>
                    <p className="text-zinc-500 font-medium text-xs md:text-sm mt-1 hidden md:block">Gestión financiera, ingresos y balance neto.</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 flex items-center gap-2 hover:border-amber-500/30 transition-all">
                        <Filter className="w-3.5 h-3.5 text-zinc-500" />
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-transparent border-none text-xs font-black text-amber-500 outline-none cursor-pointer focus:ring-0 appearance-none uppercase tracking-widest [&::-webkit-calendar-picker-indicator]:invert w-28 md:w-auto"
                        />
                        {selectedMonth && (
                            <button onClick={() => setSelectedMonth('')} className="p-0.5 hover:bg-zinc-800 rounded-full transition-colors">
                                <X className="w-3 h-3 text-zinc-600 hover:text-white" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* ── Tab Selector ──────────────────────────────────────────────── */}
            <div className="flex items-center gap-1 bg-zinc-900/60 border border-zinc-800 p-1 rounded-2xl mb-6 w-full">
                {TABS.filter(tab => {
                    if (tab.id === 'jornadas') {
                        return barberCount > 1 && plan !== 'Básico'
                    }
                    return true
                }).map(tab => {

                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    const shortLabel = tab.id === 'financiera' ? 'Finanzas' : tab.id === 'jornadas' ? 'Jornadas' : 'Facturas'
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex items-center justify-center gap-1.5 px-2 py-2 md:px-4 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all flex-1',
                                isActive
                                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                                    : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
                            )}
                        >
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span className="hidden xs:inline sm:inline">{shortLabel}</span>
                        </button>
                    )
                })}
            </div>

            {/* ── Tab Content ───────────────────────────────────────────────── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >

                    {/* ── TAB 1: Gestión Financiera ─────────────────────── */}
                    {activeTab === 'financiera' && (
                        <div className="space-y-8">
                            {isAutonomo && <AutonomoGuide />}
                            
                            <AccountingSummary
                                selectedMonth={selectedMonth}
                                onNetIncomeCalculated={setNetIncome}
                                isAutonomo={isAutonomo}
                                barberCount={barberCount}
                                onShowSalaryModal={() => { }} // No modals needed here now
                                onShowAttendanceModal={() => { }}
                                hideActions
                            />
                            <div>
                                <ExpensesSection selectedMonth={selectedMonth} />
                            </div>

                            {/* Generar Informes — Moved here */}
                            <div>
                                <h2 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5 text-amber-500" />
                                    Generar Informes
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    {/* Informe Gastos/Ingresos */}
                                    <div className="flex flex-col justify-between gap-4 md:gap-6 bg-zinc-900 border border-zinc-800 p-4 md:p-6 rounded-3xl md:rounded-[2.5rem] hover:border-zinc-700 transition-all shadow-xl">
                                        <div>
                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 mb-3 md:mb-4">
                                                <FileText className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />
                                            </div>
                                            <h3 className="text-white font-black uppercase italic tracking-tight text-sm md:text-lg leading-tight">
                                                Informe Gastos / Ingresos
                                            </h3>
                                            <p className="text-zinc-500 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-1.5 md:mt-2">Libro diario del período · {selectedMonth || 'Todos'}</p>
                                        </div>
                                        <ReportDownloadButton selectedMonth={selectedMonth} shopName={shopName} />
                                    </div>

                                    {/* Informe por Pagos */}
                                    <div className="flex flex-col justify-between gap-4 md:gap-6 bg-zinc-900 border border-zinc-800 p-4 md:p-6 rounded-3xl md:rounded-[2.5rem] hover:border-zinc-700 transition-all shadow-xl">
                                        <div>
                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-3 md:mb-4">
                                                <Receipt className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
                                            </div>
                                            <h3 className="text-white font-black uppercase italic tracking-tight text-sm md:text-lg leading-tight">
                                                Informe Por Pagos
                                            </h3>
                                            <p className="text-zinc-500 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-1.5 md:mt-2">Filtrado por método de pago y mes</p>
                                        </div>
                                        <button
                                            onClick={() => setIsPaymentModalOpen(true)}
                                            className="flex items-center justify-center gap-2 md:gap-3 px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all w-full bg-zinc-800 text-white hover:bg-zinc-700 hover:text-amber-500 active:scale-95 border border-zinc-700 hover:border-amber-500/30 shadow-xl"
                                        >
                                            <Calculator className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" />
                                            Configurar y Descargar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── TAB 2: Jornadas y Salarios ────────────────────── */}
                    {activeTab === 'jornadas' && (
                        <div className="space-y-8">
                            {/* Control de Presencia — Inline */}
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2rem] overflow-hidden">
                                <div className="px-6 py-5 border-b border-zinc-800/50 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-black italic uppercase tracking-tighter text-white">Control de Presencia</h2>
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Registro de jornadas y fichajes</p>
                                    </div>
                                </div>
                                <div className="min-h-[500px]">
                                    <AttendanceReportModal
                                        onClose={() => { }}
                                        month={selectedMonth}
                                        inline
                                    />
                                </div>
                            </div>

                            {/* Liquidación — Inline */}
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2rem] overflow-hidden">
                                <div className="px-6 py-5 border-b border-zinc-800/50 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                        <Calculator className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-black italic uppercase tracking-tighter text-white">Liquidación Mensual</h2>
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Cálculo de nóminas y comisiones</p>
                                    </div>
                                </div>
                                <SalaryCalculatorModal onClose={() => { }} inline />
                            </div>
                        </div>
                    )}

                    {/* ── TAB 3: Facturas e Informes ────────────────────── */}
                    {activeTab === 'facturas' && (
                        <div className="space-y-8">
                            {/* Archivo de Facturas */}
                            <InvoicesSection initialMonth={selectedMonth} />
                        </div>
                    )}

                </motion.div>
            </AnimatePresence>

            {/* Payment modal */}
            <PaymentReportModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                initialMonth={selectedMonth}
            />
        </main>
    )
}

// ── Report Download Button Helper ──────────────────────────────────────────────
function ReportDownloadButton({ selectedMonth, shopName }: { selectedMonth: string; shopName: string }) {
    const [entries, setEntries] = useState<any[]>([])
    const [income, setIncome] = useState(0)
    const [expenses, setExpenses] = useState(0)
    const [deductible, setDeductible] = useState(0)
    const [ready, setReady] = useState(false)
    const [loadingData, setLoadingData] = useState(false)

    useEffect(() => { setReady(false) }, [selectedMonth])

    const prepareData = async () => {
        if (ready) return
        setLoadingData(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const targetMonth = selectedMonth || new Date().toISOString().substring(0, 7)
            const [year, month] = targetMonth.split('-').map(Number)
            const startOfMonth = `${targetMonth}-01`
            const endDate = new Date(year, month, 1).toISOString().split('T')[0]

            const [{ data: gastos }, { data: citas }] = await Promise.all([
                supabase.from('gastos').select('*').eq('user_id', user.id).gte('fecha', startOfMonth).lt('fecha', endDate).order('fecha'),
                supabase.from('citas').select('Dia, Precio').eq('barberia_id', user.id).eq('confirmada', true).gte('Dia', startOfMonth).lt('Dia', endDate)
            ])

            const totals = (gastos || []).reduce((a, c) => {
                a.total += +c.monto; if (c.deducible) a.deducible += +c.monto; return a
            }, { total: 0, deducible: 0 })
            setExpenses(totals.total); setDeductible(totals.deducible)

            const dailyIncome: Record<string, number> = {}
            citas?.forEach(c => { dailyIncome[c.Dia] = (dailyIncome[c.Dia] || 0) + (+c.Precio || 0) })
            const totalInc = Object.values(dailyIncome).reduce((s, v) => s + v, 0)
            setIncome(totalInc)

            const allDates = Array.from(new Set([...Object.keys(dailyIncome), ...(gastos || []).map(g => g.fecha)])).sort()
            const built: any[] = []
            allDates.forEach(date => {
                const dayInc = dailyIncome[date] || 0
                const dayExp = (gastos || []).filter(g => g.fecha === date)
                if (!dayExp.length) { if (dayInc > 0) built.push({ date: date.split('-').reverse().join('/'), income: dayInc, expense: 0, reason: '', deductible: false }) }
                else dayExp.forEach((g, i) => built.push({ date: date.split('-').reverse().join('/'), income: i === 0 ? dayInc : 0, expense: +g.monto, reason: g.concepto, deductible: g.deducible }))
            })
            setEntries(built)
            setReady(true)
        } finally { setLoadingData(false) }
    }

    if (!ready) {
        return (
            <button
                onClick={prepareData}
                disabled={loadingData}
                className="flex items-center justify-center gap-2 px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all w-full bg-zinc-800 text-white hover:bg-zinc-700 active:scale-95 border border-zinc-700"
            >
                {loadingData ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {loadingData ? 'Preparando...' : 'Generar Informe'}
            </button>
        )
    }

    return (
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
            fileName={`Informe_Contabilidad_${selectedMonth}.pdf`}
            className="flex items-center justify-center gap-2 px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all w-full bg-amber-500 text-black hover:bg-amber-400 active:scale-95 shadow-lg shadow-amber-500/10"
        >
            {({ loading }) => (
                <>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span>{loading ? 'Preparando...' : 'Descargar Libro Diario'}</span>
                </>
            )}
        </PDFDownloadLink>
    )
}
