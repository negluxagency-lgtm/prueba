import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = await createClient()

        // 1. Verificamos si ya hay una sesión activa (por si se llamó dos veces)
        const { data: { session: existingSession } } = await supabase.auth.getSession()
        if (existingSession) {
            return NextResponse.redirect(`${origin}${next}`)
        }

        // 2. Intentamos cambiar el código por una sesión
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // ✅ Todo perfecto
            return NextResponse.redirect(`${origin}${next}`)
        } else {
            // ⚠️ Error al intercambiar el código
            console.error('Error en exchangeCodeForSession:', error.message)

            // Si el error es que el código ya se usó, comprobamos de nuevo la sesión
            const { data: { session: retrySession } } = await supabase.auth.getSession()
            if (retrySession) {
                return NextResponse.redirect(`${origin}${next}`)
            }

            // Si falla y no hay sesión, mandamos al login (inicio) con un aviso
            return NextResponse.redirect(`${origin}/inicio?message=Link_caducado_intenta_entrar`)
        }
    }

    // Si no hay código, algo raro pasa
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
