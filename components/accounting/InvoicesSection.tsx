'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Receipt, FileText, Loader2, ExternalLink, Upload, Calendar as CalendarIcon, Filter, X, Download, Search, Edit3, Save, Eye, FileDigit, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import useSWR from 'swr'
import { getLocalISOString } from '@/utils/date-helper'

interface Factura {
    id: string | number
    titulo: string
    tipo?: string
    fecha_documento: string
    archivo_url?: string
    created_at: string
}

interface InvoicesSectionProps {
    initialMonth?: string
    externalShowAdd?: boolean
    onCloseExternal?: () => void
}

export default function InvoicesSection({ initialMonth, externalShowAdd, onCloseExternal }: InvoicesSectionProps) {
    const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth || '')
    const [selectedType, setSelectedType] = useState<string>('')

    // Update internal state when prop changes
    useEffect(() => {
        if (initialMonth !== undefined) {
            setSelectedMonth(initialMonth)
        }
    }, [initialMonth])

    // --- SWR ---
    const { 
        data: facturas = [], 
        isLoading: loading, 
        mutate 
    } = useSWR(['invoices', selectedMonth, selectedType], async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []

        let query = supabase
            .from('facturas')
            .select('*')
            .eq('barberia_id', user.id)

        if (selectedMonth) {
            const startDate = `${selectedMonth}-01`
            const [year, month] = selectedMonth.split('-').map(Number)
            const nextMonthDate = new Date(year, month, 1)
            const endDate = nextMonthDate.toISOString().split('T')[0]
            query = query.gte('fecha_documento', startDate).lt('fecha_documento', endDate)
        }

        if (selectedType) {
            query = query.eq('tipo', selectedType)
        }

        const { data, error } = await query.order('fecha_documento', { ascending: false })
        if (error) throw error
        return data || []
    })

    // --- REALTIME ---
    useEffect(() => {
        const channel = supabase.channel('realtime-facturas')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'facturacion' }, () => { mutate() })
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [mutate])

    const [showAdd, setShowAdd] = useState(false)

    // Sincronización con el disparador externo
    useEffect(() => {
        if (externalShowAdd) {
            setShowAdd(true)
        }
    }, [externalShowAdd])

    const handleCloseAdd = () => {
        setShowAdd(false)
        if (onCloseExternal) onCloseExternal()
    }
    const [newFactura, setNewFactura] = useState({
        titulo: '',
        tipo: 'otros',
        fecha_documento: getLocalISOString(),
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
                barberia_id: user.id,
                titulo: newFactura.titulo,
                tipo: newFactura.tipo,
                fecha_documento: newFactura.fecha_documento,
                archivo_url: publicUrl
            })

            if (dbError) throw dbError

            toast.success('Factura archivada correctamente')
            setNewFactura({ titulo: '', tipo: 'otros', fecha_documento: getLocalISOString() })
            setFile(null)
            handleCloseAdd()
            mutate()
        } catch (error: any) {
            console.error('Error uploading invoice:', error)
            toast.error('Error al procesar la factura')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string | number, url?: string) => {
        const { error } = await supabase.from('facturas').delete().eq('id', id)
        if (error) {
            toast.error('Error al eliminar registro')
            return
        }

        if (url) {
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
        }
        mutate()
        toast.success('Factura eliminada')
    }

    const getFileUuid = (url?: string) => {
        if (!url) return null;
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/facturas/');
            if (pathParts.length > 1) {
                const storagePath = pathParts[1];
                return encodeURIComponent(storagePath); 
            }
        } catch (e) {
            console.warn('Could not parse file UUID:', e);
        }
        return null;
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

                    <div className="relative group/filter bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 flex items-center gap-2 hover:border-zinc-700 transition-all">
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="bg-transparent border-none text-[10px] md:text-sm font-black text-amber-500 outline-none cursor-pointer focus:ring-0 appearance-none uppercase tracking-widest [&>option]:bg-zinc-950"
                        >
                            <option value="">Todo</option>
                            <option value="alquiler">Alquiler</option>
                            <option value="suministros">Suministros</option>
                            <option value="material y productos">Material y Productos</option>
                            <option value="herramientas">Herramientas</option>
                            <option value="limpieza y mantenimiento">Limpieza y Mantenimiento</option>
                            <option value="marketing y publicidad">Marketing y Publicidad</option>
                            <option value="gestoría y seguros">Gestoría y Seguros</option>
                            <option value="dietas">Dietas</option>
                            <option value="otros">Otros</option>
                        </select>
                    </div>

                    <button
                        onClick={() => setShowAdd(!showAdd)}
                        className="p-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl transition-all shadow-lg shadow-amber-500/10 active:scale-95 flex items-center gap-2 group"
                    >
                        <Plus className={cn("w-5 h-5 transition-transform", showAdd && "rotate-45")} />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Subir Factura</span>
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showAdd && (
                    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className="bg-zinc-900 border-t md:border border-zinc-800 rounded-t-[2.5rem] md:rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90dvh]"
                        >
                            <div className="p-6 md:p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                        <Upload className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Subir Factura</h3>
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Archivador Inteligente 2026</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCloseAdd}
                                    className="p-2 hover:bg-white/10 rounded-full transition-all text-zinc-500 hover:text-white"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleAddFactura} className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Título del Documento</label>
                                        <input
                                            required
                                            value={newFactura.titulo}
                                            onChange={e => setNewFactura({ ...newFactura, titulo: e.target.value })}
                                            placeholder="Ej: Factura Alquiler Febrero..."
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-bold"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Fecha del Documento</label>
                                        <input
                                            required
                                            type="date"
                                            value={newFactura.fecha_documento}
                                            onChange={e => setNewFactura({ ...newFactura, fecha_documento: e.target.value })}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-bold [color-scheme:dark]"
                                        />
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Tipo de Factura</label>
                                        <select
                                            required
                                            value={newFactura.tipo}
                                            onChange={e => setNewFactura({ ...newFactura, tipo: e.target.value })}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-bold appearance-none cursor-pointer"
                                        >
                                            <option value="alquiler">Alquiler</option>
                                            <option value="suministros">Suministros</option>
                                            <option value="material y productos">Material y Productos</option>
                                            <option value="herramientas">Herramientas</option>
                                            <option value="limpieza y mantenimiento">Limpieza y Mantenimiento</option>
                                            <option value="marketing y publicidad">Marketing y Publicidad</option>
                                            <option value="gestoría y seguros">Gestoría y Seguros</option>
                                            <option value="dietas">Dietas</option>
                                            <option value="otros">Otros</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1 mb-2 block">Archivo PDF</label>
                                        <div className="relative group/upload">
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={handleFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div className={cn(
                                                "border-2 border-dashed rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center transition-all",
                                                file ? "border-amber-500/50 bg-amber-500/5" : "border-zinc-800 bg-zinc-950 group-hover/upload:border-amber-500/20"
                                            )}>
                                                <Upload className={cn("w-10 h-10 mb-3 transition-colors", file ? "text-amber-500" : "text-zinc-600")} />
                                                <p className="text-sm font-bold text-zinc-400">
                                                    {file ? file.name : "Selecciona o arrastra el PDF aquí"}
                                                </p>
                                                <p className="text-[10px] text-zinc-600 mt-2 uppercase font-black tracking-widest">Formato PDF Máximo 5MB</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving || !file}
                                    className="w-full py-5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-[0.2em] rounded-2xl text-[10px] transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(245,158,11,0.2)] active:scale-[0.98] disabled:opacity-20 mt-4"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Archivar en la Nube
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
                    facturas.map((f: Factura) => (
                        <div key={f.id} className="group relative bg-zinc-900 border border-zinc-800 p-5 rounded-[2rem] hover:border-amber-500/30 transition-all shadow-xl hover:shadow-amber-500/5 overflow-hidden">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
                                        <FileText className="w-6 h-6 text-zinc-500 group-hover:text-amber-500" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h4 className="text-sm font-black text-white truncate uppercase tracking-tight">
                                                {f.titulo}
                                            </h4>
                                            {f.tipo && (
                                                <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-[8px] font-black text-amber-500 uppercase rounded-full tracking-widest">
                                                    {f.tipo}
                                                </span>
                                            )}

                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <CalendarIcon className="w-3 h-3 text-zinc-600" />
                                            <p className="text-[10px] font-bold text-zinc-500">{new Date(f.fecha_documento).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {f.archivo_url && getFileUuid(f.archivo_url) ? (
                                    <a
                                        href={`/f/${getFileUuid(f.archivo_url)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-zinc-700/50 shadow-lg active:scale-95"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
                                        Abrir PDF
                                    </a>
                                ) : (
                                    <span className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                        <FileText className="w-3.5 h-3.5 opacity-50" />
                                        PDF no disponible
                                    </span>
                                )}

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
