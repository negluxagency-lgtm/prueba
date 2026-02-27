'use client'

import { useState, useEffect } from 'react'
import { X, Calculator, Info, Calendar } from 'lucide-react'
import { useBarberStats } from '@/hooks/useBarberStats'
import { supabase } from '@/lib/supabase'
import { BarberOvertimeInline } from './BarberOvertimeInline'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { SalaryReportPDF } from './SalaryReportPDF'
import { AccountantReportPDF } from './AccountantReportPDF'
import { FileText, Download, ShieldCheck } from 'lucide-react'

interface SalaryRow {
    commission: string
    baseSalaryRaw: string
    bonusRaw: string
    salary: number | null
}

interface SalaryCalculatorModalProps {
    onClose: () => void
}

export default function SalaryCalculatorModal({ onClose }: SalaryCalculatorModalProps) {
    const now = new Date()
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const [selectedMonth, setSelectedMonth] = useState(defaultMonth)
    const { stats, loading, refresh } = useBarberStats(selectedMonth) as any

    const [rows, setRows] = useState<Record<string, SalaryRow>>({})
    const [calculated, setCalculated] = useState(false)
    const [shopId, setShopId] = useState<string | null>(null)
    const [shopName, setShopName] = useState('Mi Barbería')

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
                    baseSalaryRaw: b.salario_base?.toString() || '0',
                    bonusRaw: '0',
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
            baseSalaryRaw: s?.baseSalaryRaw ?? '0',
            bonusRaw: s?.bonusRaw ?? '0',
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
            const extra = barber.totalExtraHoursAmount || 0

            const salary = parseFloat((base + commissionAmount + extra + bonus).toFixed(2))
            updated[barber.nombre] = { ...row, salary }
        }
        setRows(updated)
        setCalculated(true)
    }

    const totalSalaries = Object.values(rows).reduce((sum, r) => sum + (r.salary ?? 0), 0)
    const allFilled = stats.length > 0 && stats.every((b: any) => getRow(b.nombre).commission !== '')

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4">
            <div className="bg-zinc-900 border-t md:border border-zinc-800 rounded-t-[2.5rem] md:rounded-3xl w-full max-w-2xl shadow-2xl h-[94dvh] md:h-auto md:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 md:zoom-in duration-300">

                {/* Header */}
                <div className="flex items-center justify-between p-5 md:p-6 shrink-0 border-b border-zinc-800/50">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-amber-500/10 flex items-center justify-center">
                            <Calculator className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="font-black text-white text-base md:text-lg tracking-tight uppercase italic">Liquidación Mensual</h2>
                            <p className="text-zinc-500 text-[10px] md:text-xs font-medium">Control total de nóminas y horas extra</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-colors">
                        <X className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                </div>

                {/* Month Selector */}
                <div className="px-5 md:px-6 py-3 md:py-4 bg-zinc-900 shrink-0 border-b border-zinc-800/30">
                    <div className="flex items-center justify-between bg-zinc-800/50 p-2.5 md:p-3 rounded-xl md:rounded-2xl border border-zinc-700/30">
                        <div className="flex items-center gap-2 md:gap-3">
                            <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-zinc-500" />
                            <span className="text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Período Seleccionado</span>
                        </div>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(e.target.value)}
                            className="bg-transparent border-none text-white text-xs md:text-sm font-bold outline-none cursor-pointer focus:ring-0 text-right pr-0"
                        />
                    </div>
                </div>

                {/* Barber List */}
                <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4 md:space-y-6">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="h-40 rounded-[1.5rem] md:rounded-[2rem] bg-zinc-800 animate-pulse" />
                            ))}
                        </div>
                    ) : stats.length === 0 ? (
                        <div className="text-center py-20 flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center"><Calendar className="w-8 h-8 text-zinc-700" /></div>
                            <p className="text-zinc-600 text-sm font-medium">No hay actividad para este período.</p>
                        </div>
                    ) : (
                        (stats as any[]).map(barber => {
                            const row = getRow(barber.nombre)
                            const extraAmount = barber.totalExtraHoursAmount || 0

                            return (
                                <div key={barber.nombre} className="bg-zinc-800/30 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 border border-zinc-800 relative overflow-hidden group hover:border-zinc-700/50 transition-all">
                                    <div className="flex items-start justify-between mb-4 md:mb-6">
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center border border-white/5 shadow-xl">
                                                <span className="text-base md:text-lg font-black text-amber-500">
                                                    {barber.nombre.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">{barber.nombre}</h3>
                                                <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-0.5 md:mt-1">
                                                    <span className="text-[8px] md:text-[9px] font-black text-zinc-500 bg-zinc-900 px-1.5 md:px-2 py-0.5 rounded border border-zinc-800 uppercase tracking-widest">Fact: {barber.totalRevenue.toFixed(0)}€</span>
                                                    <span className="text-[8px] md:text-[9px] font-black text-zinc-500 bg-zinc-900 px-1.5 md:px-2 py-0.5 rounded border border-zinc-800 uppercase tracking-widest">{barber.totalCuts} Serv.</span>
                                                </div>
                                            </div>
                                        </div>

                                        {extraAmount > 0 && (
                                            <div className="bg-amber-500/10 border border-amber-500/20 px-2 md:px-3 py-1 rounded-full flex items-center gap-1 md:gap-1.5 anim-pulse shrink-0">
                                                <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-amber-500" />
                                                <span className="text-[8px] md:text-[10px] font-black text-amber-500 uppercase tracking-widest">+{extraAmount.toFixed(1)}€</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Financial Inputs */}
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-2">
                                        <div className="space-y-1.5 md:space-y-2">
                                            <label className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Sueldo Base</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={row.baseSalaryRaw || '0'}
                                                    onChange={e => updateRow(barber.nombre, 'baseSalaryRaw', e.target.value)}
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-white text-xs md:text-sm font-bold outline-none focus:border-amber-500/50 transition-all font-mono"
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
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-white text-xs md:text-sm font-bold outline-none focus:border-amber-500/50 transition-all font-mono"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] md:text-xs font-bold">%</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5 md:space-y-2 col-span-2 md:col-span-1">
                                            <label className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Bonus / Incentivo</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={row.bonusRaw || '0'}
                                                    onChange={e => updateRow(barber.nombre, 'bonusRaw', e.target.value)}
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-white text-xs md:text-sm font-bold outline-none focus:border-amber-500/50 transition-all font-mono"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] md:text-xs font-bold">€</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Inline Overtime Section */}
                                    {shopId && (
                                        <BarberOvertimeInline
                                            barberId={barber.id}
                                            barberiaId={shopId}
                                            month={selectedMonth}
                                            onChanged={() => refresh && refresh()}
                                        />
                                    )}

                                    {/* Row Summary */}
                                    {calculated && row.salary !== null && (
                                        <div className="mt-5 md:mt-6 pt-4 md:pt-5 border-t-2 border-dashed border-zinc-800 flex items-center justify-between bg-zinc-800/20 -mx-4 md:-mx-6 px-4 md:px-6 pb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white flex items-center justify-center shrink-0"><Info className="w-3.5 h-3.5 md:w-4 md:h-4 text-black" /></div>
                                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 leading-tight">Sueldo Bruto</span>
                                            </div>
                                            <span className="text-xl md:text-2xl font-black text-white tabular-nums tracking-tighter">
                                                {row.salary.toFixed(2)}€
                                            </span>
                                        </div>
                                    )}

                                    {/* PDF Download Link */}
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
                                                        <span>{loading ? 'Generando PDF...' : 'Descargar Recibo PDF'}</span>
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
                <div className="p-4 md:p-6 border-t border-zinc-800 bg-zinc-900/80 shrink-0 space-y-3 md:space-y-4">
                    {calculated && totalSalaries > 0 && (
                        <div className="flex items-center justify-between bg-white px-5 md:px-6 py-4 md:py-5 rounded-2xl md:rounded-[2rem] shadow-2xl relative overflow-hidden group">
                            <div className="relative z-10">
                                <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-0.5 md:mb-1">Gasto en Nóminas</p>
                                <p className="text-2xl md:text-3xl font-black text-black tabular-nums tracking-tighter">{totalSalaries.toFixed(2)}€</p>
                            </div>
                            <div className="absolute right-0 top-0 bottom-0 w-24 md:w-32 bg-amber-500 translate-x-8 -skew-x-12 opacity-10" />
                            <Calculator className="w-8 h-8 md:w-10 md:h-10 text-black/10 relative z-10" />
                        </div>
                    )}

                    {/* Accountant Report Download */}
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
                                                extraHours: b.totalExtraHoursAmount || 0,
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
                            className="flex items-center justify-center gap-3 w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-zinc-700/50 group/accountant"
                        >
                            {({ loading }) => (
                                <>
                                    <ShieldCheck className={`w-4 h-4 ${loading ? 'animate-pulse' : 'text-amber-500 group-hover/accountant:scale-110'}`} />
                                    {loading ? 'Preparando Informe...' : 'Descargar Informe para Contabilidad'}
                                </>
                            )}
                        </PDFDownloadLink>
                    )}

                    <button
                        onClick={handleCalculate}
                        disabled={!allFilled || loading}
                        className="w-full py-4 md:py-5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs md:text-sm uppercase tracking-[0.2em] md:tracking-[0.3em] rounded-xl md:rounded-[1.5rem] disabled:opacity-20 active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(245,158,11,0.3)]"
                    >
                        Ejecutar Liquidación
                    </button>
                </div>
            </div>
        </div>
    )
}
