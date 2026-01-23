import { createClient } from '@/utils/supabase/server' // <--- Importante: Usar tu helper, no la librería cruda
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    // Si en la URL viene un "?next=/loquesea", lo usamos.
    // Si no viene nada, por defecto mandamos a '/dashboard' o '/inicio'
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        // 1. Usamos el cliente de servidor que maneja cookies automáticamente
        const supabase = createClient()

        // 2. Intercambiamos el código por una sesión
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // 3. Redirigimos al usuario YA LOGUEADO a donde toca
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Si hay error o el código es inválido, vuelta al principio
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
