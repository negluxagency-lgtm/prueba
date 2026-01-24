import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
    // Debug: Log para ver si el middleware se ejecuta y si hay cookies de Supabase
    const hasAuthCookie = request.cookies.getAll().some(c => c.name.includes('sb-'));
    console.log(`[Middleware] Path: ${request.nextUrl.pathname} | SB Cookies: ${hasAuthCookie}`);

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

