"use client";

import React from "react";
import { Scissors, TrendingUp, Calendar, Package, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function InicioPage() {
    const quickStats = [
        { label: "Citas Hoy", value: "8", icon: Calendar, color: "text-amber-500", bg: "bg-amber-500/10" },
        { label: "Ingresos Hoy", value: "240€", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { label: "Stock Bajo", value: "2", icon: Package, color: "text-red-500", bg: "bg-red-500/10" },
    ];

    const actions = [
        { title: "Ver Analíticas", desc: "Rendimiento real de tu negocio", href: "/trends", icon: TrendingUp },
        { title: "Gestión de Equipo", desc: "Controla a tus barberos", href: "/perfil", icon: Scissors },
        { title: "Contabilidad", desc: "Libros, gastos e informes", href: "/contabilidad", icon: ArrowRight },
    ];

    return (
        <main className="flex-1 p-4 lg:p-10 max-w-4xl lg:max-w-6xl mx-auto w-full pb-24 lg:pb-10">
            {/* Header Section */}
            <header className="mb-10 lg:mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full mb-4">
                    <Scissors className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Panel de Control</span>
                </div>
                <h1 className="text-4xl lg:text-6xl font-black italic tracking-tighter uppercase leading-none mb-3">
                    Bienvenido, <span className="text-amber-500">Comandante</span>
                </h1>
                <p className="text-zinc-500 font-medium text-sm lg:text-lg max-w-xl">
                    Tu imperio está en marcha. Aquí tienes un resumen rápido de la actividad de hoy.
                </p>
            </header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-12">
                {quickStats.map((stat, i) => (
                    <div 
                        key={i} 
                        className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[2rem] hover:border-zinc-700 transition-all group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest mb-1">{stat.label}</p>
                        <h3 className="text-3xl font-bold text-white group-hover:text-amber-500 transition-colors uppercase">{stat.value}</h3>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <h2 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                Accesos Directos
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {actions.map((action, i) => (
                    <Link 
                        key={i} 
                        href={action.href}
                        className="group bg-zinc-900/30 border border-zinc-800/50 p-6 rounded-3xl hover:bg-zinc-900/80 hover:border-amber-500/30 transition-all flex flex-col justify-between h-40"
                    >
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-zinc-800 rounded-xl group-hover:bg-amber-500 group-hover:text-black transition-colors">
                                <action.icon className="w-5 h-5" />
                            </div>
                            <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg mb-1">{action.title}</h3>
                            <p className="text-zinc-500 text-xs">{action.desc}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </main>
    );
}
