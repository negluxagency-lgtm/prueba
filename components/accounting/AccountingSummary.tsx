'use client'

import React, { useEffect } from 'react'
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, Info, Calculator, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useBarberStats } from '@/hooks/useBarberStats'
import { cn } from '@/lib/utils'
import useSWR from 'swr'

interface AccountingSummaryProps {
    selectedMonth?: string
    onNetIncomeCalculated?: (netIncome: number) => void
    isAutonomo?: boolean
    barberCount?: number
    onShowSalaryModal: () => void
    onShowAttendanceModal: () => void
    hideActions?: boolean
}

export default function AccountingSummary({
    selectedMonth,
    onNetIncomeCalculated,
    isAutonomo,
    barberCount,
    onShowSalaryModal,
    onShowAttendanceModal,
    hideActions
}: AccountingSummaryProps) {
    const targetMonth = selectedMonth || new Date().toISOString().substring(0, 7)
    const { stats, loading: loadingStats } = useBarberStats(targetMonth)

    // --- SWR ---
    const { 
        data: summaryData, 
        isLoading: loadingContabilidad,
        mutate 
    } = useSWR(['accounting-summary', targetMonth], async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        const [pRes, mRes] = await Promise.all([
            supabase.from('perfiles').select('nombre_barberia').eq('id', user.id).single(),
            supabase.from('metricas_contabilidad_mensual')
                .select('ingresos_servicios, ingresos_productos, gastos, gastos_deducibles')
                .eq('barberia_id', user.id)
                .eq('mes', targetMonth)
                .maybeSingle()
        ])

        if (mRes.error) {
            console.error('Error fetching metricas_contabilidad_mensual:', mRes.error)
        }

        const rec: any = mRes.data || {}
        const inc = (Number(rec.ingresos_servicios) || 0) + (Number(rec.ingresos_productos) || 0)
        const gst = Number(rec.gastos) || 0
        const ded = Number(rec.gastos_deducibles) || 0
        const bal = inc - gst

        return {
            shopName: pRes.data?.nombre_barberia || 'Mi Barbería',
            ingresos: inc,
            gastos: gst,
            deducibles: ded,
            balance: bal
        }
    })

    // --- REALTIME ---
    useEffect(() => {
        const channel = supabase
            .channel('realtime-summary')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'metricas_contabilidad_mensual' }, () => mutate())
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [mutate])

    const contabilidadData = summaryData || { ingresos: 0, gastos: 0, balance: 0, deducibles: 0 }
    // const shopName = summaryData?.shopName || 'Mi Barbería'

    const totalIncome = contabilidadData.ingresos
    const totalExpenses = contabilidadData.gastos
    const balance = contabilidadData.balance
    // const deductibleAmount = contabilidadData.deducibles

    useEffect(() => {
        if (!loadingStats && !loadingContabilidad && onNetIncomeCalculated) {
            onNetIncomeCalculated(balance)
        }
    }, [balance, loadingStats, loadingContabilidad, onNetIncomeCalculated])

    const isLoading = loadingStats || loadingContabilidad

    const getAutonomoQuota = (income: number) => {
        if (income <= 670) return "~230€"
        if (income <= 1500) return "~275€ - 320€"
        if (income <= 2500) return "~370€ - 420€"
        return "~460€ - 530€"
    }

    // const showAutonomoQuota = isAutonomo && (barberCount || 0) === 1

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 md:h-32 bg-zinc-900/50 border border-zinc-800 rounded-[1.5rem] md:rounded-[2rem]" />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6 mb-10">
            {/* 1. BALANCES GRID */}
            <div className="grid grid-cols-3 gap-2 md:gap-6">
                {/* INGRESOS */}
                <div className="relative overflow-hidden group bg-zinc-900 border border-zinc-800 p-3 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] hover:border-emerald-500/30 transition-all shadow-xl">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2 md:mb-4">
                        <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-2 md:mb-0">
                            <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-emerald-500" />
                        </div>
                        <div className="hidden md:flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/10">
                            <ArrowUpRight className="w-3 h-3" />
                            Ingresos
                        </div>
                    </div>
                    <div>
                        <p className="text-zinc-500 text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-0.5 md:mb-1">Ingresos</p>
                        <h2 className="text-base md:text-3xl font-black text-white tabular-nums tracking-tighter">
                            {totalIncome.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
                        </h2>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-emerald-500/5 blur-3xl rounded-full" />
                </div>

                {/* GASTOS */}
                <div className="relative overflow-hidden group bg-zinc-900 border border-zinc-800 p-3 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] hover:border-red-500/30 transition-all shadow-xl">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2 md:mb-4">
                        <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-2 md:mb-0">
                            <TrendingDown className="w-4 h-4 md:w-6 md:h-6 text-red-500" />
                        </div>
                    </div>
                    <div>
                        <p className="text-zinc-500 text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-0.5 md:mb-1">Gastos</p>
                        <h2 className="text-base md:text-3xl font-black text-white tabular-nums tracking-tighter">
                            {totalExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
                        </h2>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-red-500/5 blur-3xl rounded-full" />
                </div>

                {/* BALANCE */}
                <div className="relative overflow-hidden group bg-zinc-900 border border-zinc-800 p-3 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] hover:border-zinc-700 transition-all shadow-xl">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2 md:mb-4">
                        <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-zinc-800 flex items-center justify-center border border-zinc-700/50 mb-2 md:mb-0">
                            <Wallet className="w-4 h-4 md:w-6 md:h-6 text-zinc-500 group-hover:text-amber-500 transition-colors" />
                        </div>
                    </div>
                    <div>
                        <p className="text-zinc-500 text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-0.5 md:mb-1">Balance</p>
                        <h2 className={cn(
                            "text-base md:text-3xl font-black tabular-nums tracking-tighter transition-colors",
                            balance >= 0 ? "text-white group-hover:text-emerald-500" : "text-red-400"
                        )}>
                            {balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
                        </h2>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-zinc-500/5 blur-3xl rounded-full" />
                </div>
            </div>

            {/* 2. QUICK ACTIONS GRID */}
            {!hideActions && ((isAutonomo && (barberCount || 0) === 1) || (barberCount || 0) > 1) && (
                <div className={cn(
                    "grid gap-4 md:gap-6",
                    (isAutonomo && (barberCount || 0) === 1 && (barberCount || 0) <= 1) ? "grid-cols-1" :
                        (isAutonomo && (barberCount || 0) > 1) ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
                )}>
                    {isAutonomo && (
                        <div className="flex items-center justify-between p-6 bg-amber-500/10 border border-amber-500/20 text-white rounded-[2rem] shadow-xl group">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                                    <Info className="w-7 h-7 text-amber-500" />
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="font-black uppercase italic text-lg leading-tight text-white">Cuota de Autónomos</h3>
                                    <p className="text-zinc-500 text-[10px] font-bold">Estimación según ingresos personales del dueño</p>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end justify-center min-w-[120px]">
                                <span className="text-[10px] text-amber-500/70 font-black uppercase tracking-widest block mb-0.5 leading-none">Tramo actual</span>
                                <span className="text-xl font-black text-amber-500 tracking-tighter tabular-nums leading-tight">
                                    {(() => {
                                        const owner = stats.find((s: any) => s.isOwner);
                                        const quotaBasis = owner ? (owner.totalRevenue - totalExpenses) : balance;
                                        return getAutonomoQuota(quotaBasis);
                                    })()}
                                </span>
                            </div>
                        </div>
                    )}

                    {(barberCount || 0) > 1 && (
                        <>
                            <button
                                onClick={onShowSalaryModal}
                                className="flex items-center gap-4 p-6 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 active:scale-[0.98] text-white rounded-[2rem] transition-all shadow-xl group text-left"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
                                    <Calculator className="w-7 h-7 text-zinc-500 group-hover:text-amber-500 transition-colors" />
                                </div>
                                <div>
                                    <h3 className="font-black uppercase italic text-lg leading-tight text-white">Liquidación</h3>
                                    <p className="text-zinc-500 text-[10px] font-bold">Calcula salarios y comisiones del mes</p>
                                </div>
                            </button>

                            <button
                                onClick={onShowAttendanceModal}
                                className="flex items-center gap-4 p-6 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 active:scale-[0.98] text-white rounded-[2rem] transition-all shadow-xl group text-left"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
                                    <Clock className="w-7 h-7 text-zinc-500 group-hover:text-amber-500 transition-colors" />
                                </div>
                                <div>
                                    <h3 className="font-black uppercase italic text-lg leading-tight text-white">Control Presencia</h3>
                                    <p className="text-zinc-500 text-[10px] font-bold">Registro de jornadas y auditoría PDF</p>
                                </div>
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
