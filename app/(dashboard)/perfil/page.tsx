'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { manageSubscription } from '@/app/actions/manage-subscription'
import {
    Store, CreditCard, LogOut, Headset,
    Settings, Rocket as RocketIcon, Coins,
    Save, Loader2, Calendar as CalendarIcon, ChevronRight,
    Users, CheckCircle2, AlertTriangle, Shield
} from 'lucide-react'
import { toast } from 'sonner'
import { Paywall } from '@/components/Paywall'
import { ResetPasswordButton } from '@/components/ResetPasswordButton'
import ManageSubscriptionButton from '@/components/ManageSubscriptionButton'
import { useSubscription } from '@/hooks/useSubscription'
import { BarberManager } from '@/components/management/BarberManager'
import { AvatarUpload } from '@/components/AvatarUpload'
import { ImageCropperDialog } from '@/components/ImageCropperDialog'
import { getCroppedImg } from '@/utils/cropImage'
import MonthlyClosingModal from '@/components/MonthlyClosingModal'
import { cn } from '@/lib/utils'

function formatearFecha(fecha: string) {
    return new Date(fecha).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
}

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
            return 'Activa'
        case 'impago':
            return 'Pago Pendiente'
        case 'prueba':
        case 'periodo_prueba':
            return 'Periodo de Prueba'
        default:
            return 'Desconocido'
    }
}

export default function PerfilPage() {
    const router = useRouter()
    const { refresh: refreshSubscription } = useSubscription()
    const [loading, setLoading] = useState(true)
    const [perfil, setPerfil] = useState<any>(null)
    const [email, setEmail] = useState('')
    const [userId, setUserId] = useState('')
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [uploadingLogo, setUploadingLogo] = useState(false)
    const [bannerFile, setBannerFile] = useState<File | null>(null)
    const [uploadingBanner, setUploadingBanner] = useState(false)
    const bannerInputRef = useRef<HTMLInputElement>(null)
    const [uncroppedBannerUrl, setUncroppedBannerUrl] = useState<string | null>(null)
    const [isBannerCropperOpen, setIsBannerCropperOpen] = useState(false)
    const [showClosingModal, setShowClosingModal] = useState(false)

    const cargarPerfil = useCallback(async () => {
        setLoading(true)
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()
            if (sessionError || !session) { router.push('/'); return }
            setUserId(session.user.id)
            setEmail(session.user.email || '')
            const { data: perfilData, error: perfilError } = await supabase
                .from('perfiles').select('*').eq('id', session.user.id).single()
            if (perfilError) {
                toast.error('Error al cargar datos del perfil'); return
            }
            setPerfil(perfilData)
        } catch { toast.error('Error inesperado al cargar el perfil') }
        finally { setLoading(false) }
    }, [router])

    useEffect(() => { cargarPerfil() }, [cargarPerfil])

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) { toast.error('Error al cerrar sesión'); return }
            toast.success('Sesión cerrada correctamente')
            router.push('/'); router.refresh()
        } catch { toast.error('Error inesperado al cerrar sesión') }
    }

    const handleUploadLogo = async () => {
        if (!avatarFile || !userId) return
        setUploadingLogo(true)
        try {
            const fileExt = avatarFile.name.split('.').pop()
            const fileName = `${userId}/${Date.now()}.${fileExt}`
            const { error: uploadError } = await supabase.storage.from('logos_barberias').upload(fileName, avatarFile, { upsert: true })
            if (uploadError) throw uploadError
            const { data: urlData } = supabase.storage.from('logos_barberias').getPublicUrl(fileName)
            const { error: profileError } = await supabase.from('perfiles').update({ logo_url: urlData.publicUrl }).eq('id', userId)
            if (profileError) throw profileError
            setPerfil((prev: any) => ({ ...prev, logo_url: urlData.publicUrl }))
            setAvatarFile(null)
            toast.success('Foto de perfil actualizada')
        } catch (error: any) { toast.error('Error al subir imagen: ' + (error.message || 'Error desconocido')) }
        finally { setUploadingLogo(false) }
    }

    const handleUploadBanner = async (fileToUpload?: File) => {
        const file = fileToUpload || bannerFile
        if (!file || !userId) return
        setUploadingBanner(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${userId}/banner_${Date.now()}.${fileExt}`
            const { error: uploadError } = await supabase.storage.from('banner').upload(fileName, file, { upsert: true })
            if (uploadError) throw uploadError
            const { data: urlData } = supabase.storage.from('banner').getPublicUrl(fileName)
            const { error: profileError } = await supabase.from('perfiles').update({ banner_url: urlData.publicUrl }).eq('id', userId)
            if (profileError) throw profileError
            setPerfil((prev: any) => ({ ...prev, banner_url: urlData.publicUrl }))
            setBannerFile(null)
            toast.success('Banner actualizado correctamente')
        } catch (error: any) { toast.error('Error al subir el banner: ' + (error.message || 'Error desconocido')) }
        finally { setUploadingBanner(false) }
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
        <div className="min-h-[calc(100vh+4.5rem)] bg-[#0a0a0a] -mt-[1.5rem] lg:mt-0 pb-24 lg:pb-8">

            {/* ── HEADER FUSION ── */}
            <div className="relative">
                <div
                    className="h-[140px] lg:h-[420px] w-full bg-zinc-900 relative overflow-hidden"
                    style={{ backgroundImage: `url(${perfil.banner_url || '/images/default_banner.jpg'})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                >
                    {/* Degradado inferior */}
                    <div className="absolute inset-x-0 bottom-0 h-30 lg:h-40 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent pointer-events-none" />
                    {/* Banner upload overlay */}
                    <input
                        ref={bannerInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            if (file.size > 8 * 1024 * 1024) { toast.error('La imagen no debe superar los 8MB'); return }
                            const objectUrl = URL.createObjectURL(file)
                            setUncroppedBannerUrl(objectUrl)
                            setIsBannerCropperOpen(true)
                            e.target.value = ''
                        }}
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-2 z-20">
                        <button
                            onClick={() => bannerInputRef.current?.click()}
                            disabled={uploadingBanner}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white font-bold text-[10px] uppercase tracking-widest rounded-lg border border-white/10 hover:border-white/20 transition-all shadow-lg disabled:opacity-50"
                        >
                            {uploadingBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                            {uploadingBanner ? 'Guardando...' : 'Cambiar banner'}
                        </button>
                    </div>
                </div>

                {/* Avatar flotante */}
                <div className="px-4 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col lg:flex-row items-center lg:items-end lg:justify-between gap-3 -mt-10 lg:-mt-16 relative z-10 text-center lg:text-left">
                            <div className="flex flex-col lg:flex-row items-center lg:items-end gap-3 lg:gap-4">
                                <div className="relative">
                                    <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-full border-4 border-[#0a0a0a] overflow-hidden bg-zinc-900 shadow-xl">
                                        <AvatarUpload
                                            currentImageUrl={perfil?.logo_url}
                                            onFileSelect={setAvatarFile}
                                            loading={uploadingLogo}
                                        />
                                    </div>
                                </div>
                                <div className="pb-1">
                                    <h1 className="text-xl lg:text-2xl font-black text-white leading-tight">
                                        {perfil.nombre_barberia || 'Tu Barbería'}
                                    </h1>
                                    <p className="text-xs text-zinc-500 font-mono mt-0.5">
                                        app.nelux.es/<span className="text-amber-500">{perfil.slug || 'sin-slug'}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap justify-center lg:justify-end items-center gap-2 pb-1 lg:mt-0 mt-2">
                                {avatarFile && (
                                    <button
                                        onClick={handleUploadLogo}
                                        disabled={uploadingLogo}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] uppercase rounded-lg transition-all disabled:opacity-50"
                                    >
                                        {uploadingLogo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                        Guardar Foto
                                    </button>
                                )}
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${getBadgeEstado(perfil.estado)}`}>
                                    {perfil.estado === 'pagado' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                                    {getTextoEstado(perfil.estado)}
                                </span>
                                <Link
                                    href="/ajustes"
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all"
                                >
                                    <Settings className="w-3.5 h-3.5 text-amber-500" />
                                    Ajustes
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── CUERPO PRINCIPAL ── */}
            <div className="px-4 lg:px-8 py-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                        {/* ══════════ COLUMNA IZQUIERDA (7/12) ══════════ */}
                        <div className="lg:col-span-7 flex flex-col gap-6 order-1 lg:order-1">

                            {/* Datos Generales (compacto) */}
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                                <div className="flex items-center gap-2.5 mb-4">
                                    <div className="p-1.5 bg-amber-500/10 rounded-lg">
                                        <Store className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">Datos Generales</h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Nombre del Negocio</p>
                                        <p className="text-sm text-white font-medium truncate">{perfil.nombre_barberia || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Email</p>
                                        <p className="text-sm text-white font-medium truncate">{email}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Link de Citas</p>
                                        <p className="text-xs text-zinc-300 font-mono truncate">app.nelux.es/{perfil.slug || '(sin-slug)'}</p>
                                    </div>
                                    {perfil.plan !== 'Básico' && (
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Portal de Barberos</p>
                                            <p className="text-xs text-amber-500/80 font-mono truncate">app.nelux.es/{perfil.slug || '(sin-slug)'}/staff</p>
                                        </div>
                                    )}
                                    <div className="sm:col-span-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Miembro desde</p>
                                        <p className="text-sm text-zinc-300">{formatearFecha(perfil.created_at)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Gestión de Equipo */}
                            {perfil.plan !== 'Básico' && (
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                                    <div className="flex items-center gap-2.5 mb-4">
                                        <div className="p-1.5 bg-amber-500/10 rounded-lg">
                                            <Users className="w-4 h-4 text-amber-500" />
                                        </div>
                                        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">
                                            Gestión de Equipo
                                        </h2>
                                    </div>
                                    <BarberManager perfilId={userId} />
                                </div>
                            )}

                            {/* Cierres Mensuales */}
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 bg-amber-500/10 rounded-lg">
                                            <CalendarIcon className="w-4 h-4 text-amber-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">Cierres Mensuales</h2>
                                            <p className={cn(
                                                "text-[10px] font-black uppercase tracking-wider mt-0.5",
                                                perfil.calendario_confirmado ? "text-zinc-600" : "text-red-500 animate-pulse"
                                            )}>
                                                {perfil.calendario_confirmado ? '✓ Calendario Verificado' : '⚠ Confirmación Pendiente'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowClosingModal(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700/50 transition-all text-xs font-bold uppercase tracking-widest group"
                                    >
                                        Abrir
                                        <ChevronRight className="w-3.5 h-3.5 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                </div>
                                <p className="text-xs text-zinc-500 mb-3">
                                    Define los días de cierre del próximo mes. Los clientes no podrán agendar en esas fechas.
                                </p>
                                {perfil.fechas_cierre && perfil.fechas_cierre.length > 0 ? (
                                    <div className="flex overflow-x-auto hide-scrollbar flex-nowrap gap-2 pb-2 -mx-5 px-5 lg:mx-0 lg:px-0">
                                        {[...perfil.fechas_cierre].sort().map((fecha: string) => (
                                            <span key={fecha} className="px-3 py-1.5 whitespace-nowrap bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-md text-[10px] font-bold">
                                                {fecha.split('-').reverse().slice(0, 2).join('/')}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-zinc-600 italic">Sin fechas de cierre configuradas</p>
                                )}
                            </div>

                            {/* Cuenta & Soporte (Desktop) */}
                            <div className="hidden lg:block bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-3">
                                <div className="flex items-center gap-2.5 mb-4">
                                    <div className="p-1.5 bg-amber-500/10 rounded-lg">
                                        <Shield className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">Cuenta & Soporte</h2>
                                </div>

                                <a
                                    href="https://wa.me/34623064127"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-white font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all"
                                >
                                    <Headset className="w-4 h-4 text-amber-500" />
                                    Hablar con Soporte
                                </a>

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Cerrar Sesión
                                </button>

                                <div className="pt-1 border-t border-zinc-800/60 flex justify-center">
                                    <ResetPasswordButton email={email} />
                                </div>
                            </div>
                        </div>

                        {/* ══════════ COLUMNA DERECHA (5/12) ══════════ */}
                        <div className="lg:col-span-5 flex flex-col gap-6 order-2 lg:order-2">

                            {/* Tarjeta de Recompensas: Afiliados (Mobile Action Card) */}
                            <div className="bg-gradient-to-b from-[#1a1500] to-zinc-900/60 border border-amber-500/30 rounded-3xl p-6 relative overflow-hidden flex flex-col items-center text-center shadow-2xl">
                                <div className="absolute -top-10 -right-10 opacity-[0.03] pointer-events-none">
                                    <Coins className="w-64 h-64 text-amber-500" />
                                </div>
                                <div className="relative z-10 w-full space-y-6">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                                        <RocketIcon className="w-3.5 h-3.5 text-amber-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Programa de Afiliados</span>
                                    </div>

                                    {perfil?.afiliado ? (
                                        <div className="w-full pt-2">
                                            <Link
                                                href="/afiliados"
                                                className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:-translate-y-0.5 active:translate-y-0"
                                            >
                                                <Coins className="w-4 h-4" />
                                                Acceder a mi panel de afiliados
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col text-left space-y-5">
                                            <div className="space-y-3">
                                                <h3 className="text-white font-bold text-lg">Gana más con Nelux</h3>
                                                <ul className="text-xs text-zinc-400 space-y-2">
                                                    <li className="flex items-start gap-2">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                        <span>Llévate el <strong className="text-amber-400">100% del primer pago</strong> de cada profesional que invites.</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                        <span>Generador automático de cupones para atraer prospectos.</span>
                                                    </li>
                                                </ul>
                                            </div>

                                            <Link
                                                href="/afiliados"
                                                className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:-translate-y-0.5 active:translate-y-0"
                                            >
                                                <RocketIcon className="w-4 h-4" />
                                                Unirme al programa de afiliados
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Suscripción */}
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1.5 bg-amber-500/10 rounded-lg">
                                        <CreditCard className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">Suscripción</h2>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Plan Actual</p>
                                        <p className="text-base font-black text-white">{perfil.plan || '—'}</p>
                                    </div>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${getBadgeEstado(perfil.estado)}`}>
                                        {getTextoEstado(perfil.estado)}
                                    </span>
                                </div>

                                <div className="border-t border-zinc-800 pt-4">
                                    <div className="lg:scale-75 lg:origin-top lg:-mb-[11rem]">
                                        <Paywall variant="pricing" isSection={true} showAllPlans={false} />
                                    </div>
                                </div>

                                {perfil.estado !== 'prueba' && perfil.estado !== 'periodo_prueba' && (
                                    <ManageSubscriptionButton className="w-full" />
                                )}
                            </div>


                        </div>

                        {/* ══════════ SECCIÓN FINAL (Cuenta & Soporte Mobile) ══════════ */}
                        <div className="lg:hidden lg:col-span-7 flex flex-col gap-6 order-3">
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-3">
                                <div className="flex items-center gap-2.5 mb-4">
                                    <div className="p-1.5 bg-amber-500/10 rounded-lg">
                                        <Shield className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">Cuenta & Soporte</h2>
                                </div>

                                <a
                                    href="https://wa.me/34623064127"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-white font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all"
                                >
                                    <Headset className="w-4 h-4 text-amber-500" />
                                    Hablar con Soporte
                                </a>

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Cerrar Sesión
                                </button>

                                <div className="pt-1 border-t border-zinc-800/60 flex justify-center">
                                    <ResetPasswordButton email={email} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {uncroppedBannerUrl && (
                <ImageCropperDialog
                    isOpen={isBannerCropperOpen}
                    imageSrc={uncroppedBannerUrl}
                    onClose={() => setIsBannerCropperOpen(false)}
                    onCropComplete={async (croppedAreaPixels) => {
                        try {
                            const croppedFile = await getCroppedImg(uncroppedBannerUrl, croppedAreaPixels)
                            if (croppedFile) {
                                setIsBannerCropperOpen(false)
                                // Guardar automáticamente
                                await handleUploadBanner(croppedFile)
                            }
                        } catch {
                            toast.error('Error al recortar la imagen')
                        }
                    }}
                    aspectRatio={3 / 1}
                />
            )}

            <MonthlyClosingModal
                isOpen={showClosingModal}
                onClose={() => setShowClosingModal(false)}
                onSuccess={(newDates) => {
                    setPerfil((prev: any) => ({
                        ...prev,
                        calendario_confirmado: true,
                        fechas_cierre: newDates
                    }))
                    refreshSubscription()
                }}
                currentClosingDates={perfil.fechas_cierre}
            />
        </div>
    )
}
