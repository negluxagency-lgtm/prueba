import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    const next = searchParams.get('next') ?? '/dashboard'

    if (token_hash && type) {
        const supabase = await createClient()

        // Verificar el token de confirmación de email
        const { error } = await supabase.auth.verifyOtp({
            type: type as any,
            token_hash,
        })

        if (!error) {
            // ✅ Email confirmado correctamente
            return NextResponse.redirect(`${origin}${next}`)
        } else {
            // ❌ Error al verificar el token
            console.error('Error al confirmar email:', error.message)
            return NextResponse.redirect(`${origin}/auth/auth-code-error?message=invalid_token`)
        }
    }

    // Si faltan parámetros
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
