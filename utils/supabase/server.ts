import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    // DEBUG DIAGNÓSTICO: Ver qué cookies llegan realmente al Layout
    const allCookies = cookieStore.getAll();
    const authCookie = allCookies.find(c => c.name.includes('sb-'));
    console.log(`[ServerClient] Total Cookies: ${allCookies.length} | Auth Cookie Present: ${!!authCookie}`);
    if (authCookie) console.log(`[ServerClient] Auth Cookie Name: ${authCookie.name}`);

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}