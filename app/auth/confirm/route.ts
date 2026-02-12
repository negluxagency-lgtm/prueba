import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const token_hash = requestUrl.searchParams.get('token_hash')
    const type = requestUrl.searchParams.get('type')
    const next = requestUrl.searchParams.get('next') ?? '/dashboard'

    // --- CRITICAL FIX: Determine correct origin ---
    // Netlify internal routing often messes up request.url origin
    let origin = requestUrl.origin

    // 1. Force Production URL (Best for SEO and consistency)
    if (process.env.NEXT_PUBLIC_SITE_URL) {
        origin = process.env.NEXT_PUBLIC_SITE_URL
    }
    // 2. Fallback: Trust Forwarded Headers (Standard Proxy/Edge practice)
    else if (request.headers.get('x-forwarded-host')) {
        const proto = request.headers.get('x-forwarded-proto') || 'https'
        const host = request.headers.get('x-forwarded-host')
        origin = `${proto}://${host}`
    }

    // Ensure origin doesn't have trailing slash for clean concatenation
    origin = origin.replace(/\/$/, '')

    if (token_hash && type) {
        // Helper to get supabase client
        // NOTE: In route handlers, we use 'await createClient()'
        const supabase = await createClient()

        const { error } = await supabase.auth.verifyOtp({
            type: type as any,
            token_hash,
        })

        if (!error) {
            // ✅ Email confirmado
            // Redirigir a la URL final correcta (app.nelux.es/verified)
            return NextResponse.redirect(`${origin}${next}`)
        } else {
            console.error('Error al confirmar email:', error.message)
            return NextResponse.redirect(`${origin}/auth/auth-code-error?message=invalid_token`)
        }
    }

    // Si faltan parámetros
    return NextResponse.redirect(`${origin}/auth/auth-code-error?message=missing_params`)
}
