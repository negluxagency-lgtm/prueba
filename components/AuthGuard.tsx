"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface AuthGuardProps {
    children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Estados para el formulario
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        // 1. Comprobar si ya hay sesión guardada en el navegador al entrar
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // 2. Escuchar cambios (si se loguea o desloguea)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setErrorMsg("Usuario o contraseña incorrectos.");
            setLoading(false);
        }
    };

    if (loading && !session) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#0a0a0a] ">
                <div className="text-amber-500 font-bold animate-pulse">CARGANDO SISTEMA...</div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
                <div className="w-full max-w-[380px] p-8 md:p-12 bg-zinc-900/50 border border-zinc-800 rounded-[24px] shadow-2xl text-white">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter">
                            Wolf <span className="text-amber-500">Barbershop</span>
                        </h2>
                        <p className="mt-1 text-zinc-500 text-[10px] font-bold uppercase tracking-[2px]">Acceso restringido</p>
                    </div>

                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-sm text-white outline-none focus:border-amber-500 transition-all"
                            required
                        />
                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-sm text-white outline-none focus:border-amber-500 transition-all"
                            required
                        />

                        {errorMsg && (
                            <p className="text-red-500 text-xs font-bold text-center">{errorMsg}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={cn(
                                "p-4 mt-2 bg-amber-500 text-black rounded-xl text-sm font-black transition-all active:scale-95 disabled:opacity-50",
                                loading ? "cursor-wait" : "hover:bg-amber-600"
                            )}
                        >
                            {loading ? 'AUTENTICANDO...' : 'INICIAR SESIÓN'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
