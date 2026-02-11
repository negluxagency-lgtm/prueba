import { createClient } from '@supabase/supabase-js' // Use direct client for public data
import { notFound } from 'next/navigation'
import BookingFlow from '@/components/public-booking/BookingFlow'
import { MapPin, Phone } from 'lucide-react'

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
        .select('*') // Removed legacy relation
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
        .eq('perfil_id', profile.id)
        .order('precio', { ascending: true })

    // 3. Fetch Barbers
    const { data: barbers } = await supabase
        .from('barberos')
        .select('*')
        .eq('barberia_id', profile.id)


    return (
        <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-amber-500/30">

            {/* HERO SECTION */}
            <header className="relative w-full">
                {/* Background Gradient */}
                <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-rose-900/20 via-zinc-900/0 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 -top-20 h-64 bg-amber-500/10 blur-[100px] pointer-events-none rounded-full" />

                <div className="container mx-auto px-4 pt-12 pb-8 flex flex-col items-center justify-center text-center relative z-10">

                    {/* Avatar / Logo */}
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-zinc-900 border-4 border-zinc-950 shadow-2xl flex items-center justify-center mb-6 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-rose-600 opacity-20 group-hover:opacity-30 transition-opacity" />
                        <span className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-400 to-rose-500">
                            {profile.nombre_barberia?.charAt(0) || profile.nombre_negocio?.charAt(0) || 'B'}
                        </span>
                    </div>

                    {/* Shop Name & Details */}
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-4">
                        {profile.nombre_barberia || profile.nombre_negocio || 'Barbería'}
                    </h1>

                    <div className="flex flex-wrap justify-center gap-3">
                        {profile.Direccion && (
                            <div className="px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center gap-2 text-xs md:text-sm text-zinc-400 backdrop-blur-sm">
                                <MapPin size={12} className="text-amber-500" />
                                <span>{profile.Direccion}</span>
                            </div>
                        )}
                        {profile.telefono && (
                            <div className="px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center gap-2 text-xs md:text-sm text-zinc-400 backdrop-blur-sm">
                                <Phone size={12} className="text-amber-500" />
                                <span>{profile.telefono}</span>
                            </div>
                        )}
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
                    plan={profile.plan} // Passed plan for conditional logic
                />
            </main>

        </div>
    )
}
