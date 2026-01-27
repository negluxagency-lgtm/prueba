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
        // Si no hay sesión en el servidor, redirigir al login limpiamente con flag de error
        redirect('/login?error=session_expired');
    }

    // Opcional: Fetch inicial del perfil para pasar al cliente
    const { data: profile } = await supabase
        .from('perfiles')
        .select('nombre_barberia, estado, telefono, onboarding_completado, created_at')
        .eq('id', user.id)
        .single();

    // Redirigir a configuración SOLO si nunca completó el onboarding inicial
    // (no si simplemente falta un campo después de haberlo completado)
    if (!profile || profile.onboarding_completado === false) {
        console.log("DashboardLayout (Server): Onboarding no completado. Redirigiendo a /configuracion");
        redirect('/configuracion');
    }

    // 🕒 CÁLCULO DE SUSCRIPCIÓN (Server-Side)
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const TRIAL_DAYS = 7;

    // Si no hay created_at (caso raro), usamos fecha actual para dar beneficio de duda (prueba)
    const createdAt = profile.created_at ? new Date(profile.created_at).getTime() : Date.now();
    const now = Date.now();
    const daysPassed = Math.floor((now - createdAt) / ONE_DAY_MS);
    const isTrial = daysPassed < TRIAL_DAYS;

    // Determinar estado
    let subscriptionStatus = 'impago';
    if (profile.estado === 'pagado') {
        subscriptionStatus = 'pagado';
    } else if (isTrial) {
        subscriptionStatus = 'prueba';
    }

    console.log(`[DashboardLayout] Server Status: ${subscriptionStatus} (Days Passed: ${daysPassed})`);

    return (
        <DashboardLayoutClient initialProfile={profile} serverStatus={subscriptionStatus}>
            {children}
        </DashboardLayoutClient>
    );
}
