'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { X, Download, Plus, Clock, Loader2, Calendar as CalendarIcon, User, AlertTriangle, MapPin, Zap, TrendingUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { getMonthlyLogs, auditPunch, TipoFichaje, FichajeLog } from '@/app/actions/attendance'
import { getBarberOvertimeFromSchedule, type BarberOvertimeResult } from '@/app/actions/overtime'
import { getBarberAbsences } from '@/app/actions/staff'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface AttendanceReportModalProps {
    onClose: () => void
    month: string // format: YYYY-MM
    inline?: boolean
}

const TIPO_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    entrada: { label: 'Entrada', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' },
    salida: { label: 'Salida', color: 'bg-red-500/10 text-red-400 border-red-500/20', dot: 'bg-red-500' },
    pausa_inicio: { label: 'Inicio Pausa', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-500' },
    pausa_fin: { label: 'Fin Pausa', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20', dot: 'bg-sky-500' },
}

export default function AttendanceReportModal({ onClose, month, inline }: AttendanceReportModalProps) {
    const [barbers, setBarbers] = useState<any[]>([])
    const [selectedBarber, setSelectedBarber] = useState<any | null>(null)
    const [attendanceDate, setAttendanceDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [logs, setLogs] = useState<FichajeLog[]>([])
    const [loading, setLoading] = useState(true)
    const [adminId, setAdminId] = useState<string>('')
    const [shopName, setShopName] = useState<string>('')
    const [shopCif, setShopCif] = useState<string>('')
    const [autoOvertime, setAutoOvertime] = useState<BarberOvertimeResult | null>(null)
    const [loadingOvertime, setLoadingOvertime] = useState(false)
    const [activeView, setActiveView] = useState<'day' | 'month' | 'overtime' | 'absences'>('month')
    const [barberAbsences, setBarberAbsences] = useState<string[]>([])
    const [showAllDays, setShowAllDays] = useState(false)

    // Audit State
    const [isAuditing, setIsAuditing] = useState(false)
    const [auditForm, setAuditForm] = useState({
        tipo: 'entrada' as TipoFichaje,
        fechaHora: '',
        motivo: ''
    })
    const [submittingAudit, setSubmittingAudit] = useState(false)

    useEffect(() => {
        fetchInitialData()
    }, [])

    useEffect(() => {
        if (selectedBarber?.id && attendanceDate) {
            const targetMonth = attendanceDate.substring(0, 7)
            fetchLogs(selectedBarber.id, targetMonth)
            fetchAutoOvertime(selectedBarber.id, targetMonth)
            fetchAbsences(selectedBarber.id)
        }
    }, [selectedBarber?.id, attendanceDate.substring(0, 7)])

    useEffect(() => {
        if (month) {
            const currentMonth = attendanceDate.substring(0, 7)
            if (month !== currentMonth) {
                const today = format(new Date(), 'yyyy-MM')
                setAttendanceDate(month === today ? format(new Date(), 'yyyy-MM-dd') : `${month}-01`)
            }
        }
    }, [month])

    const dayLogs = useMemo(() => {
        if (!logs.length) return []
        return logs
            .filter(l => {
                try { return format(parseISO(l.timestamp_servidor), 'yyyy-MM-dd') === attendanceDate }
                catch (e) { return false }
            })
            .sort((a, b) => new Date(a.timestamp_servidor).getTime() - new Date(b.timestamp_servidor).getTime())
    }, [logs, attendanceDate])

    const fetchInitialData = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setAdminId(user.id)
            const { data: profile } = await supabase
                .from('perfiles')
                .select('nombre_barberia, "CIF/NIF"')
                .eq('id', user.id)
                .single()
            if (profile) {
                setShopName(profile.nombre_barberia || 'Barbería')
                setShopCif(profile['CIF/NIF'] || '')
            }
            const { data: bData } = await supabase
                .from('barberos')
                .select('id, nombre')
                .eq('barberia_id', user.id)
            if (bData) {
                setBarbers(bData)
                if (bData.length > 0) setSelectedBarber(bData[0])
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const fetchLogs = async (bId: number, targetMonth: string) => {
        setLoading(true)
        try {
            const [year, m] = targetMonth.split('-')
            const data = await getMonthlyLogs(bId, parseInt(year), parseInt(m))
            setLogs(data as FichajeLog[])
        } catch {
            toast.error('Error al cargar los fichajes')
            setLogs([])
        } finally {
            setLoading(false)
        }
    }

    const fetchAutoOvertime = async (bId: number, targetMonth: string) => {
        setLoadingOvertime(true)
        try {
            const result = await getBarberOvertimeFromSchedule(bId, targetMonth)
            setAutoOvertime(result)
        } catch (e) {
            console.error(e)
        } finally {
            setLoadingOvertime(false)
        }
    }

    const fetchAbsences = async (bId: number) => {
        try {
            const data = await getBarberAbsences(String(bId))
            setBarberAbsences(data)
        } catch (e) {
            console.error(e)
        }
    }

    // ── Daily Summaries ──────────────────────────────────────────────────────
    const processDailySummaries = () => {
        const daysTracker: Record<string, { totalSeconds: number; firstIn: string; lastOut: string; events: FichajeLog[] }> = {}
        logs.forEach(log => {
            try {
                const dateStr = format(parseISO(log.timestamp_servidor), 'yyyy-MM-dd')
                if (!daysTracker[dateStr]) daysTracker[dateStr] = { totalSeconds: 0, firstIn: '', lastOut: '', events: [] }
                daysTracker[dateStr].events.push(log)
            } catch (e) { }
        })
        Object.keys(daysTracker).forEach(date => {
            let daySecs = 0
            let lastIn: Date | null = null
            const dayLogs = daysTracker[date].events.sort((a, b) => new Date(a.timestamp_servidor).getTime() - new Date(b.timestamp_servidor).getTime())
            const entradas = dayLogs.filter(l => l.tipo === 'entrada')
            const salidas = dayLogs.filter(l => l.tipo === 'salida').reverse()
            if (entradas.length) daysTracker[date].firstIn = format(new Date(entradas[0].timestamp_servidor), 'HH:mm')
            if (salidas.length) daysTracker[date].lastOut = format(new Date(salidas[0].timestamp_servidor), 'HH:mm')
            dayLogs.forEach(log => {
                const logTime = new Date(log.timestamp_servidor)
                if (log.tipo === 'entrada' || log.tipo === 'pausa_fin') { lastIn = logTime }
                else if (log.tipo === 'salida' || log.tipo === 'pausa_inicio') {
                    if (lastIn) { daySecs += (logTime.getTime() - lastIn.getTime()) / 1000; lastIn = null }
                }
            })
            daysTracker[date].totalSeconds = Math.max(0, Math.floor(daySecs))
        })
        return Object.entries(daysTracker).sort((a, b) => b[0].localeCompare(a[0]))
    }

    const formatHours = (secs: number) => {
        const h = Math.floor(secs / 3600)
        const m = Math.floor((secs % 3600) / 60)
        return `${h}h ${m}m`
    }

    const dailySummaries = processDailySummaries()
    const totalMonthSecs = dailySummaries.reduce((acc, [, d]) => acc + d.totalSeconds, 0)

    const handleAuditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!auditForm.fechaHora || !auditForm.motivo) { toast.error('Completa todos los campos.'); return }
        setSubmittingAudit(true)
        try {
            const localDate = new Date(auditForm.fechaHora).toISOString()
            const res = await auditPunch(selectedBarber.id, auditForm.tipo, localDate, adminId, auditForm.motivo)
            if (res.success) {
                toast.success('Corrección auditada añadida.')
                setIsAuditing(false)
                setAuditForm({ tipo: 'entrada', fechaHora: '', motivo: '' })
                fetchLogs(selectedBarber.id, attendanceDate.substring(0, 7))
            } else {
                toast.error(res.error || 'Error al auditar')
            }
        } catch { toast.error('Error de conexión.') }
        finally { setSubmittingAudit(false) }
    }

    const generatePDF = () => {
        if (!selectedBarber || logs.length === 0) { toast.error('No hay datos para generar el PDF.'); return }
        const doc = new jsPDF()
        const [year, parsedMonth] = month.split('-')
        const monthName = format(new Date(parseInt(year), parseInt(parsedMonth) - 1, 1), 'MMMM yyyy', { locale: es }).toUpperCase()
        doc.setFontSize(14); doc.setFont('helvetica', 'bold')
        doc.text('REGISTRO DE JORNADA LABORAL', 105, 15, { align: 'center' })
        doc.setFontSize(10); doc.setFont('helvetica', 'normal')
        doc.text(`Empresa: ${shopName}`, 14, 25)
        doc.text(`CIF/NIF: ${shopCif}`, 14, 30)
        doc.text(`Trabajador/a: ${selectedBarber.nombre}`, 120, 25)
        doc.text(`Mes/Año: ${monthName}`, 120, 30)
        let totalMonthSecs = 0
        const tableData = [...dailySummaries].reverse().map(([date, d]) => {
            totalMonthSecs += d.totalSeconds
            return [format(parseISO(date), 'dd/MM/yyyy'), d.firstIn || '--:--', d.lastOut || '--:--', formatHours(d.totalSeconds)]
        })
        const audits = logs.filter(l => l.editado_por != null)
        autoTable(doc, {
            startY: 40,
            head: [['Fecha', 'Primera Entrada', 'Última Salida', 'Total Diario']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255] },
            styles: { fontSize: 9, halign: 'center' },
            foot: [['', '', 'TOTAL MENSUAL:', formatHours(totalMonthSecs)]],
            footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
        })
        let finalY = (doc as any).lastAutoTable?.finalY || 40
        if (audits.length > 0) {
            doc.setFontSize(9)
            doc.text('Notas de Auditoría:', 14, finalY + 10)
            autoTable(doc, {
                startY: finalY + 15,
                head: [['Fecha Corregida', 'Acción', 'Motivo']],
                body: audits.map(a => [format(new Date(a.timestamp_servidor), 'dd/MM HH:mm'), a.tipo.toUpperCase(), a.motivo_edicion || 'Sin motivo']),
                theme: 'plain', styles: { fontSize: 8, textColor: [80, 80, 80] }
            })
            finalY = (doc as any).lastAutoTable?.finalY + 10
        } else { finalY += 20 }
        doc.setFontSize(9)
        doc.text('Firma de la Empresa:', 30, finalY + 15)
        doc.text('Firma del Trabajador/a:', 130, finalY + 15)
        doc.line(20, finalY + 35, 80, finalY + 35)
        doc.line(120, finalY + 35, 180, finalY + 35)
        doc.setFontSize(7); doc.setTextColor(136, 136, 136)
        doc.text('Documento oficial de control horario según artículo 34.9 del Estatuto de los Trabajadores.', 105, 285, { align: 'center' })
        doc.save(`Fichaje_${selectedBarber.nombre.replace(/\s+/g, '_')}_${month}.pdf`)
    }

    if (inline) {
        return (
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row h-full">
                {/* ── SIDEBAR ──────────────────────────────────────── */}
                <div className="w-full md:w-52 shrink-0 border-b md:border-b-0 md:border-r border-zinc-800/50 p-3 md:p-4 flex flex-col gap-2 md:gap-3">
                    <p className="text-[8px] md:text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Trabajadores</p>
                    <div className="flex md:flex-col gap-1.5 md:gap-2 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0 scrollbar-hide">
                        {barbers.map(b => (
                            <button
                                key={b.id}
                                onClick={() => setSelectedBarber(b)}
                                className={cn(
                                    'flex items-center gap-2 px-3 py-2 md:px-3 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all shrink-0 md:w-full',
                                    selectedBarber?.id === b.id
                                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                )}
                            >
                                <div className={cn('w-5 h-5 md:w-6 md:h-6 rounded-md md:rounded-lg flex items-center justify-center text-[8px] md:text-[9px] font-black shrink-0',
                                    selectedBarber?.id === b.id ? 'bg-black/20' : 'bg-zinc-700'
                                )}>
                                    {b.nombre.charAt(0).toUpperCase()}
                                </div>
                                <span className="truncate max-w-[80px] md:max-w-none">{b.nombre}</span>
                            </button>
                        ))}
                    </div>
                    <div className="hidden md:block flex-1" />
                    <div className="flex md:flex-col gap-2">
                        <button
                            onClick={() => setIsAuditing(!isAuditing)}
                            className={cn(
                                'flex-1 md:w-full flex items-center justify-center md:justify-start gap-2 px-3 py-2 md:py-2.5 rounded-lg md:rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all border',
                                isAuditing ? 'bg-zinc-800 border-zinc-700 text-white' : 'border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700'
                            )}
                        >
                            <AlertTriangle className="w-3 md:w-3.5 h-3 md:h-3.5 text-amber-500" /> <span className="hidden xs:inline">Auditar</span><span className="xs:hidden">Audit</span>
                        </button>
                        <button
                            onClick={generatePDF}
                            disabled={!selectedBarber || logs.length === 0}
                            className="flex-1 md:w-full flex items-center justify-center gap-2 px-3 py-2 md:py-2.5 bg-white text-black rounded-lg md:rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest disabled:opacity-40"
                        >
                            <Download className="w-3 md:w-3.5 h-3 md:h-3.5" /> <span className="hidden xs:inline">Exportar PDF</span><span className="xs:hidden">PDF</span>
                        </button>
                    </div>
                </div>
                {/* Content area */}
                <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-5">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center text-zinc-500 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                            <span className="text-[11px] font-black uppercase tracking-widest">Cargando registros...</span>
                        </div>
                    ) : isAuditing ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-white italic uppercase">Auditoría de Fichaje</h3>
                                    <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Inserta un fichaje omitido o erróneo. Se registrará tu autoría.</p>
                                </div>
                            </div>
                            <form onSubmit={handleAuditSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Tipo de Acción</label>
                                        <select value={auditForm.tipo} onChange={(e) => setAuditForm({ ...auditForm, tipo: e.target.value as TipoFichaje })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500">
                                            <option value="entrada">Entrada</option>
                                            <option value="salida">Salida</option>
                                            <option value="pausa_inicio">Inicio Pausa</option>
                                            <option value="pausa_fin">Fin Pausa</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Fecha y Hora Real</label>
                                        <input type="datetime-local" required value={auditForm.fechaHora} onChange={(e) => setAuditForm({ ...auditForm, fechaHora: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500" style={{ colorScheme: 'dark' }} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Motivo Justificado</label>
                                    <textarea required placeholder="Ej: Olvido del empleado al finalizar el turno." value={auditForm.motivo} onChange={(e) => setAuditForm({ ...auditForm, motivo: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500 resize-none h-24" />
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <button type="button" onClick={() => setIsAuditing(false)} className="flex-1 py-3 border border-zinc-800 rounded-xl font-bold text-xs uppercase text-zinc-400 hover:text-white">Cancelar</button>
                                    <button type="submit" disabled={submittingAudit} className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2 transition-colors">
                                        {submittingAudit ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Corrección'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Días Trabajados</p>
                                    <p className="text-lg font-black text-white">{dailySummaries.length}</p>
                                </div>
                                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Horas Totales</p>
                                    <p className="text-lg font-black text-white">{formatHours(totalMonthSecs)}</p>
                                </div>
                                <div className={cn("border rounded-2xl p-4 text-center", autoOvertime?.totalHoras ? "bg-amber-500/10 border-amber-500/20" : "bg-zinc-900 border-zinc-800")}>
                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Horas Extra</p>
                                    {loadingOvertime ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-amber-500" /> : <p className={cn("text-lg font-black", autoOvertime?.totalHoras ? "text-amber-500" : "text-white")}>{autoOvertime?.totalHoras ? `${autoOvertime.totalHoras.toFixed(1)}h` : '—'}</p>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5">
                                {[{ key: 'month', label: 'Resumen Mensual', icon: CalendarIcon }, { key: 'day', label: 'Detalle del Día', icon: Clock }, { key: 'overtime', label: 'Horas Extra', icon: Zap }, { key: 'absences', label: 'Ausencias', icon: AlertTriangle }].map(({ key, label, icon: Icon }) => (
                                    <button key={key} onClick={() => setActiveView(key as any)} className={cn('flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all', activeView === key ? 'bg-white text-black shadow' : 'text-zinc-500 hover:text-white')}>
                                        <Icon className="w-3.5 h-3.5" /><span className="hidden sm:inline">{label}</span>
                                    </button>
                                ))}
                            </div>
                            {activeView === 'month' && (
                                <div className="space-y-2">
                                    {dailySummaries.length === 0 ? (
                                        <div className="text-center py-12 text-zinc-600 bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-800"><Clock className="w-8 h-8 mx-auto mb-3 opacity-50" /><p className="text-xs font-bold uppercase tracking-widest">Sin registros este mes</p></div>
                                    ) : (() => {
                                        const toShow = showAllDays ? dailySummaries : dailySummaries.slice(0, 3)
                                        return (
                                            <>
                                                {toShow.map(([date, d]) => {
                                                    const dayOt = autoOvertime?.dias.find(od => od.fecha === date)
                                                    return (
                                                        <div key={date} onClick={() => { setAttendanceDate(date); setActiveView('day') }} className="group flex items-center justify-between bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 cursor-pointer transition-all">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-xl bg-zinc-800 group-hover:bg-zinc-700 flex flex-col items-center justify-center transition-colors shrink-0">
                                                                    <span className="text-[9px] font-black text-zinc-500 uppercase">{format(parseISO(date), 'EEE', { locale: es })}</span>
                                                                    <span className="text-lg font-black text-white leading-none">{format(parseISO(date), 'dd')}</span>
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-[9px] font-black text-emerald-500 uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded-md">{d.firstIn || '--:--'}</span>
                                                                        <span className="text-zinc-700 text-xs">→</span>
                                                                        <span className="text-[9px] font-black text-red-500 uppercase bg-red-500/10 px-1.5 py-0.5 rounded-md">{d.lastOut || '--:--'}</span>
                                                                    </div>
                                                                    <p className="text-[9px] text-zinc-500 font-medium">{d.events.length} movimientos</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                {dayOt && dayOt.minutos_extra > 0 && <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">+{(dayOt.minutos_extra / 60).toFixed(1)}h extra</span>}
                                                                <div className="text-right"><p className="text-sm font-black text-white tabular-nums">{formatHours(d.totalSeconds)}</p><p className="text-[9px] text-zinc-600 font-medium">efectivas</p></div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                                {dailySummaries.length > 3 && (
                                                    <button
                                                        onClick={() => setShowAllDays(v => !v)}
                                                        className="w-full flex items-center justify-center gap-2 py-3 text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all border border-dashed border-zinc-800 hover:border-zinc-600 rounded-2xl"
                                                    >
                                                        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showAllDays && 'rotate-180')} />
                                                        {showAllDays ? 'Ocultar' : `Mostrar todos (${dailySummaries.length} días)`}
                                                    </button>
                                                )}
                                            </>
                                        )
                                    })()}
                                </div>
                            )}
                            {activeView === 'day' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-base font-black text-white italic uppercase">Movimientos del Día</h3>
                                        <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500" style={{ colorScheme: 'dark' }} />
                                    </div>
                                    {dayLogs.length === 0 ? (
                                        <div className="text-center py-12 text-zinc-600 bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-800"><Clock className="w-8 h-8 mx-auto mb-3 opacity-50" /><p className="text-xs font-bold uppercase tracking-widest">Sin movimientos este día</p></div>
                                    ) : (
                                        <div className="space-y-2">
                                            {dayLogs.map((log: FichajeLog) => {
                                                const cfg = TIPO_CONFIG[log.tipo] || TIPO_CONFIG.entrada
                                                return (
                                                    <div key={log.id} className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                                                        <div className="flex flex-col items-center gap-1 shrink-0"><div className={cn('w-2.5 h-2.5 rounded-full', cfg.dot)} /></div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1"><span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border', cfg.color)}>{cfg.label}</span>{log.editado_por && <span className="text-[8px] font-black text-zinc-600 uppercase bg-zinc-800 px-1.5 py-0.5 rounded">auditado</span>}</div>
                                                            {log.motivo_edicion && <p className="text-[9px] text-zinc-500 italic mt-1">{log.motivo_edicion}</p>}
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            {log.geolocalizacion && <a href={`https://www.google.com/maps?q=${log.geolocalizacion.replace('(', '').replace(')', '').split(',')[1]?.trim()},${log.geolocalizacion.replace('(', '').replace(')', '').split(',')[0]?.trim()}`} target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:text-amber-400"><MapPin className="w-4 h-4" /></a>}
                                                            <span className="text-lg font-black text-white tabular-nums">{format(new Date(log.timestamp_servidor), 'HH:mm')}</span>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                            {activeView === 'overtime' && (
                                <div className="space-y-4">
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                                        <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"><Zap className="w-5 h-5 text-amber-500" /></div><div><h3 className="text-sm font-black text-white uppercase italic">Horas Extra Automáticas</h3><p className="text-[9px] text-zinc-500 font-medium mt-0.5">Calculadas desde fichajes vs horario configurado · Mínimo 30 min de exceso</p></div></div>
                                        {loadingOvertime ? (
                                            <div className="flex items-center justify-center py-8 gap-3"><Loader2 className="w-5 h-5 animate-spin text-amber-500" /><span className="text-xs text-zinc-500 font-medium">Calculando...</span></div>
                                        ) : !autoOvertime || autoOvertime.dias.length === 0 ? (
                                            <div className="text-center py-8"><TrendingUp className="w-8 h-8 mx-auto mb-3 text-zinc-700" /><p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Sin horas extra detectadas</p><p className="text-[10px] text-zinc-600 mt-1">El horario del trabajador debe estar configurado</p></div>
                                        ) : (
                                            <>
                                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4 flex items-center justify-between"><span className="text-xs font-black text-amber-500 uppercase tracking-widest">Total horas extra del mes</span><span className="text-2xl font-black text-amber-500">{(autoOvertime.totalMinutos / 60).toFixed(2)}h</span></div>
                                                <div className="space-y-2">
                                                    {autoOvertime.dias.map(dia => (
                                                        <div key={dia.fecha} className="flex items-center justify-between bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-3.5">
                                                            <div><p className="text-sm font-black text-white">{format(new Date(dia.fecha + 'T12:00:00'), "EEE d 'de' MMMM", { locale: es })}</p><p className="text-[9px] text-zinc-500 mt-0.5">Realizadas: <span className="text-white font-bold">{Math.round(dia.minutos_reales)} min</span> · Esperadas: <span className="text-zinc-400">{Math.round(dia.minutos_esperados)} min</span></p></div>
                                                            <span className="text-base font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">+{(dia.minutos_extra / 60).toFixed(2)}h</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeView === 'absences' && (
                                <div className="space-y-4">
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-white uppercase italic">Historial de Ausencias</h3>
                                                <p className="text-[9px] text-zinc-500 font-medium mt-0.5">Días marcados como no laborables por {selectedBarber?.nombre}</p>
                                            </div>
                                        </div>
                                        {barberAbsences.length === 0 ? (
                                            <div className="text-center py-8">
                                                <Clock className="w-8 h-8 mx-auto mb-3 text-zinc-700 opacity-50" />
                                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Sin ausencias registradas</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {[...barberAbsences].sort((a,b) => b.localeCompare(a)).map(date => (
                                                    <div key={date} className="flex items-center justify-between bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex flex-col items-center justify-center">
                                                                <span className="text-[7px] font-black text-red-500 uppercase">{format(parseISO(date), 'EEE', { locale: es })}</span>
                                                                <span className="text-sm font-black text-white leading-none">{format(parseISO(date), 'dd')}</span>
                                                            </div>
                                                            <p className="text-sm font-black text-white capitalize">{format(parseISO(date), "MMMM yyyy", { locale: es })}</p>
                                                        </div>
                                                        <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-500 font-black uppercase tracking-widest">Ausente</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0a0a0a] border border-zinc-800 rounded-[2rem] w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">

                {/* ── HEADER ───────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800/50 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black italic uppercase tracking-tighter text-white leading-tight">Control de Presencia</h2>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                                {format(parseISO(`${attendanceDate.substring(0, 7)}-01`), 'MMMM yyyy', { locale: es })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={generatePDF}
                            disabled={!selectedBarber || logs.length === 0}
                            className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-40"
                        >
                            <Download className="w-4 h-4" /> Exportar PDF
                        </button>
                        <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors rounded-full hover:bg-zinc-800">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* ── SIDEBAR ──────────────────────────────────────── */}
                    <div className="w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-zinc-800/50 p-4 flex flex-col gap-3">
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Trabajadores</p>
                        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
                            {barbers.map(b => (
                                <button
                                    key={b.id}
                                    onClick={() => setSelectedBarber(b)}
                                    className={cn(
                                        'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 md:w-full',
                                        selectedBarber?.id === b.id
                                            ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                                            : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                    )}
                                >
                                    <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black shrink-0',
                                        selectedBarber?.id === b.id ? 'bg-black/20' : 'bg-zinc-700'
                                    )}>
                                        {b.nombre.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="truncate">{b.nombre}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex-1" />

                        <button
                            onClick={() => setIsAuditing(!isAuditing)}
                            className={cn(
                                'w-full flex items-center gap-2 px-3 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border',
                                isAuditing
                                    ? 'bg-zinc-800 border-zinc-700 text-white'
                                    : 'border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700'
                            )}
                        >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Auditar
                        </button>

                        <button
                            onClick={generatePDF}
                            disabled={!selectedBarber || logs.length === 0}
                            className="md:hidden w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-40"
                        >
                            <Download className="w-3.5 h-3.5" /> Exportar PDF
                        </button>
                    </div>

                    {/* ── MAIN CONTENT ─────────────────────────────────── */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

                        {loading ? (
                            <div className="h-64 flex flex-col items-center justify-center text-zinc-500 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                                <span className="text-[11px] font-black uppercase tracking-widest">Cargando registros...</span>
                            </div>
                        ) : isAuditing ? (
                            /* ── AUDIT FORM ──────────────────────────────── */
                            <div className="animate-in fade-in slide-in-from-bottom-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-white italic uppercase">Auditoría de Fichaje</h3>
                                        <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Inserta un fichaje omitido o erróneo. Se registrará tu autoría.</p>
                                    </div>
                                </div>
                                <form onSubmit={handleAuditSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Tipo de Acción</label>
                                            <select value={auditForm.tipo} onChange={(e) => setAuditForm({ ...auditForm, tipo: e.target.value as TipoFichaje })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500">
                                                <option value="entrada">Entrada</option>
                                                <option value="salida">Salida</option>
                                                <option value="pausa_inicio">Inicio Pausa</option>
                                                <option value="pausa_fin">Fin Pausa</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Fecha y Hora Real</label>
                                            <input type="datetime-local" required value={auditForm.fechaHora} onChange={(e) => setAuditForm({ ...auditForm, fechaHora: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500" style={{ colorScheme: 'dark' }} />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Motivo Justificado</label>
                                        <textarea required placeholder="Ej: Olvido del empleado al finalizar el turno." value={auditForm.motivo} onChange={(e) => setAuditForm({ ...auditForm, motivo: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500 resize-none h-24" />
                                    </div>
                                    <div className="flex items-center gap-3 pt-2">
                                        <button type="button" onClick={() => setIsAuditing(false)} className="flex-1 py-3 border border-zinc-800 rounded-xl font-bold text-xs uppercase text-zinc-400 hover:text-white">Cancelar</button>
                                        <button type="submit" disabled={submittingAudit} className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2 transition-colors">
                                            {submittingAudit ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Corrección'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <>
                                {/* ── STATS STRIP ──────────────────────── */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
                                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Días Trabajados</p>
                                        <p className="text-lg font-black text-white">{dailySummaries.length}</p>
                                    </div>
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
                                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Horas Totales</p>
                                        <p className="text-lg font-black text-white">{formatHours(totalMonthSecs)}</p>
                                    </div>
                                    <div className={cn("border rounded-2xl p-4 text-center", autoOvertime?.totalHoras ? "bg-amber-500/10 border-amber-500/20" : "bg-zinc-900 border-zinc-800")}>
                                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Horas Extra</p>
                                        {loadingOvertime
                                            ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-amber-500" />
                                            : <p className={cn("text-lg font-black", autoOvertime?.totalHoras ? "text-amber-500" : "text-white")}>
                                                {autoOvertime?.totalHoras ? `${autoOvertime.totalHoras.toFixed(1)}h` : '—'}
                                            </p>
                                        }
                                    </div>
                                </div>

                                {/* ── VIEW TABS ─────────────────────────── */}
                                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5">
                                    {[
                                        { key: 'month', label: 'Resumen Mensual', icon: CalendarIcon },
                                        { key: 'day', label: 'Detalle del Día', icon: Clock },
                                        { key: 'overtime', label: 'Horas Extra', icon: Zap },
                                        { key: 'absences', label: 'Ausencias', icon: AlertTriangle },
                                    ].map(({ key, label, icon: Icon }) => (
                                        <button
                                            key={key}
                                            onClick={() => setActiveView(key as any)}
                                            className={cn(
                                                'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all',
                                                activeView === key ? 'bg-white text-black shadow' : 'text-zinc-500 hover:text-white'
                                            )}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">{label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* ── MONTHLY SUMMARY VIEW ─────────────── */}
                                {activeView === 'month' && (
                                    <div className="space-y-2">
                                        {dailySummaries.length === 0 ? (
                                            <div className="text-center py-12 text-zinc-600 bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-800">
                                                <Clock className="w-8 h-8 mx-auto mb-3 opacity-50" />
                                                <p className="text-xs font-bold uppercase tracking-widest">Sin registros este mes</p>
                                            </div>
                                        ) : (() => {
                                            const toShow = showAllDays ? dailySummaries : dailySummaries.slice(0, 3)
                                            return (
                                                <>
                                                    {toShow.map(([date, d]) => {
                                                        const dayOt = autoOvertime?.dias.find(od => od.fecha === date)
                                                        return (
                                                            <div
                                                                key={date}
                                                                onClick={() => { setAttendanceDate(date); setActiveView('day') }}
                                                                className="group flex items-center justify-between bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 cursor-pointer transition-all"
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-12 h-12 rounded-xl bg-zinc-800 group-hover:bg-zinc-700 flex flex-col items-center justify-center transition-colors shrink-0">
                                                                        <span className="text-[9px] font-black text-zinc-500 uppercase">{format(parseISO(date), 'EEE', { locale: es })}</span>
                                                                        <span className="text-lg font-black text-white leading-none">{format(parseISO(date), 'dd')}</span>
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="text-[9px] font-black text-emerald-500 uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded-md">{d.firstIn || '--:--'}</span>
                                                                            <span className="text-zinc-700 text-xs">→</span>
                                                                            <span className="text-[9px] font-black text-red-500 uppercase bg-red-500/10 px-1.5 py-0.5 rounded-md">{d.lastOut || '--:--'}</span>
                                                                        </div>
                                                                        <p className="text-[9px] text-zinc-500 font-medium">{d.events.length} movimientos</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    {dayOt && dayOt.minutos_extra > 0 && (
                                                                        <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                                                                            +{(dayOt.minutos_extra / 60).toFixed(1)}h extra
                                                                        </span>
                                                                    )}
                                                                    <div className="text-right">
                                                                        <p className="text-sm font-black text-white tabular-nums">{formatHours(d.totalSeconds)}</p>
                                                                        <p className="text-[9px] text-zinc-600 font-medium">efectivas</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                    {dailySummaries.length > 3 && (
                                                        <button
                                                            onClick={() => setShowAllDays(v => !v)}
                                                            className="w-full flex items-center justify-center gap-2 py-3 text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all border border-dashed border-zinc-800 hover:border-zinc-600 rounded-2xl"
                                                        >
                                                            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showAllDays && 'rotate-180')} />
                                                            {showAllDays ? 'Ocultar' : `Mostrar todos (${dailySummaries.length} días)`}
                                                        </button>
                                                    )}
                                                </>
                                            )
                                        })()}
                                    </div>
                                )}

                                {/* ── DAY DETAIL VIEW ──────────────────── */}
                                {activeView === 'day' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-base font-black text-white italic uppercase">Movimientos del Día</h3>
                                            <input
                                                type="date"
                                                value={attendanceDate}
                                                onChange={(e) => setAttendanceDate(e.target.value)}
                                                className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                                                style={{ colorScheme: 'dark' }}
                                            />
                                        </div>
                                        {dayLogs.length === 0 ? (
                                            <div className="text-center py-12 text-zinc-600 bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-800">
                                                <Clock className="w-8 h-8 mx-auto mb-3 opacity-50" />
                                                <p className="text-xs font-bold uppercase tracking-widest">Sin movimientos este día</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {dayLogs.map((log: FichajeLog) => {
                                                    const cfg = TIPO_CONFIG[log.tipo] || TIPO_CONFIG.entrada
                                                    return (
                                                        <div key={log.id} className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                                                            <div className="flex flex-col items-center gap-1 shrink-0">
                                                                <div className={cn('w-2.5 h-2.5 rounded-full', cfg.dot)} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border', cfg.color)}>{cfg.label}</span>
                                                                    {log.editado_por && <span className="text-[8px] font-black text-zinc-600 uppercase bg-zinc-800 px-1.5 py-0.5 rounded">auditado</span>}
                                                                </div>
                                                                {log.motivo_edicion && <p className="text-[9px] text-zinc-500 italic mt-1">{log.motivo_edicion}</p>}
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                {log.geolocalizacion && (
                                                                    <a href={`https://www.google.com/maps?q=${log.geolocalizacion.replace('(', '').replace(')', '').split(',')[1]?.trim()},${log.geolocalizacion.replace('(', '').replace(')', '').split(',')[0]?.trim()}`} target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:text-amber-400">
                                                                        <MapPin className="w-4 h-4" />
                                                                    </a>
                                                                )}
                                                                <span className="text-lg font-black text-white tabular-nums">{format(new Date(log.timestamp_servidor), 'HH:mm')}</span>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── OVERTIME VIEW ────────────────────── */}
                                {activeView === 'overtime' && (
                                    <div className="space-y-4">
                                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                                    <Zap className="w-5 h-5 text-amber-500" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black text-white uppercase italic">Horas Extra Automáticas</h3>
                                                    <p className="text-[9px] text-zinc-500 font-medium mt-0.5">Calculadas desde fichajes vs horario configurado · Mínimo 30 min de exceso</p>
                                                </div>
                                            </div>
                                            {loadingOvertime ? (
                                                <div className="flex items-center justify-center py-8 gap-3">
                                                    <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                                                    <span className="text-xs text-zinc-500 font-medium">Calculando...</span>
                                                </div>
                                            ) : !autoOvertime || autoOvertime.dias.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <TrendingUp className="w-8 h-8 mx-auto mb-3 text-zinc-700" />
                                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Sin horas extra detectadas</p>
                                                    <p className="text-[10px] text-zinc-600 mt-1">El horario del trabajador debe estar configurado</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4 flex items-center justify-between">
                                                        <span className="text-xs font-black text-amber-500 uppercase tracking-widest">Total horas extra del mes</span>
                                                        <span className="text-2xl font-black text-amber-500">{(autoOvertime.totalMinutos / 60).toFixed(2)}h</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {autoOvertime.dias.map(dia => (
                                                            <div key={dia.fecha} className="flex items-center justify-between bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-3.5">
                                                                <div>
                                                                    <p className="text-sm font-black text-white">
                                                                        {format(new Date(dia.fecha + 'T12:00:00'), "EEE d 'de' MMMM", { locale: es })}
                                                                    </p>
                                                                    <p className="text-[9px] text-zinc-500 mt-0.5">
                                                                        Realizadas: <span className="text-white font-bold">{Math.round(dia.minutos_reales)} min</span>
                                                                        {' '}· Esperadas: <span className="text-zinc-400">{Math.round(dia.minutos_esperados)} min</span>
                                                                    </p>
                                                                </div>
                                                                <span className="text-base font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                                                                    +{(dia.minutos_extra / 60).toFixed(2)}h
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
