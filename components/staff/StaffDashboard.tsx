'use client'

import React, { useState, useEffect, useRef } from 'react'
import { StaffBarber } from './StaffApp'
import { Calendar as CalendarIcon, Scissors, Clock, LogOut, Loader2, CheckCircle2, AlertCircle, Calendar as LucideCalendar, Plus, Target, MessageCircle, Settings2, Pencil, Trash2, Receipt, CheckCircle, XCircle, Play, Pause, StopCircle, Camera } from 'lucide-react'
import { getStaffAgenda, getStaffCuts, updateStaffAppointmentStatus, deleteStaffAppointment, saveStaffAppointment, getShopServices, updateBarberPhoto, getBarberAbsences, markBarberAbsence } from '@/app/actions/staff'
import { getAttendanceStatus, logAttendance, getDailySummary, getWeeklyLogs, TipoFichaje } from '@/app/actions/attendance'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { AppointmentModal } from '@/components/dashboard/AppointmentModal'
import { InvoiceModal } from '@/components/dashboard/InvoiceModal'
import { PaymentMethodModal, PaymentMethod } from '@/components/dashboard/PaymentMethodModal'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { AppointmentFormData } from '@/types'

interface StaffDashboardProps {
    shopData: any
    barber: StaffBarber
    onLogout: () => void
}

type TabType = 'agenda' | 'cortes' | 'horas'

const DAY_NAMES_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DAY_KEYS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

export default function StaffDashboard({ shopData, barber, onLogout }: StaffDashboardProps) {
    const [activeTab, setActiveTab] = useState<TabType>('agenda')
    const [loading, setLoading] = useState(true)

    // Agenda State
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [agenda, setAgenda] = useState<any[]>([])
    const [showAllAppointments, setShowAllAppointments] = useState(false)
    const dateInputRef = useRef<HTMLInputElement>(null)

    // Cortes State
    const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'))
    const [cutsData, setCutsData] = useState<{
        total: number,
        distribution: Record<string, number>,
        revenue: number,
        targets: { revenue: number, cuts: number }
    }>({
        total: 0,
        distribution: {},
        revenue: 0,
        targets: { revenue: 0, cuts: 0 }
    })

    // Fichaje State
    const [attendanceStatus, setAttendanceStatus] = useState<TipoFichaje | null>(null)
    const [attendanceDate, setAttendanceDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [tableLogs, setTableLogs] = useState<any[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [locationError, setLocationError] = useState<string | null>(null)
    const [absenceDates, setAbsenceDates] = useState<string[]>([])
    const [absenceTarget, setAbsenceTarget] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [isMarkingAbsence, setIsMarkingAbsence] = useState(false)

    // Modal & Actions State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingAppointment, setEditingAppointment] = useState<any>(null)
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
    const [invoiceAppointment, setInvoiceAppointment] = useState<any>(null)
    const [services, setServices] = useState<any[]>([])
    const [menuState, setMenuState] = useState<{ id: string | number, x: number, y: number } | null>(null)
    const [paymentModal, setPaymentModal] = useState<{ id: string | number } | null>(null)

    // Photo State
    const [currentPhoto, setCurrentPhoto] = useState<string | undefined>(barber.foto)
    const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        loadData()
        fetchServices()
    }, [activeTab, currentMonth, selectedDate, showAllAppointments, attendanceDate])

    useEffect(() => {
        getBarberAbsences(barber.id).then(setAbsenceDates)
    }, [])

    const fetchServices = async () => {
        const data = await getShopServices(shopData.id)
        setServices(data)
    }

    // --- REALTIME SUBSCRIPTION ---
    useEffect(() => {
        if (!shopData?.id) return
        const channel = supabase
            .channel(`staff-agenda-${shopData.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'citas',
                filter: `barberia_id=eq.${shopData.id}`
            }, () => {
                setTimeout(() => loadData(), 500)
            })
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [shopData?.id])

    const loadData = async () => {
        setLoading(true)
        try {
            if (activeTab === 'agenda') {
                const response = await getStaffAgenda(shopData.id, barber.nombre, selectedDate, showAllAppointments)
                setAgenda(response.data)
            } else if (activeTab === 'cortes') {
                const data = await getStaffCuts(shopData.id, barber.nombre, currentMonth)
                setCutsData(data)
            } else if (activeTab === 'horas') {
                const status = await getAttendanceStatus(Number(barber.id));
                setAttendanceStatus(status ? status.tipo : null);
                const summary = await getDailySummary(Number(barber.id), attendanceDate);
                setTableLogs([...(summary.logs || [])].reverse());
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateStatus = async (id: number, status: 'pendiente' | 'confirmada' | 'cancelada', pago?: string) => {
        toast.promise(updateStaffAppointmentStatus(id, status, barber.nombre, pago), {
            loading: 'Actualizando...',
            success: () => { loadData(); return 'Estado actualizado' },
            error: 'Error al actualizar'
        })
    }

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar esta cita?')) return
        toast.promise(deleteStaffAppointment(id), {
            loading: 'Eliminando...',
            success: () => { loadData(); return 'Cita eliminada' },
            error: 'Error al eliminar'
        })
    }

    const handleSaveAppointment = async (data: AppointmentFormData) => {
        const res = await saveStaffAppointment(data, editingAppointment?.id || null, shopData.id)
        if (res.success) {
            toast.success('Cita guardada')
            setIsEditModalOpen(false)
            setEditingAppointment(null)
            loadData()
        } else {
            toast.error(res.error || 'Error al guardar')
        }
    }

    // Photo Handlers
    function handlePhotoClick() {
        fileInputRef.current?.click()
    }

    async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUpdatingPhoto(true)
        const toastId = toast.loading('Subiendo foto...')

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `barber_${barber.id}_${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('foto_barberos')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('foto_barberos')
                .getPublicUrl(filePath)

            const res = await updateBarberPhoto(barber.id, publicUrl)
            if (res.success) {
                setCurrentPhoto(publicUrl)
                toast.success('Foto actualizada', { id: toastId })
            } else {
                throw new Error(res.error)
            }
        } catch (error: any) {
            console.error('Error updating photo:', error)
            toast.error(error.message || 'Error al actualizar foto', { id: toastId })
        } finally {
            setIsUpdatingPhoto(false)
        }
    }

    const renderSchedule = () => {
        const schedule = barber.horario_semanal
        if (!schedule) return null

        const entries: { dayName: string, shifts: string, activo: boolean }[] = []

        if (Array.isArray(schedule)) {
            const sortedSchedule = [...schedule].sort((a, b) => {
                const dayA = a.dia === 0 ? 7 : a.dia
                const dayB = b.dia === 0 ? 7 : b.dia
                return dayA - dayB
            })

            sortedSchedule.forEach((day: any) => {
                const dayName = DAY_NAMES_ES[day.dia]
                const shifts = day.activo && day.turnos && day.turnos.length > 0
                    ? day.turnos.map((t: any) => `${t.inicio} - ${t.fin}`).join(', ')
                    : 'Cerrado'
                entries.push({ dayName, shifts, activo: day.activo && day.turnos?.length > 0 })
            })
        } else if (typeof schedule === 'object') {
            const keys = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
            keys.forEach(key => {
                const ranges = schedule[key] || []
                const shifts = ranges.length > 0
                    ? ranges.map((r: any) => `${r.desde} - ${r.hasta}`).join(', ')
                    : 'Cerrado'
                entries.push({
                    dayName: key.charAt(0).toUpperCase() + key.slice(1),
                    shifts,
                    activo: ranges.length > 0
                })
            })
        }

        if (entries.length === 0) return null

        return (
            <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Horario Semanal Establecido</p>
                </div>
                <div className="w-full overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <tbody className="divide-y divide-zinc-800/30">
                            {entries.map((entry, idx) => (
                                <tr key={idx} className="group/row hover:bg-zinc-800/20 transition-colors">
                                    <td className="py-2 px-4 text-xs text-zinc-400 font-medium w-1/3">
                                        {entry.dayName}
                                    </td>
                                    <td className={cn(
                                        "py-2 px-4 text-xs font-bold tabular-nums text-right",
                                        entry.activo ? "text-white" : "text-zinc-600 italic"
                                    )}>
                                        {entry.shifts}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    const handlePunch = async (tipo: TipoFichaje) => {
        setIsSubmitting(true)
        setLocationError(null)
        try {
            let lat: number | undefined;
            let lng: number | undefined;

            if (navigator.geolocation && (tipo === 'entrada' || tipo === 'salida')) {
                try {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
                    });
                    lat = position.coords.latitude;
                    lng = position.coords.longitude;
                } catch (geoError) {
                    console.warn("Geolocalización no disponible.", geoError);
                    setLocationError("Ubicación no guardada.");
                }
            }

            const res = await logAttendance(Number(barber.id), tipo, lat, lng);
            if (res.success) {
                toast.success(`Fichaje registrado con éxito.`);
                loadData();
            } else {
                toast.error(res.error || "Error al registrar fichaje");
            }
        } catch (error) {
            toast.error("Error de conexión al fichar.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-black flex flex-col pt-12 md:pt-20 px-4 max-w-2xl mx-auto">
            {/* Header Mini Profile */}
            <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-4 rounded-[2rem] mb-6 shadow-xl">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handlePhotoClick}
                        disabled={isUpdatingPhoto}
                        className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-zinc-700 overflow-hidden flex items-center justify-center text-xl font-black text-zinc-500 hover:border-amber-500 transition-all relative group/photo"
                    >
                        {isUpdatingPhoto ? (
                            <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                        ) : currentPhoto ? (
                            <img src={currentPhoto} alt={barber.nombre} className="w-full h-full object-cover" />
                        ) : (
                            barber.nombre.charAt(0).toUpperCase()
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity">
                            <Camera className="w-4 h-4 text-white" />
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoChange}
                        />
                    </button>
                    <div>
                        <h2 className="text-white font-bold leading-tight tracking-tight">{barber.nombre}</h2>
                        <p className="text-xs text-amber-500 font-bold uppercase tracking-widest">{shopData.nombre_barberia}</p>
                    </div>
                </div>
                <button onClick={onLogout} className="w-12 h-12 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-red-500 transition-colors">
                    <LogOut className="w-5 h-5" />
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 mb-8 bg-zinc-900 p-2 rounded-[2rem] border border-zinc-800">
                {['agenda', 'cortes', 'horas'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as TabType)}
                        className={cn(
                            "flex-1 flex flex-col md:flex-row items-center justify-center gap-2 py-3 rounded-full transition-all text-sm font-bold capitalize",
                            activeTab === tab ? "bg-amber-500 text-black shadow-lg" : "text-zinc-500 hover:text-white"
                        )}
                    >
                        {tab === 'agenda' && <CalendarIcon className="w-4 h-4" />}
                        {tab === 'cortes' && <Scissors className="w-4 h-4" />}
                        {tab === 'horas' && <Clock className="w-4 h-4" />}
                        <span className="hidden md:inline">{tab === 'cortes' ? 'Rendimiento' : tab === 'horas' ? 'Jornada' : 'Mi Agenda'}</span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-[2rem] p-6 mb-8 overflow-hidden flex flex-col">
                {loading && activeTab !== 'horas' ? (
                    <div className="flex-1 flex items-center justify-center flex-col gap-4">
                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                        <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">Sincronizando...</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        {activeTab === 'agenda' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex flex-col gap-4 mb-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">
                                            {format(new Date(selectedDate + 'T12:00:00'), 'EEEE d', { locale: es })}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => { setEditingAppointment(null); setIsEditModalOpen(true); }} className="hidden md:flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-all shadow-lg active:scale-95">
                                                <Plus className="w-4 h-4" /> Nuevo Corte
                                            </button>
                                            <div className="relative">
                                                <div onClick={() => dateInputRef.current?.showPicker()} className="bg-black border border-zinc-800 text-white rounded-full px-4 py-1.5 text-xs font-bold flex items-center gap-2 hover:border-amber-500 transition-colors relative cursor-pointer">
                                                    <LucideCalendar className="w-3.5 h-3.5 text-amber-500" />
                                                    <span className="capitalize">{format(parseISO(selectedDate), "MMM d", { locale: es })}</span>
                                                    <input ref={dateInputRef} type="date" value={selectedDate} onChange={(e) => e.target.value && setSelectedDate(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full" style={{ colorScheme: 'dark' }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between bg-black/40 border border-zinc-800/50 p-3 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", showAllAppointments ? "bg-amber-500/10 text-amber-500" : "bg-zinc-800 text-zinc-500")}>
                                                <Settings2 className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-white uppercase tracking-tighter leading-tight">Visibilidad Global</p>
                                                <p className="text-[10px] text-zinc-500 font-medium">Citas de todos los barberos</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setShowAllAppointments(!showAllAppointments)} className={cn("relative w-11 h-6 rounded-full transition-colors outline-none", showAllAppointments ? "bg-amber-500" : "bg-zinc-800")}>
                                            <div className={cn("absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm", showAllAppointments ? "translate-x-5" : "translate-x-0")} />
                                        </button>
                                    </div>
                                </div>
                                {agenda.length === 0 ? (
                                    <div className="text-center py-12 bg-zinc-900/50 rounded-[2rem] border border-zinc-800 border-dashed">
                                        <CalendarIcon className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                                        <p className="text-zinc-500 font-bold">Sin citas programadas</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 pb-20">
                                        {agenda.map((cita) => (
                                            <div key={cita.id} className={cn("bg-zinc-900 border border-zinc-800 rounded-[1.5rem] md:rounded-[2rem] p-3.5 md:p-5 hover:border-amber-500/30 transition-all group", cita.cancelada && "opacity-50")}>
                                                <div className="flex items-center justify-between mb-3 md:mb-4">
                                                    <div className="flex items-center gap-3 md:gap-4">
                                                        <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-xs md:text-sm font-black italic shrink-0", cita.cancelada ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500")}>
                                                            {cita.Hora.substring(0, 5)}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <h4 className={cn("text-white font-bold text-base md:text-lg truncate max-w-[120px] md:max-w-none", cita.cancelada && "line-through leading-tight")}>{cita.Nombre}</h4>
                                                                {cita.barbero && (
                                                                    <span className={cn("px-1 py-0.5 rounded-md border text-[7px] md:text-[8px] font-black uppercase tracking-tighter shrink-0", cita.barbero === barber.nombre ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-zinc-500/10 border-zinc-500/20 text-zinc-400")}>
                                                                        {cita.barbero === barber.nombre ? 'Para ti' : cita.barbero}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest leading-none">{cita.servicio || '--'}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); setMenuState({ id: cita.id, x: rect.left, y: rect.bottom + 10 }); }} className="p-2 md:p-3 rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors shrink-0">
                                                        <Settings2 className="w-4 h-4 md:w-5 md:h-5" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-2 md:gap-3">
                                                    {cita.Telefono && (
                                                        <a href={`https://wa.me/34${String(cita.Telefono).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-green-500 hover:border-green-500/50 transition-all text-[10px] md:text-xs font-bold">
                                                            <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500" /> <span className="hidden xs:inline">{cita.Telefono}</span>
                                                        </a>
                                                    )}
                                                    <button onClick={() => {
                                                        if (cita.confirmada) {
                                                            handleUpdateStatus(cita.id, 'pendiente')
                                                        } else {
                                                            setPaymentModal({ id: cita.id })
                                                        }
                                                    }} className={cn("flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-tighter transition-all border shrink-0", cita.cancelada ? "bg-red-500/10 text-red-500 border-red-500/20" : cita.confirmada ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20")}>
                                                        {cita.cancelada ? <XCircle className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                                                        <span>{cita.cancelada ? 'Cancelada' : cita.confirmada ? 'Hecho' : 'Pendiente'}</span>
                                                    </button>
                                                    <div className="ml-auto text-lg md:text-xl font-black text-amber-500 italic shrink-0">{cita.Precio || 0}€</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'cortes' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-2 pb-10">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Rendimiento</h3>
                                    <input type="month" value={currentMonth} onChange={(e) => setCurrentMonth(e.target.value)} className="bg-black border border-zinc-800 text-white rounded-full px-4 py-2 text-sm focus:border-amber-500 outline-none shadow-lg" style={{ colorScheme: 'dark' }} />
                                </div>
                                {cutsData.total > 0 ? (
                                    <div className="space-y-6">
                                        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-xl relative overflow-hidden group">
                                            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                <Target className="w-3 h-3 text-amber-500" /> Objetivos Mensuales
                                            </h4>
                                            <div className="grid grid-cols-1">
                                                <div className="space-y-3 p-5 bg-black/40 rounded-3xl border border-zinc-800/50">
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tu Meta de Cortes</p>
                                                        <Scissors className="w-3.5 h-3.5 text-zinc-600" />
                                                    </div>
                                                    <div className="flex items-end gap-1.5">
                                                        <span className="text-3xl font-black text-white tabular-nums leading-none">{cutsData.total}</span>
                                                        {cutsData.targets.cuts > 0 && (
                                                            <span className="text-sm text-zinc-600 font-bold mb-1">/ {cutsData.targets.cuts}</span>
                                                        )}
                                                    </div>
                                                    {cutsData.targets.cuts > 0 ? (
                                                        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-amber-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                                                                style={{ width: `${Math.min((cutsData.total / cutsData.targets.cuts) * 100, 100)}%` }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <p className="text-[9px] text-zinc-700 font-medium italic">Configura una meta en el perfil para ver el progreso.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-xl">
                                            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Distribución</h4>
                                            <div className="space-y-4">
                                                {Object.entries(cutsData.distribution).sort(([, a], [, b]) => b - a).map(([name, count]) => {
                                                    const perc = Math.round((count / cutsData.total) * 100)
                                                    return (
                                                        <div key={name} className="space-y-2">
                                                            <div className="flex justify-between items-end"><span className="text-xs font-bold text-zinc-300 capitalize">{name}</span><div className="flex items-center gap-2"><span className="text-[10px] text-zinc-600">{count} cortes</span><span className="text-xs font-black text-amber-500 italic">{perc}%</span></div></div>
                                                            <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-zinc-800/50"><div className="h-full bg-gradient-to-r from-amber-600 to-amber-400" style={{ width: `${perc}%` }} /></div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-zinc-900/50 p-12 rounded-[2rem] border border-dashed border-zinc-800 text-center"><Scissors className="w-12 h-12 text-zinc-800 mx-auto mb-4" /><p className="text-zinc-500 font-bold">Sin actividad confirmada este mes</p></div>
                                )}
                                <div className="mt-8 bg-gradient-to-br from-amber-500 to-rose-600 p-8 rounded-[2rem] text-center shadow-2xl relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
                                    <Scissors className="w-12 h-12 text-white/50 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                                    <p className="text-7xl font-black text-white tracking-tighter mb-2">{cutsData.total}</p>
                                    <p className="text-white/80 font-medium uppercase tracking-widest text-sm italic">Citas Confirmadas este mes</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'horas' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-2 md:pt-6">
                                <div className="text-center mb-8">
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Control de Presencia</h3>
                                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Registra tu jornada de hoy</p>
                                </div>

                                <div className="w-full grid gap-3 z-10">
                                    {(!attendanceStatus || attendanceStatus === 'salida') && (
                                        <button
                                            onClick={() => handlePunch('entrada')}
                                            disabled={isSubmitting}
                                            className="w-full bg-green-500 hover:bg-green-400 text-black font-black uppercase tracking-widest py-4 md:py-5 rounded-2xl flex items-center justify-center gap-3 transition-colors active:scale-95 shadow-lg"
                                        >
                                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Play className="w-5 h-5 fill-current" /> Entrar al turno</>}
                                        </button>
                                    )}

                                    {(attendanceStatus === 'entrada' || attendanceStatus === 'pausa_fin') && (
                                        <div className="grid grid-cols-2 gap-3 w-full">
                                            <button
                                                onClick={() => handlePunch('pausa_inicio')}
                                                disabled={isSubmitting}
                                                className="w-full bg-zinc-800 hover:bg-zinc-700 text-amber-500 font-bold uppercase tracking-widest py-4 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-colors border border-zinc-700 active:scale-95"
                                            >
                                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Pause className="w-5 h-5" /> Iniciar Pausa</>}
                                            </button>

                                            <button
                                                onClick={() => handlePunch('salida')}
                                                disabled={isSubmitting}
                                                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold uppercase tracking-widest py-4 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-colors active:scale-95"
                                            >
                                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><StopCircle className="w-5 h-5" /> Finalizar Turno</>}
                                            </button>
                                        </div>
                                    )}

                                    {attendanceStatus === 'pausa_inicio' && (
                                        <button
                                            onClick={() => handlePunch('pausa_fin')}
                                            disabled={isSubmitting}
                                            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest py-4 md:py-5 rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-amber-500/20 active:scale-95"
                                        >
                                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Play className="w-5 h-5 fill-current" /> Reanudar Turno</>}
                                        </button>
                                    )}
                                </div>

                                <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-xl">
                                    <div className="mb-4 flex items-center justify-between">
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Actividad del Día</p>
                                        <input
                                            type="date"
                                            value={attendanceDate}
                                            onChange={(e) => setAttendanceDate(e.target.value)}
                                            className="bg-black border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500"
                                            style={{ colorScheme: 'dark' }}
                                        />
                                    </div>
                                    <div className="w-full max-h-64 overflow-y-auto custom-scrollbar pr-2">
                                        {tableLogs.length > 0 ? (
                                            <table className="w-full text-left border-collapse">
                                                <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800/50 z-10">
                                                    <tr>
                                                        <th className="py-2 px-4 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Día</th>
                                                        <th className="py-2 px-4 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Hora</th>
                                                        <th className="py-2 px-4 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Movimiento</th>
                                                        <th className="py-2 px-4 text-[10px] text-zinc-500 font-bold uppercase tracking-widest hidden md:table-cell text-right">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-zinc-800/30">
                                                    {tableLogs.map((log, index) => {
                                                        let elapsed = null;
                                                        if (log.tipo === 'salida' || log.tipo === 'pausa_inicio') {
                                                            for (let i = index + 1; i < tableLogs.length; i++) {
                                                                const prev = tableLogs[i]
                                                                if (prev.tipo === 'entrada' || prev.tipo === 'pausa_fin') {
                                                                    if (prev.timestamp_servidor.substring(0, 10) === log.timestamp_servidor.substring(0, 10)) {
                                                                        const secs = (new Date(log.timestamp_servidor).getTime() - new Date(prev.timestamp_servidor).getTime()) / 1000;
                                                                        const h = Math.floor(secs / 3600);
                                                                        const m = Math.floor((secs % 3600) / 60);
                                                                        elapsed = h === 0 && m === 0 ? '< 1m' : `${h}h ${m}m`;
                                                                    }
                                                                    break;
                                                                }
                                                            }
                                                        }

                                                        return (
                                                            <tr key={log.id} className="group/row hover:bg-zinc-800/20 transition-colors">
                                                                <td className="py-3 px-4 text-xs text-white font-medium capitalize">
                                                                    {format(new Date(log.timestamp_servidor), 'EEE d', { locale: es })}
                                                                </td>
                                                                <td className="py-3 px-4 text-xs text-zinc-400 tabular-nums">
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
                                                                <td className="py-3 px-4 text-right text-xs font-bold text-zinc-300 tabular-nums hidden md:table-cell">
                                                                    {elapsed || '--'}
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="text-center py-6 text-zinc-600 bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-800">
                                                <Clock className="w-8 h-8 mx-auto mb-3 opacity-50" />
                                                <p className="text-xs font-bold uppercase tracking-widest leading-normal">Sin actividad reciente</p>
                                            </div>
                                        )}
                                    </div>
                                    {locationError && <p className="text-[10px] text-red-500 font-medium mt-4"><AlertCircle className="w-3 h-3 inline mr-1" />{locationError}</p>}
                                </div>

                                {renderSchedule()}

                                <div className="mt-6 bg-zinc-900 border border-red-500/20 rounded-[2rem] p-6 shadow-xl">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-2 h-2 rounded-full bg-red-500" />
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Ausencias Planeadas</p>
                                    </div>
                                    <p className="text-xs text-zinc-600 mb-4 leading-relaxed">Marca un día de ausencia para que no aparezcas disponible en el portal de citas.</p>
                                    <div className="flex gap-3 items-center">
                                        <input
                                            type="date"
                                            value={absenceTarget}
                                            onChange={e => setAbsenceTarget(e.target.value)}
                                            className="flex-1 bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500/50 transition-colors"
                                            style={{ colorScheme: 'dark' }}
                                        />
                                        {absenceDates.includes(absenceTarget) ? (
                                            <button
                                                onClick={async () => {
                                                    setIsMarkingAbsence(true)
                                                    const res = await markBarberAbsence(barber.id, absenceTarget, true)
                                                    if (res.success) {
                                                        setAbsenceDates(prev => prev.filter(d => d !== absenceTarget))
                                                        toast.success('Ausencia cancelada')
                                                    } else toast.error(res.error || 'Error')
                                                    setIsMarkingAbsence(false)
                                                }}
                                                disabled={isMarkingAbsence}
                                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-widest rounded-xl flex items-center gap-2 transition-colors"
                                            >
                                                {isMarkingAbsence ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 text-green-500" />}
                                                Recuperar
                                            </button>
                                        ) : (
                                            <button
                                                onClick={async () => {
                                                    setIsMarkingAbsence(true)
                                                    const res = await markBarberAbsence(barber.id, absenceTarget)
                                                    if (res.success) {
                                                        setAbsenceDates(prev => [...prev, absenceTarget])
                                                        toast.success('Ausencia registrada')
                                                    } else toast.error(res.error || 'Error')
                                                    setIsMarkingAbsence(false)
                                                }}
                                                disabled={isMarkingAbsence}
                                                className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white text-xs font-black uppercase tracking-widest rounded-xl flex items-center gap-2 transition-colors active:scale-95"
                                            >
                                                {isMarkingAbsence ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                                Ausente
                                            </button>
                                        )}
                                    </div>
                                    {absenceDates.length > 0 && (() => {
                                        const grouped = absenceDates.sort().reduce((acc, d) => {
                                            const monthKey = d.substring(0, 7)
                                            if (!acc[monthKey]) acc[monthKey] = []
                                            acc[monthKey].push(d)
                                            return acc
                                        }, {} as Record<string, string[]>)

                                        return (
                                            <div className="mt-5 space-y-4">
                                                {Object.entries(grouped).map(([month, dates]) => (
                                                    <div key={month}>
                                                        <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-2 px-1">
                                                            {format(new Date(month + '-01'), 'MMMM yyyy', { locale: es })}
                                                        </p>
                                                        <table className="w-full text-left border-collapse">
                                                            <tbody className="divide-y divide-zinc-800/30">
                                                                {dates.map(d => (
                                                                    <tr key={d} className="hover:bg-zinc-800/20 transition-colors group/row">
                                                                        <td className="py-2.5 px-4 text-xs text-white font-medium capitalize">
                                                                            {format(new Date(d + 'T00:00:00'), 'EEEE d', { locale: es })}
                                                                        </td>
                                                                        <td className="py-2.5 px-4">
                                                                            <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-md text-[9px] text-red-400 font-black uppercase tracking-widest">Ausente</span>
                                                                        </td>
                                                                        <td className="py-2.5 px-4 text-right">
                                                                            <button
                                                                                onClick={async () => {
                                                                                    setIsMarkingAbsence(true)
                                                                                    const res = await markBarberAbsence(barber.id, d, true)
                                                                                    if (res.success) {
                                                                                        setAbsenceDates(prev => prev.filter(x => x !== d))
                                                                                        toast.success('Ausencia eliminada')
                                                                                    } else toast.error(res.error || 'Error')
                                                                                    setIsMarkingAbsence(false)
                                                                                }}
                                                                                disabled={isMarkingAbsence}
                                                                                className="opacity-100 md:opacity-0 group-hover/row:opacity-100 transition-opacity p-2 md:p-1 rounded-lg hover:bg-red-500/10 text-zinc-400 md:text-zinc-600 hover:text-red-400"
                                                                            >
                                                                                <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals & Fragments */}
            <AppointmentModal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingAppointment(null); }} onSave={handleSaveAppointment} services={services} isEditing={!!editingAppointment} initialData={editingAppointment ? { Nombre: editingAppointment.Nombre, servicio: editingAppointment.servicio, Dia: editingAppointment.Dia, Hora: editingAppointment.Hora, Telefono: editingAppointment.Telefono, Precio: String(editingAppointment.Precio), confirmada: editingAppointment.confirmada } : { Nombre: '', servicio: '', Dia: selectedDate, Hora: '09:00', Telefono: '', Precio: '', confirmada: false }} />
            <InvoiceModal isOpen={isInvoiceModalOpen} onClose={() => { setIsInvoiceModalOpen(false); setInvoiceAppointment(null); }} appointment={invoiceAppointment} shopData={{ name: shopData?.nombre_barberia, address: shopData?.Direccion, phone: shopData?.telefono, email: shopData?.correo, cif: shopData?.['CIF/NIF'] }} />

            {menuState && typeof document !== 'undefined' && createPortal(
                <>
                    <div className="fixed inset-0 z-[10000]" onClick={() => setMenuState(null)} />
                    <div className="fixed z-[10001] w-52 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95" style={{ left: menuState.x - 180, top: menuState.y }}>
                        <button onClick={() => { setEditingAppointment(agenda.find(a => a.id === menuState.id)); setIsEditModalOpen(true); setMenuState(null); }} className="w-full text-left px-4 py-3.5 rounded-2xl text-xs font-bold text-white hover:bg-zinc-800 flex items-center gap-3"><Pencil className="w-4 h-4 text-amber-500" /> Editar</button>
                        <button onClick={() => { setInvoiceAppointment(agenda.find(a => a.id === menuState.id)); setIsInvoiceModalOpen(true); setMenuState(null); }} className="w-full text-left px-4 py-3.5 rounded-2xl text-xs font-bold text-white hover:bg-zinc-800 flex items-center gap-3"><Receipt className="w-4 h-4 text-green-500" /> Factura</button>
                        <button onClick={() => { handleUpdateStatus(Number(menuState.id), 'cancelada'); setMenuState(null); }} className="w-full text-left px-4 py-3.5 rounded-2xl text-xs font-bold text-red-500 hover:bg-red-500/10 flex items-center gap-3"><XCircle className="w-4 h-4" /> Cancelar</button>
                        <div className="h-px bg-zinc-800 my-1.5 mx-2" />
                        <button onClick={() => { handleDelete(Number(menuState.id)); setMenuState(null); }} className="w-full text-left px-4 py-3.5 rounded-2xl text-xs font-bold text-red-600 hover:bg-red-600/10 flex items-center gap-3"><Trash2 className="w-4 h-4" /> Eliminar</button>
                    </div>
                </>, document.body
            )}
            <PaymentMethodModal
                isOpen={!!paymentModal}
                onClose={() => setPaymentModal(null)}
                onSelect={(method) => {
                    if (paymentModal) {
                        handleUpdateStatus(Number(paymentModal.id), 'confirmada', method)
                        setPaymentModal(null)
                    }
                }}
            />
        </div>
    )
}
