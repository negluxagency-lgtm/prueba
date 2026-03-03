'use client'

import { useState, useEffect } from 'react'
import { Clock, Plus, Trash2, Loader2, Zap, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { getBarberOvertimeFromSchedule, type BarberOvertimeResult } from '@/app/actions/overtime'

interface ExtraHourRecord {
    id: number
    barbero_id: any
    fecha: string
    cantidad_horas: number
    precio_hora_extra: number
    motivo: string
}

interface BarberOvertimeInlineProps {
    barberId: any
    barberiaId: string
    month: string
    onChanged: () => void
}

export function BarberOvertimeInline({ barberId, barberiaId, month, onChanged }: BarberOvertimeInlineProps) {
    const [records, setRecords] = useState<ExtraHourRecord[]>([])
    const [autoOvertime, setAutoOvertime] = useState<BarberOvertimeResult | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto')

    const [newRecord, setNewRecord] = useState({
        fecha: `${month}-01`,
        cantidad_horas: '',
        motivo: ''
    })

    const fetchRecords = async () => {
        setLoading(true)
        try {
            const [year, m] = month.split('-').map(Number)
            const lastDay = new Date(year, m, 0).getDate()
            const startDate = `${month}-01`
            const endDate = `${month}-${String(lastDay).padStart(2, '0')}`

            const [manualRes, autoRes] = await Promise.all([
                supabase
                    .from('horas_extra')
                    .select('*')
                    .eq('barbero_id', barberId)
                    .gte('fecha', startDate)
                    .lte('fecha', endDate)
                    .order('fecha', { ascending: false }),
                getBarberOvertimeFromSchedule(barberId, month)
            ])

            if (manualRes.error) throw manualRes.error
            setRecords(manualRes.data || [])
            setAutoOvertime(autoRes)
        } catch (err: any) {
            console.error('Error loading records:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRecords()
    }, [barberId, month])

    const handleAdd = async () => {
        if (!newRecord.cantidad_horas) {
            toast.error('Indica la cantidad de horas')
            return
        }
        setSaving(true)
        try {
            const { error } = await supabase.from('horas_extra').insert({
                barbero_id: barberId,
                barberia_id: barberiaId,
                fecha: newRecord.fecha,
                cantidad_horas: parseFloat(newRecord.cantidad_horas),
                precio_hora_extra: 0,
                motivo: newRecord.motivo
            })
            if (error) throw error
            toast.success('Horas registradas')
            setNewRecord(prev => ({ ...prev, cantidad_horas: '', motivo: '' }))
            setShowForm(false)
            fetchRecords()
            onChanged()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar registro?')) return
        try {
            const { error } = await supabase.from('horas_extra').delete().eq('id', id)
            if (error) throw error
            fetchRecords()
            onChanged()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const autoTotal = autoOvertime?.totalHoras || 0
    const manualTotal = records.reduce((sum, r) => sum + Number(r.cantidad_horas), 0)

    return (
        <div className="mt-4 pt-4 border-t border-zinc-800/50">
            {/* Tabs */}
            <div className="flex items-center gap-2 mb-3">
                <button
                    onClick={() => setActiveTab('auto')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'auto'
                        ? 'bg-amber-500 text-black'
                        : 'bg-zinc-800 text-zinc-500 hover:text-white'
                        }`}
                >
                    <Zap className="w-2.5 h-2.5" />
                    Auto ({autoTotal.toFixed(1)}h)
                </button>
                <button
                    onClick={() => setActiveTab('manual')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'manual'
                        ? 'bg-zinc-600 text-white'
                        : 'bg-zinc-800 text-zinc-500 hover:text-white'
                        }`}
                >
                    <Clock className="w-2.5 h-2.5" />
                    Manual ({manualTotal.toFixed(1)}h)
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-700" />
                </div>
            ) : activeTab === 'auto' ? (
                /* ─── TAB AUTO ─── */
                <div className="space-y-2">
                    {!autoOvertime || autoOvertime.dias.length === 0 ? (
                        <div className="text-center py-3">
                            <p className="text-[10px] text-zinc-600 italic">Sin horas extra detectadas en los fichajes de este mes</p>
                            <p className="text-[9px] text-zinc-700 mt-1">Solo cuentan salidas ≥30 min después del horario</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 mb-2">
                                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">
                                    {autoTotal.toFixed(2)}h extra detectadas automáticamente
                                </p>
                                <p className="text-[8px] text-zinc-500 mt-0.5">Basado en tus fichajes vs tu horario configurado</p>
                            </div>
                            {autoOvertime.dias.map(dia => (
                                <div key={dia.fecha} className="flex items-center justify-between bg-zinc-950/30 p-2.5 rounded-lg border border-zinc-800/50">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-2.5 h-2.5 text-zinc-600" />
                                            <span className="text-[9px] font-black text-zinc-400">
                                                {new Date(dia.fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                        <p className="text-[8px] text-zinc-600 mt-0.5">
                                            Realizadas: <span className="text-white font-bold">{Math.round(dia.minutos_reales)} min</span>
                                            {' '}· Esperadas: <span className="text-zinc-400">{Math.round(dia.minutos_esperados)} min</span>
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg">
                                        +{(dia.minutos_extra / 60).toFixed(2)}h
                                    </span>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            ) : (
                /* ─── TAB MANUAL ─── */
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Registros manuales</span>
                        {!showForm && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="text-[9px] font-black uppercase bg-white text-black px-2 py-1.5 rounded-md hover:bg-zinc-200 transition-colors flex items-center gap-1"
                            >
                                <Plus className="w-2.5 h-2.5" /> Registrar
                            </button>
                        )}
                    </div>

                    {showForm && (
                        <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-700/30 mb-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-zinc-500 uppercase px-1">Fecha</label>
                                    <input
                                        type="date"
                                        className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-2 text-[10px] text-white outline-none focus:border-amber-500 w-full"
                                        value={newRecord.fecha}
                                        onChange={e => setNewRecord(p => ({ ...p, fecha: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-zinc-500 uppercase px-1">Cantidad</label>
                                    <input
                                        type="number"
                                        placeholder="Ej: 2.5"
                                        className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-2 text-[10px] text-white outline-none focus:border-amber-500 w-full"
                                        value={newRecord.cantidad_horas}
                                        onChange={e => setNewRecord(p => ({ ...p, cantidad_horas: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1 mb-3">
                                <label className="text-[8px] font-black text-zinc-500 uppercase px-1">Motivo (Opcional)</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Cierre tarde, formación..."
                                    className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-2 text-[10px] text-white outline-none focus:border-amber-500 w-full"
                                    value={newRecord.motivo}
                                    onChange={e => setNewRecord(p => ({ ...p, motivo: e.target.value }))}
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleAdd}
                                    disabled={saving}
                                    className="flex-1 bg-amber-500 text-black font-black text-[9px] uppercase py-2.5 rounded-lg hover:bg-amber-400 disabled:opacity-50"
                                >
                                    {saving ? 'Guardando...' : 'Confirmar Registro'}
                                </button>
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="px-4 bg-zinc-800 text-zinc-400 font-black text-[9px] uppercase py-2.5 rounded-lg hover:bg-zinc-700"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        {records.length === 0 ? (
                            <p className="text-[10px] text-zinc-600 italic text-center py-1">Sin horas registradas manualmente este mes</p>
                        ) : (
                            records.map(r => (
                                <div key={r.id} className="flex items-center justify-between bg-zinc-950/30 p-2.5 rounded-lg border border-zinc-800/50 group">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[8px] font-black text-zinc-500">{r.fecha.split('-').slice(1).reverse().join('/')}</span>
                                            <span className="text-[10px] font-bold text-zinc-300 truncate">{r.motivo || 'Sesión extra'}</span>
                                        </div>
                                        <p className="text-[9px] text-amber-500/80 font-black uppercase tracking-widest mt-0.5">{r.cantidad_horas} Horas realizadas</p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(r.id)}
                                        className="p-2 text-zinc-600 hover:text-red-500 transition-colors md:opacity-0 md:group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
