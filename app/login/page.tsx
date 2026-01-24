"use client";

import AuthGuard from "@/components/AuthGuard";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
    const [status, setStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
    const router = useRouter();

    useEffect(() => {
        // 1. Chequeo inicial y manejo de errores de sesión
        const checkSession = async () => {
            // Check for forced logout param
            const params = new URLSearchParams(window.location.search);
            const error = params.get('error');

            if (error === 'session_expired') {
                console.log("Login: Session expired detected. Forcing clean state.");
                await supabase.auth.signOut();
                setStatus('unauthenticated');
                // Limpiar URL para que no se quede el parámetro feo
                window.history.replaceState({}, '', '/login');
                // Opcional: Mostrar toast o alerta aquí si tienes una librería de UI
                return; // 🛑 IMPORTANTE: Detener ejecución para no redirigir de vuelta
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // Redirect automático si ya hay sesión (y no acabamos de forzar logout)
                router.push('/inicio');
            } else {
                setStatus('unauthenticated');
            }
        };
        checkSession();

        // 2. Listener en tiempo real (Login/Logout dentro de AuthGuard u otra tab)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                // Redirect automático al loguearse
                router.push('/inicio');
            } else {
                setStatus('unauthenticated');
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    if (status === 'checking') {
        return (
            <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
                <div className="text-amber-500 font-bold animate-pulse">VERIFICANDO ESTADO...</div>
            </div>
        );
    }

    // Si no está autenticado, mostramos el formulario de login.
    // Usamos AuthGuard pero controlando nosotros el estado padre, así evitamos parpadeos.
    return (
        <AuthGuard>
            {/* Si AuthGuard detecta sesión internamente, renderizará esto. 
                Nuestro listener onAuthStateChange capturará el evento y cambiará el estado a 'authenticated' arriba.
             */}
            <></>
        </AuthGuard>
    );
}
