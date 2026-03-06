"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import { signUp } from '@/app/actions/auth';

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [barberiaNombre, setBarberiaNombre] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setLoading(true);

        if (!barberiaNombre.trim()) {
            setErrorMsg("El nombre de la barbería es obligatorio.");
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg("Las contraseñas no coinciden.");
            setLoading(false);
            return;
        }

        if (!acceptedTerms) {
            setErrorMsg("Debes aceptar los Términos de Servicio y la Política de Privacidad.");
            setLoading(false);
            return;
        }

        try {
            // 1. Verificar si el nombre de la barbería ya existe
            const { data: existingData, error: searchError } = await supabase
                .from('perfiles')
                .select('nombre_barberia')
                .eq('nombre_barberia', barberiaNombre.trim())
                .maybeSingle();

            if (searchError) {
                console.error('Error al verificar duplicados:', searchError);
            }

            if (existingData) {
                setErrorMsg("Ese nombre ya está en uso, prueba con otro.");
                setLoading(false);
                return;
            }

            // 2. Proceder con el registro usando la Server Action para PKCE
            const result = await signUp(email, password, barberiaNombre.trim());

            if (result.error) {
                setErrorMsg(result.error);
                setLoading(false);
                return;
            }

            setSuccess(true);
            toast.success('Cuenta creada exitosamente');

        } catch (error: any) {
            console.error('Error al registrar:', error);
            setErrorMsg(error.message || "Error al crear la cuenta");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex items-center justify-center bg-[#0a0a0a] pt-10 p-4 md:pt-0">
            <div className="w-full max-w-[420px] p-8 md:p-12 bg-zinc-900/50 border border-zinc-800 rounded-[24px] shadow-2xl text-white">
                {success ? (
                    <div className="text-center animate-in fade-in zoom-in duration-500">
                        <div className="mb-6 flex justify-center">
                            <div className="p-4 bg-amber-500/10 rounded-full">
                                <MailCheck className="w-12 h-12 text-amber-500" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-4">
                            Revisa tu <span className="text-amber-500">Bandeja de entrada</span>
                        </h2>
                        <div className="space-y-4">
                            <p className="text-zinc-400 text-sm leading-relaxed">
                                Hemos enviado un enlace de confirmación a <span className="text-white font-bold">{email}</span>. Necesitas pulsarlo para activar tu cuenta de Nelux.
                            </p>
                            <div className="pt-6 border-t border-zinc-800">
                                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                                    ¿No lo ves? Revisa la carpeta de Spam.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
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

                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase ml-1 mb-1 block">
                                        Confirmar Contraseña
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="********"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-sm text-white outline-none focus:border-amber-500 transition-all"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <div className="flex items-start gap-3 mt-2 px-1">
                                <div className="relative flex items-center">
                                    <input
                                        id="terms"
                                        type="checkbox"
                                        checked={acceptedTerms}
                                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-zinc-700 bg-zinc-800/50 transition-all checked:bg-amber-500 checked:border-amber-500 focus:outline-none"
                                        required
                                    />
                                    <span className="absolute text-black opacity-0 peer-checked:opacity-100 pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                        </svg>
                                    </span>
                                </div>
                                <label htmlFor="terms" className="text-[11px] text-zinc-400 leading-tight cursor-pointer select-none">
                                    Acepto los <Link href="http://nelux.es/terminos-y-condiciones" target="_blank" className="text-amber-500 hover:underline">Términos de Servicio</Link> y la <Link href="https://nelux.es/politica-de-privacidad" target="_blank" className="text-amber-500 hover:underline">Política de Privacidad</Link>, incluyendo el Anexo de Encargado de Tratamiento conforme al RGPD.
                                </label>
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
                                    <Link href="/inicio" className="text-amber-500 font-bold hover:text-amber-400 transition-colors">
                                        Iniciar Sesión
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
