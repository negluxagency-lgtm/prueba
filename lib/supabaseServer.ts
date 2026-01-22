import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Cliente de Supabase para Server Components
export async function createServerClient() {
    const cookieStore = await cookies()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://liyoivvgmtkzyttrlotk.supabase.co'
    const supabaseAnonKey = 'sb_publishable_jpS0YIXtZKowgpyNwnONfg_cVa_g0ZF'

    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
        },
        global: {
            headers: {
                cookie: cookieStore.toString(),
            },
        },
    })
}
