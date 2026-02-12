"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, User, Calendar, Clock, ChevronRight, Star, Check } from 'lucide-react';

const DemoBookingPreview = () => {
    const [step, setStep] = useState(1);

    // Auto-advance demo to simulate interaction
    React.useEffect(() => {
        const timer = setInterval(() => {
            setStep((prev) => (prev >= 4 ? 1 : prev + 1));
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    const variants = {
        enter: { opacity: 0, x: 20 },
        center: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
    };

    return (
        <div className="relative mx-auto w-full max-w-[200px] xs:max-w-[240px] md:max-w-[360px] aspect-[9/19] bg-black rounded-[2rem] md:rounded-[2.5rem] border-4 md:border-8 border-zinc-900 shadow-2xl overflow-hidden ring-1 ring-zinc-800/50 transform-gpu">
            {/* Dynamic Island / Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-20 md:h-7 md:w-28 bg-black rounded-b-xl md:rounded-b-2xl z-20 flex items-center justify-center">
                <div className="w-12 h-1 md:w-16 md:h-1.5 bg-zinc-900 rounded-full" />
            </div>

            {/* Status Bar */}
            <div className="absolute top-2 left-5 right-5 flex justify-between text-[8px] md:text-[10px] font-medium text-zinc-500 z-20">
                <span>19:41</span>
                <div className="flex gap-0.5 md:gap-1">
                    <div className="w-2 h-2 md:w-3 md:h-3 bg-zinc-800 rounded-[1px] md:rounded-sm" />
                    <div className="w-2 h-2 md:w-3 md:h-3 bg-zinc-800 rounded-[1px] md:rounded-sm" />
                    <div className="w-2.5 h-2 md:w-4 md:h-3 bg-zinc-800 rounded-[1px] md:rounded-sm" />
                </div>
            </div>

            {/* Content Container */}
            <div className="relative h-full flex flex-col pt-8 md:pt-12 px-3 md:px-4 pb-4 md:pb-6 bg-gradient-to-br from-zinc-950 to-zinc-900">

                {/* Header */}
                {step !== 4 && (
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                            <span className="font-bold text-amber-500 text-xs">NL</span>
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm leading-tight">Nelux Barber</h3>
                            <p className="text-zinc-500 text-[10px]">Reservar Cita</p>
                        </div>
                    </div>
                )}

                {/* Simulated Flow */}
                <div className="flex-1 relative">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.4 }}
                                className="space-y-3"
                            >
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">1. Selecciona Servicio</p>
                                {[
                                    { name: "Corte Clásico", time: "45 min", price: "20€" },
                                    { name: "Corte + Barba", time: "60 min", price: "35€" },
                                    { name: "Afeitado Premium", time: "30 min", price: "15€" },
                                ].map((s, i) => (
                                    <div key={i} className={`p-2 md:p-3 rounded-lg md:rounded-xl border flex items-center justify-between ${i === 0 ? 'bg-amber-500/10 border-amber-500/50' : 'bg-zinc-900/50 border-zinc-800'}`}>
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <div className="p-1.5 md:p-2 bg-zinc-800/50 rounded-lg">
                                                <Scissors className={`w-3 h-3 md:w-4 md:h-4 ${i === 0 ? 'text-amber-500' : 'text-zinc-400'}`} />
                                            </div>
                                            <div>
                                                <p className={`text-[10px] md:text-sm font-bold ${i === 0 ? 'text-white' : 'text-zinc-300'}`}>{s.name}</p>
                                                <p className="text-[8px] md:text-[10px] text-zinc-500">{s.time}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-[10px] md:text-sm font-bold ${i === 0 ? 'text-amber-500' : 'text-zinc-300'}`}>{s.price}</p>
                                            {i === 0 && <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-amber-500 ml-auto mt-1" />}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.4 }}
                                className="space-y-3"
                            >
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">2. Elige Profesional</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { name: "Alex" },
                                        { name: "Marco" },
                                        { name: "Dani" },
                                        { name: "Cualquiera" },
                                    ].map((p, i) => (
                                        <div key={i} className={`p-2 md:p-3 rounded-lg md:rounded-xl border flex flex-col items-center gap-1.5 md:gap-2 text-center ${i === 1 ? 'bg-amber-500/10 border-amber-500/50' : 'bg-zinc-900/50 border-zinc-800'}`}>
                                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                                                <User className={`w-4 h-4 md:w-5 md:h-5 ${i === 1 ? 'text-amber-500' : 'text-zinc-400'}`} />
                                            </div>
                                            <div>
                                                <p className={`text-[10px] md:text-xs font-bold ${i === 1 ? 'text-white' : 'text-zinc-300'}`}>{p.name}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.4 }}
                                className="space-y-3"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">3. Fecha y Hora</p>
                                    <p className="text-[10px] text-amber-500 font-bold">Hoy, 12 Oct</p>
                                </div>

                                <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                                    {['16:00', '16:45', '17:30', '18:15', '19:00', '19:45'].map((t, i) => (
                                        <div key={i} className={`py-1.5 md:py-2 rounded-lg border text-center ${i === 2 ? 'bg-amber-500 text-black border-amber-500 font-bold' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400'}`}>
                                            <span className="text-[10px] md:text-xs">{t}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 pt-4 border-t border-zinc-800">
                                    <div className="w-full bg-white text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-white/10">
                                        Confirmar Cita
                                        <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        {step === 4 && (
                            <motion.div
                                key="step4"
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.4 }}
                                className="flex flex-col items-center justify-center text-center space-y-6 w-full h-full pb-10"
                            >
                                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                                    <Check className="w-10 h-10 text-black stroke-[3]" />
                                </div>

                                <div>
                                    <h3 className="text-2xl font-black text-white mb-2">¡Confirmada!</h3>
                                    <p className="text-zinc-400 text-sm">
                                        Te hemos enviado los detalles por WhatsApp.
                                    </p>
                                </div>

                                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 w-full">
                                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-zinc-800/50">
                                        <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                                            <Calendar className="w-5 h-5 text-amber-500" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-white font-bold text-sm">Hoy, 12 Oct</p>
                                            <p className="text-zinc-500 text-xs">17:30 - 18:30</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-zinc-400">Servicio</span>
                                        <span className="text-white font-bold">Corte + Barba</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Bottom Bar */}
                <div className="mt-4 flex justify-center">
                    <div className="w-1/3 h-1 bg-zinc-800 rounded-full" />
                </div>
            </div>

            {/* Gloss Effect */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/5 to-transparent rounded-[2.5rem]" />
        </div>
    );
};

export default DemoBookingPreview;
