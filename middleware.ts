import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
    // -----------------------------------------------------------------
    // 🔒 CAPA DE SEGURIDAD EXTRA (Auditoría Punto 3)
    // -----------------------------------------------------------------
    // Si intentan entrar a /admin y estamos en Producción -> Fuera.
    if (request.nextUrl.pathname.startsWith('/admin')) {
        if (process.env.NODE_ENV === 'production') {
            const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
            console.warn(`🛑 Acceso bloqueado a /admin desde ${ip}`);
            // Redirigimos a la home para que no sepan ni que existe
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // -----------------------------------------------------------------
    // 🍪 GESTIÓN DE SESIÓN SUPABASE (Tu código original)
    // -----------------------------------------------------------------
    // Debug: Log para ver si el middleware se ejecuta y si hay cookies de Supabase
    // (Puedes comentar esto en producción para limpiar logs, punto 6 de la auditoría)
    if (process.env.NODE_ENV === 'development') {
        const hasAuthCookie = request.cookies.getAll().some(c => c.name.includes('sb-'));
        console.log(`[Middleware] Path: ${request.nextUrl.pathname} | SB Cookies: ${hasAuthCookie}`);
    }

    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api/webhooks (Stripe doesn't need Supabase cookies)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}

