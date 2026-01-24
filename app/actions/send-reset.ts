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

    // 2. Definir URL base (Prioridad absoluta a variables de entorno)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        'https://app.nelux.es';

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/update-password`,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}
