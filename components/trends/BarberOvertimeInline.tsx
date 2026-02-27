'use client'

import { useState, useEffect } from 'react'
import { Clock, Plus, Trash2, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

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
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showForm, setShowForm] = useState(false)

    const [newRecord, setNewRecord] = useState({
        fecha: `${month}-01`,
        cantidad_horas: '',
        precio_hora_extra: '',
        motivo: ''
    })

    const fetchRecords = async () => {
        setLoading(true)
        try {
            const [year, m] = month.split('-').map(Number)
            const lastDay = new Date(year, m, 0).getDate()
            const startDate = `${month}-01`
            const endDate = `${month}-${String(lastDay).padStart(2, '0')}`

            const { data, error } = await supabase
                .from('horas_extra')
                .select('*')
                .eq('barbero_id', barberId)
                .gte('fecha', startDate)
                .lte('fecha', endDate)
                .order('fecha', { ascending: false })

            if (error) throw error
            setRecords(data || [])
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
        if (!newRecord.cantidad_horas || !newRecord.precio_hora_extra) {
            toast.error('Indica horas y precio/h')
            return
        }
        setSaving(true)
        try {
            const { error } = await supabase.from('horas_extra').insert({
                barbero_id: barberId,
                barberia_id: barberiaId,
                fecha: newRecord.fecha,
                cantidad_horas: parseFloat(newRecord.cantidad_horas),
                precio_hora_extra: parseFloat(newRecord.precio_hora_extra),
                motivo: newRecord.motivo
            })
            if (error) throw error
            toast.success('Horas añadidas')
            setNewRecord(prev => ({ ...prev, cantidad_horas: '', precio_hora_extra: '', motivo: '' }))
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

    return (
        <div className="mt-4 pt-4 border-t border-zinc-800/50">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-zinc-400">
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Desglose Horas Extra</span>
                </div>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="text-[9px] font-black uppercase bg-white text-black px-2 py-1.5 rounded-md hover:bg-zinc-200 transition-colors flex items-center gap-1"
                    >
                        <Plus className="w-2.5 h-2.5" /> Añadir
                    </button>
                )}
            </div>

            {showForm && (
                <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-700/30 mb-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <input
                            type="date"
                            className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-2 text-[10px] text-white outline-none focus:border-amber-500 w-full"
                            value={newRecord.fecha}
                            onChange={e => setNewRecord(p => ({ ...p, fecha: e.target.value }))}
                        />
                        <input
                            type="number"
                            placeholder="Horas"
                            className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-2 text-[10px] text-white outline-none focus:border-amber-500 w-full"
                            value={newRecord.cantidad_horas}
                            onChange={e => setNewRecord(p => ({ ...p, cantidad_horas: e.target.value }))}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                        <input
                            type="number"
                            placeholder="Precio/h"
                            className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-2 text-[10px] text-white outline-none focus:border-amber-500 w-full"
                            value={newRecord.precio_hora_extra}
                            onChange={e => setNewRecord(p => ({ ...p, precio_hora_extra: e.target.value }))}
                        />
                        <input
                            type="text"
                            placeholder="Motivo"
                            className="md:col-span-2 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-2 text-[10px] text-white outline-none focus:border-amber-500 w-full"
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
                            {saving ? 'Guardando...' : 'Guardar Registro'}
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
                {loading ? (
                    <div className="flex justify-center py-2"><Loader2 className="w-4 h-4 animate-spin text-zinc-700" /></div>
                ) : records.length === 0 ? (
                    <p className="text-[10px] text-zinc-600 italic text-center py-1">Sin registros este mes</p>
                ) : (
                    records.map(r => (
                        <div key={r.id} className="flex items-center justify-between bg-zinc-950/30 p-2.5 rounded-lg border border-zinc-800/50 group">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-black text-zinc-500">{r.fecha.split('-').slice(1).reverse().join('/')}</span>
                                    <span className="text-[10px] font-bold text-zinc-300 truncate">{r.motivo || 'Sin motivo'}</span>
                                </div>
                                <p className="text-[9px] text-zinc-500 mt-0.5">{r.cantidad_horas}h × {r.precio_hora_extra}€ = <span className="text-zinc-400 font-bold">{(r.cantidad_horas * r.precio_hora_extra).toFixed(1)}€</span></p>
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
    )
}
