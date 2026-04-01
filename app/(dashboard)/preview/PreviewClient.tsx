'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Phone, ArrowLeft, Palette, Save, Loader2, X, Check, ImageIcon, Type } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { getProxiedUrl } from '@/utils/url-helper'
import { ImageCropperDialog } from '@/components/ImageCropperDialog'
import { getCroppedImg } from '@/utils/cropImage'
import BookingFlow from '@/components/public-booking/BookingFlow'
import { BookingService, BookingBarber } from '@/store/useBookingStore'

interface PreviewClientProps {
    profile: any
    services: BookingService[]
    barbers: BookingBarber[]
    initialColorSecundario: string
    userId: string
}

// ── Paletas predefinidas ──────────────────────────────────────────────────────

const PALETTE_PRIMARY = [
    '#0c0a09', // stone-950 (default)
    '#0f172a', // slate-900
    '#1e1b4b', // indigo-950
    '#1a1a2e', // dark navy
    '#0d1b2a', // deep ocean
    '#1c1917', // stone-900
    '#14532d', // green-900
    '#431407', // orange-950
    '#3b0764', // purple-950
    '#27272a', // zinc-800
    '#ffffff', // white
    '#f8fafc', // slate-50
]

const PALETTE_SECONDARY = [
    '#f59e0b', // amber-500 (default)
    '#3b82f6', // blue-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#10b981', // emerald-500
    '#f97316', // orange-500
    '#ef4444', // red-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
    '#ffffff', // white
    '#a78bfa', // violet-400
    '#fb923c', // orange-400
]

const PALETTE_TEXT = [
    '#ffffff', // white (default)
    '#f8fafc', // slate-50
    '#e2e8f0', // slate-200
    '#cbd5e1', // slate-300
    '#94a3b8', // slate-400
    '#64748b', // slate-500
    '#475569', // slate-600
    '#334155', // slate-700
    '#1e293b', // slate-800
    '#0f172a', // slate-900
    '#000000', // black
    '#f59e0b', // amber (accent)
]

// ── Color picker block (reutilizable) ────────────────────────────────────────

function ColorPicker({
    label,
    description,
    value,
    onChange,
    palette,
    placeholder,
}: {
    label: string
    description: string
    value: string
    onChange: (v: string) => void
    palette: string[]
    placeholder: string
}) {
    return (
        <div className="space-y-3">
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">{label}</p>
                <p className="text-[10px] text-zinc-600">{description}</p>
            </div>
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-xl border-2 border-zinc-700 overflow-hidden cursor-pointer shadow-md relative flex-shrink-0"
                    style={{ backgroundColor: value }}
                >
                    <input
                        type="color"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                </div>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                        const val = e.target.value
                        if (/^#[0-9a-fA-F]{0,6}$/.test(val)) onChange(val)
                    }}
                    maxLength={7}
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs font-mono focus:border-amber-500 outline-none transition-colors"
                    placeholder={placeholder}
                />
            </div>
            <div className="grid grid-cols-6 gap-1.5">
                {palette.map((c) => (
                    <button
                        key={c}
                        onClick={() => onChange(c)}
                        title={c}
                        className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 ${
                            value === c
                                ? 'border-white scale-110'
                                : 'border-zinc-700'
                        } ${c === '#ffffff' ? 'bg-white' : ''}`}
                        style={{ backgroundColor: c }}
                    />
                ))}
            </div>
            
            {/* Custom OS picker button */}
            <div className="relative rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-500 transition-all cursor-pointer group">
                <div className="flex items-center justify-center gap-2 py-2.5 px-3 relative z-10 pointer-events-none">
                    <Palette className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-300 group-hover:text-white transition-colors">
                        Elegir color personalizado
                    </span>
                </div>
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250%] h-[300%] opacity-0 cursor-pointer z-20"
                />
            </div>
        </div>
    )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PreviewClient({
    profile,
    services,
    barbers,
    initialColorSecundario,
    userId,
}: PreviewClientProps) {
    const colorPrimario = '#0c0a09' // Hardcoded as original
    const colorTexto = '#ffffff'    // Hardcoded as original
    const [colorSecundario, setColorSecundario] = useState(initialColorSecundario || '#f59e0b')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [isPanelOpen, setIsPanelOpen] = useState(true)

    // Banner state
    const [bannerUrl, setBannerUrl] = useState(profile.banner_url || null)
    const [uncroppedBannerUrl, setUncroppedBannerUrl] = useState<string | null>(null)
    const [isBannerCropperOpen, setIsBannerCropperOpen] = useState(false)
    const [uploadingBanner, setUploadingBanner] = useState(false)
    const bannerInputRef = useRef<HTMLInputElement>(null)

    const handleSave = async () => {
        setSaving(true)
        try {
            const { error } = await supabase
                .from('perfiles')
                .update({
                    color_secundario: colorSecundario,
                })
                .eq('id', userId)

            if (error) throw error
            setSaved(true)
            toast.success('Colores guardados correctamente')
            setTimeout(() => setSaved(false), 3000)
        } catch (err: any) {
            toast.error('Error al guardar: ' + (err.message || 'Error desconocido'))
        } finally {
            setSaving(false)
        }
    }

    const handleUploadBanner = async (fileToUpload: File) => {
        setUploadingBanner(true)
        try {
            const fileExt = fileToUpload.name.split('.').pop()
            const fileName = `${userId}/banner_${Date.now()}.${fileExt}`
            const { error: uploadError } = await supabase.storage
                .from('banner')
                .upload(fileName, fileToUpload, { upsert: true })
            if (uploadError) throw uploadError
            const { data: urlData } = supabase.storage.from('banner').getPublicUrl(fileName)
            const { error: profileError } = await supabase
                .from('perfiles')
                .update({ banner_url: urlData.publicUrl })
                .eq('id', userId)
            if (profileError) throw profileError
            setBannerUrl(urlData.publicUrl)
            toast.success('Banner actualizado correctamente')
        } catch (error: any) {
            toast.error('Error al subir el banner: ' + (error.message || 'Error desconocido'))
        } finally {
            setUploadingBanner(false)
        }
    }

    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result
            ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
            : '245, 158, 11'
    }

    const secondaryRgb = hexToRgb(colorSecundario)

    return (
        <>
            {/* ── CSS Variables ── */}
            <style>{`
                :root {
                    --color-primary: ${colorPrimario};
                    --color-secondary: ${colorSecundario};
                    --color-secondary-rgb: ${secondaryRgb};
                }
            `}</style>

            {/* ── TOP BAR ── */}
            <div className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-4 py-2.5 bg-black/90 backdrop-blur-md border-b border-zinc-800">
                <div className="flex items-center gap-3">
                    <Link
                        href="/perfil"
                        className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Perfil
                    </Link>
                    <span className="text-zinc-700">|</span>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest">
                            Modo Preview
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => setIsPanelOpen((p) => !p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all"
                >
                    <Palette className="w-3.5 h-3.5 text-amber-500" />
                    {isPanelOpen ? 'Ocultar editor' : 'Editar colores'}
                </button>
            </div>

            {/* ── MAIN LAYOUT ── */}
            <div className="flex min-h-screen pt-[44px]">

                {/* ── PORTAL PREVIEW ── */}
                <div
                    id="portal-preview-area"
                    className="flex-1 min-h-screen overflow-y-auto transition-all duration-300"
                    style={{ backgroundColor: colorPrimario, color: colorTexto }}
                >
                    {/* HERO SECTION */}
                    <header className="relative w-full">
                        <div className="max-w-5xl mx-auto md:px-8 lg:px-12">
                            {/* Banner */}
                            <div className="relative w-full h-56 md:h-72 overflow-hidden md:rounded-2xl">
                                {bannerUrl ? (
                                    <Image
                                        src={getProxiedUrl(bannerUrl)}
                                        alt={`Banner de ${profile.nombre_barberia || 'tu barbería'}`}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div
                                        className="absolute inset-0"
                                        style={{
                                            background: `linear-gradient(135deg, ${colorPrimario} 0%, ${colorSecundario}22 100%)`
                                        }}
                                    >
                                        <div
                                            className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-[100px] opacity-20"
                                            style={{ backgroundColor: colorSecundario }}
                                        />
                                    </div>
                                )}
                                {/* Bottom fade */}
                                <div
                                    className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
                                    style={{
                                        background: `linear-gradient(to top, ${colorPrimario}, ${colorPrimario}b3, transparent)`
                                    }}
                                />
                            </div>

                            {/* Profile info */}
                            <div className="relative px-5 md:px-4 pb-6">
                                {/* Avatar */}
                                <div className="absolute -top-12 md:-top-14 left-5 md:left-4">
                                    <div
                                        className="relative w-24 h-24 md:w-28 md:h-28 rounded-full ring-4 overflow-hidden bg-zinc-900 flex items-center justify-center"
                                        style={{
                                            boxShadow: `0 0 0 4px ${colorPrimario}, 0 0 45px rgba(${secondaryRgb}, 0.65)`
                                        }}
                                    >
                                        {profile.logo_url ? (
                                            <Image
                                                src={getProxiedUrl(profile.logo_url)}
                                                alt={`Logo de ${profile.nombre_barberia}`}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <>
                                                <div
                                                    className="absolute inset-0 opacity-20"
                                                    style={{ background: `linear-gradient(135deg, ${colorSecundario}, #ec4899)` }}
                                                />
                                                <span
                                                    className="text-3xl md:text-4xl font-black"
                                                    style={{ color: colorSecundario }}
                                                >
                                                    {profile.nombre_barberia?.charAt(0) || 'B'}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Shop name & details */}
                                <div className="pt-16 md:pt-20">
                                    <h1
                                        className="text-2xl md:text-4xl font-black tracking-tighter mb-3"
                                        style={{ color: colorTexto }}
                                    >
                                        {profile.nombre_barberia || profile.nombre_negocio || 'Barbería'}
                                    </h1>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.Direccion && (
                                            <div
                                                className="px-3 py-1.5 rounded-full border flex items-center gap-2 text-xs backdrop-blur-sm"
                                                style={{
                                                    backgroundColor: `${colorPrimario}cc`,
                                                    borderColor: '#3f3f46',
                                                    color: `color-mix(in srgb, ${colorTexto} 60%, transparent)`
                                                }}
                                            >
                                                <MapPin size={11} style={{ color: colorSecundario }} className="shrink-0" />
                                                <span>{profile.Direccion}</span>
                                            </div>
                                        )}
                                        {profile.telefono && (
                                            <div
                                                className="px-3 py-1.5 rounded-full border flex items-center gap-2 text-xs backdrop-blur-sm"
                                                style={{
                                                    backgroundColor: `${colorPrimario}cc`,
                                                    borderColor: '#3f3f46',
                                                    color: `color-mix(in srgb, ${colorTexto} 60%, transparent)`
                                                }}
                                            >
                                                <Phone size={11} style={{ color: colorSecundario }} className="shrink-0" />
                                                <span>{profile.telefono}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Booking flow */}
                    <main className="container mx-auto px-4 pb-12 relative z-20">
                        <BookingFlow
                            services={services}
                            slug={profile.slug}
                            shopName={profile.nombre_barberia || profile.nombre_negocio}
                            closingDates={(profile.fechas_cierre as string[]) || []}
                            profileId={profile.id}
                            barbers={barbers}
                            plan={profile.plan}
                            previewMode={true}
                        />
                    </main>
                </div>

                {/* ── EDITOR PANEL ── */}
                <div
                    className={`fixed top-[44px] right-0 h-[calc(100vh-44px)] w-[300px] bg-[#0a0a0a]/95 backdrop-blur-xl border-l border-zinc-800 flex flex-col shadow-2xl transition-transform duration-300 z-50 ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    {/* Panel header */}
                    <div className="flex items-center justify-between p-5 border-b border-zinc-800">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-500/10 rounded-lg">
                                <Palette className="w-4 h-4 text-amber-500" />
                            </div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-white">Editor</h2>
                        </div>
                        <button
                            onClick={() => setIsPanelOpen(false)}
                            className="p-1.5 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-zinc-800"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Panel body — scrollable */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-7">

                        <ColorPicker
                            label="Color de Acento"
                            description="Botones, iconos y elementos destacados"
                            value={colorSecundario}
                            onChange={setColorSecundario}
                            palette={PALETTE_SECONDARY}
                            placeholder="#f59e0b"
                        />

                        {/* ── Banner ── */}
                        <div className="space-y-3">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Banner del Portal</p>
                                <p className="text-[10px] text-zinc-600">Imagen de cabecera visible para los clientes</p>
                            </div>
                            <input
                                ref={bannerInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (!file) return
                                    if (file.size > 8 * 1024 * 1024) {
                                        toast.error('La imagen no debe superar los 8MB')
                                        return
                                    }
                                    const objectUrl = URL.createObjectURL(file)
                                    setUncroppedBannerUrl(objectUrl)
                                    setIsBannerCropperOpen(true)
                                    e.target.value = ''
                                }}
                            />
                            <button
                                onClick={() => bannerInputRef.current?.click()}
                                disabled={uploadingBanner}
                                className="flex items-center justify-center gap-2 w-full py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                            >
                                {uploadingBanner ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                                )}
                                {uploadingBanner ? 'Subiendo banner...' : 'Cambiar Banner'}
                            </button>
                            {bannerUrl && (
                                <div className="relative w-full h-16 rounded-xl overflow-hidden border border-zinc-700">
                                    <Image src={getProxiedUrl(bannerUrl)} alt="Banner actual" fill className="object-cover" />
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <span className="text-[9px] font-bold text-white uppercase tracking-widest">Banner actual</span>
                                    </div>
                                </div>
                            )}

                            {/* Botón de Guardar en Móvil (debajo del banner) */}
                            <div className="lg:hidden pt-4">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                                        saved
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            : 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                    {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar cambios'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Panel footer (Oculto en móvil, visible en escritorio) */}
                    <div className="hidden lg:block p-5 border-t border-zinc-800">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                                saved
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                            } disabled:opacity-60 disabled:cursor-not-allowed`}
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                            {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar cambios'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Banner Cropper */}
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
                                await handleUploadBanner(croppedFile)
                            }
                        } catch {
                            toast.error('Error al recortar la imagen')
                        }
                    }}
                    aspectRatio={3 / 1}
                />
            )}
        </>
    )
}
