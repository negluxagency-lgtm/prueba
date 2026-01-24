'use server'

import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

// Definimos un tipo para aceptar ambos formatos y argumentos individuales
type SignUpData = FormData | { email: string; password: string; barberiaNombre?: string }

export async function signUp(data: SignUpData | string, arg2?: string, arg3?: string) {
    let email: string;
    let password: string;
    let barberiaNombre: string | undefined;

    // 1. EXTRAER DATOS (Lógica universal)
    if (data instanceof FormData) {
        email = data.get('email') as string;
        password = data.get('password') as string;
        barberiaNombre = (data.get('barberiaNombre') as string) || (data.get('barberia_nombre') as string);
    } else if (typeof data === 'object' && data !== null) {
        email = (data as any).email;
        password = (data as any).password;
        barberiaNombre = (data as any).barberiaNombre || (data as any).barberia_nombre;
    } else if (typeof data === 'string' && typeof arg2 === 'string') {
        // Soporte para llamada directa: signUp(email, password, barberiaNombre)
        email = data;
        password = arg2;
        barberiaNombre = arg3;
    } else {
        return { error: "Formato de datos inválido para el registro." };
    }

    // 2. Definir URL base (Prioridad absoluta a variables de entorno)
    // Esto evita que Supabase use URLs internas de Netlify/Vercel (preview URLs)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        'https://app.nelux.es';

    console.log("signUp: Final siteUrl:", siteUrl);

    // 3. Crear cliente Supabase
    const supabase = await createClient()

    try {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${siteUrl}/auth/callback?next=/auth/verified`,
                data: {
                    barberia_nombre: barberiaNombre?.trim()
                }
            },
        })

        if (error) {
            console.error("Error de Supabase:", error)
            return { error: error.message }
        }

    } catch (e) {
        console.error("Error inesperado:", e)
        return { error: "Error interno del servidor." }
    }

    return { success: true }
}
