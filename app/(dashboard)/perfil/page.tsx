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
    CheckCircle2, AlertTriangle, Shield
} from 'lucide-react'
import { toast } from 'sonner'
import { Paywall } from '@/components/Paywall'
import { ResetPasswordButton } from '@/components/ResetPasswordButton'
import ManageSubscriptionButton from '@/components/ManageSubscriptionButton'
import { useSubscription } from '@/hooks/useSubscription'
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
            <div className="relative group/banner">
                <div
                    className="h-[160px] lg:h-[480px] w-full bg-zinc-900 relative overflow-hidden"
                    style={{ backgroundImage: `url(${perfil.banner_url || '/images/default_banner.jpg'})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                >
                    {/* Glass Overlay Superior */}
                    <div className="absolute inset-0 bg-black/20 group-hover/banner:bg-black/10 transition-all duration-700" />
                    
                    {/* Degradado inferior progresivo (High Visual Depth) */}
                    <div className="absolute inset-x-0 bottom-0 h-40 lg:h-64 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent z-10" />
                    
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
                    <div className="absolute top-4 right-4 lg:bottom-10 lg:right-10 lg:top-auto z-30">
                        <button
                            onClick={() => bannerInputRef.current?.click()}
                            disabled={uploadingBanner}
                            className="flex items-center gap-2 px-4 py-2 bg-black/60 hover:bg-black/80 backdrop-blur-xl text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl border border-white/10 hover:border-amber-500/50 transition-all shadow-2xl disabled:opacity-50 active:scale-95 group/btn"
                        >
                            {uploadingBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RocketIcon className="w-3.5 h-3.5 text-amber-500 group-hover/btn:rotate-12 transition-transform" />}
                            {uploadingBanner ? 'Sincronizando...' : 'Personalizar Banner'}
                        </button>
                    </div>
                </div>

                {/* Avatar flotante & Bio */}
                <div className="px-4 lg:px-12 relative z-20 -mt-16 lg:-mt-24">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col lg:flex-row items-center lg:items-end gap-6 lg:gap-10">
                            {/* Logo Wrapper */}
                            <div className="relative">
                                <div className="w-28 h-28 lg:w-40 lg:h-40 rounded-[2rem] lg:rounded-[3rem] border-[6px] border-[#0a0a0a] overflow-hidden bg-zinc-900 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-500">
                                    <AvatarUpload
                                        currentImageUrl={perfil?.logo_url}
                                        onFileSelect={setAvatarFile}
                                        loading={uploadingLogo}
                                    />
                                </div>
                                {/* Status Orb */}
                                <div className={cn(
                                    "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-[#0a0a0a] shadow-lg",
                                    perfil.estado === 'pagado' ? "bg-emerald-500" : "bg-amber-500"
                                )} />
                            </div>

                            {/* Bio & Actions */}
                            <div className="flex-1 flex flex-col lg:flex-row items-center lg:items-end justify-between gap-6 pb-2 text-center lg:text-left">
                                <div className="space-y-1">
                                    <h1 className="text-2xl lg:text-5xl font-black italic text-white leading-none tracking-tighter uppercase">
                                        {perfil.nombre_barberia || 'Tu Barbería'}
                                    </h1>
                                    <div className="flex items-center justify-center lg:justify-start gap-2 pt-1">
                                        <div className="px-3 py-1 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full flex items-center gap-2 shadow-inner">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                            <p className="text-[10px] lg:text-xs text-zinc-400 font-black uppercase tracking-widest">
                                                app.nelux.es/<span className="text-amber-500">{perfil.slug || 'sin-slug'}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap justify-center lg:justify-end items-center gap-3">
                                    {avatarFile && (
                                        <button
                                            onClick={handleUploadLogo}
                                            disabled={uploadingLogo}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                                        >
                                            {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                            Guardar Cambios
                                        </button>
                                    )}
                                    <Link
                                        href="/ajustes"
                                        className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-xl active:scale-95 group"
                                    >
                                        <Settings className="w-4 h-4 text-amber-500 group-hover:rotate-45 transition-transform" />
                                        Ajustes
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-800 text-red-400 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                </div>
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
                        <div className="lg:col-span-7 flex flex-col gap-6 order-1">

                            {/* Datos Generales y Cierres Mensuales */}
                            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-[2.5rem] p-6 lg:p-10 space-y-10 shadow-2xl">
                                {/* Datos de Negocio */}
                                <div>
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-inner">
                                            <Store className="w-6 h-6 text-amber-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black uppercase tracking-tighter text-white italic">Gestión de Negocio</h2>
                                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Identidad y credenciales registradas</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="group/item">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2 group-hover/item:text-amber-500 transition-colors">Nombre del Establecimiento</p>
                                            <p className="text-base text-white font-black truncate">{perfil.nombre_barberia || '—'}</p>
                                        </div>
                                        <div className="group/item">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2 group-hover/item:text-amber-500 transition-colors">Email de Administración</p>
                                            <p className="text-base text-white font-black truncate">{email}</p>
                                        </div>
                                        <div className="group/item">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2 group-hover/item:text-amber-500 transition-colors">Link de Reserva Público</p>
                                            <p className="text-sm text-amber-500 font-black truncate bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-2 mt-1">app.nelux.es/{perfil.slug || '(sin-slug)'}</p>
                                        </div>
                                        {perfil.plan !== 'Básico' && (
                                            <div className="group/item">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2 group-hover/item:text-amber-500 transition-colors">Panel Staff 360º</p>
                                                <p className="text-sm text-amber-500 font-black truncate bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-2 mt-1">app.nelux.es/{perfil.slug || '(sin-slug)'}/staff</p>
                                            </div>
                                        )}
                                        <div className="md:col-span-2 pt-2">
                                            <div className="flex items-center gap-3 text-zinc-500 bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
                                                <CalendarIcon className="w-4 h-4 shrink-0" />
                                                <p className="text-[11px] font-bold uppercase tracking-widest">Miembro desde el <span className="text-white">{formatearFecha(perfil.created_at)}</span></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Días de Cierre */}
                                <div className="pt-10 border-t border-zinc-800/60">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center border border-zinc-700/50 shadow-inner group-hover:bg-amber-500/10 transition-colors">
                                                <CalendarIcon className="w-6 h-6 text-zinc-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black uppercase tracking-tighter text-white italic">Cierres Mensuales</h2>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        perfil.calendario_confirmado ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                                                    )} />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                                        {perfil.calendario_confirmado ? 'Calendario Verificado' : 'Confirmación Pendiente'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowClosingModal(true)}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all border border-zinc-800 active:scale-95 group shadow-xl"
                                        >
                                            Gestionar Cierres
                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                    
                                    <div className="p-6 bg-zinc-950/50 border border-zinc-800 rounded-3xl">
                                        <p className="text-xs text-zinc-500 mb-4 font-medium leading-relaxed italic">Marca los días festivos o de baja para evitar solapamientos en la agenda.</p>
                                        {perfil.fechas_cierre && perfil.fechas_cierre.length > 0 ? (
                                            <div className="flex flex-wrap gap-2.5">
                                                {[...perfil.fechas_cierre].sort().map((fecha: string) => (
                                                    <span key={fecha} className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-xl text-xs font-black shadow-lg border-b-2 border-b-amber-500/20">
                                                        {fecha.split('-').reverse().slice(0, 2).join('/')}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                <p className="text-[11px] font-black text-emerald-500/80 uppercase tracking-widest">Barbería operativa 24/7 este mes</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

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
                        </div>

                        {/* ══════════ COLUMNA DERECHA (5/12) ══════════ */}
                        <div className="lg:col-span-5 flex flex-col gap-6 order-2">

                            {/* Suscripción */}
                            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-[2.5rem] p-6 lg:p-8 space-y-6 shadow-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-inner">
                                        <CreditCard className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black uppercase tracking-tighter text-white italic">Suscripción</h2>
                                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Estado y facturación del servicio</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Plan Nelux</p>
                                        <p className="text-lg font-black text-white italic tracking-tighter uppercase">{perfil.plan || '—'}</p>
                                    </div>
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest shadow-sm",
                                        getBadgeEstado(perfil.estado)
                                    )}>
                                        {getTextoEstado(perfil.estado)}
                                    </span>
                                </div>

                                <div className="border-t border-zinc-800/80 pt-6">
                                    <div className="rounded-[2.5rem] overflow-hidden border border-zinc-800/50 bg-black/40 p-1">
                                        <Paywall variant="pricing" isSection={true} showAllPlans={false} />
                                    </div>
                                </div>

                                {perfil.estado !== 'prueba' && perfil.estado !== 'periodo_prueba' && (
                                    <div className="mt-4">
                                        <ManageSubscriptionButton className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all border border-zinc-700 shadow-xl active:scale-95" />
                                    </div>
                                )}
                            </div>

                            {/* Cuenta & Soporte (Desktop) */}
                            <div className="hidden lg:block bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-[2.5rem] p-8 space-y-4 shadow-2xl">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center border border-zinc-700/50 shadow-inner">
                                        <Shield className="w-6 h-6 text-zinc-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black uppercase tracking-tighter text-white italic">Centro de Seguridad</h2>
                                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Soporte y gestión de acceso</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <a
                                        href="https://wa.me/34623064127"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg active:scale-95 group"
                                    >
                                        <Headset className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                                        Asistencia en Directo
                                    </a>

                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/30 text-red-500/80 hover:text-red-400 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Finalizar Sesión
                                    </button>

                                    <div className="pt-2 border-t border-zinc-800/50 mt-2 flex justify-center">
                                        <ResetPasswordButton email={email} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ══════════ SECCIÓN FINAL (Cuenta & Soporte Mobile) ══════════ */}
                        <div className="lg:hidden lg:col-span-7 flex flex-col gap-6 order-3">
                            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-[2.5rem] p-8 space-y-4 shadow-2xl">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center border border-zinc-700/50 shadow-inner">
                                        <Shield className="w-6 h-6 text-zinc-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black uppercase tracking-tighter text-white italic">Centro de Seguridad</h2>
                                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Soporte y gestión de acceso</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <a
                                        href="https://wa.me/34623064127"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg active:scale-95 group"
                                    >
                                        <Headset className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                                        Asistencia en Directo
                                    </a>

                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/30 text-red-500/80 hover:text-red-400 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Finalizar Sesión
                                    </button>

                                    <div className="pt-2 border-t border-zinc-800/50 mt-2 flex justify-center">
                                        <ResetPasswordButton email={email} />
                                    </div>
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
