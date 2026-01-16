import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();

    // Crear cliente de Supabase con las credenciales
    const supabaseUrl = 'https://liyoivvgmtkzyttrlotk.supabase.co';
    const supabaseAnonKey = 'sb_publishable_jpS0YIXtZKowgpyNwnONfg_cVa_g0ZF';

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
        },
    });

    // Obtener token de autenticación de las cookies
    const token = req.cookies.get('sb-access-token')?.value;

    if (token) {
        // Si hay token, intentar obtener el usuario
        const { data: { user } } = await supabase.auth.getUser(token);

        // Si no hay usuario válido, el AuthGuard manejará el login
        if (!user) {
            // El AuthGuard client-side se encargará de la redirección
        }
    }

    return res;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
