'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Search, Filter, Loader2, DollarSign, Wallet, CheckCircle2, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Gasto {
    id: number
    concepto: string
    monto: number
    fecha: string
    categoria: string
    metodo_pago: string
    deducible: boolean
}

interface ExpensesSectionProps {
    selectedMonth?: string // YYYY-MM
}

export default function ExpensesSection({ selectedMonth }: ExpensesSectionProps) {
    const [gastos, setGastos] = useState<Gasto[]>([])
    const [loading, setLoading] = useState(true)
    const [showAdd, setShowAdd] = useState(false)
    const [newGasto, setNewGasto] = useState({
        concepto: '',
        monto: '',
        fecha: new Date().toISOString().split('T')[0],
        categoria: 'General',
        metodo_pago: 'Efectivo',
        deducible: true
    })
    const [saving, setSaving] = useState(false)

    const targetMonth = selectedMonth || new Date().toISOString().substring(0, 7)

    useEffect(() => {
        fetchGastos()
    }, [targetMonth])

    const fetchGastos = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        let query = supabase
            .from('gastos')
            .select('*')
            .eq('user_id', user.id)
            .order('fecha', { ascending: false })

        if (targetMonth) {
            const [year, month] = targetMonth.split('-').map(Number)
            const startDate = `${targetMonth}-01`
            const nextMonthDate = new Date(year, month, 1)
            const endDate = nextMonthDate.toISOString().split('T')[0]
            query = query.gte('fecha', startDate).lt('fecha', endDate)
        }

        const { data, error } = await query

        if (error) {
            toast.error('Error al cargar gastos')
        } else {
            setGastos(data || [])
        }
        setLoading(false)
    }

    const handleAddGasto = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase.from('gastos').insert({
            user_id: user.id,
            concepto: newGasto.concepto,
            monto: parseFloat(newGasto.monto),
            fecha: newGasto.fecha,
            categoria: newGasto.categoria,
            metodo_pago: newGasto.metodo_pago,
            deducible: newGasto.deducible
        })

        if (error) {
            toast.error('Error al guardar el gasto')
        } else {
            toast.success('Gasto guardado correctamente')
            setNewGasto({
                concepto: '',
                monto: '',
                fecha: new Date().toISOString().split('T')[0],
                categoria: 'General',
                metodo_pago: 'Efectivo',
                deducible: true
            })
            setShowAdd(false)
            fetchGastos()
        }
        setSaving(false)
    }

    const handleDelete = async (id: number) => {
        const { error } = await supabase.from('gastos').delete().eq('id', id)
        if (error) {
            toast.error('Error al eliminar')
        } else {
            setGastos(gastos.filter(g => g.id !== id))
            toast.success('Gasto eliminado')
        }
    }

    const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0)
    const totalDeducible = gastos.filter(g => g.deducible).reduce((sum, g) => sum + g.monto, 0)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-red-500" />
                        Gastos Operativos
                    </h3>
                    <p className="text-zinc-500 text-xs font-medium">Controla tus egresos en {targetMonth}</p>
                </div>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition-all"
                >
                    <Plus className={cn("w-5 h-5 transition-transform", showAdd && "rotate-45")} />
                </button>
            </div>

            {showAdd && (
                <form onSubmit={handleAddGasto} className="p-5 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-5 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Concepto</label>
                            <input
                                required
                                value={newGasto.concepto}
                                onChange={e => setNewGasto({ ...newGasto, concepto: e.target.value })}
                                placeholder="Ej: Café clientes, Pilas..."
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-bold"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Monto (€)</label>
                            <input
                                required
                                type="number"
                                step="0.01"
                                value={newGasto.monto}
                                onChange={e => setNewGasto({ ...newGasto, monto: e.target.value })}
                                placeholder="0.00"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm font-black outline-none focus:border-amber-500/50 transition-all font-mono"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Fecha</label>
                            <input
                                required
                                type="date"
                                value={newGasto.fecha}
                                onChange={e => setNewGasto({ ...newGasto, fecha: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-amber-500/50 transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Método de Pago</label>
                            <select
                                value={newGasto.metodo_pago}
                                onChange={e => setNewGasto({ ...newGasto, metodo_pago: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-amber-500/50 appearance-none transition-all cursor-pointer font-bold"
                            >
                                <option value="Efectivo">Efectivo</option>
                                <option value="Tarjeta">Tarjeta</option>
                                <option value="Bizum">Bizum</option>
                                <option value="Transferencia">Transferencia</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Categoría</label>
                            <select
                                value={newGasto.categoria}
                                onChange={e => setNewGasto({ ...newGasto, categoria: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-amber-500/50 appearance-none transition-all cursor-pointer font-bold"
                            >
                                <option value="General">General</option>
                                <option value="Dietas">Dietas</option>
                                <option value="Limpieza">Limpieza</option>
                                <option value="Mantenimiento">Mantenimiento</option>
                                <option value="Suministros">Suministros</option>
                                <option value="Alquiler">Alquiler</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Material">Material</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-3 bg-zinc-950/50 border border-zinc-800 p-3 rounded-2xl md:mt-5">
                            <input
                                type="checkbox"
                                id="deducible"
                                checked={newGasto.deducible}
                                onChange={e => setNewGasto({ ...newGasto, deducible: e.target.checked })}
                                className="w-5 h-5 rounded border-zinc-800 bg-zinc-900 text-amber-500 focus:ring-amber-500/20"
                            />
                            <label htmlFor="deducible" className="text-xs font-black text-zinc-300 uppercase tracking-widest cursor-pointer select-none">
                                Gasto Deducible (IVA)
                            </label>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-4 bg-red-500 hover:bg-red-400 text-white font-black uppercase tracking-[0.2em] rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-xl shadow-red-500/10 active:scale-[0.98] disabled:opacity-20"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Registrar Gasto del Negocio'}
                    </button>
                </form>
            )}

            <div className="bg-zinc-900 shadow-2xl border border-zinc-800/50 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-zinc-800/50 bg-zinc-950/30">
                                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Concepto</th>
                                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] text-center">Detalles</th>
                                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] text-right">Monto</th>
                                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/30">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={4} className="px-6 py-4"><div className="h-12 bg-zinc-800 rounded-2xl w-full" /></td>
                                    </tr>
                                ))
                            ) : gastos.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <DollarSign className="w-10 h-10 text-zinc-800" />
                                            <p className="text-zinc-600 text-sm font-medium">No hay gastos para {targetMonth}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                gastos.map((g) => (
                                    <tr key={g.id} className="hover:bg-zinc-800/20 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-white group-hover:text-amber-500 transition-colors uppercase tracking-tight">{g.concepto}</span>
                                                    {g.deducible && (
                                                        <span className="text-[8px] bg-green-500/10 text-green-500 border border-green-500/20 px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest">IVA</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">{g.categoria}</span>
                                                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                                    <span className="text-[9px] text-zinc-400 font-bold">{new Date(g.fecha).toLocaleDateString('es-ES')}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-950 border border-zinc-800 text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                                                <Wallet className="w-3 h-3" />
                                                {g.metodo_pago}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <span className="text-base font-black text-white tabular-nums tracking-tight">
                                                {g.monto.toFixed(2)}€
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button
                                                onClick={() => handleDelete(g.id)}
                                                className="p-2.5 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-zinc-800/50">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="p-4 animate-pulse">
                                <div className="h-16 bg-zinc-800 rounded-xl w-full" />
                            </div>
                        ))
                    ) : gastos.length === 0 ? (
                        <div className="px-6 py-16 text-center">
                            <div className="flex flex-col items-center gap-3">
                                <DollarSign className="w-10 h-10 text-zinc-800" />
                                <p className="text-zinc-600 text-sm font-medium">No hay gastos para {targetMonth}</p>
                            </div>
                        </div>
                    ) : (
                        gastos.map((g) => (
                            <div key={g.id} className="p-4 flex flex-col gap-3 group bg-zinc-950/20">
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-white uppercase tracking-tight">{g.concepto}</span>
                                            {g.deducible && (
                                                <span className="text-[7px] bg-green-500/10 text-green-500 border border-green-500/20 px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest">IVA</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">{g.categoria}</span>
                                            <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                            <span className="text-[8px] text-zinc-400 font-bold">{new Date(g.fecha).toLocaleDateString('es-ES')}</span>
                                        </div>
                                    </div>
                                    <span className="text-lg font-black text-white tabular-nums tracking-tighter">
                                        {g.monto.toFixed(2)}€
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[8px] font-black text-zinc-400 uppercase tracking-widest">
                                        <Wallet className="w-2.5 h-2.5" />
                                        {g.metodo_pago}
                                    </span>
                                    <button
                                        onClick={() => handleDelete(g.id)}
                                        className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all border border-zinc-800"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Shared Footer (Totals) */}
                <div className="px-6 py-6 bg-zinc-950/50 border-t border-zinc-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Impacto Fiscal ({targetMonth})</span>
                        <span className="text-xs font-bold text-green-500/70">Deducible: {totalDeducible.toFixed(2)}€</span>
                    </div>
                    <div className="flex flex-col md:items-end">
                        <span className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Gasto Total</span>
                        <span className="text-xl md:text-2xl font-black text-white tabular-nums">
                            {totalGastos.toFixed(2)}€
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
