"use server";

import { createClient } from "@/utils/supabase/server";

export async function sendResetEmail() {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
        return { success: false, error: "Usuario no autenticado o sin email." };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/update-password`,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}
