import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import StaffApp from '@/components/staff/StaffApp'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ slug: string }>
}

export default async function StaffPage(props: PageProps) {
    const params = await props.params
    // Use Service Role to allow fetching barbers unconditionally for the public URL
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Fetch Profile (Shop) by Slug
    const { data: profile, error: profileError } = await supabase
        .from('perfiles')
        .select('id, nombre_barberia, logo_url')
        .eq('slug', params.slug)
        .single()

    if (profileError || !profile) {
        return notFound()
    }

    // 2. Fetch Barbers (With their PIN mapping, Photo and Schedule)
    const { data: barbers, error: barbersError } = await supabase
        .from('barberos')
        .select('id, nombre, pin, foto, horario_semanal')
        .eq('barberia_id', profile.id)
        .order('nombre', { ascending: true })

    console.log(`[StaffPage] Fetched ${barbers?.length || 0} barbers for shop ${profile.nombre_barberia}`)
    if (barbersError) console.error('[StaffPage] Error fetching barbers:', barbersError)
    // console.log('[StaffPage] Barbers data:', barbers) // Careful with sensitive data in logs, but useful for debugging

    if (!barbers || barbers.length === 0) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-black italic mb-2">Sin Equipo Registrado</h1>
                    <p className="text-zinc-500">Contacta con el administrador.</p>
                </div>
            </div>
        )
    }

    // Map `pin` to `hasPin` boolean to secure the PIN from the client
    const secureBarbers = barbers.map(b => ({
        id: b.id,
        nombre: b.nombre,
        foto: b.foto,
        horario_semanal: b.horario_semanal,
        hasPin: !!b.pin
    }))

    // Pass data to the Client Component
    return (
        <StaffApp
            shopData={profile}
            barbers={secureBarbers}
            slug={params.slug}
        />
    )
}
