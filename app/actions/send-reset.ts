"use server";

import { createClient } from "@/utils/supabase/server";

export async function sendResetEmail(providedEmail?: string) {
    const supabase = await createClient();

    // 1. Obtener usuario de la sesión para verificar (opcional si se provee email)
    const { data: { user } } = await supabase.auth.getUser();

    // El email a usar será el proveido o el del usuario autenticado
    const email = providedEmail || user?.email;

    if (!email) {
        console.error("sendResetEmail: No email found", { user, providedEmail });
        return { success: false, error: "Usuario no autenticado o sin email." };
    }

    // Usar la misma lógica de siteUrl robusta
    const { headers } = await import('next/headers');
    const headerList = await headers();
    const host = headerList.get('host') || 'app.nelux.es';
    const protocol = (host.includes('localhost') || host.includes('127.0.0.1')) ? 'http' : 'https';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/update-password`,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}
