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
        console.log("DashboardLayout (Server): No hay sesión.");
        // redirect('/login'); // DETENCIÓN DE BUCLE
        return (
            <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 text-white">
                <h1 className="text-3xl font-bold text-red-500 mb-4">CRITICAL AUTH ERROR</h1>
                <p>El servidor no recibe tu sesión, pero el cliente sí.</p>
                <div className="bg-zinc-900 p-4 rounded mt-4 font-mono text-xs">
                    {authError?.message || 'Session Missing'}
                </div>
            </div>
        )
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
