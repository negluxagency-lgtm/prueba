import { createClient } from '@supabase/supabase-js' // Use direct client for public data
import { notFound } from 'next/navigation'
import BookingFlow from '@/components/public-booking/BookingFlow'
import { MapPin, Phone, Instagram } from 'lucide-react'
import { getProxiedUrl } from '@/utils/url-helper'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ slug: string }>
}

export default async function PublicBookingPage(props: PageProps) {
    const params = await props.params
    // Use Service Role to ensure public data is always visible (bypass RLS for anon users)
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Fetch Profile (Shop) by Slug with Schedule
    const { data: profile, error: profileError } = await supabase
        .from('perfiles')
        .select('*')
        .eq('slug', params.slug)
        .single()

    if (profileError) {
        console.error('❌ Error fetching profile:', profileError)
    }

    if (!profile) {
        console.error('❌ Profile not found for slug:', params.slug)
        return notFound()
    }
    console.log('✅ Profile found:', profile.nombre_barberia)

    // 2. Fetch Services
    const { data: services } = await supabase
        .from('servicios')
        .select('*')
        .eq('barberia_id', profile.id)
        .order('precio', { ascending: true })

    // 3. Fetch Barbers
    const { data: barbers } = await supabase
        .from('barberos')
        .select('*')
        .eq('barberia_id', profile.id)

    const colorPrimario = '#0c0a09' // Hardcoded as original
    const colorSecundario = profile.color_secundario || '#f59e0b'

    // Helper: hex -> r,g,b for rgba usage
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result
            ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
            : '245, 158, 11'
    }
    const secondaryRgb = hexToRgb(colorSecundario)

    return (
        <div className="min-h-screen text-zinc-100 font-sans selection:bg-amber-500/30" style={{ backgroundColor: colorPrimario }}>
            <style>{`
                :root {
                    --color-primary: ${colorPrimario};
                    --color-secondary: ${colorSecundario};
                    --color-secondary-rgb: ${secondaryRgb};
                }
            `}</style>

            {/* HERO SECTION */}
            <header className="relative w-full">
                {/* Contenedor con max-width en desktop para evitar que el banner se estire */}
                <div className="max-w-5xl mx-auto md:px-8 lg:px-12">

                    {/* ── Banner Image ── */}
                    <div className="relative w-full h-56 md:h-72 overflow-hidden md:rounded-2xl">
                        {profile.banner_url ? (
                            <Image
                                src={getProxiedUrl(profile.banner_url)}
                                alt={`Banner principal y promocional de la barbería ${profile.nombre_barberia || 'NeluxBarber'}`}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            /* Fallback gradient banner */
                            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${colorPrimario} 0%, ${colorSecundario}22 100%)` }}>
                                <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-[100px] opacity-10" style={{ backgroundColor: colorSecundario }} />
                                <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] opacity-10" style={{ backgroundColor: colorSecundario }} />
                            </div>
                        )}
                        {/* Bottom fade to match bg */}
                        <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none" style={{ background: `linear-gradient(to top, ${colorPrimario}, ${colorPrimario}b3, transparent)` }} />
                    </div>

                    {/* ── Profile photo + Shop info ── */}
                    <div className="relative px-5 md:px-4 pb-6">

                        {/* Profile photo — overlapping the banner bottom */}
                        <div className="absolute -top-12 md:-top-14 left-5 md:left-4">
                            <div
                                className="
                                    relative
                                    w-24 h-24 md:w-28 md:h-28
                                    rounded-full
                                    ring-4
                                    overflow-hidden
                                    bg-zinc-900
                                    flex items-center justify-center
                                "
                                style={{
                                    boxShadow: `0 0 0 4px ${colorPrimario}, 0 0 45px rgba(${secondaryRgb}, 0.65)`
                                }}
                            >
                                {profile.logo_url ? (
                                    <Image
                                        src={getProxiedUrl(profile.logo_url)}
                                        alt={`Logo oficial de la barbería ${profile.nombre_barberia || 'NeluxBarber'} - Reservas de cortes de pelo`}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <>
                                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-rose-600 opacity-20" />
                                        <span className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-400 to-rose-500">
                                            {profile.nombre_barberia?.charAt(0) || profile.nombre_negocio?.charAt(0) || 'B'}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Text: pushed down to clear the photo */}
                        <div className="pt-16 md:pt-20">
                            <div className="flex items-center gap-4 mb-3">
                                <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-white">
                                    {profile.nombre_barberia || profile.nombre_negocio || 'Barbería'}
                                </h1>
                                
                                <div className="flex items-center gap-3 pt-1">
                                    {profile.instagram && profile.instagram !== '@' && (
                                        <a
                                            href={`https://instagram.com/${profile.instagram.replace('@', '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-zinc-400 hover:text-white transition-all group"
                                            title="Instagram"
                                        >
                                            <Instagram size={20} className="group-hover:scale-110 transition-transform" style={{ color: colorSecundario }} />
                                        </a>
                                    )}
                                    {profile.tiktok && profile.tiktok !== '@' && (
                                        <a
                                            href={`https://tiktok.com/@${profile.tiktok.replace('@', '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-zinc-400 hover:text-white transition-all group"
                                            title="TikTok"
                                        >
                                            <svg 
                                                className="w-[20px] h-[20px] group-hover:scale-110 transition-transform" 
                                                viewBox="0 0 24 24" 
                                                fill="none" 
                                                stroke="currentColor" 
                                                strokeWidth="2.5" 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round"
                                                style={{ color: colorSecundario }}
                                            >
                                                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                                            </svg>
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {profile.Direccion && (
                                    <div className="px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center gap-2 text-xs text-zinc-400 backdrop-blur-sm">
                                        <MapPin size={11} style={{ color: colorSecundario }} className="shrink-0" />
                                        <span>{profile.Direccion}</span>
                                    </div>
                                )}
                                {profile.telefono && (
                                    <div className="px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center gap-2 text-xs text-zinc-400 backdrop-blur-sm">
                                        <Phone size={11} style={{ color: colorSecundario }} className="shrink-0" />
                                        <span>{profile.telefono}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="container mx-auto px-4 pb-12 relative z-20">
                <BookingFlow
                    services={services || []}
                    slug={params.slug}
                    shopName={profile.nombre_barberia || profile.nombre_negocio}
                    closingDates={(profile.fechas_cierre as string[]) || []}
                    profileId={profile.id}
                    barbers={barbers || []}
                    plan={profile.plan}
                />
            </main>

        </div>
    )
}
