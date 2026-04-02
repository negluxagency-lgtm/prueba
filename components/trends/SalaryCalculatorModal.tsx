'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, Calculator, Info, Calendar, ChevronRight } from 'lucide-react'
import { useBarberStats } from '@/hooks/useBarberStats'
import { supabase } from '@/lib/supabase'
import { BarberOvertimeInline } from './BarberOvertimeInline'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { SalaryReportPDF } from './SalaryReportPDF'
import { AccountantReportPDF } from './AccountantReportPDF'
import { FileText, Download, ShieldCheck, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface SalaryRow {
    commission: string
    baseSalaryRaw: string
    bonusRaw: string
    salary: number | null
}

interface SalaryCalculatorModalProps {
    onClose: () => void
    inline?: boolean
    barberId?: string
    initialMonth?: string
}

export default function SalaryCalculatorModal({ onClose, inline, barberId, initialMonth }: SalaryCalculatorModalProps) {
    const now = new Date()
    const defaultMonth = initialMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const [selectedMonth, setSelectedMonth] = useState(defaultMonth)
 
    useEffect(() => {
        if (initialMonth) {
            setSelectedMonth(initialMonth)
        }
    }, [initialMonth])
    const { stats: allStats, loading, refresh } = useBarberStats(selectedMonth) as any

    // Filtrar stats si se proporciona barberId (Memoizado para evitar bucles de renderizado)
    const stats = useMemo(() => {
        return barberId ? allStats.filter((b: any) => String(b.id) === String(barberId)) : allStats
    }, [barberId, allStats])

    const [rows, setRows] = useState<Record<string, SalaryRow>>({})
    const [calculated, setCalculated] = useState(false)
    const [shopId, setShopId] = useState<string | null>(null)
    const [shopName, setShopName] = useState('Mi Barbería')
    
    // Pre-expandir el barbero si se proporciona barberId
    const [expandedBarbers, setExpandedBarbers] = useState<Record<string, boolean>>({})

    useEffect(() => {
        if (barberId && stats.length > 0) {
            setExpandedBarbers({ [stats[0].nombre]: true })
        }
    }, [barberId, stats])

    const toggleBarber = (nombre: string) => {
        setExpandedBarbers(prev => ({ ...prev, [nombre]: !prev[nombre] }))
    }

    useEffect(() => {
        const fetchShopId = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const { data } = await supabase.from('perfiles').select('id, nombre_barberia').eq('id', user.id).single()
            if (data) {
                setShopId(data.id)
                setShopName(data.nombre_barberia || 'Mi Barbería')
            }
        }
        fetchShopId()
    }, [])

    useEffect(() => {
        if (stats.length > 0) {
            const initialRows: Record<string, SalaryRow> = {}
            stats.forEach((b: any) => {
                initialRows[b.nombre] = {
                    commission: b.porcentaje_comision?.toString() || '',
                    baseSalaryRaw: b.salario_base?.toString() || '',
                    bonusRaw: '',
                    salary: null
                }
            })
            setRows(initialRows)
            setCalculated(false)
        }
    }, [stats])

    const getRow = (nombre: string): SalaryRow => {
        const s = rows[nombre]
        return {
            commission: s?.commission ?? '',
            baseSalaryRaw: s?.baseSalaryRaw ?? '',
            bonusRaw: s?.bonusRaw ?? '',
            salary: s?.salary ?? null
        }
    }

    const updateRow = (nombre: string, field: keyof Omit<SalaryRow, 'salary'>, value: string) => {
        setCalculated(false)
        setRows(prev => ({
            ...prev,
            [nombre]: { ...getRow(nombre), [field]: value, salary: null }
        }))
    }

    const handleCalculate = () => {
        const updated: Record<string, SalaryRow> = {}
        for (const barber of (stats as any[])) {
            const row = getRow(barber.nombre)
            const pct = parseFloat(row.commission)
            const base = parseFloat(row.baseSalaryRaw) || 0
            const bonus = parseFloat(row.bonusRaw) || 0
            const commissionAmount = isNaN(pct) || pct < 0 || pct > 100 ? 0 : barber.totalRevenue * (pct / 100)

            // Overtime is EXCLUDED from financial calculation
            const salary = parseFloat((base + commissionAmount + bonus).toFixed(2))
            updated[barber.nombre] = { ...row, salary }
        }
        setRows(updated)
        setCalculated(true)
    }

    const totalSalaries = Object.values(rows).reduce((sum, r) => sum + (r.salary ?? 0), 0)
    const allFilled = stats.length > 0 && stats.every((b: any) => getRow(b.nombre).commission !== '')

    const innerContent = (
        <div className={inline
            ? "w-full flex flex-col"
            : "bg-zinc-900 border-t md:border border-zinc-800 rounded-t-[2.5rem] md:rounded-3xl w-full max-w-2xl shadow-2xl h-[94dvh] md:h-auto md:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 md:zoom-in duration-300"
        }>
            {/* Header - Only in modal mode */}
            {!inline && (
                <div className="p-4 md:p-8 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 relative overflow-hidden shrink-0">
                    <div className="flex items-center gap-4 md:gap-6 relative z-10">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-[1.5rem] md:rounded-[2rem] bg-white flex items-center justify-center shadow-2xl rotate-3 shrink-0">
                            <Calculator className="w-6 h-6 md:w-8 md:h-8 text-black" />
                        </div>
                        <div>
                            <h2 className="text-2xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                                Salary <span className="text-amber-500 underline decoration-white/20 underline-offset-8 md:underline-offset-[12px]">Engine</span>
                            </h2>
                            <p className="text-[10px] md:text-sm text-zinc-500 font-bold uppercase tracking-[0.3em] md:tracking-[0.5em] mt-1 md:mt-3">Liquidación Mensual de Equipo</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 md:p-4 hover:bg-white/10 rounded-full transition-all border border-transparent hover:border-white/10 relative z-10 group">
                        <X className="w-6 h-6 md:w-8 md:h-8 text-zinc-500 group-hover:text-white transition-colors" />
                    </button>
                </div>
            )}

            {/* Filters Row */}
            <div className="p-3 md:p-6 border-b border-zinc-800 bg-zinc-900/30 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 md:gap-4">
                    <Calendar className="w-4 h-4 md:w-5 md:h-5 text-amber-500 shrink-0" />
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-zinc-800 border border-zinc-700 rounded-lg md:rounded-xl px-2.5 md:px-4 py-1.5 md:py-2.5 text-xs md:text-sm font-black text-white outline-none focus:border-amber-500 transition-all uppercase tracking-widest [&::-webkit-calendar-picker-indicator]:invert w-28 md:w-auto"
                    />
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 md:p-8 space-y-4 md:space-y-10 custom-scrollbar relative">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Analizando ingresos...</p>
                    </div>
                ) : stats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                        <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mb-6">
                            <Info className="w-10 h-10 text-zinc-700" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase mb-2">Sin actividad</h3>
                        <p className="text-zinc-500 text-sm max-w-xs">No hay datos de ingresos para este mes. Sigue trabajando para ver resultados.</p>
                    </div>
                ) : (
                    (stats as any[]).map(barber => {
                        const row = getRow(barber.nombre)
                        return (
                            <div key={barber.nombre} className="bg-zinc-900 border border-zinc-800 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 relative overflow-hidden group/card shadow-2xl transition-all hover:border-zinc-700">
                                <button
                                    onClick={() => toggleBarber(barber.nombre)}
                                    className={cn("w-full flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 relative z-10 text-left cursor-pointer", expandedBarbers[barber.nombre] ? "mb-6 md:mb-8" : "mb-0")}
                                >
                                    <div className="flex items-center gap-3 md:gap-5 flex-1">
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-amber-500 flex items-center justify-center text-xl md:text-xl font-black text-black shadow-lg shrink-0">
                                            {barber.nombre.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg md:text-2xl font-black text-white italic tracking-tighter uppercase leading-none">{barber.nombre}</h3>
                                                <div className="p-2 hover:bg-white/10 rounded-full transition-all border border-white/5 ml-2">
                                                    <ChevronRight className={cn("w-5 h-5 text-amber-500 transition-transform duration-300", expandedBarbers[barber.nombre] && "rotate-90")} />
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-1.5 md:gap-3 mt-1.5 md:mt-2">
                                                <span className="text-[8px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">Fact: {barber.totalRevenue.toFixed(0)}€</span>
                                                <span className="hidden md:inline-flex text-[8px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700 items-center gap-1">
                                                    <Clock className="w-2.5 h-2.5 text-amber-500" /> {barber.totalExtraHours?.toFixed(1) || 0}h Extra
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                <AnimatePresence initial={false}>
                                    {expandedBarbers[barber.nombre] && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pt-4 space-y-4">
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 relative z-10">
                                                    <div className="space-y-1.5 md:space-y-2">
                                                        <label className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Sueldo Base</label>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                value={row.baseSalaryRaw}
                                                                onChange={e => updateRow(barber.nombre, 'baseSalaryRaw', e.target.value)}
                                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-white text-xs md:text-sm font-bold outline-none focus:border-amber-500/50 transition-all font-mono"
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] md:text-xs font-bold">€</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5 md:space-y-2">
                                                        <label className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Comisión</label>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                value={row.commission || ''}
                                                                onChange={e => updateRow(barber.nombre, 'commission', e.target.value)}
                                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-white text-xs md:text-sm font-bold outline-none focus:border-amber-500/50 transition-all font-mono"
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] md:text-xs font-bold">%</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5 md:space-y-2 col-span-2 md:col-span-1">
                                                        <label className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Horas Extra / Bonus</label>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                value={row.bonusRaw}
                                                                onChange={e => updateRow(barber.nombre, 'bonusRaw', e.target.value)}
                                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-white text-xs md:text-sm font-bold outline-none focus:border-amber-500/50 transition-all font-mono"
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] md:text-xs font-bold">€</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {shopId && (
                                                    <BarberOvertimeInline
                                                        barberId={barber.id}
                                                        barberiaId={shopId}
                                                        month={selectedMonth}
                                                        onChanged={() => refresh && refresh()}
                                                    />
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {calculated && row.salary !== null && (
                                    <div className="mt-5 md:mt-8 pt-4 md:pt-6 border-t-2 border-dashed border-zinc-800 flex items-center justify-between bg-zinc-950/50 -mx-4 md:-mx-10 px-4 md:px-10 pb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white flex items-center justify-center shrink-0"><Info className="w-3.5 h-3.5 md:w-4 md:h-4 text-black" /></div>
                                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 leading-tight">Total Neto</span>
                                        </div>
                                        <span className="text-xl md:text-2xl font-black text-white tabular-nums tracking-tighter">
                                            {row.salary.toFixed(2)}€
                                        </span>
                                    </div>
                                )}

                                {calculated && row.salary !== null && (
                                    <div className="mt-4 flex justify-end">
                                        <PDFDownloadLink
                                            document={
                                                <SalaryReportPDF
                                                    data={{
                                                        shopName,
                                                        month: selectedMonth,
                                                        barberName: barber.nombre,
                                                        baseSalary: parseFloat(row.baseSalaryRaw) || 0,
                                                        commissionAmount: barber.totalRevenue * ((parseFloat(row.commission) || 0) / 100),
                                                        extraHoursCount: barber.totalExtraHours || 0,
                                                        extraHoursAmount: barber.totalExtraHoursAmount || 0,
                                                        bonusAmount: parseFloat(row.bonusRaw) || 0,
                                                        totalNeto: row.salary,
                                                        totalRevenue: barber.totalRevenue,
                                                        totalCuts: barber.totalCuts,
                                                        timestamp: new Date().toLocaleString(),
                                                    }}
                                                />
                                            }
                                            fileName={`Liquidacion_${barber.nombre}_${selectedMonth}.pdf`}
                                            className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-amber-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-zinc-700/50 shadow-lg active:scale-95 group/pdf"
                                        >
                                            {({ loading }) => (
                                                <>
                                                    {loading ? <Download className="w-4 h-4 animate-bounce" /> : <FileText className="w-4 h-4 group-hover/pdf:scale-110 transition-transform" />}
                                                    <span>{loading ? 'Generando PDF...' : 'Descargar Recibo'}</span>
                                                </>
                                            )}
                                        </PDFDownloadLink>
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>

            {/* Footer */}
            <div className="p-3 md:p-6 border-t border-zinc-800 bg-zinc-900 shrink-0 space-y-3 md:space-y-4">
                {calculated && totalSalaries > 0 && (
                    <div className="flex items-center justify-between bg-white px-4 md:px-6 py-3 md:py-5 rounded-xl md:rounded-[2rem] shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-0.5 md:mb-1">Carga Salarial Total</p>
                            <p className="text-xl md:text-3xl font-black text-black tabular-nums tracking-tighter">{totalSalaries.toFixed(2)}€</p>
                        </div>
                        <div className="absolute right-0 top-0 bottom-0 w-24 md:w-32 bg-amber-500 translate-x-8 -skew-x-12 opacity-10" />
                        <Calculator className="w-6 h-6 md:w-10 md:h-10 text-black/10 relative z-10" />
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                    {calculated && stats.length > 0 && (
                        <PDFDownloadLink
                            document={
                                <AccountantReportPDF
                                    data={{
                                        shopName,
                                        month: selectedMonth,
                                        barbers: stats.map((b: any) => {
                                            const row = getRow(b.nombre)
                                            return {
                                                nombre: b.nombre,
                                                baseSalary: parseFloat(row.baseSalaryRaw) || 0,
                                                commission: b.totalRevenue * ((parseFloat(row.commission) || 0) / 100),
                                                extraHours: b.totalExtraHours || 0,
                                                extraHoursAmount: b.totalExtraHoursAmount || 0,
                                                bonus: parseFloat(row.bonusRaw) || 0,
                                                total: row.salary || 0
                                            }
                                        }),
                                        totalPayroll: totalSalaries,
                                        timestamp: new Date().toLocaleString()
                                    }}
                                />
                            }
                            fileName={`Informe_Contabilidad_${selectedMonth}.pdf`}
                            className="flex items-center justify-center gap-2 flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all border border-zinc-700/50 group/accountant"
                        >
                            {({ loading }) => (
                                <>
                                    <ShieldCheck className={`w-3.5 h-3.5 ${loading ? 'animate-pulse' : 'text-amber-500'}`} />
                                    {loading ? '...' : <span className="hidden xs:inline">Informe Contabilidad</span>}
                                    {loading ? '' : <span className="xs:hidden">Report</span>}
                                </>
                            )}
                        </PDFDownloadLink>
                    )}

                    <button
                        onClick={handleCalculate}
                        disabled={!allFilled || loading}
                        className="flex-[2] py-3 md:py-5 bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] md:text-xs uppercase tracking-[0.2em] rounded-xl md:rounded-[1.5rem] disabled:opacity-20 active:scale-[0.98] transition-all shadow-xl"
                    >
                        Ejecutar Liquidación
                    </button>
                </div>
                <p className="text-[8px] md:text-[10px] font-bold text-zinc-500 text-center uppercase tracking-widest leading-relaxed">
                    Las horas extra no impactan el cálculo económico.
                </p>
            </div>
        </div>
    )

    if (inline) return innerContent

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4">
            {innerContent}
        </div>
    )
}
