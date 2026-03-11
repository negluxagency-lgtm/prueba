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
import { ShopScheduleManager } from '@/components/management/ShopScheduleManager'
import { BarberManager } from '@/components/management/BarberManager'
import { AvatarUpload } from '@/components/AvatarUpload'
import { BannerUpload } from '@/components/BannerUpload'
import { Save, Loader2, Calendar as CalendarIcon, ChevronRight } from 'lucide-react'
import MonthlyClosingModal from '@/components/MonthlyClosingModal'
import { cn } from '@/lib/utils'

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
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [uploadingLogo, setUploadingLogo] = useState(false)
    const [bannerFile, setBannerFile] = useState<File | null>(null)
    const [uploadingBanner, setUploadingBanner] = useState(false)
    const [showClosingModal, setShowClosingModal] = useState(false)

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

    const handleUploadLogo = async () => {
        if (!avatarFile || !userId) return;

        setUploadingLogo(true);
        try {
            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `${userId}/${Date.now()}.${fileExt}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('logos_barberias')
                .upload(fileName, avatarFile, { upsert: true });

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: urlData } = supabase.storage
                .from('logos_barberias')
                .getPublicUrl(fileName);

            const finalLogoUrl = urlData.publicUrl;

            // Update Profile Table
            const { error: profileError } = await supabase
                .from('perfiles')
                .update({ logo_url: finalLogoUrl })
                .eq('id', userId);

            if (profileError) throw profileError;

            // Update local state
            setPerfil((prev: any) => ({ ...prev, logo_url: finalLogoUrl }));
            setAvatarFile(null);
            toast.success('Foto de perfil actualizada');
        } catch (error: any) {
            console.error('Error:', error);
            toast.error('Error al subir imagen: ' + (error.message || 'Error desconocido'));
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleUploadBanner = async () => {
        if (!bannerFile || !userId) return;

        setUploadingBanner(true);
        try {
            const fileExt = bannerFile.name.split('.').pop();
            const fileName = `${userId}/banner_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('banner')
                .upload(fileName, bannerFile, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('banner')
                .getPublicUrl(fileName);

            const finalBannerUrl = urlData.publicUrl;

            const { error: profileError } = await supabase
                .from('perfiles')
                .update({ banner_url: finalBannerUrl })
                .eq('id', userId);

            if (profileError) throw profileError;

            setPerfil((prev: any) => ({ ...prev, banner_url: finalBannerUrl }));
            setBannerFile(null);
            toast.success('Banner actualizado correctamente');
        } catch (error: any) {
            console.error('Error:', error);
            toast.error('Error al subir el banner: ' + (error.message || 'Error desconocido'));
        } finally {
            setUploadingBanner(false);
        }
    };

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
        <div className="min-h-screen bg-[#0a0a0a] p-4 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl lg:text-4xl font-bold text-white">
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

                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        {/* Columna Izquierda: Logo y Banner */}
                        <div className="flex flex-col gap-8 w-full lg:w-64 shrink-0">
                            {/* Selector de Foto de Perfil */}
                            <div className="flex flex-col items-center gap-4 w-full">
                                <AvatarUpload
                                    currentImageUrl={perfil?.logo_url}
                                    onFileSelect={setAvatarFile}
                                    loading={uploadingLogo}
                                />
                                {avatarFile && (
                                    <button
                                        onClick={handleUploadLogo}
                                        disabled={uploadingLogo}
                                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs uppercase rounded-xl transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                        Guardar Nueva Foto
                                    </button>
                                )}
                            </div>

                            {/* Selector de Banner */}
                            <div className="flex flex-col gap-3 w-full">
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest text-center">
                                    Banner de la Barbería
                                </span>
                                <BannerUpload
                                    currentImageUrl={perfil?.banner_url}
                                    onFileSelect={setBannerFile}
                                    loading={uploadingBanner}
                                />
                                {bannerFile && (
                                    <button
                                        onClick={handleUploadBanner}
                                        disabled={uploadingBanner}
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs uppercase rounded-xl transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {uploadingBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                        Guardar Banner
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4 flex-1 w-full">
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
                                <div className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs lg:text-sm break-all font-mono min-h-[42px] flex items-center">
                                    {`app.nelux.es/${perfil.slug || '(sin-slug)'}`}
                                </div>
                            </div>

                            {/* Link portal de barberos (Solo para planes no Básicos) */}
                            {perfil.plan !== 'Básico' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                        <User className="w-4 h-4 text-amber-500" />
                                        Link portal de barberos
                                    </label>
                                    <div className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-amber-500/80 text-xs lg:text-sm font-mono break-all min-h-[42px] flex items-center">
                                        {`app.nelux.es/${perfil.slug || '(sin-slug)'}/staff`}
                                    </div>
                                </div>
                            )}

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
                                    className="inline-flex items-center gap-2 px-3 py-2 lg:px-4 lg:py-2.5 bg-zinc-800 hover:bg-zinc-700 
                                         text-white text-[10px] lg:text-sm font-bold uppercase tracking-widest rounded-xl 
                                         border border-zinc-700 hover:border-zinc-600 transition-all active:scale-95"
                                >
                                    <Settings className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-amber-500" />
                                    <span className="leading-none">Cambiar Datos de Configuración</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sección de Gestión Operativa (NUEVO) */}
                <div className={cn(
                    "grid grid-cols-1 gap-6",
                    perfil.plan === 'Básico' ? "lg:grid-cols-2" : "lg:grid-cols-3"
                )}>
                    {/* Tarjeta: Gestión de Equipo */}
                    {perfil.plan !== 'Básico' && (
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 h-fit">
                            <BarberManager perfilId={userId} />
                        </div>
                    )}

                    {/* Tarjeta: Horario de Apertura */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 h-fit text-sm">
                        <ShopScheduleManager
                            perfilId={userId}
                            initialSchedule={perfil.horario_semanal}
                        />
                    </div>

                    {/* Tarjeta: Gestión de Cierres y Vacaciones (NUEVO) */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 h-fit flex flex-col justify-between space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <CalendarIcon className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm">Cierres Mensuales</h3>
                                <p className={cn(
                                    "uppercase tracking-wider font-black transition-all",
                                    perfil.calendario_confirmado
                                        ? "text-[10px] text-zinc-500"
                                        : "text-xs text-red-500 animate-pulse"
                                )}>
                                    {perfil.calendario_confirmado ? '✓ Calendario Verificado' : '⚠ Confirmación Pendiente'}
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-zinc-400">
                            Define qué días cerrarás el próximo mes para que esos días los clientes no puedan agendar citas.
                            La APP te hará confirmar las fechas de cierre del próximo mes una semana antes de su comienzo automáticamente.
                        </p>

                        {/* Preview de fechas seleccionadas */}
                        {perfil.fechas_cierre && perfil.fechas_cierre.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-2">
                                {perfil.fechas_cierre.sort().map((fecha: string) => (
                                    <span key={fecha} className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-md text-[10px] font-bold">
                                        {fecha.split('-').reverse().slice(0, 2).join('/')}
                                    </span>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => setShowClosingModal(true)}
                            className="flex items-center justify-between w-full px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 text-white rounded-xl border border-zinc-700/50 transition-all group mt-auto"
                        >
                            <span className="text-xs font-bold uppercase tracking-widest">Abrir Calendario</span>
                            <ChevronRight className="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

                <MonthlyClosingModal
                    isOpen={showClosingModal}
                    onClose={() => setShowClosingModal(false)}
                    onSuccess={() => {
                        setPerfil((prev: any) => ({ ...prev, calendario_confirmado: true }));
                        cargarPerfil();
                    }}
                    currentClosingDates={perfil.fechas_cierre}
                />

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
                    <Paywall variant="pricing" isSection={true} showAllPlans={false} />
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
