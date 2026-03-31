import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PreviewClient from './PreviewClient'
import { createClient as createPublicClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export default async function PreviewPage() {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) redirect('/login')

    const { data: profile } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

    if (!profile) redirect('/perfil')

    // Fetch services and barbers (same as public portal)
    const publicClient = createPublicClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: services } = await publicClient
        .from('servicios')
        .select('*')
        .eq('barberia_id', profile.id)
        .order('precio', { ascending: true })

    const { data: barbers } = await publicClient
        .from('barberos')
        .select('*')
        .eq('barberia_id', profile.id)

    const colorSecundario = profile.color_secundario || '#f59e0b'

    return (
        <PreviewClient
            profile={profile}
            services={services || []}
            barbers={barbers || []}
            initialColorSecundario={colorSecundario}
            userId={session.user.id}
        />
    )
}
