'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Search, Filter, Loader2, DollarSign, Wallet, CheckCircle2, XCircle, Upload, FileText, Download, Receipt, Edit3, Save, X, TrendingDown, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import useSWR from 'swr'
import { getLocalISOString } from '@/utils/date-helper'

interface Gasto {
    id: number
    concepto: string
    monto: number
    fecha: string
    categoria: string
    metodo_pago: string
    deducible: boolean
    factura_id?: string | number
    factura_uuid?: string
}

interface ExpensesSectionProps {
    selectedMonth?: string
}

export default function ExpensesSection({ selectedMonth }: ExpensesSectionProps) {
    const targetMonth = selectedMonth || new Date().toISOString().substring(0, 7)

    // --- SWR ---
    const { 
        data: gastos = [], 
        mutate, 
        isLoading: loading 
    } = useSWR(['expenses', targetMonth], async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []

        const [year, month] = targetMonth.split('-').map(Number)
        const startDate = `${targetMonth}-01`
        const nextMonthDate = new Date(year, month, 1)
        const endDate = nextMonthDate.toISOString().split('T')[0]

        const [gRes, fRes] = await Promise.all([
            supabase.from('gastos').select('*').eq('barberia_id', user.id).gte('fecha', startDate).lt('fecha', endDate).order('fecha', { ascending: false }),
            supabase.from('facturas').select('id, titulo, fecha_documento, archivo_url').eq('barberia_id', user.id).gte('fecha_documento', startDate).lt('fecha_documento', endDate)
        ])

        if (gRes.error) throw gRes.error

        return (gRes.data || []).map((g: any) => {
            const facturaVinculada = fRes.data?.find(f => f.titulo === g.concepto && f.fecha_documento === g.fecha)
            let parsedUuid = undefined
            if (facturaVinculada?.archivo_url) {
                try {
                    const parts = facturaVinculada.archivo_url.split('/facturas/');
                    if (parts.length > 1) parsedUuid = encodeURIComponent(parts[1]);
                } catch (e) {}
            }
            return { ...g, factura_id: facturaVinculada?.id, factura_uuid: parsedUuid }
        })
    })

    // --- REALTIME ---
    useEffect(() => {
        const channel = supabase
            .channel('realtime-expenses')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'gastos' }, () => mutate())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'facturas' }, () => mutate())
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [mutate])

    const [showAdd, setShowAdd] = useState(false)
    const [newGasto, setNewGasto] = useState({
        concepto: '',
        monto: '',
        fecha: getLocalISOString(),
        categoria: 'Otros',
        metodo_pago: 'Efectivo',
        deducible: true
    })
    const [file, setFile] = useState<File | null>(null)
    const [saving, setSaving] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            if (selectedFile.type !== 'application/pdf') {
                toast.error('Solo se permiten archivos PDF')
                return
            }
            if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error('El archivo es demasiado grande (máx 5MB)')
                return
            }
            setFile(selectedFile)
        }
    }

    const handleAddGasto = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        try {
            let facturaUrl = null

            if (file) {
                const fileExt = file.name.split('.').pop()
                const fileName = `${user.id}/${Date.now()}_${newGasto.concepto.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('facturas')
                    .upload(fileName, file)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('facturas')
                    .getPublicUrl(fileName)
                
                facturaUrl = publicUrl

                const { error: dbFacturaError } = await supabase.from('facturas').insert({
                    barberia_id: user.id,
                    titulo: newGasto.concepto,
                    tipo: newGasto.categoria.toLowerCase(),
                    fecha_documento: newGasto.fecha,
                    archivo_url: publicUrl
                })

                if (dbFacturaError) throw dbFacturaError
            }

            const { error: dbGastoError } = await supabase.from('gastos').insert({
                barberia_id: user.id,
                concepto: newGasto.concepto,
                monto: parseFloat(newGasto.monto),
                fecha: newGasto.fecha,
                categoria: newGasto.categoria,
                metodo_pago: newGasto.metodo_pago,
                deducible: newGasto.deducible
            })
            
            if (dbGastoError) throw dbGastoError

            toast.success('Gasto guardado correctamente' + (facturaUrl ? ' con factura vinculada' : ''))
            setNewGasto({
                concepto: '',
                monto: '',
                fecha: getLocalISOString(),
                categoria: 'Otros',
                metodo_pago: 'Efectivo',
                deducible: true
            })
            setFile(null)
            setShowAdd(false)
            mutate()

        } catch (error: any) {
            console.error('Error procesando gasto/factura:', error)
            toast.error('Error al guardar el gasto')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: number) => {
        const { error } = await supabase.from('gastos').delete().eq('id', id)
        if (error) {
            toast.error('Error al eliminar')
        } else {
            mutate()
            toast.success('Gasto eliminado')
        }
    }

    const totalGastos = gastos.reduce((sum: number, g: Gasto) => sum + g.monto, 0)
    const totalDeducible = gastos.filter((g: Gasto) => g.deducible).reduce((sum: number, g: Gasto) => sum + g.monto, 0)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm md:text-xl font-black text-white flex items-center gap-2 uppercase tracking-tighter italic">
                        <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
                        Gastos Operativos
                    </h3>
                    <p className="text-zinc-500 text-xs font-medium">Controla tus egresos en {targetMonth}</p>
                </div>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    className="p-1.5 md:p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition-all"
                >
                    <Plus className={cn("w-4 h-4 md:w-5 md:h-5 transition-transform", showAdd && "rotate-45")} />
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
                                <option value="Alquiler">Alquiler</option>
                                <option value="Suministros">Suministros</option>
                                <option value="Material y Productos">Material y Productos</option>
                                <option value="Herramientas">Herramientas</option>
                                <option value="Limpieza y Mantenimiento">Limpieza y Mantenimiento</option>
                                <option value="Marketing y Publicidad">Marketing y Publicidad</option>
                                <option value="Gestoría y Seguros">Gestoría y Seguros</option>
                                <option value="Dietas">Dietas</option>
                                <option value="Otros">Otros</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1 block mb-2">Adjuntar Factura (Opcional)</label>
                            <div className="relative group/upload">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className={cn(
                                    "border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all",
                                    file ? "border-amber-500/50 bg-amber-500/5" : "border-zinc-800 bg-zinc-950 group-hover/upload:border-zinc-700"
                                )}>
                                    <Upload className={cn("w-6 h-6 mb-2 transition-colors", file ? "text-amber-500" : "text-zinc-600")} />
                                    <p className="text-xs font-bold text-zinc-400 text-center px-4">
                                        {file ? file.name : "Selecciona o arrastra el PDF de la factura asociada a este gasto"}
                                    </p>
                                    <p className="text-[9px] text-zinc-600 mt-1 uppercase font-black">Máximo 5MB</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-zinc-950/50 border border-zinc-800 p-3 rounded-2xl md:col-span-2">
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
                                gastos.map((g: Gasto) => (
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
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-950 border border-zinc-800 text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                                                    <Wallet className="w-3 h-3" />
                                                    {g.metodo_pago}
                                                </span>
                                                {g.factura_uuid && (
                                                    <a 
                                                        href={`/f/${g.factura_uuid}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-500 uppercase tracking-widest hover:bg-emerald-500/20 transition-colors"
                                                    >
                                                        <FileText className="w-3 h-3" />
                                                        Factura
                                                    </a>
                                                )}
                                            </div>
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
                        <div className="px-6 py-10 text-center">
                            <div className="flex flex-col items-center gap-2">
                                <DollarSign className="w-8 h-8 text-zinc-800" />
                                <p className="text-zinc-600 text-xs font-medium">No hay gastos para {targetMonth}</p>
                            </div>
                        </div>
                    ) : (
                        gastos.map((g: Gasto) => (
                            <div key={g.id} className="p-3 flex flex-col gap-2 group bg-zinc-950/20">
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-white uppercase tracking-tight">{g.concepto}</span>
                                            {g.deducible && (
                                                <span className="text-[6px] bg-green-500/10 text-green-500 border border-green-500/20 px-1 py-0.5 rounded-full font-black uppercase tracking-widest">IVA</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[7px] text-zinc-500 uppercase font-black tracking-widest">{g.categoria}</span>
                                            <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                            <span className="text-[7px] text-zinc-400 font-bold">{new Date(g.fecha).toLocaleDateString('es-ES')}</span>
                                        </div>
                                    </div>
                                    <span className="text-sm font-black text-white tabular-nums tracking-tighter">
                                        {g.monto.toFixed(2)}€
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[8px] font-black text-zinc-400 uppercase tracking-widest">
                                            <Wallet className="w-2 h-2" />
                                            {g.metodo_pago}
                                        </span>
                                        {g.factura_uuid && (
                                            <a 
                                                href={`/f/${g.factura_uuid}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-500 uppercase tracking-widest active:scale-95 transition-transform"
                                            >
                                                <FileText className="w-2 h-2" />
                                                Factura
                                            </a>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(g.id)}
                                        className="p-1.5 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all border border-zinc-800"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Shared Footer (Totals) */}
                <div className="px-4 py-4 md:px-6 md:py-6 bg-zinc-950/50 border-t border-zinc-800/50 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[8px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Impacto Fiscal</span>
                        <span className="text-[10px] md:text-xs font-bold text-green-500/70">Deducible: {totalDeducible.toFixed(2)}€</span>
                    </div>
                    <div className="flex flex-col md:items-end">
                        <span className="text-[8px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Total</span>
                        <span className="text-lg md:text-2xl font-black text-white tabular-nums">
                            {totalGastos.toFixed(2)}€
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
