'use client'

import React, { useState, useEffect } from 'react'
import { BarChart3, Clock, FileText, Filter, X, DollarSign, Users, Loader2, Download, Receipt, Calculator, BookOpen, History } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import useSWR from 'swr'
import Link from 'next/link'

// ── Existing components ────────────────────────────────────────────────────────
import ExpensesSection from '@/components/accounting/ExpensesSection'
import InvoicesSection from '@/components/accounting/InvoicesSection'
import AccountingSummary from '@/components/accounting/AccountingSummary'
import AttendanceReportModal from '@/components/accounting/AttendanceReportModal'
import SalaryCalculatorModal from '@/components/trends/SalaryCalculatorModal'
import { PaymentReportModal } from '@/components/accounting/PaymentReportModal'
import { AccountingReportModal } from '@/components/accounting/AccountingReportModal'
import AutonomoGuide from '@/components/accounting/AutonomoGuide'
import { Barber360View } from '@/components/management/Barber360View'

// ── Tab definitions ────────────────────────────────────────────────────────────
const TABS = [
    { id: 'financiera', label: 'Gestión Financiera', icon: BarChart3 },
    { id: 'equipo', label: 'Equipo (360º)', icon: Users },
    { id: 'facturas', label: 'Facturas e Informes', icon: FileText },
] as const

type TabId = typeof TABS[number]['id']

export default function AccountingPage() {
    const [activeTab, setActiveTab] = useState<TabId>('financiera')
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7))

    // --- SWR FOR USER DATA & TEAM ---
    const { data: accountingProfile } = useSWR('accounting-profile', async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        const [pRes, bRes] = await Promise.all([
            supabase.from('perfiles').select('Autonomo, nombre_barberia, plan').eq('id', user.id).single(),
            supabase.from('barberos').select('*', { count: 'exact', head: true }).eq('barberia_id', user.id)
        ])

        return {
            userId: user.id,
            isAutonomo: !!pRes.data?.Autonomo,
            shopName: pRes.data?.nombre_barberia || 'Mi Barbería',
            plan: pRes.data?.plan || '',
            barberCount: bRes.count || 0
        }
    })

    const isAutonomo = accountingProfile?.isAutonomo ?? false
    const barberCount = accountingProfile?.barberCount ?? 0
    const plan = accountingProfile?.plan ?? ''
    const shopName = accountingProfile?.shopName ?? 'Mi Barbería'

    const [netIncome, setNetIncome] = useState(0)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const [isAccountingModalOpen, setIsAccountingModalOpen] = useState(false)

    // Ensure we don't stay on 'equipo' if hidden
    useEffect(() => {
        const isTeamHidden = barberCount <= 1 || plan === 'Básico'
        if (isTeamHidden && activeTab === 'equipo') {
            setActiveTab('financiera')
        }
    }, [barberCount, plan, activeTab])


    return (
        <main className="flex-1 p-2 lg:p-10 max-w-4xl lg:max-w-6xl mx-auto w-full pb-24 lg:pb-10">

            {/* ── Header ────────────────────────────────────────────────────── */}
            <header className="mb-6 flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl lg:text-4xl font-black italic tracking-tighter uppercase leading-none">
                        Accounting <span className="text-amber-500">Center</span>
                    </h1>
                    <p className="text-zinc-500 font-medium text-xs lg:text-sm mt-1 hidden lg:block">Gestión financiera, ingresos y balance neto.</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Link
                        href="/historial_caja"
                        className="p-1.5 lg:px-4 lg:py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center gap-2 group"
                    >
                        <History className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                        <span className="hidden lg:inline text-[10px] font-black uppercase tracking-widest">Historial Cajas</span>
                    </Link>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 flex items-center gap-2 hover:border-amber-500/30 transition-all">
                        <Filter className="w-3.5 h-3.5 text-zinc-500" />
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-transparent border-none text-xs font-black text-amber-500 outline-none cursor-pointer focus:ring-0 appearance-none uppercase tracking-widest [&::-webkit-calendar-picker-indicator]:invert w-28 lg:w-auto"
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
            <div className="flex items-center gap-1 bg-zinc-900/60 border border-zinc-800 p-1 rounded-2xl mb-6 w-full overflow-x-auto">
                {TABS.filter(tab => {
                    if (tab.id === 'equipo') {
                        return barberCount > 1 && plan !== 'Básico'
                    }
                    return true
                }).map(tab => {

                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    const shortLabel = tab.id === 'financiera' ? 'Finanzas' : tab.id === 'equipo' ? 'Equipo' : 'Facturas'
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex items-center justify-center gap-1.5 px-2 py-2 lg:px-4 lg:py-2.5 rounded-xl text-[10px] lg:text-xs font-black uppercase tracking-widest transition-all flex-1 whitespace-nowrap',
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
                                <h2 className="text-[10px] lg:text-xs font-black text-zinc-500 uppercase tracking-widest mb-3 lg:mb-4 flex items-center gap-2 px-1">
                                    <FileText className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-amber-500" />
                                    Generar Informes
                                </h2>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
                                    {/* Informe Gastos/Ingresos */}
                                    <div className="flex flex-col justify-between gap-3 lg:gap-6 bg-zinc-900 border border-zinc-800 p-3.5 lg:p-6 rounded-2xl lg:rounded-[2.5rem] hover:border-zinc-700 transition-all shadow-xl">
                                        <div className="flex items-center lg:block gap-3 lg:gap-0">
                                            <div className="w-9 h-9 lg:w-12 lg:h-12 shrink-0 rounded-xl lg:rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 mb-0 lg:mb-4">
                                                <FileText className="w-4.5 h-4.5 lg:w-6 lg:h-6 text-amber-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-white font-black uppercase italic tracking-tight text-[13px] lg:text-lg leading-tight">
                                                    Informe Gastos / Ingresos
                                                </h3>
                                                <p className="text-zinc-500 text-[8px] lg:text-[10px] font-bold uppercase tracking-widest mt-0.5 lg:mt-2">Libro diario del período</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsAccountingModalOpen(true)}
                                            className="flex items-center justify-center gap-2 lg:gap-3 px-4 py-2.5 lg:py-4 rounded-xl lg:rounded-2xl font-black text-[9px] lg:text-[10px] uppercase tracking-widest transition-all w-full bg-zinc-800 text-white hover:bg-zinc-700 hover:text-amber-500 active:scale-95 border border-zinc-700 hover:border-amber-500/30 shadow-xl"
                                        >
                                            <Download className="w-3 h-3 lg:w-4 lg:h-4 text-amber-500" />
                                            Configurar y Descargar
                                        </button>
                                    </div>

                                    {/* Informe por Pagos */}
                                    <div className="flex flex-col justify-between gap-3 lg:gap-6 bg-zinc-900 border border-zinc-800 p-3.5 lg:p-6 rounded-2xl lg:rounded-[2.5rem] hover:border-zinc-700 transition-all shadow-xl">
                                        <div className="flex items-center lg:block gap-3 lg:gap-0">
                                            <div className="w-9 h-9 lg:w-12 lg:h-12 shrink-0 rounded-xl lg:rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-0 lg:mb-4">
                                                <Receipt className="w-4.5 h-4.5 lg:w-6 lg:h-6 text-emerald-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-white font-black uppercase italic tracking-tight text-[13px] lg:text-lg leading-tight">
                                                    Informe Por Pagos
                                                </h3>
                                                <p className="text-zinc-500 text-[8px] lg:text-[10px] font-bold uppercase tracking-widest mt-0.5 lg:mt-2">Filtrado por método de pago</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsPaymentModalOpen(true)}
                                            className="flex items-center justify-center gap-2 lg:gap-3 px-4 py-2.5 lg:py-4 rounded-xl lg:rounded-2xl font-black text-[9px] lg:text-[10px] uppercase tracking-widest transition-all w-full bg-zinc-800 text-white hover:bg-zinc-700 hover:text-amber-500 active:scale-95 border border-zinc-700 hover:border-amber-500/30 shadow-xl"
                                        >
                                            <Calculator className="w-3 h-3 lg:w-4 lg:h-4 text-amber-500" />
                                            Configurar y Descargar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── TAB 2: Barber 360 ────────────────────────────── */}
                    {activeTab === 'equipo' && (
                        <div className="space-y-8">
                            {accountingProfile?.userId && (
                                <Barber360View
                                    perfilId={accountingProfile.userId}
                                    initialMonth={selectedMonth}
                                />
                            )}
                        </div>
                    )}

                    {/* ── TAB 3: Facturas e Informes ────────────────────── */}
                    {activeTab === 'facturas' && (
                        <div className="space-y-8">
                            {/* Guía Autónomo */}
                            {isAutonomo && (
                                <div className="w-full">
                                    <AutonomoGuide />
                                </div>
                            )}

                            {/* Archivo de Facturas */}
                            <InvoicesSection initialMonth={selectedMonth} />
                        </div>
                    )}

                </motion.div>
            </AnimatePresence>

            <PaymentReportModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                initialMonth={selectedMonth}
            />

            <AccountingReportModal
                isOpen={isAccountingModalOpen}
                onClose={() => setIsAccountingModalOpen(false)}
                initialMonth={selectedMonth}
                shopName={shopName}
            />
        </main>
    )
}


