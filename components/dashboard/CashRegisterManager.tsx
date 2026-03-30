'use client'

import React, { useState, useEffect } from 'react'
import { AlertCircle, Lock, Unlock, DollarSign, Calculator, AlertTriangle, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react'
import { getCajaByDate, abrirCaja, cerrarCaja, getExpectedCash, getDashboardStats } from '@/app/actions/cash'
import { CashRegisterSkeleton } from '@/components/ui/SkeletonLoader'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import useSWR from 'swr'
import Link from 'next/link'

interface CashRegisterManagerProps {
    shopId: string
    userName?: string
    onStatusChange?: () => void
    selectedDate?: string
}

export const CashRegisterManager: React.FC<CashRegisterManagerProps> = ({ shopId, userName, onStatusChange, selectedDate }) => {
    const [isOpeningModal, setIsOpeningModal] = useState(false)
    const [isClosingModal, setIsClosingModal] = useState(false)
    const [monto, setMonto] = useState('')
    const [expectedCash, setExpectedCash] = useState<number | null>(null)
    const [observaciones, setObservaciones] = useState('')

    const dateSpain = new Date(Date.now() + 3600000).toISOString().split('T')[0]
    const targetDate = selectedDate || dateSpain
    const isPast = targetDate < dateSpain
    const isFuture = targetDate > dateSpain

    // SWR para la caja
    const { data: caja, mutate: mutateCaja, isLoading: boxLoading } = useSWR(
        shopId ? ['caja', shopId, targetDate] : null,
        async () => {
            const res = await getCajaByDate(shopId, targetDate)
            return res.success ? res.data : null
        }
    )

    // SWR para estadísticas (ingresos)
    const { data: stats, mutate: mutateStats, isLoading: statsLoading } = useSWR(
        shopId ? ['cash-stats', shopId] : null,
        async () => {
            const res = await getDashboardStats(shopId, new Date().toISOString().split('T')[0])
            return res.success ? res.data : null
        }
    )

    const loading = boxLoading || statsLoading

    const onStatusChangeRef = React.useRef(onStatusChange)
    useEffect(() => { onStatusChangeRef.current = onStatusChange }, [onStatusChange])

    useEffect(() => {
        if (!shopId) return

        const channel = supabase
            .channel(`cash-manager-${shopId}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'arqueos_caja'
            }, (payload) => {
                const isRelevant = (payload.new as any)?.barberia_id === shopId || (payload.old as any)?.barberia_id === shopId
                if (isRelevant) {
                    mutateCaja()
                    mutateStats()
                    onStatusChangeRef.current?.()
                }
            })
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'metricas_diarias'
            }, (payload) => {
                const isRelevant = (payload.new as any)?.barberia_id === shopId
                if (isRelevant) {
                    mutateStats()
                    onStatusChangeRef.current?.()
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [shopId, mutateCaja, mutateStats])

    const handleOpen = async () => {
        const val = parseFloat(monto)
        if (isNaN(val)) return toast.error('Introduce un monto válido')
        
        const res = await abrirCaja(shopId, val, userName)
        if (res.success) {
            toast.success('Caja abierta correctamente')
            setIsOpeningModal(false)
            setMonto('')
            mutateCaja()
            mutateStats()
            onStatusChange?.()
        } else {
            toast.error(res.error || 'Error al abrir caja')
        }
    }

    const prepareClosure = async () => {
        const expected = await getExpectedCash(shopId)
        setExpectedCash(expected)
        setIsClosingModal(true)
    }

    const handleClose = async (finalAmount: number) => {
        const res = await cerrarCaja(shopId, finalAmount, observaciones, userName)
        if (res.success) {
            toast.success('Caja cerrada correctamente')
            setIsClosingModal(false)
            setMonto('')
            setObservaciones('')
            mutateCaja()
            mutateStats()
            onStatusChange?.()
        } else {
            toast.error(res.error || 'Error al cerrar caja')
        }
    }

    if (loading) return <CashRegisterSkeleton />

    return (
        <>
            <div className="h-full w-full bg-zinc-900/80 border border-zinc-800 rounded-xl lg:rounded-3xl p-3 lg:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col justify-between items-start min-w-[140px] lg:min-w-[200px] min-h-[90px] lg:min-h-[140px] transition-all relative overflow-hidden group">
                {/* Glow de fondo ambiental muy sutil */}
                <div className={cn(
                    "absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-20 pointer-events-none transition-colors duration-1000",
                    caja?.estado === 'abierta' ? "bg-emerald-500" : (caja?.estado === 'cerrada' ? "bg-zinc-500" : "bg-amber-500")
                )} />

                <div className="w-full flex items-center justify-between mb-3 border-b border-zinc-800/50 pb-2.5 relative z-10">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "w-2 h-2 rounded-full shadow-sm",
                            caja?.estado === 'abierta' ? "bg-emerald-500 shadow-emerald-500/50 animate-pulse" : (caja?.estado === 'cerrada' ? "bg-zinc-500" : "bg-amber-500 shadow-amber-500/50 animate-pulse")
                        )} />
                        <span className={cn(
                            "text-[8px] lg:text-[10px] font-black uppercase tracking-widest truncate",
                            caja?.estado === 'abierta' ? "text-emerald-400" : (caja?.estado === 'cerrada' || (isPast && !caja) ? "text-zinc-400" : "text-amber-400")
                        )}>
                            {caja?.estado === 'abierta' ? 'Caja Abierta' : (caja?.estado === 'cerrada' ? 'Caja Cerrada' : (isPast ? 'Caja no abierta' : 'Apertura Pendiente'))}
                        </span>
                    </div>
                </div>

                {isPast ? (
                    <div className="w-full space-y-3 lg:space-y-4 relative z-10 mt-auto">
                        <div>
                            <p className="hidden lg:block text-[8px] lg:text-[9px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Caja del día {targetDate.split('-').reverse().join('-')}</p>
                            {!caja ? (
                                <p className="text-[10px] lg:text-xs font-black text-zinc-500 uppercase tracking-widest">
                                    Caja no abierta
                                </p>
                            ) : (
                                <p className="text-[10px] lg:text-xs font-medium text-zinc-400">
                                    Apertura: <span className="text-white">{caja.monto_apertura || 0}€</span> <br/>
                                    Cierre: <span className="text-emerald-400">{caja.monto_cierre_real || 0}€</span>
                                </p>
                            )}
                        </div>
                        <Link 
                            href="/historial_caja"
                            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-[8px] lg:text-[10px] font-black uppercase tracking-widest rounded-lg lg:rounded-xl transition-all flex items-center justify-center gap-1.5"
                        >
                            Ver Historial <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                ) : isFuture ? (
                    <div className="w-full space-y-3 lg:space-y-4 relative z-10 mt-auto opacity-50">
                        <div className="hidden lg:block">
                            <p className="text-[8px] lg:text-[9px] text-zinc-500 uppercase font-bold tracking-widest mb-0.5">Pendiente</p>
                            <p className="text-[10px] lg:text-xs font-medium text-zinc-400 truncate">
                                Día no iniciado
                            </p>
                        </div>
                        <div className="w-full py-2 bg-zinc-900 border border-zinc-800 text-zinc-500 text-[8px] lg:text-[10px] font-black uppercase tracking-widest rounded-lg lg:rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed">
                            <Lock className="w-3 h-3" /> Futuro
                        </div>
                    </div>
                ) : caja?.estado === 'abierta' ? (
                    <div className="w-full space-y-3 lg:space-y-4 relative z-10 mt-auto">
                        <div>
                            <p className="text-[8px] lg:text-[9px] text-zinc-500 uppercase font-bold tracking-widest mb-0.5">Fondo Inicial</p>
                            <p className="text-xs lg:text-xl font-black text-white">{caja.monto_apertura}€</p>
                        </div>
                        <button 
                            onClick={prepareClosure}
                            className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-500 hover:text-red-400 text-[8px] lg:text-[10px] font-black uppercase tracking-widest rounded-lg lg:rounded-xl transition-all shadow-sm"
                        >
                            Cerrar Jornada
                        </button>
                    </div>
                ) : caja?.estado === 'cerrada' ? (
                    <div className="w-full space-y-3 lg:space-y-4 relative z-10 mt-auto">
                        <div>
                            <p className="hidden lg:block text-[8px] lg:text-[9px] text-zinc-500 uppercase font-bold tracking-widest mb-0.5">Caja del día {targetDate.split('-').reverse().join('-')}</p>
                            <p className="text-[10px] lg:text-xs font-medium text-zinc-400">
                                Apertura: <span className="text-white">{caja?.monto_apertura || 0}€</span> <br/>
                                Cierre: <span className="text-emerald-400">{caja?.monto_cierre_real || 0}€</span>
                            </p>
                        </div>
                        <Link 
                            href="/historial_caja"
                            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-[8px] lg:text-[10px] font-black uppercase tracking-widest rounded-lg lg:rounded-xl transition-all flex items-center justify-center gap-1.5"
                        >
                            Ver Historial <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                ) : (
                    <div className="w-full space-y-3 lg:space-y-4 relative z-10 mt-auto">
                        <div className="hidden lg:block">
                            <p className="text-[8px] lg:text-[9px] text-zinc-500 uppercase font-bold tracking-widest mb-0.5">Estado actual</p>
                            <p className="text-[10px] lg:text-xs font-medium text-zinc-400 truncate">
                                Inicia la caja para cobrar
                            </p>
                        </div>
                        <button 
                            onClick={() => setIsOpeningModal(true)}
                            className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black text-[8px] lg:text-[10px] font-black uppercase tracking-widest rounded-lg lg:rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center justify-center gap-1.5"
                        >
                            <Unlock className="w-3 h-3 lg:w-3.5 lg:h-3.5" strokeWidth={2.5} /> 
                            Abrir Caja
                        </button>
                    </div>
                )}
            </div>

            {/* Modal Apertura */}
            {isOpeningModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 max-w-md w-full shadow-2xl">
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                                <DollarSign className="w-8 h-8 text-amber-500" />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Apertura de Caja</h3>
                            <p className="text-xs text-zinc-500 font-medium mt-1">Introduce el fondo de maniobra inicial</p>
                        </div>

                        <div className="space-y-6">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Calculator className="h-5 w-5 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                                </div>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={monto}
                                    onChange={(e) => setMonto(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-2xl py-4 pl-12 pr-4 text-white text-lg font-black outline-none transition-all placeholder:text-zinc-800"
                                    autoFocus
                                />
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <span className="text-zinc-600 font-black">€</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setIsOpeningModal(false)}
                                    className="py-4 bg-zinc-950 hover:bg-zinc-900 text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-zinc-800 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleOpen}
                                    className="py-4 bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-lg shadow-amber-500/20"
                                >
                                    Iniciar Jornada
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Cierre */}
            {isClosingModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 max-w-md w-full shadow-2xl">
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                                <Lock className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Cierre de Caja</h3>
                            <p className="text-xs text-zinc-500 font-medium mt-1">Finaliza la jornada financiera actual</p>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-center">
                                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">Efectivo Esperado</p>
                                <p className="text-4xl font-black text-white italic">{expectedCash?.toFixed(2)}€</p>
                                <p className="text-[9px] text-zinc-600 font-medium mt-2 italic">(Apertura + Ventas Efectivo)</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest ml-1 mb-2 block">Efectivo Real en Cajón</label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            defaultValue={expectedCash || ''}
                                            onChange={(e) => setMonto(e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-500 rounded-2xl py-4 px-6 text-white text-xl font-black outline-none transition-all"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-6 flex items-center pointer-events-none">
                                            <span className="text-zinc-600 font-black">€</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest ml-1 mb-2 block">Observaciones / Descuadre</label>
                                    <textarea
                                        placeholder="Escribe aquí si hay algún descuadre o nota importante..."
                                        value={observaciones}
                                        onChange={(e) => setObservaciones(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-2xl py-4 px-6 text-white text-xs font-medium outline-none transition-all resize-none h-24"
                                    />
                                </div>
                            </div>

                            {monto && parseFloat(monto) !== expectedCash && (
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                                    <p className="text-[10px] text-amber-500 font-bold leading-tight">
                                        Hay un descuadre de <span className="underline">{(parseFloat(monto) - (expectedCash || 0)).toFixed(2)}€</span> respecto al esperado.
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setIsClosingModal(false)}
                                    className="py-4 bg-zinc-950 hover:bg-zinc-900 text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-zinc-800 transition-all"
                                >
                                    Volver
                                </button>
                                <button 
                                    onClick={() => handleClose(monto ? parseFloat(monto) : (expectedCash || 0))}
                                    className="py-4 bg-white hover:bg-zinc-200 text-black text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95"
                                >
                                    Confirmar Cierre
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
