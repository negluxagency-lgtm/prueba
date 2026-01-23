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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.log("DashboardLayout (Server): No hay sesión. Redirigiendo a /login");
        redirect('/login');
    }

    // Opcional: Fetch inicial del perfil para pasar al cliente
    const { data: profile } = await supabase
        .from('perfiles')
        .select('nombre_barberia, estado, telefono')
        .eq('id', user.id)
        .single();

    // Si no tiene teléfono configurado, mandarlo a configuración (excepto si ya está ahí)
    // Pero como configuración está fuera de (dashboard), no hay bucle aquí.
    if (!profile || !profile.telefono) {
        console.log("DashboardLayout (Server): Perfil incompleto. Redirigiendo a /configuracion");
        redirect('/configuracion');
    }

    return (
        <DashboardLayoutClient initialProfile={profile}>
            {children}
        </DashboardLayoutClient>
    );
}
