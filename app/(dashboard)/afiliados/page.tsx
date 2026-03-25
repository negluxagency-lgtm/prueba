'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Rocket, Coins, Users, Handshake, Check, Copy, Star, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function AfiliadosPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<any>(null)
    const [copied, setCopied] = useState(false)
    const [joining, setJoining] = useState(false)

    const fetchProfile = useCallback(async () => {
        setLoading(true)
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()

            if (sessionError || !session) {
                router.push('/')
                return
            }

            const { data, error } = await supabase
                .from('perfiles')
                .select('afiliado, codigo, cantidad_ganada, cantidad_afiliados, plan')
                .eq('id', session.user.id)
                .single()

            if (error) {
                console.error('Error fetching profile:', error)
                toast.error('Error al cargar datos del perfil')
            } else {
                setProfile(data)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }, [router])

    useEffect(() => {
        fetchProfile()
    }, [fetchProfile])

    const copyToClipboard = () => {
        if (!profile?.codigo) return
        navigator.clipboard.writeText(profile.codigo)
        setCopied(true)
        toast.success('Código copiado al portapapeles')
        setTimeout(() => setCopied(false), 2000)
    }

    const handleJoinProgram = async () => {
        setJoining(true)
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()
            if (sessionError || !session) throw new Error('No session')

            const { error } = await supabase
                .from('perfiles')
                .update({ afiliado: true })
                .eq('id', session.user.id)

            if (error) throw error

            setProfile((prev: any) => ({ ...prev, afiliado: true }))
            toast.success('¡Te has unido al Programa de Afiliados!')
        } catch (error) {
            console.error('Error joining affiliate program:', error)
            toast.error('Error al unirse al programa')
        } finally {
            setJoining(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-zinc-800 border-t-amber-500 rounded-full animate-spin"></div>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest animate-pulse">
                        Cargando panel...
                    </p>
                </div>
            </div>
        )
    }

    // VISTA DE AFILIADO ACTIVO (Si tiene código, ya es afiliado por defecto gracias a n8n)
    if (profile?.afiliado && profile?.codigo) {
        const balance = profile.cantidad_ganada || 0
        const afiliadosCount = profile.cantidad_afiliados || 0
        const code = profile.codigo

        return (
            <div className="-mt-6 lg:mt-0 min-h-[calc(100vh+1.5rem)] lg:min-h-screen bg-[#0a0a0a] p-4 lg:p-8 pt-[6.5rem] lg:pt-8 relative overflow-hidden">
                {/* Ambience */}
                <div className="absolute -top-20 lg:top-0 right-0 w-[150%] lg:w-full h-[800px] lg:h-[1000px] bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.15),transparent_60%)] pointer-events-none" />

                <div className="max-w-4xl mx-auto space-y-8 relative z-10">
                    <div className="text-center lg:text-left mb-6">
                        <h1 className="text-3xl lg:text-4xl font-black text-white italic uppercase tracking-tighter">
                            Tu Panel de <span className="text-amber-500">Afiliado</span>
                        </h1>
                        <p className="text-zinc-400 text-sm mt-3 lg:mt-2">
                            Comparte tu código con otros barberos y gana recompensas.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Código de Afiliado */}
                        <div className="bg-gradient-to-br from-amber-500/10 to-zinc-900/50 border border-amber-500/30 rounded-2xl p-6 lg:p-8 flex flex-col justify-center items-center text-center space-y-6">
                            <div className="p-3 bg-amber-500/20 rounded-xl">
                                <Rocket className="w-8 h-8 text-amber-500" />
                            </div>
                            <div className="space-y-2 w-full">
                                <h3 className="text-zinc-400 font-medium text-sm">Tu Código Único</h3>
                                <div
                                    onClick={copyToClipboard}
                                    className="w-full bg-black border border-zinc-800 rounded-xl py-4 px-6 flex items-center justify-between cursor-pointer hover:border-amber-500/50 transition-colors group"
                                >
                                    <span className="text-2xl lg:text-3xl font-black text-white tracking-widest font-mono">
                                        {code}
                                    </span>
                                    <div className={`p-2 rounded-lg transition-colors ${copied ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-800 text-zinc-400 group-hover:bg-amber-500/20 group-hover:text-amber-500'}`}>
                                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-zinc-500">
                                Comparte este código. Los nuevos usuarios deberán introducirlo al suscribirse por primera vez.
                            </p>
                        </div>

                        {/* Balance y Estadísticas */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 lg:p-8 space-y-8 flex flex-col">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-zinc-500 font-bold text-xs uppercase tracking-widest mb-2">Ingresos</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl lg:text-5xl font-black text-white italic tracking-tighter">
                                            {balance}
                                        </span>
                                        <span className="text-xl font-bold text-amber-500">€</span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-zinc-500 font-bold text-xs uppercase tracking-widest mb-2">Referidos</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl lg:text-5xl font-black text-white italic tracking-tighter">
                                            {afiliadosCount}
                                        </span>
                                        <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest ml-2">Barberos</span>
                                    </div>
                                </div>
                            </div>

                            {afiliadosCount > 0 && balance === 0 && (
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                                    <div className="mt-0.5 shrink-0">
                                        <Coins className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <p className="text-sm text-zinc-300 leading-relaxed">
                                        <strong className="text-amber-500 font-bold">Enhorabuena, tienes saldo pendiente:</strong> Las ganancias se sumarán aquí una vez que tus referidos completen su primer pago de suscripción oficial.
                                    </p>
                                </div>
                            )}

                            <div className="mt-auto pt-6 border-t border-zinc-800">
                                <h4 className="text-white text-sm font-bold mb-4">¿Cómo funciona tu saldo?</h4>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <span className="text-xs text-zinc-400 leading-relaxed">
                                            Tu código <strong className="text-white">no tiene límite de usos</strong>. Cuantos más barberos invites, más ganarás.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                        <span className="text-xs text-zinc-400 leading-relaxed">
                                            Cuando un barbero se suscriba con tu código, obtendrás comisiones que se irán sumando a este balance. <strong>Las comisiones se acreditan tras el primer pago real</strong> de la suscripción (una vez finalizado el periodo promocional inicial).
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                        <span className="text-xs text-zinc-400 leading-relaxed">
                                            <strong className="text-white">Resumiendo, te llevas el 100% del primer mes de suscripción real de cada barbero que invites. Sin límites.</strong>
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // VISTA DE LANDING PARA NO AFILIADOS (Aún no tienen código de n8n)
    return (
        <div className="-mt-6 lg:mt-0 min-h-[calc(100vh+1.5rem)] lg:min-h-screen bg-[#0a0a0a] p-4 lg:p-8 pt-[6.5rem] lg:pt-8 relative overflow-hidden flex flex-col justify-center">
            {/* Background Ambience */}
            <div className="absolute -top-20 lg:top-0 left-0 w-[150%] lg:w-full h-[800px] lg:h-[1000px] bg-[radial-gradient(circle_at_top_center,rgba(245,158,11,0.12),transparent_60%)] pointer-events-none -translate-x-1/4 lg:translate-x-0" />

            <div className="max-w-3xl mx-auto w-full relative z-10 text-center space-y-12">
                <div className="space-y-6">
                    <div className="inline-flex items-center justify-center p-4 bg-amber-500/10 rounded-full border border-amber-500/20 mb-4 animate-[bounce_3s_ease-in-out_infinite]">
                        <Coins className="w-12 h-12 text-amber-500" />
                    </div>

                    <h1 className="text-4xl lg:text-6xl font-black italic uppercase tracking-tighter text-white">
                        <span className="text-amber-500">Gana ingresos ilimitados</span> recomendando Nelux
                    </h1>

                    <p className="text-zinc-400 text-base lg:text-xl max-w-2xl mx-auto">
                        Únete hoy al Programa de Afiliados Exclusivo para Barberos Registrados y convierte tu experiencia con nosotros en ingresos directos.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 hover:border-amber-500/30 transition-colors">
                        <Star className="w-8 h-8 text-amber-500 mb-4" />
                        <h3 className="text-white font-bold text-lg mb-2">1. Obtén tu Código Único</h3>
                        <p className="text-zinc-400 text-sm">
                            Tu código se generará automáticamente en cuanto inicies tu primera suscripción.
                        </p>
                    </div>

                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 hover:border-amber-500/30 transition-colors">
                        <Users className="w-8 h-8 text-amber-500 mb-4" />
                        <h3 className="text-white font-bold text-lg mb-2">2. Compártelo con Compañeros</h3>
                        <p className="text-zinc-400 text-sm">
                            Pasa tu código a otros dueños de barberías. Solo es válido en su primera suscripción.
                        </p>
                    </div>

                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 hover:border-amber-500/30 transition-colors">
                        <Handshake className="w-8 h-8 text-amber-500 mb-4" />
                        <h3 className="text-white font-bold text-lg mb-2">3. Gana Recompensas</h3>
                        <p className="text-zinc-400 text-sm">
                            El valor de su suscripción se suma a tu balance tras su primer pago real. No hay límite de ganancias.
                        </p>
                    </div>
                </div>

                <div className="pt-8 flex flex-col items-center gap-4">
                    {!profile?.afiliado ? (
                        <button
                            onClick={handleJoinProgram}
                            disabled={joining}
                            className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-black text-sm uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] disabled:opacity-50"
                        >
                            {joining ? (
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Rocket className="w-5 h-5" />
                            )}
                            {joining ? 'Uniendo...' : 'Unirme al programa de afiliados'}
                        </button>
                    ) : (
                        <div className="bg-zinc-900/80 border border-amber-500/20 text-amber-500 px-6 py-4 rounded-xl text-sm font-bold uppercase tracking-widest text-center">
                            Para activar tu panel de afiliado y ver tu código, necesitas tener una suscripción activa.
                        </div>
                    )}

                    <p className="text-xs text-zinc-600 font-medium max-w-xl text-center mt-2">
                        * Aplicable a todos los planes. Las comisiones se acreditan exclusivamente tras el primer pago real de la suscripción del referido (excluyendo pagos promocionales de 0€).
                    </p>
                </div>
            </div>
        </div>
    )
}
