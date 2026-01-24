"use client";

import AuthGuard from "@/components/AuthGuard";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
    const [status, setStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
    const router = useRouter();

    useEffect(() => {
        // 1. Chequeo inicial
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setStatus('authenticated');
            } else {
                setStatus('unauthenticated');
            }
        };
        checkSession();

        // 2. Listener en tiempo real (Login/Logout dentro de AuthGuard u otra tab)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                setStatus('authenticated');
            } else {
                setStatus('unauthenticated');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    if (status === 'checking') {
        return (
            <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
                <div className="text-amber-500 font-bold animate-pulse">VERIFICANDO ESTADO...</div>
            </div>
        );
    }

    if (status === 'authenticated') {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white gap-4">
                <p className="text-amber-500 font-bold">Sesión detectada en el navegador</p>
                <div className="p-4 bg-zinc-900 rounded border border-zinc-800 text-xs text-zinc-400 max-w-sm text-center mb-4">
                    Hemos migrado el sistema de autenticación. Es necesario validar tus credenciales en el servidor.
                </div>
                <a
                    href="/inicio"
                    className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold uppercase tracking-widest transition-colors"
                >
                    ENTRAR AL DASHBOARD
                </a>
                <button
                    onClick={async () => {
                        await supabase.auth.signOut();
                        setStatus('unauthenticated');
                    }}
                    className="text-xs text-zinc-500 hover:text-red-400 underline mt-4"
                >
                    Cerrar sesión y conectar con otra cuenta
                </button>
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
