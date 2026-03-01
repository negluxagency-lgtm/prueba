'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Receipt, FileText, Loader2, ExternalLink, Upload, Calendar as CalendarIcon, Filter, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Factura {
    id: number
    titulo: string
    fecha_documento: string
    archivo_url: string
    created_at: string
}

interface InvoicesSectionProps {
    initialMonth?: string // YYYY-MM
}

export default function InvoicesSection({ initialMonth }: InvoicesSectionProps) {
    const [facturas, setFacturas] = useState<Factura[]>([])
    const [loading, setLoading] = useState(true)
    const [showAdd, setShowAdd] = useState(false)
    const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth || '')
    const [newFactura, setNewFactura] = useState({
        titulo: '',
        fecha_documento: new Date().toISOString().split('T')[0]
    })
    const [file, setFile] = useState<File | null>(null)
    const [saving, setSaving] = useState(false)

    // Update internal state when prop changes, but allow local override if needed
    // (though in this case keeping it synchronized is better)
    useEffect(() => {
        if (initialMonth !== undefined) {
            setSelectedMonth(initialMonth)
        }
    }, [initialMonth])

    useEffect(() => {
        fetchFacturas()
    }, [selectedMonth])

    const fetchFacturas = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        let query = supabase
            .from('facturas')
            .select('*')
            .eq('user_id', user.id)
            .order('fecha_documento', { ascending: false })

        if (selectedMonth) {
            const [year, month] = selectedMonth.split('-').map(Number)
            const startDate = `${selectedMonth}-01`
            const nextMonthDate = new Date(year, month, 1)
            const endDate = nextMonthDate.toISOString().split('T')[0]

            query = query.gte('fecha_documento', startDate).lt('fecha_documento', endDate)
        }

        const { data, error } = await query

        if (error) {
            toast.error('Error al cargar facturas')
        } else {
            setFacturas(data || [])
        }
        setLoading(false)
    }

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

    const handleAddFactura = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) {
            toast.error('Por favor, selecciona un archivo PDF')
            return
        }

        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}/${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('facturas')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('facturas')
                .getPublicUrl(fileName)

            const { error: dbError } = await supabase.from('facturas').insert({
                user_id: user.id,
                titulo: newFactura.titulo,
                fecha_documento: newFactura.fecha_documento,
                archivo_url: publicUrl
            })

            if (dbError) throw dbError

            toast.success('Factura archivada correctamente')
            setNewFactura({ titulo: '', fecha_documento: new Date().toISOString().split('T')[0] })
            setFile(null)
            setShowAdd(false)
            fetchFacturas()
        } catch (error: any) {
            console.error('Error uploading invoice:', error)
            toast.error('Error al procesar la factura')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: number, url: string) => {
        const { error } = await supabase.from('facturas').delete().eq('id', id)
        if (error) {
            toast.error('Error al eliminar registro')
            return
        }

        try {
            const urlObj = new URL(url)
            const pathParts = urlObj.pathname.split('/facturas/')
            if (pathParts.length > 1) {
                const storagePath = pathParts[1]
                await supabase.storage.from('facturas').remove([storagePath])
            }
        } catch (e) {
            console.warn('Could not delete file from storage:', e)
        }

        setFacturas(facturas.filter(f => f.id !== id))
        toast.success('Factura eliminada')
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-amber-500" />
                        Archivo de Facturas
                    </h3>
                    <p className="text-zinc-500 text-xs font-medium">Gestión de comprobantes para {selectedMonth || 'todos los meses'}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group/filter bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 flex items-center gap-2 hover:border-zinc-700 transition-all">
                        <Filter className="w-3.5 h-3.5 text-zinc-500" />
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-transparent border-none text-[10px] md:text-sm font-black text-amber-500 outline-none cursor-pointer focus:ring-0 appearance-none uppercase tracking-widest [&::-webkit-calendar-picker-indicator]:invert"
                        />
                        {selectedMonth && (
                            <button
                                onClick={() => setSelectedMonth('')}
                                className="p-1 hover:bg-zinc-800 rounded-full transition-colors"
                            >
                                <X className="w-3 h-3 text-zinc-600 hover:text-white" />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => setShowAdd(!showAdd)}
                        className="p-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl transition-all shadow-lg shadow-amber-500/10 active:scale-95 flex items-center gap-2 group"
                    >
                        <Plus className={cn("w-5 h-5 transition-transform", showAdd && "rotate-45")} />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Nueva Factura</span>
                    </button>
                </div>
            </div>

            {showAdd && (
                <form onSubmit={handleAddFactura} className="p-5 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-5 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Título del Documento</label>
                            <input
                                required
                                value={newFactura.titulo}
                                onChange={e => setNewFactura({ ...newFactura, titulo: e.target.value })}
                                placeholder="Ej: Factura Alquiler Febrero..."
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-bold"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Fecha del Documento</label>
                            <input
                                required
                                type="date"
                                value={newFactura.fecha_documento}
                                onChange={e => setNewFactura({ ...newFactura, fecha_documento: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-amber-500/50 transition-all"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1 block mb-2">Archivo PDF</label>
                            <div className="relative group/upload">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className={cn(
                                    "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all",
                                    file ? "border-amber-500/50 bg-amber-500/5" : "border-zinc-800 bg-zinc-950 group-hover/upload:border-zinc-700"
                                )}>
                                    <Upload className={cn("w-8 h-8 mb-2 transition-colors", file ? "text-amber-500" : "text-zinc-600")} />
                                    <p className="text-xs font-bold text-zinc-400">
                                        {file ? file.name : "Selecciona o arrastra el PDF aquí"}
                                    </p>
                                    <p className="text-[9px] text-zinc-600 mt-1 uppercase font-black">Máximo 5MB</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={saving || !file}
                        className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-[0.2em] rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-xl shadow-amber-500/10 active:scale-[0.98] disabled:opacity-20"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Archivar Factura en la Nube'}
                    </button>
                </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-zinc-800/50 animate-pulse rounded-[2rem]" />
                    ))
                ) : facturas.length === 0 ? (
                    <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <FileText className="w-8 h-8 text-zinc-800" />
                        </div>
                        <p className="text-zinc-600 text-sm font-medium">No se encontraron facturas {selectedMonth ? 'para este mes' : 'archivadas'}.</p>
                        {selectedMonth && (
                            <button
                                onClick={() => setSelectedMonth('')}
                                className="text-amber-500 text-[10px] font-black uppercase tracking-widest hover:underline"
                            >
                                Ver todas las facturas
                            </button>
                        )}
                    </div>
                ) : (
                    facturas.map((f) => (
                        <div key={f.id} className="group relative bg-zinc-900 border border-zinc-800 p-5 rounded-[2rem] hover:border-amber-500/30 transition-all shadow-xl hover:shadow-amber-500/5 overflow-hidden">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
                                        <FileText className="w-6 h-6 text-zinc-500 group-hover:text-amber-500" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <h4 className="text-sm font-black text-white truncate uppercase tracking-tight">{f.titulo}</h4>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <CalendarIcon className="w-3 h-3 text-zinc-600" />
                                            <p className="text-[10px] font-bold text-zinc-500">{new Date(f.fecha_documento).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <a
                                    href={f.archivo_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-zinc-700/50 shadow-lg active:scale-95"
                                >
                                    <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
                                    Abrir PDF
                                </a>
                                <button
                                    onClick={() => handleDelete(f.id, f.archivo_url)}
                                    className="p-3 bg-zinc-950 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-zinc-800 active:scale-95"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500 to-transparent opacity-[0.03] -translate-y-8 translate-x-8 rounded-full" />
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
