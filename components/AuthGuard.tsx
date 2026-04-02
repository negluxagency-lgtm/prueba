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
    const [view, setView] = useState<'login' | 'forgot_password' | 'success'>('login');
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

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setLoading(true);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback?next=/update-password`,
        });

        if (error) {
            setErrorMsg(error.message || "Error al enviar el correo.");
            setLoading(false);
        } else {
            setView('success');
            setLoading(false);
        }
    };

    if (loading && !session) {
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
                            Estableciendo Conexión
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

    if (!session) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#0a0a0a] pt-10 p-4 md:pt-0">
                <div className="w-full max-w-[380px] p-8 md:p-12 bg-zinc-900/50 border border-zinc-800 rounded-[24px] shadow-2xl text-white">
                    <div className="text-center mb-10">
                        Nelux <span className="text-amber-500">Barbershop</span>
                        <p className="mt-1 text-zinc-500 text-[10px] font-bold uppercase tracking-[2px]">
                            {view === 'forgot_password' ? 'Recuperar Acceso' : 'Acceso restringido'}
                        </p>
                    </div>

                    {view === 'success' ? (
                        <div className="text-center space-y-6">
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                <p className="text-emerald-400 text-sm font-medium">
                                    ✅ Correo enviado. Revisa tu bandeja de entrada para restablecer tu contraseña.
                                </p>
                            </div>
                            <button
                                onClick={() => setView('login')}
                                className="w-full p-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-black transition-all"
                            >
                                VOLVER AL INICIO
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={view === 'login' ? handleLogin : handleResetPassword} className="flex flex-col gap-4">
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-sm text-white outline-none focus:border-amber-500 transition-all"
                                required
                            />

                            {view === 'login' && (
                                <input
                                    type="password"
                                    placeholder="Contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-sm text-white outline-none focus:border-amber-500 transition-all"
                                    required
                                />
                            )}

                            {errorMsg && (
                                <p className="text-red-400 text-xs font-bold text-center">{errorMsg}</p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className={cn(
                                    "p-4 mt-2 bg-amber-500 text-black rounded-xl text-sm font-black transition-all active:scale-95 disabled:opacity-50",
                                    loading ? "cursor-wait" : "hover:bg-amber-600"
                                )}
                            >
                                {loading ? 'PROCESANDO...' : view === 'login' ? 'INICIAR SESIÓN' : 'ENVIAR ENLACE'}
                            </button>

                            {view === 'login' ? (
                                <div className="space-y-4">
                                    <button
                                        type="button"
                                        onClick={() => setView('forgot_password')}
                                        className="w-full text-zinc-500 text-sm hover:text-white transition-colors"
                                    >
                                        ¿Has olvidado tu contraseña?
                                    </button>

                                    <div className="pt-4 text-center border-t border-zinc-800/50">
                                        <p className="text-zinc-500 text-xs">
                                            ¿No tienes cuenta?{' '}
                                            <a href="/register" className="text-amber-500 font-bold hover:text-amber-400 transition-colors">
                                                Registrar nueva barbería
                                            </a>
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setView('login')}
                                    className="w-full text-zinc-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
                                >
                                    Volver a Iniciar Sesión
                                </button>
                            )}
                        </form>
                    )}
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
