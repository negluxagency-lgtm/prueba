'use client'

import React, { useState, useEffect } from 'react'
import { Calendar as LucideCalendar, ArrowLeft, Filter, AlertTriangle, CheckCircle, Edit3, DollarSign, Calculator, Lock, Info, TrendingUp, TrendingDown, MessageSquare, ChevronRight, User, Clock, Calendar, X, BookOpen } from 'lucide-react'
import { getMonthlyArqueos, updateArqueoEntry } from '@/app/actions/cash'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import Link from 'next/link'
import useSWR from 'swr'

export default function HistorialCajaPage() {
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7))
    const [editingArqueo, setEditingArqueo] = useState<any>(null)
    const [selectedArqueoDetail, setSelectedArqueoDetail] = useState<any>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [newMonto, setNewMonto] = useState('')
    const [newObs, setNewObs] = useState('')
    const [isUpdating, setIsUpdating] = useState(false)

    // 1. Obtener ID de Usuario (ShopId)
    const { data: userData } = useSWR('auth-user-data', async () => {
        const { data: { user } } = await supabase.auth.getUser()
        return user
    })
    const shopId = userData?.id

    // 2. Obtener Arqueos del Mes
    const { data: arqueos = [], mutate: refreshArqueos, isLoading } = useSWR(
        shopId && selectedMonth ? ['arqueos-history', shopId, selectedMonth] : null,
        () => getMonthlyArqueos(shopId!, selectedMonth).then(r => r.data || [])
    )

    const handleEditClick = (arq: any) => {
        setEditingArqueo(arq)
        setNewMonto(String(arq.monto_cierre_real || ''))
        setNewObs(arq.observaciones || '')
        setIsEditModalOpen(true)
    }

    const handleUpdate = async () => {
        if (!editingArqueo) return
        const val = parseFloat(newMonto)
        if (isNaN(val)) return toast.error('Monto no válido')

        setIsUpdating(true)
        const res = await updateArqueoEntry(editingArqueo.id, val, newObs)
        if (res.success) {
            toast.success('Entrada corregida correctamente')
            setIsEditModalOpen(false)
            refreshArqueos()
        } else {
            toast.error(res.error || 'Error al actualizar')
        }
        setIsUpdating(false)
    }

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white p-4 lg:p-10 max-w-5xl mx-auto pb-32">
            {/* Header */}
            <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/contabilidad" className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all hover:scale-105 active:scale-95">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Historial de <span className="text-amber-500">Caja</span></h1>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Auditoría y control de arqueos</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2 flex items-center gap-3 hover:border-amber-500 transition-all shadow-xl">
                        <Filter className="w-4 h-4 text-zinc-500" />
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-transparent border-none text-sm font-black text-amber-500 outline-none cursor-pointer uppercase tracking-widest"
                            style={{ colorScheme: 'dark' }}
                        />
                    </div>
                </div>
            </header>

            {/* Arqueos List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="py-20 text-center">
                        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Cargando bitácora...</p>
                    </div>
                ) : arqueos.length > 0 ? (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-[1.5rem] overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-center border-collapse">
                                <thead>
                                    <tr className="border-b border-zinc-800 bg-zinc-900/80">
                                        <th className="py-2 px-2 lg:py-5 lg:px-6 text-[9px] lg:text-[10px] text-zinc-500 uppercase font-black tracking-widest">Día</th>
                                        <th className="py-2 px-2 lg:py-5 lg:px-6 text-[9px] lg:text-[10px] text-zinc-500 uppercase font-black tracking-widest">Apertura</th>
                                        <th className="py-2 px-2 lg:py-5 lg:px-6 text-[9px] lg:text-[10px] text-zinc-500 uppercase font-black tracking-widest">Cierre (Exp./Real)</th>
                                        <th className="py-2 px-2 lg:py-5 lg:px-6 text-[9px] lg:text-[10px] text-zinc-500 uppercase font-black tracking-widest">Descuadre</th>
                                        <th className="py-2 px-2 lg:py-5 lg:px-6 text-[9px] lg:text-[10px] text-zinc-500 uppercase font-black tracking-widest text-right whitespace-nowrap"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/30">
                                    {arqueos.map((arq: any) => {
                                        const date = parseISO(arq.dia)
                                        const margen = Number(arq.margen || 0)
                                        const canEdit = arq.estado === 'cerrada'

                                        return (
                                            <tr key={arq.id} className="hover:bg-zinc-800/30 transition-colors group">
                                                <td className="py-2 px-2 lg:py-6 lg:px-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] lg:text-xs font-black text-white uppercase italic leading-none">{format(date, 'EEEE d', { locale: es })}</span>
                                                        <span className="text-[8px] lg:text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">{format(date, 'MMMM', { locale: es })}</span>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 lg:py-6 lg:px-6 text-center">
                                                    <span className="text-[9px] lg:text-xs font-bold text-zinc-400">{arq.monto_apertura?.toFixed(2)}€</span>
                                                </td>
                                                <td className="py-2 px-2 lg:py-6 lg:px-6 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[8px] lg:text-[10px] text-zinc-600 font-bold">{arq.monto_cierre_esperado?.toFixed(1)}€</span>
                                                        <span className="text-[10px] lg:text-sm font-black text-white italic">{arq.monto_cierre_real?.toFixed(2)}€</span>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 lg:py-6 lg:px-6 text-center">
                                                    <div className={cn(
                                                        "inline-flex items-center gap-1 px-1.5 py-0.5 lg:px-3 lg:py-1 rounded-full text-[8px] lg:text-[10px] font-black uppercase tracking-widest",
                                                        margen === 0 ? "bg-emerald-500/10 text-emerald-500" :
                                                            margen > 0 ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                                                    )}>
                                                        {margen === 0 ? "OK" : `${margen > 0 ? '+' : ''}${margen.toFixed(1)}€`}
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 lg:py-6 lg:px-6 text-right">
                                                    <div className="flex flex-col sm:flex-row items-center justify-end gap-1.5 lg:gap-2">
                                                        <button
                                                            onClick={() => handleEditClick(arq)}
                                                            className="p-1.5 lg:p-3 rounded-lg lg:rounded-2xl bg-zinc-800/50 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all active:scale-90"
                                                            title="Editar"
                                                        >
                                                            <Edit3 className="w-3 h-3 lg:w-4 lg:h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedArqueoDetail(arq)}
                                                            className="p-1.5 lg:p-3 rounded-lg lg:rounded-2xl bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black transition-all active:scale-90 shadow-lg shadow-amber-500/10"
                                                            title="Ver Detalle"
                                                        >
                                                            <ChevronRight className="w-3 h-3 lg:w-4 lg:h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="py-20 text-center bg-zinc-900/50 border border-dashed border-zinc-800 rounded-[2.5rem]">
                        <LucideCalendar className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Sin registros para este periodo</p>
                    </div>
                )}
            </div>

            {/* Modal de Corrección */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a0a0a]/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                            <button onClick={() => setIsEditModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors"><Info className="w-5 h-5 rotate-180" /></button>
                        </div>

                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                                <Lock className="w-8 h-8 text-amber-500" />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Auditoría de Caja</h3>
                            <p className="text-xs text-zinc-500 font-medium mt-1">Corrige el monto real contado del día {editingArqueo?.dia}</p>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-center">
                                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">Cierre Original (Efectivo)</p>
                                <p className="text-4xl font-black text-white italic">{editingArqueo?.monto_cierre_real?.toFixed(2)}€</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest ml-1 mb-2 block">Nuevo Monto Real en Cajón</label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={newMonto}
                                            onChange={(e) => setNewMonto(e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-2xl py-4 px-6 text-white text-xl font-black outline-none transition-all"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-6 flex items-center pointer-events-none">
                                            <span className="text-zinc-600 font-black">€</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest ml-1 mb-2 block">Motivo de Corrección</label>
                                    <textarea
                                        placeholder="Explica el motivo del cambio..."
                                        value={newObs}
                                        onChange={(e) => setNewObs(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-2xl py-4 px-6 text-white text-xs font-medium outline-none transition-all resize-none h-24"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="py-4 bg-zinc-950 hover:bg-zinc-900 text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-zinc-800 transition-all"
                                >
                                    Cerrar
                                </button>
                                <button
                                    onClick={handleUpdate}
                                    disabled={isUpdating}
                                    className="py-4 bg-white hover:bg-zinc-200 text-black text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isUpdating ? 'Actualizando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Detalle Completo */}
            {selectedArqueoDetail && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in zoom-in duration-300">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-1 lg:p-10 max-w-2xl w-full shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
                        {/* Botón Cerrar */}
                        <button
                            onClick={() => setSelectedArqueoDetail(null)}
                            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-all z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-6 lg:p-0">
                            <div className="flex items-center gap-5 mb-10">
                                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                                    <BookOpen className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Detalles del <span className="text-amber-500">Arqueo</span></h3>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">ID Auditoría: {selectedArqueoDetail.id.substring(0, 8)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                {/* Datos de Tiempo */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] text-zinc-500 font-black uppercase tracking-widest border-b border-zinc-800 pb-2 flex items-center gap-2">
                                        <Clock className="w-3 h-3" /> Tiempo y Registro
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-zinc-600 font-bold uppercase">Fecha</span>
                                            <span className="text-xs font-black text-white italic">{format(parseISO(selectedArqueoDetail.dia), 'EEEE d MMMM, yyyy', { locale: es })}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-zinc-600 font-bold uppercase">Hora Apertura</span>
                                            <span className="text-xs font-black text-white italic">{selectedArqueoDetail.created_at.split('T')[1].substring(0, 5)} HS</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-zinc-600 font-bold uppercase">Hora Cierre</span>
                                            <span className="text-xs font-black text-white italic">
                                                {selectedArqueoDetail.hora_cierre
                                                    ? `${selectedArqueoDetail.hora_cierre.split('T')[1].substring(0, 5)} HS`
                                                    : 'Pendiente'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-zinc-600 font-bold uppercase">Abierta por</span>
                                            <div className="flex items-center gap-2">
                                                <User className="w-3 h-3 text-zinc-700" />
                                                <span className="text-xs font-black text-amber-500/80 italic">{selectedArqueoDetail.abierta_por || 'Sistema'}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-zinc-600 font-bold uppercase">Cerrada por</span>
                                            <div className="flex items-center gap-2">
                                                <User className="w-3 h-3 text-zinc-700" />
                                                <span className="text-xs font-black text-amber-500/80 italic">{selectedArqueoDetail.cerrada_por || 'Pendiente'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Datos Financieros */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] text-zinc-500 font-black uppercase tracking-widest border-b border-zinc-800 pb-2 flex items-center gap-2">
                                        <DollarSign className="w-3 h-3" /> Desglose Económico
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-zinc-600 font-bold uppercase">Monto Apertura</span>
                                            <span className="text-xs font-black text-zinc-400">{selectedArqueoDetail.monto_apertura?.toFixed(2)}€</span>
                                        </div>
                                        <div className="flex justify-between items-center border-t border-zinc-800/50 pt-2">
                                            <span className="text-[10px] text-zinc-600 font-bold uppercase">Caja Esperada</span>
                                            <span className="text-xs font-black text-zinc-500">{selectedArqueoDetail.monto_cierre_esperado?.toFixed(2)}€</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-zinc-600 font-bold uppercase">Caja Real</span>
                                            <span className="text-lg font-black text-white italic">{selectedArqueoDetail.monto_cierre_real?.toFixed(2)}€</span>
                                        </div>
                                        <div className="flex justify-between items-center border-t border-zinc-800/50 pt-2">
                                            <span className="text-[10px] text-zinc-600 font-bold uppercase">Margen / Descuadre</span>
                                            <span className={cn(
                                                "text-xs font-black italic",
                                                selectedArqueoDetail.margen === 0 ? "text-emerald-500" :
                                                    selectedArqueoDetail.margen > 0 ? "text-amber-500" : "text-red-500"
                                            )}>
                                                {selectedArqueoDetail.margen > 0 ? '+' : ''}{selectedArqueoDetail.margen?.toFixed(2)}€
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Observaciones */}
                            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 relative group mb-2">
                                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
                                    <MessageSquare className="w-5 h-5 text-zinc-500" />
                                </div>
                                <h4 className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-3">Observaciones de Auditoría</h4>
                                <p className="text-xs font-medium text-zinc-400 leading-relaxed italic">
                                    "{selectedArqueoDetail.observaciones || 'Sin observaciones registradas para esta jornada.'}"
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}
