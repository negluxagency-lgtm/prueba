'use client'

import React from 'react'
import { BookOpen, ExternalLink, Sparkles } from 'lucide-react'

export default function AutonomoGuide() {
    const PDF_URL = '/NELUX-Guia-2026-del-Barbero-Autonomo.pdf'

    return (
        <div className="relative group overflow-hidden bg-zinc-900 border border-zinc-800 rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 hover:border-amber-500/30 transition-all shadow-2xl">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full group-hover:bg-amber-500/10 transition-all duration-500" />
            
            <div className="relative flex flex-col md:flex-row items-center gap-4 md:gap-8">
                {/* Icon Section */}
                <div className="relative shrink-0">
                    <div className="w-12 h-12 md:w-20 md:h-20 rounded-xl md:rounded-[1.5rem] bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-inner">
                        <BookOpen className="w-6 h-6 md:w-10 md:h-10 text-amber-500" />
                    </div>
                    <div className="absolute -top-1.5 -right-1.5 p-1 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl">
                        <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 text-center md:text-left space-y-1 md:space-y-2">
                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                        <h3 className="text-lg md:text-2xl font-black italic uppercase tracking-tight text-white leading-tight">
                            Guía del Barbero <span className="text-amber-500">Autónomo 2026</span>
                        </h3>
                        <span className="hidden md:inline-block px-2 py-0.5 bg-zinc-800 text-zinc-500 text-[9px] font-black uppercase tracking-widest rounded-md border border-zinc-700">
                            Exclusivo
                        </span>
                    </div>
                    <p className="text-zinc-500 md:text-zinc-400 text-[10px] md:text-sm font-medium leading-relaxed max-w-xl">
                        Aprende a navegar las normativas de 2026, optimiza deducciones y maximiza el rendimiento de tu negocio.
                    </p>
                </div>

                {/* Action Section */}
                <div className="w-full md:w-auto shrink-0 mt-2 md:mt-0">
                    <a
                        href={PDF_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-[0.15em] rounded-xl md:rounded-3xl transition-all shadow-lg active:scale-95 group/btn"
                    >
                        Ver Guía
                        <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                </div>
            </div>
        </div>
    )
}
