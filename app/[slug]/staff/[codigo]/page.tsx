import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import StaffApp from '@/components/staff/StaffApp'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ slug: string; codigo: string }>
}

export default async function SecureStaffPage(props: PageProps) {
    const params = await props.params
    // Use Service Role to allow fetching barbers unconditionally for the public URL
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Fetch Profile (Shop) by Slug WITH codigo_equipo validation
    const { data: profile, error: profileError } = await supabase
        .from('perfiles')
        .select('id, nombre_barberia, logo_url, "CIF/NIF", Direccion, telefono, correo, plan, codigo_equipo')
        .eq('slug', params.slug)
        .single()

    if (profileError || !profile) {
        return notFound()
    }

    // SECURITY: Validate that the PIN in the URL matches the one in DB exactly.
    if (!profile.codigo_equipo || profile.codigo_equipo !== params.codigo) {
        // Return 404 to avoid exposing that a shop exists but the pin is wrong to scanners.
        return notFound()
    }

    // 2. Fetch Barbers (With their PIN mapping, Photo and Schedule)
    const { data: barbers, error: barbersError } = await supabase
        .from('barberos')
        .select('id, nombre, pin, foto, horario_semanal, "jefe/dueño"')
        .eq('barberia_id', profile.id)
        .order('nombre', { ascending: true })

    console.log(`[SecureStaffPage] Fetched ${barbers?.length || 0} barbers for shop ${profile.nombre_barberia}`)
    if (barbersError) console.error('[SecureStaffPage] Error fetching barbers:', barbersError)

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
    // Filter out the owner from the staff view
    const secureBarbers = barbers
        .filter(b => !b['jefe/dueño'])
        .map(b => ({
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
