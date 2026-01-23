"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { KeyRound, ShieldCheck, Loader2 } from 'lucide-react';

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            toast.success('Contraseña actualizada correctamente');
            router.push('/inicio');
        } catch (error: any) {
            toast.error('Error al actualizar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[400px]"
            >
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-[32px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 blur-[80px] rounded-full" />

                    <div className="relative text-center mb-10">
                        <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
                            <KeyRound className="w-8 h-8 text-amber-500" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white">
                            Nueva <span className="text-amber-500">Contraseña</span>
                        </h1>
                        <p className="mt-2 text-zinc-500 text-[10px] font-bold uppercase tracking-[2px]">
                            Asegura tu imperio
                        </p>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Nueva Contraseña</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-sm text-white outline-none focus:border-amber-500 transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Confirmar Contraseña</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-sm text-white outline-none focus:border-amber-500 transition-all"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full p-4 mt-6 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <ShieldCheck className="w-5 h-5" />
                                    ACTUALIZAR CONTRASEÑA
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="mt-8 text-center text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
                    Nelux <span className="text-zinc-500">Security System</span>
                </p>
            </motion.div>
        </div>
    );
}
