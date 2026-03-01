'use client'

import React, { useState, useEffect } from 'react'
import { Receipt, DollarSign, Calculator, Clock, TrendingDown, FileText, ArrowLeftRight, Filter, X, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ExpensesSection from '@/components/accounting/ExpensesSection'
import InvoicesSection from '@/components/accounting/InvoicesSection'
import SalaryCalculatorModal from '@/components/trends/SalaryCalculatorModal'
import AttendanceReportModal from '@/components/accounting/AttendanceReportModal'
import AccountingSummary from '@/components/accounting/AccountingSummary'

export default function AccountingPage() {
    const [activeTab, setActiveTab] = useState<'gastos' | 'facturas'>('gastos')
    const [showSalaryModal, setShowSalaryModal] = useState(false)
    const [showAttendanceModal, setShowAttendanceModal] = useState(false)
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7))

    const [isAutonomo, setIsAutonomo] = useState<boolean>(false)
    const [barberCount, setBarberCount] = useState<number>(0)
    const [netIncome, setNetIncome] = useState<number>(0)

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase
                .from('perfiles')
                .select('Autonomo')
                .eq('id', user.id)
                .single()

            if (profile) {
                setIsAutonomo(!!profile.Autonomo)
            }

            const { count } = await supabase
                .from('barberos')
                .select('*', { count: 'exact', head: true })
                .eq('barberia_id', user.id)

            setBarberCount(count || 0)
        }

        fetchUserData()
    }, [])

    const getAutonomoQuota = (income: number) => {
        if (income <= 670) return "~230€"
        if (income <= 1500) return "~275€ - 320€"
        if (income <= 2500) return "~370€ - 420€"
        return "~460€ - 530€"
    }

    const showAutonomoQuota = isAutonomo && barberCount === 1


    return (
        <main className="flex-1 p-2 md:p-10 max-w-4xl md:max-w-6xl mx-auto w-full pb-24 md:pb-10">
            <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase mb-2">
                        Accounting <span className="text-amber-500">Center</span>
                    </h1>
                    <p className="text-zinc-500 font-medium text-sm md:text-base">Gestión financiera, ingresos y balance neto.</p>
                </div>

                {/* GLOBAL MONTH SELECTOR */}
                <div className="flex items-center gap-3 self-start md:self-auto">
                    <div className="relative group/filter bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2 flex items-center gap-3 hover:border-amber-500/30 transition-all shadow-xl">
                        <Filter className="w-4 h-4 text-zinc-500 group-hover:text-amber-500 transition-colors" />
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-transparent border-none text-sm font-black text-amber-500 outline-none cursor-pointer focus:ring-0 appearance-none uppercase tracking-widest [&::-webkit-calendar-picker-indicator]:invert"
                        />
                        {selectedMonth && (
                            <button
                                onClick={() => setSelectedMonth('')}
                                className="p-1 hover:bg-zinc-800 rounded-full transition-colors"
                                title="Limpiar filtro"
                            >
                                <X className="w-3.5 h-3.5 text-zinc-600 hover:text-white" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* FINANCIAL SUMMARY */}
            <AccountingSummary
                selectedMonth={selectedMonth}
                onNetIncomeCalculated={setNetIncome}
            />

            {/* QUICK ACTIONS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-12">
                {showAutonomoQuota ? (
                    <div className="flex items-center justify-between p-6 bg-amber-500/10 border border-amber-500/20 text-white rounded-[2rem] shadow-xl group">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                                <Info className="w-7 h-7 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="font-black uppercase italic text-lg leading-tight text-white">Cuota de Autónomos</h3>
                                <p className="text-zinc-500 text-xs font-bold">Estimación según ingresos netos de {selectedMonth}</p>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <span className="text-xs text-amber-500/70 font-bold uppercase tracking-widest block mb-1">Tramo actual</span>
                            <span className="text-2xl font-black text-amber-500 tracking-tighter whitespace-nowrap">{getAutonomoQuota(netIncome)}</span>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowSalaryModal(true)}
                        className="flex items-center gap-4 p-6 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 active:scale-[0.98] text-white rounded-[2rem] transition-all shadow-xl group text-left"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
                            <Calculator className="w-7 h-7 text-zinc-500 group-hover:text-amber-500 transition-colors" />
                        </div>
                        <div>
                            <h3 className="font-black uppercase italic text-lg leading-tight text-white">Liquidación</h3>
                            <p className="text-zinc-500 text-xs font-bold">Calcula salarios y comisiones del mes</p>
                        </div>
                    </button>
                )}

                <button
                    onClick={() => setShowAttendanceModal(true)}
                    className="flex items-center gap-4 p-6 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 active:scale-[0.98] text-white rounded-[2rem] transition-all shadow-xl group text-left"
                >
                    <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
                        <Clock className="w-7 h-7 text-zinc-500 group-hover:text-amber-500 transition-colors" />
                    </div>
                    <div>
                        <h3 className="font-black uppercase italic text-lg leading-tight text-white">Control Presencia</h3>
                        <p className="text-zinc-500 text-xs font-bold">Registro de jornadas y auditoría PDF</p>
                    </div>
                </button>
            </div>

            {/* TABS SELECTOR */}
            <div className="flex items-center gap-2 bg-zinc-900/50 p-1 rounded-2xl border border-zinc-800 mb-8 w-fit">
                <button
                    onClick={() => setActiveTab('gastos')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'gastos' ? 'bg-amber-500 text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                >
                    Gastos Operativos
                </button>
                <button
                    onClick={() => setActiveTab('facturas')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'facturas' ? 'bg-amber-500 text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                >
                    Archivo Facturas
                </button>
            </div>

            {/* SECTIONS */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                {activeTab === 'gastos' ? (
                    <ExpensesSection selectedMonth={selectedMonth} />
                ) : (
                    <InvoicesSection initialMonth={selectedMonth} />
                )}
            </div>

            {/* Modals */}
            {showSalaryModal && (
                <SalaryCalculatorModal onClose={() => setShowSalaryModal(false)} />
            )}
            {showAttendanceModal && (
                <AttendanceReportModal onClose={() => setShowAttendanceModal(false)} month={selectedMonth} />
            )}
        </main>
    )
}
