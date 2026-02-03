'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { manageSubscription } from '@/app/actions/manage-subscription'
import { Store, CreditCard, Calendar, Mail, User, LogOut, Headset, Settings, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Paywall } from '@/components/Paywall'
import { ResetPasswordButton } from '@/components/ResetPasswordButton'
import ManageSubscriptionButton from '@/components/ManageSubscriptionButton'

// Función para formatear fecha
function formatearFecha(fecha: string) {
    return new Date(fecha).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
}

// Función para obtener badge según estado
function getBadgeEstado(estado: string) {
    switch (estado) {
        case 'pagado':
            return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
        case 'impago':
            return 'bg-red-500/20 text-red-400 border-red-500/30'
        case 'prueba':
        case 'periodo_prueba':
            return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        default:
            return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
    }
}

function getTextoEstado(estado: string) {
    switch (estado) {
        case 'pagado':
            return 'Suscripción Activa'
        case 'impago':
            return 'Pago Pendiente'
        case 'prueba':
        case 'periodo_prueba':
            return 'Periodo de Prueba'
        default:
            return 'Estado Desconocido'
    }
}

export default function PerfilPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [perfil, setPerfil] = useState<any>(null)
    const [email, setEmail] = useState('')
    const [userId, setUserId] = useState('')

    const cargarPerfil = useCallback(async () => {
        setLoading(true)
        try {
            // Obtener sesión actual
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()

            if (sessionError || !session) {
                router.push('/')
                return
            }

            setUserId(session.user.id)
            setEmail(session.user.email || '')

            // Obtener datos del perfil desde la tabla perfiles
            const { data: perfilData, error: perfilError } = await supabase
                .from('perfiles')
                .select('*')
                .eq('id', session.user.id)
                .single()

            if (perfilError) {
                console.error('Error al obtener perfil:', perfilError)
                toast.error('Error al cargar datos del perfil')
                return
            }

            setPerfil(perfilData)
        } catch (error) {
            console.error('Error:', error)
            toast.error('Error inesperado al cargar el perfil')
        } finally {
            setLoading(false)
        }
    }, [router])

    useEffect(() => {
        cargarPerfil()
    }, [cargarPerfil])

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut()

            if (error) {
                toast.error('Error al cerrar sesión')
                console.error('Error:', error)
                return
            }

            toast.success('Sesión cerrada correctamente')
            router.push('/')
            router.refresh()
        } catch (error) {
            toast.error('Error inesperado al cerrar sesión')
            console.error('Error:', error)
        }
    }

    const handleManageSubscription = async () => {
        try {
            await manageSubscription(email)
        } catch (error: any) {
            toast.error(error.message || 'Error al abrir el portal de Stripe')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-zinc-800 border-t-amber-500 rounded-full animate-spin"></div>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest animate-pulse">
                        Cargando perfil...
                    </p>
                </div>
            </div>
        )
    }

    if (!perfil) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-2">Error al cargar perfil</h1>
                    <p className="text-zinc-400">No se pudo cargar la información del perfil</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-white">
                        Perfil de Barbería
                    </h1>
                    <p className="text-sm text-zinc-500">
                        ID: {userId}
                    </p>
                </div>

                {/* Tarjeta 1: Datos Generales */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <Store className="w-6 h-6 text-amber-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-white">
                            Datos Generales
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {/* Nombre del negocio */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Nombre del Negocio
                            </label>
                            <input
                                type="text"
                                value={perfil.nombre_barberia || 'Sin nombre'}
                                disabled
                                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 
                                         rounded-lg text-white disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* Link para agendar */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                <ExternalLink className="w-4 h-4" />
                                Link para agendar en tu barbería
                            </label>
                            <input
                                type="text"
                                value={`app.nelux.es/${perfil.slug || '(sin-slug)'}`}
                                disabled
                                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 
                                         rounded-lg text-white disabled:opacity-60 disabled:cursor-not-allowed"
                            />

                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                disabled
                                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 
                                         rounded-lg text-white disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* Miembro desde */}
                        <div className="flex items-center gap-2 text-zinc-400">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">
                                Miembro desde: <span className="text-white font-medium">
                                    {formatearFecha(perfil.created_at)}
                                </span>
                            </span>
                        </div>

                        {/* Botón Cambiar Datos */}
                        <div className="pt-4 border-t border-zinc-800/50">
                            <Link
                                href="/configuracion"
                                className="inline-flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 bg-zinc-800 hover:bg-zinc-700 
                                         text-white text-[10px] md:text-sm font-bold uppercase tracking-widest rounded-xl 
                                         border border-zinc-700 hover:border-zinc-600 transition-all active:scale-95"
                            >
                                <Settings className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" />
                                <span className="leading-none">Cambiar Datos de Configuración</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Tarjeta 2: Suscripción y Facturación */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <CreditCard className="w-6 h-6 text-amber-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-white">
                            Suscripción y Facturación
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {/* Estado */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">
                                Estado de Suscripción
                            </label>
                            <div>
                                <span className={`inline-block px-4 py-2 rounded-lg border font-medium text-sm
                                                ${getBadgeEstado(perfil.estado)}`}>
                                    {getTextoEstado(perfil.estado)}
                                </span>
                            </div>
                        </div>

                        {/* Botón de gestión - Solo visible si no es periodo de prueba */}
                        {perfil.estado !== 'prueba' && perfil.estado !== 'periodo_prueba' && (
                            <ManageSubscriptionButton className="w-full" />
                        )}
                    </div>
                </div>

                {/* Tarjeta 3: Planes y Precios */}
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 overflow-hidden">
                    <Paywall variant="pricing" isSection={true} />
                </div>

                {/* Tarjeta 4: Contactar con Soporte */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <Headset className="w-6 h-6 text-amber-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-white">
                            Contactar con Soporte
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm text-zinc-400">
                            ¿Tienes alguna duda o problema técnico? Nuestro equipo está listo para ayudarte por WhatsApp.
                        </p>
                        <a
                            href="https://wa.me/34623064127"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 
                                     text-white font-medium rounded-lg transition-all duration-200
                                     border border-zinc-700 hover:border-zinc-600 text-center block"
                        >
                            Hablar con Soporte
                        </a>
                    </div>
                </div>

                {/* Zona de Peligro */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <div className="border-t border-red-900/30 pt-6">
                        <h3 className="text-sm font-semibold text-red-400 mb-3">
                            Zona de Peligro
                        </h3>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 
                                       bg-red-950/30 hover:bg-red-900/40 border border-red-800/50 
                                       hover:border-red-700 text-red-400 hover:text-red-300 
                                       rounded-lg transition-all duration-200"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="font-medium">Cerrar Sesión</span>
                        </button>
                        <ResetPasswordButton email={email} />
                    </div>
                </div>
            </div>
        </div>
    )
}
