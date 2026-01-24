import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardLayoutClient from "./DashboardLayoutClient";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    // 🛡️ VERIFICACIÓN DE SERVIDOR (Evita el Layout Flash)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // DEBUG: Loguear si hay fallo en servidor
    if (authError || !user) {
        console.log(`[DashboardLayout] Auth Fail: ${authError?.message || 'No User'}`);
    } else {
        console.log(`[DashboardLayout] Success: User ${user.email}`);
    }

    if (!user) {
        // Si no hay sesión en el servidor, redirigir al login limpiamente
        redirect('/login');
    }

    // Opcional: Fetch inicial del perfil para pasar al cliente
    const { data: profile } = await supabase
        .from('perfiles')
        .select('nombre_barberia, estado, telefono, onboarding_completado')
        .eq('id', user.id)
        .single();

    // Redirigir a configuración SOLO si nunca completó el onboarding inicial
    // (no si simplemente falta un campo después de haberlo completado)
    if (!profile || profile.onboarding_completado === false) {
        console.log("DashboardLayout (Server): Onboarding no completado. Redirigiendo a /configuracion");
        redirect('/configuracion');
    }

    return (
        <DashboardLayoutClient initialProfile={profile}>
            {children}
        </DashboardLayoutClient>
    );
}
