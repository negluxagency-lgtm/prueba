import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import ReviewPageClient from './ReviewPageClient'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ slug: string }>
}

export default async function ReviewPage(props: PageProps) {
    const params = await props.params
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile, error } = await supabase
        .from('perfiles')
        .select('url_google, nombre_barberia')
        .eq('slug', params.slug)
        .single()

    if (error || !profile) {
        return notFound()
    }

    return (
        <ReviewPageClient 
            googleUrl={profile.url_google} 
            shopName={profile.nombre_barberia || 'la barbería'} 
        />
    )
}
