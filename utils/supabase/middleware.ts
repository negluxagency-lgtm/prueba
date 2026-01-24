import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) => {
                        // console.log(`[Middleware] Setting Cookie: ${name}`);
                        supabaseResponse.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser().
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // console.log(`[Middleware] Auth Check: ${user ? 'Authenticated: ' + user.email : 'No Session'}`);

    // Si no hay usuario y estamos intentando acceder a rutas protegidas, redirigir al login
    if (!user && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/auth') && request.nextUrl.pathname !== '/') {
        // console.log(`[Middleware] Redirecting unauthenticated user from ${request.nextUrl.pathname} to /login`);
        // const url = request.nextUrl.clone()
        // url.pathname = '/login'
        // return NextResponse.redirect(url)
    }

    return supabaseResponse
}
