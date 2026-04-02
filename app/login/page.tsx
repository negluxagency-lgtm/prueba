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
                <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-700">
                    <div className="relative w-20 h-20">
                        {/* Efecto de pulso exterior */}
                        <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping duration-[2000ms]" />
                        <div className="relative bg-[#0d0d0d] border border-amber-500/30 rounded-2xl w-full h-full flex items-center justify-center p-4 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                            <span className="font-black text-2xl tracking-tighter italic">
                                <span className="text-white">N</span>
                                <span className="text-amber-500">B</span>
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <h2 className="text-amber-500/90 font-bold tracking-[0.3em] text-[10px] uppercase animate-pulse">
                            Sincronizando perfil
                        </h2>
                        <div className="flex gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-amber-500/30 animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1 h-1 rounded-full bg-amber-500/50 animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1 h-1 rounded-full bg-amber-500 animate-bounce" />
                        </div>
                    </div>
                </div>
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
