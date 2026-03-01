'use client'

import React, { useState, useEffect } from 'react'
import { X, Download, Plus, Clock, Loader2, Calendar as CalendarIcon, User, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { getMonthlyLogs, auditPunch, TipoFichaje, FichajeLog } from '@/app/actions/attendance'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface AttendanceReportModalProps {
    onClose: () => void
    month: string // format: YYYY-MM
}

export default function AttendanceReportModal({ onClose, month }: AttendanceReportModalProps) {
    const [barbers, setBarbers] = useState<any[]>([])
    const [selectedBarber, setSelectedBarber] = useState<any | null>(null)
    const [attendanceDate, setAttendanceDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [logs, setLogs] = useState<FichajeLog[]>([])
    const [loading, setLoading] = useState(true)
    const [adminId, setAdminId] = useState<string>('')
    const [shopName, setShopName] = useState<string>('')
    const [shopCif, setShopCif] = useState<string>('')

    // Audit State
    const [isAuditing, setIsAuditing] = useState(false)
    const [auditForm, setAuditForm] = useState({
        tipo: 'entrada' as TipoFichaje,
        fechaHora: '', // YYYY-MM-DDThh:mm
        motivo: ''
    })
    const [submittingAudit, setSubmittingAudit] = useState(false)

    useEffect(() => {
        fetchInitialData()
    }, [])

    useEffect(() => {
        if (selectedBarber && month) {
            fetchLogs(selectedBarber.id)
            // Sync attendanceDate with the month if current selection is outside
            if (!attendanceDate.startsWith(month)) {
                const today = format(new Date(), 'yyyy-MM')
                if (month === today) {
                    setAttendanceDate(format(new Date(), 'yyyy-MM-dd'))
                } else {
                    setAttendanceDate(`${month}-01`)
                }
            }
        } else {
            setLogs([])
        }
    }, [selectedBarber, month])

    const fetchInitialData = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setAdminId(user.id)

            // Get shop details for PDF
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

    const fetchLogs = async (bId: number) => {
        setLoading(true)
        try {
            const [year, m] = month.split('-')
            const data = await getMonthlyLogs(bId, parseInt(year), parseInt(m))
            setLogs(data as FichajeLog[])
        } catch (error) {
            toast.error("Error al cargar los fichajes")
        } finally {
            setLoading(false)
        }
    }

    // Process logs into daily summaries
    const processDailySummaries = () => {
        const daysTracker: Record<string, { totalSeconds: number, firstIn: string, lastOut: string, events: FichajeLog[] }> = {}

        logs.forEach(log => {
            const dateStr = log.timestamp_servidor.substring(0, 10) // YYYY-MM-DD
            if (!daysTracker[dateStr]) {
                daysTracker[dateStr] = { totalSeconds: 0, firstIn: '', lastOut: '', events: [] }
            }
            daysTracker[dateStr].events.push(log)
        })

        // Calc seconds per day
        Object.keys(daysTracker).forEach(date => {
            let daySecs = 0;
            let lastIn: Date | null = null;
            const dayLogs = daysTracker[date].events.sort((a, b) => new Date(a.timestamp_servidor).getTime() - new Date(b.timestamp_servidor).getTime());

            // Track bounding times for visual display
            const entradas = dayLogs.filter(l => l.tipo === 'entrada')
            const salidas = dayLogs.filter(l => l.tipo === 'salida').reverse()
            if (entradas.length) daysTracker[date].firstIn = format(new Date(entradas[0].timestamp_servidor), 'HH:mm')
            if (salidas.length) daysTracker[date].lastOut = format(new Date(salidas[0].timestamp_servidor), 'HH:mm')

            dayLogs.forEach(log => {
                const logTime = new Date(log.timestamp_servidor)
                if (log.tipo === 'entrada' || log.tipo === 'pausa_fin') {
                    lastIn = logTime
                } else if (log.tipo === 'salida' || log.tipo === 'pausa_inicio') {
                    if (lastIn) {
                        daySecs += (logTime.getTime() - lastIn.getTime()) / 1000
                        lastIn = null
                    }
                }
            })
            daysTracker[date].totalSeconds = Math.max(0, Math.floor(daySecs))
        })

        return Object.entries(daysTracker).sort((a, b) => a[0].localeCompare(b[0]))
    }

    const formatHours = (secs: number) => {
        const h = Math.floor(secs / 3600)
        const m = Math.floor((secs % 3600) / 60)
        return `${h}h ${m}m`
    }

    const handleAuditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!auditForm.fechaHora || !auditForm.motivo) {
            toast.error("Completa la fecha, hora y el motivo legal.")
            return
        }
        setSubmittingAudit(true)
        try {
            // Convierte YYYY-MM-DDThh:mm a ISO UTC o Local Date para DB
            const localDate = new Date(auditForm.fechaHora).toISOString()
            const res = await auditPunch(selectedBarber.id, auditForm.tipo, localDate, adminId, auditForm.motivo)
            if (res.success) {
                toast.success("Corrección auditada añadida.")
                setIsAuditing(false)
                setAuditForm({ tipo: 'entrada', fechaHora: '', motivo: '' })
                fetchLogs(selectedBarber.id)
            } else {
                toast.error(res.error || "Error al auditar")
            }
        } catch (err) {
            toast.error("Error de conexión.")
        } finally {
            setSubmittingAudit(false)
        }
    }

    const generatePDF = () => {
        if (!selectedBarber || logs.length === 0) {
            toast.error("No hay datos para generar el PDF.")
            return;
        }

        const doc = new jsPDF()
        const [year, parsedMonth] = month.split('-')
        const monthName = format(new Date(parseInt(year), parseInt(parsedMonth) - 1, 1), 'MMMM yyyy', { locale: es }).toUpperCase()

        // Cabecera Legal (España)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text("REGISTRO DE JORNADA LABORAL", 105, 15, { align: "center" })

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(`Empresa: ${shopName}`, 14, 25)
        doc.text(`CIF/NIF: ${shopCif}`, 14, 30)
        doc.text(`Trabajador/a: ${selectedBarber.nombre}`, 120, 25)
        doc.text(`Mes/Año: ${monthName}`, 120, 30)

        const dailyData = processDailySummaries()
        let totalMonthSecs = 0

        const tableData = dailyData.map(([date, d]) => {
            totalMonthSecs += d.totalSeconds
            return [
                format(parseISO(date), 'dd/MM/yyyy'),
                d.firstIn || '--:--',
                d.lastOut || '--:--',
                formatHours(d.totalSeconds)
            ]
        })

        // Info of Edits (Audits) in that month
        const audits = logs.filter(l => l.editado_por != null)

        autoTable(doc, {
            startY: 40,
            head: [['Fecha', 'Primera Entrada', 'Última Salida', 'Total Diario Efectivo']],
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
            doc.text("Notas de Auditoría (Correcciones del Empleador):", 14, finalY + 10)
            const auditData = audits.map(a => [
                format(new Date(a.timestamp_servidor), 'dd/MM HH:mm'),
                a.tipo.toUpperCase(),
                a.motivo_edicion || 'Sin motivo'
            ])
            autoTable(doc, {
                startY: finalY + 15,
                head: [['Fecha Corregida', 'Acción', 'Motivo de Edición Legítimo']],
                body: auditData,
                theme: 'plain',
                styles: { fontSize: 8, textColor: [80, 80, 80] }
            })
            finalY = (doc as any).lastAutoTable?.finalY + 10
        } else {
            finalY += 20
        }

        // Firmas obligatorias según RD-Ley 8/2019
        doc.setFontSize(9)
        doc.text("Firma de la Empresa:", 30, finalY + 15)
        doc.text("Firma del Trabajador/a:", 130, finalY + 15)

        // Líneas para firmar
        doc.line(20, finalY + 35, 80, finalY + 35)
        doc.line(120, finalY + 35, 180, finalY + 35)

        doc.setFontSize(7)
        doc.setTextColor(136, 136, 136) // #888
        doc.text("Documento oficial de control horario según artículo 34.9 del Estatuto de los Trabajadores.", 105, 285, { align: 'center' })

        doc.save(`Fichaje_${selectedBarber.nombre.replace(/\s+/g, '_')}_${month}.pdf`)
    }


    const dailySummaries = processDailySummaries()

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0a0a0a] border border-zinc-800 rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black italic uppercase tracking-tighter text-white leading-tight">Control de Presencia</h2>
                            <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">{format(parseISO(`${month}-01`), 'MMMM yyyy', { locale: es })}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 text-zinc-500 hover:text-white transition-colors rounded-full hover:bg-zinc-800">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
                    {/* Left Sidebar: Barbers & Actions */}
                    <div className="w-full md:w-64 flex flex-col gap-4">
                        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Equipo</p>
                            <div className="space-y-1">
                                {barbers.map(b => (
                                    <button
                                        key={b.id}
                                        onClick={() => setSelectedBarber(b)}
                                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${selectedBarber?.id === b.id ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                                    >
                                        <User className="w-4 h-4 inline mr-2" />
                                        {b.nombre}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={generatePDF}
                            disabled={!selectedBarber || logs.length === 0}
                            className="w-full bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-widest py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors text-xs disabled:opacity-50"
                        >
                            <Download className="w-4 h-4" /> Exportar PDF Oficial
                        </button>

                        <button
                            onClick={() => setIsAuditing(!isAuditing)}
                            className={`w-full font-bold uppercase tracking-widest py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors text-xs border ${isAuditing ? 'bg-zinc-800 border-zinc-700 text-white' : 'border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'}`}
                        >
                            <AlertTriangle className="w-4 h-4" /> Auditar / Corregir
                        </button>
                    </div>

                    {/* Right Content: Logs Table & Audit Form */}
                    <div className="flex-1 bg-zinc-900/50 rounded-[2rem] border border-zinc-800 p-6">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                                <Loader2 className="w-8 h-8 animate-spin mb-4 text-amber-500" />
                                <span className="text-xs font-bold uppercase tracking-widest">Cargando registros...</span>
                            </div>
                        ) : isAuditing ? (
                            <div className="animate-in fade-in slide-in-from-bottom-4">
                                <h3 className="text-lg font-black text-white italic mb-1">Auditoría de Fichaje</h3>
                                <p className="text-xs text-zinc-500 mb-6 font-medium">Inserta legalmente un fichaje omitido o erróneo. Se registrará tu autoría.</p>

                                <form onSubmit={handleAuditSubmit} className="space-y-4">
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
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Motivo Justificado (Auditoría)</label>
                                        <textarea required placeholder="Ej: Olvido del empleado al finalizar el turno." value={auditForm.motivo} onChange={(e) => setAuditForm({ ...auditForm, motivo: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500 resize-none h-24" />
                                    </div>
                                    <div className="flex items-center gap-3 pt-4">
                                        <button type="button" onClick={() => setIsAuditing(false)} className="flex-1 py-3 border border-zinc-800 rounded-xl font-bold text-xs uppercase text-zinc-400 hover:text-white">Cancelar</button>
                                        <button type="submit" disabled={submittingAudit} className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2 transition-colors">
                                            {submittingAudit ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Corrección'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-black text-white italic">Movimientos del Día</h3>
                                    <input
                                        type="date"
                                        value={attendanceDate}
                                        onChange={(e) => setAttendanceDate(e.target.value)}
                                        className="bg-black border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>

                                <div className="w-full max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                                    {(() => {
                                        const dayLogs = logs
                                            .filter(l => l.timestamp_servidor.substring(0, 10) === attendanceDate)
                                            .sort((a, b) => new Date(b.timestamp_servidor).getTime() - new Date(a.timestamp_servidor).getTime());

                                        if (dayLogs.length === 0) {
                                            return (
                                                <div className="text-center py-12 text-zinc-600 bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-800">
                                                    <Clock className="w-8 h-8 mx-auto mb-3 opacity-50" />
                                                    <p className="text-xs font-bold uppercase tracking-widest leading-normal">Sin movimientos registrados este día</p>
                                                </div>
                                            );
                                        }

                                        return (
                                            <table className="w-full text-left border-collapse">
                                                <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800/50 z-10">
                                                    <tr>
                                                        <th className="py-2 px-4 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Hora</th>
                                                        <th className="py-2 px-4 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Movimiento</th>
                                                        <th className="py-2 px-4 text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-right">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-zinc-800/30">
                                                    {dayLogs.map((log, index) => {
                                                        let elapsed = null;
                                                        if (log.tipo === 'salida' || log.tipo === 'pausa_inicio') {
                                                            for (let i = index + 1; i < dayLogs.length; i++) {
                                                                const prev = dayLogs[i]
                                                                if (prev.tipo === 'entrada' || prev.tipo === 'pausa_fin') {
                                                                    const secs = (new Date(log.timestamp_servidor).getTime() - new Date(prev.timestamp_servidor).getTime()) / 1000;
                                                                    const h = Math.floor(secs / 3600);
                                                                    const m = Math.floor((secs % 3600) / 60);
                                                                    elapsed = h === 0 && m === 0 ? '< 1m' : `${h}h ${m}m`;
                                                                    break;
                                                                }
                                                            }
                                                        }

                                                        return (
                                                            <tr key={log.id} className="group/row hover:bg-zinc-800/20 transition-colors">
                                                                <td className="py-3 px-4 text-xs text-white font-medium tabular-nums">
                                                                    {format(new Date(log.timestamp_servidor), 'HH:mm')}
                                                                </td>
                                                                <td className="py-3 px-4">
                                                                    <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest whitespace-nowrap",
                                                                        log.tipo === 'entrada' ? "bg-green-500/10 text-green-500" :
                                                                            log.tipo === 'salida' ? "bg-red-500/10 text-red-500" :
                                                                                "bg-amber-500/10 text-amber-500"
                                                                    )}>
                                                                        {log.tipo.replace('_', ' ')}
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 px-4 text-right text-xs font-bold text-zinc-300 tabular-nums">
                                                                    {elapsed || '--'}
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        );
                                    })()}
                                </div>

                                <div className="pt-6 border-t border-zinc-800/50">
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Resumen Mensual</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
                                        {dailySummaries.slice(-5).map(([date, d]) => (
                                            <div key={date} className="bg-black/40 border border-zinc-800/50 rounded-xl p-3 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-[10px] font-black text-amber-500 w-5">
                                                        {format(parseISO(date), 'dd')}
                                                    </div>
                                                    <p className="text-[10px] text-white font-bold uppercase">{format(parseISO(date), 'EEE', { locale: es })}</p>
                                                </div>
                                                <p className="text-xs font-black tabular-nums text-white">{formatHours(d.totalSeconds)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
