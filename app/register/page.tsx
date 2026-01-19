"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [barberiaNombre, setBarberiaNombre] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setLoading(true);

        if (!barberiaNombre.trim()) {
            setErrorMsg("El nombre de la barbería es obligatorio.");
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        barberia_nombre: barberiaNombre
                    }
                }
            });

            if (error) throw error;

            toast.success('Cuenta creada exitosamente');
            // Como la confirmación de email está desactivada, redirigimos directamente
            router.push('/?registered=true');
            router.refresh();

        } catch (error: any) {
            console.error('Error al registrar:', error);
            setErrorMsg(error.message || "Error al crear la cuenta");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
            <div className="w-full max-w-[420px] p-8 md:p-12 bg-zinc-900/50 border border-zinc-800 rounded-[24px] shadow-2xl text-white">
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">
                        Crear <span className="text-amber-500">Cuenta</span>
                    </h2>
                    <p className="mt-1 text-zinc-500 text-[10px] font-bold uppercase tracking-[2px]">
                        Nueva Barbería
                    </p>
                </div>

                <form onSubmit={handleRegister} className="flex flex-col gap-4">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase ml-1 mb-1 block">
                                Nombre del Negocio
                            </label>
                            <input
                                type="text"
                                placeholder="Ej: Barbería Premium"
                                value={barberiaNombre}
                                onChange={(e) => setBarberiaNombre(e.target.value)}
                                className="w-full p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-sm text-white outline-none focus:border-amber-500 transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase ml-1 mb-1 block">
                                Correo Electrónico
                            </label>
                            <input
                                type="email"
                                placeholder="correo@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-sm text-white outline-none focus:border-amber-500 transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase ml-1 mb-1 block">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                placeholder="********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-sm text-white outline-none focus:border-amber-500 transition-all"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    {errorMsg && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-red-500 text-xs font-bold text-center">{errorMsg}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={cn(
                            "w-full p-4 mt-4 bg-amber-500 text-black rounded-xl text-sm font-black transition-all active:scale-95 disabled:opacity-50 uppercase tracking-wide",
                            loading ? "cursor-wait" : "hover:bg-amber-600 shadow-[0_0_20px_-5px_rgba(245,158,11,0.4)]"
                        )}
                    >
                        {loading ? 'Creando cuenta...' : 'Registrar Barbería'}
                    </button>

                    <div className="mt-6 text-center border-t border-zinc-800 pt-6">
                        <p className="text-zinc-500 text-xs">
                            ¿Ya tienes cuenta?{' '}
                            <Link href="/" className="text-amber-500 font-bold hover:text-amber-400 transition-colors">
                                Iniciar Sesión
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
