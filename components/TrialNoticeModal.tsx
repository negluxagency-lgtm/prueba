"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrialNoticeModalProps {
    userStatus: string | null;
}

export function TrialNoticeModal({ userStatus }: TrialNoticeModalProps) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const hasSeenWarning = localStorage.getItem("trial_warning_seen");
        // Mostramos solo si es estado prueba y no lo ha visto
        if (userStatus === "prueba" && !hasSeenWarning) {
            setShow(true);
        }
    }, [userStatus]);

    const handleClose = () => {
        localStorage.setItem("trial_warning_seen", "true");
        setShow(false);
    };

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Modal Arfifact */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-zinc-950 border border-amber-500/30 rounded-[2rem] p-8 md:p-10 shadow-2xl shadow-amber-500/10 overflow-hidden"
                    >
                        {/* Glow effect */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 blur-[80px] rounded-full" />

                        <div className="relative flex flex-col items-center text-center space-y-6">
                            {/* Icon */}
                            <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center border border-amber-500/20 shadow-inner">
                                <AlertTriangle className="w-10 h-10 text-amber-500" />
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white">
                                    Modo de Prueba <span className="text-amber-500">Activado</span>
                                </h2>
                                <div className="h-1 w-20 bg-amber-500/50 mx-auto rounded-full" />
                            </div>

                            <div className="space-y-4">
                                <p className="text-zinc-300 text-sm md:text-base leading-relaxed">
                                    Bienvenido a Nelux. Tienes acceso completo a la gestión de citas, métricas y base de datos.
                                </p>

                                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                                    <p className="text-zinc-400 text-xs md:text-sm leading-relaxed">
                                        <span className="text-amber-500 font-black">⚠️ NOTA IMPORTANTE:</span> Debido a los costes de infraestructura, la IA de WhatsApp (GPT-4o) solo está activa en planes suscritos. Durante la prueba, podrás ver cómo se configura, pero no enviará mensajes reales.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleClose}
                                className="w-full py-4 bg-white hover:bg-zinc-200 text-black rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-[0.98] shadow-xl"
                            >
                                Entendido, continuar al Dashboard
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
