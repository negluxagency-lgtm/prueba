'use server'

import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

export async function signUp(email: string, password: string, barberiaNombre: string) {
    const origin = (await headers()).get('origin')
    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${origin}/auth/callback?next=/auth/verified`,
            data: {
                barberia_nombre: barberiaNombre
            }
        },
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}
