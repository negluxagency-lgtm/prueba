import React from 'react';
import { X, Mail, CheckCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-zinc-900 border border-amber-500/30 w-full max-w-lg rounded-[2.5rem] p-8 md:p-12 shadow-[0_0_50px_rgba(245,158,11,0.2)] overflow-hidden relative text-center"
                    >
                        {/* Background Effects */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl"></div>

                        <div className="relative z-10 flex flex-col items-center gap-6">

                            {/* Icono Grande Animado */}
                            <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mb-2 animate-pulse">
                                <Mail className="w-10 h-10 text-amber-500" />
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tight text-white">
                                    ¡Registro <span className="text-amber-500">Exitoso!</span>
                                </h2>
                                <p className="text-zinc-400 font-medium">
                                    Bienvenido a la familia Nelux Barbershop
                                </p>
                            </div>

                            <div className="p-6 bg-zinc-800/50 border border-zinc-700/50 rounded-2xl w-full text-left flex gap-4 items-start">
                                <Info className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                                <div className="space-y-1">
                                    <p className="text-white font-bold text-lg">Acción Requerida</p>
                                    <p className="text-zinc-400 text-sm leading-relaxed">
                                        Te hemos enviado un <strong>formulario importante a tu correo electrónico</strong>. Es vital que lo completes para configurar tu barbería correctamente y activar todas las funciones.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black uppercase py-4 rounded-xl transition-all shadow-lg hover:shadow-amber-500/25 active:scale-95 flex items-center justify-center gap-2 mt-4"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Entendido, Revisaré mi Correo
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
