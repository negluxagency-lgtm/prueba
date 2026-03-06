'use client'

import React from 'react'
import { BookOpen, ExternalLink, Sparkles } from 'lucide-react'

export default function AutonomoGuide() {
    const PDF_URL = '/NELUX-Guia-2026-del-Barbero-Autonomo.pdf'

    return (
        <div className="relative group overflow-hidden bg-zinc-900 border border-zinc-800 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 hover:border-amber-500/30 transition-all shadow-2xl">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full group-hover:bg-amber-500/10 transition-all duration-500" />
            
            <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8">
                {/* Icon Section */}
                <div className="relative shrink-0">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-[1.5rem] bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-inner">
                        <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-amber-500" />
                    </div>
                    <div className="absolute -top-2 -right-2 p-1.5 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 text-center md:text-left space-y-2">
                    <div className="flex flex-col md:flex-row md:items-center gap-2">
                        <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tight text-white">
                            Guía del Barbero <span className="text-amber-500">Autónomo 2026</span>
                        </h3>
                        <span className="hidden md:inline-block px-2 py-0.5 bg-zinc-800 text-zinc-500 text-[9px] font-black uppercase tracking-widest rounded-md border border-zinc-700">
                            Exclusivo
                        </span>
                    </div>
                    <p className="text-zinc-400 text-xs md:text-sm font-medium leading-relaxed max-w-xl">
                        Hemos preparado una guía completa para ayudarte a navegar las nuevas normativas fiscales de 2026, optimizar tus deducciones y maximizar el rendimiento de tu negocio.
                    </p>
                </div>

                {/* Action Section */}
                <div className="w-full md:w-auto shrink-0">
                    <a
                        href={PDF_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-[0.15em] rounded-2xl md:rounded-3xl transition-all shadow-[0_10px_30px_rgba(245,158,11,0.2)] active:scale-95 group/btn"
                    >
                        Ver Guía Completa
                        <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                </div>
            </div>
        </div>
    )
}
