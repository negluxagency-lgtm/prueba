"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutDashboard, Users, TrendingUp, DollarSign, Calendar, AlertCircle, ArrowRight } from 'lucide-react';

interface Profile {
    nombre_barberia: string;
    correo?: string;
}

interface BillingClientProps {
    profiles: Profile[];
    selectedBarberia: string;
    stats: {
        totalAppointments: number;
        totalRevenue: number;
        appointmentsWithoutPrice: number;
        noShows: number;
    } | null;
}

export default function BillingClient({ profiles, selectedBarberia, stats }: BillingClientProps) {
    const router = useRouter();
    const [ticketMedio, setTicketMedio] = useState<number>(15);

    const handleBarberiaChange = (nombre: string) => {
        if (!nombre) {
            router.push('/admin/billing');
        } else {
            router.push(`/admin/billing?barberia=${encodeURIComponent(nombre)}`);
        }
    };

    // Lógica Premium: Ingresos Reales + Estimación de las que vienen vacías
    const displayStats = stats ? {
        ...stats,
        estimatedRevenue: stats.appointmentsWithoutPrice * ticketMedio,
        finalRevenue: stats.totalRevenue + (stats.appointmentsWithoutPrice * ticketMedio),
        finalCommission: (stats.totalRevenue + (stats.appointmentsWithoutPrice * ticketMedio)) * 0.01
    } : null;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white flex items-center gap-3">
                            <LayoutDashboard className="text-amber-500 w-8 h-8 md:w-12 md:h-12" />
                            Admin <span className="text-amber-500">Billing</span>
                        </h1>
                        <p className="text-zinc-500 text-sm md:text-base mt-2 font-black uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Entorno Local Seguro • By-passing RLS
                        </p>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-2xl flex items-center gap-2 shadow-2xl">
                        <Calendar className="w-5 h-5 text-amber-500 ml-2" />
                        <span className="text-zinc-300 font-bold uppercase text-xs tracking-widest mr-2">
                            {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                </div>

                {/* Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2.5rem] backdrop-blur-md shadow-xl hover:border-zinc-700 transition-colors">
                        <label className="block text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-black mb-4 flex items-center gap-2">
                            <Users size={14} className="text-amber-500" /> Barbería a Auditar
                        </label>
                        <div className="relative">
                            <select
                                value={selectedBarberia}
                                onChange={(e) => handleBarberiaChange(e.target.value)}
                                className="w-full bg-black border border-zinc-800 rounded-xl px-5 py-4 text-white font-bold focus:outline-none focus:border-amber-500 transition-all appearance-none cursor-pointer"
                            >
                                <option value="">ELIGE UNA BARBERÍA...</option>
                                {profiles.map(p => (
                                    <option key={p.nombre_barberia} value={p.nombre_barberia}>
                                        {p.nombre_barberia.toUpperCase()} {p.correo ? `(${p.correo})` : ''}
                                    </option>
                                ))}
                            </select>
                            <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" size={20} />
                        </div>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2.5rem] backdrop-blur-md shadow-xl hover:border-zinc-700 transition-colors">
                        <label className="block text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-black mb-4 flex items-center gap-2">
                            <DollarSign size={14} className="text-amber-500" /> Ticket Medio Estimado
                        </label>
                        <div className="flex items-center gap-6">
                            <input
                                type="range"
                                min="10"
                                max="100"
                                step="5"
                                value={ticketMedio}
                                onChange={(e) => setTicketMedio(Number(e.target.value))}
                                className="flex-1 accent-amber-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer hover:bg-zinc-700 transition-colors"
                            />
                            <div className="bg-black border border-zinc-800 px-4 py-2 rounded-xl min-w-[80px] text-center">
                                <span className="text-2xl font-black text-amber-500">
                                    {ticketMedio}€
                                </span>
                            </div>
                        </div>
                        <p className="text-zinc-600 text-[10px] mt-4 italic font-medium uppercase tracking-tighter">
                            * Se aplica si no hay Precio registrado en la tabla Citas.
                        </p>
                    </div>
                </div>

                {/* Main Content */}
                {displayStats ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Citas IA */}
                        <div className="bg-zinc-900/80 border border-zinc-800 p-8 rounded-[2rem] relative overflow-hidden group">
                            <div className="absolute -right-2 -top-2 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                <LayoutDashboard size={100} />
                            </div>
                            <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-black mb-1">Citas Agendadas</p>
                            <h2 className="text-5xl font-black text-white italic tracking-tighter">{displayStats.totalAppointments}</h2>
                            <div className="mt-4 flex items-center gap-2 text-[10px] text-zinc-600 font-bold uppercase">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                                Excluyendo Ventas de Productos
                            </div>
                        </div>

                        {/* Ingresos Totales */}
                        <div className="bg-zinc-900/80 border border-zinc-800 p-8 rounded-[2rem] relative overflow-hidden group">
                            <div className="absolute -right-2 -top-2 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                <DollarSign size={100} />
                            </div>
                            <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-black mb-1">Facturación Base</p>
                            <h2 className="text-5xl font-black text-white italic tracking-tighter">{displayStats.finalRevenue.toFixed(0)}€</h2>
                            <div className="mt-4 flex items-center gap-2 text-[10px] text-zinc-600 font-bold uppercase">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                                Confirmados por IA
                            </div>
                        </div>

                        {/* No-Shows */}
                        <div className="bg-zinc-900/80 border border-zinc-800 p-8 rounded-[2rem] relative overflow-hidden group">
                            <div className="absolute -right-2 -top-2 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                <AlertCircle size={100} />
                            </div>
                            <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-black mb-1">No-Shows Perfil</p>
                            <h2 className="text-5xl font-black text-red-500/80 italic tracking-tighter">{displayStats.noShows}</h2>
                            <div className="mt-4 flex items-center gap-2 text-[10px] text-zinc-600 font-bold uppercase">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                                Pérdida de Tiempo Estimada
                            </div>
                        </div>

                        {/* Comisión 1% */}
                        <div className="bg-amber-500 p-8 rounded-[2.5rem] relative overflow-hidden group shadow-[0_30px_60px_rgba(245,158,11,0.25)] hover:shadow-[0_40px_80px_rgba(245,158,11,0.4)] transition-all transform hover:-translate-y-1">
                            <div className="absolute -right-6 -bottom-6 p-4 opacity-20">
                                <TrendingUp size={150} className="text-black" />
                            </div>
                            <p className="text-black/60 text-[10px] uppercase tracking-widest font-black mb-1">Comisión Nelux (1%)</p>
                            <h2 className="text-5xl font-black text-black italic tracking-tighter">{displayStats.finalCommission.toFixed(2)}€</h2>
                            <div className="mt-3 bg-black/10 px-4 py-1.5 rounded-full inline-block border border-black/5">
                                <p className="text-[10px] text-black font-black uppercase tracking-widest">A Facturar este Mes</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-32 border-2 border-dashed border-zinc-800 rounded-[3rem] bg-zinc-900/10 flex flex-col items-center gap-6">
                        <div className="bg-zinc-800 p-6 rounded-full animate-bounce">
                            <Users size={32} className="text-zinc-600" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-zinc-400 uppercase tracking-[0.4em] text-xs font-black">
                                Auditoría de Facturación Lista
                            </p>
                            <p className="text-zinc-600 text-[10px] uppercase font-bold">
                                Selecciona una barbería para iniciar el escaneo de base de datos
                            </p>
                        </div>
                    </div>
                )}

                {/* Advanced Info */}
                <div className="mt-16 bg-gradient-to-r from-zinc-900 to-transparent p-8 border-l-4 border-amber-500 rounded-r-3xl">
                    <h4 className="text-zinc-200 font-black uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
                        <AlertCircle size={14} className="text-amber-500" /> Lógica de Cálculo Interna
                    </h4>
                    <ul className="space-y-3">
                        <li className="flex gap-3 text-zinc-500 text-[11px] leading-relaxed">
                            <span className="text-amber-500 font-black">•</span>
                            <span>Bypass de RLS activo mediante <span className="text-zinc-300">SERVICE_ROLE_KEY</span> en capa de servidor.</span>
                        </li>
                        <li className="flex gap-3 text-zinc-500 text-[11px] leading-relaxed">
                            <span className="text-amber-500 font-black">•</span>
                            <span>La comisión del 1% se calcula sobre todos los servicios agendados (citas) que no sean productos físicos.</span>
                        </li>
                        <li className="flex gap-3 text-zinc-500 text-[11px] leading-relaxed">
                            <span className="text-amber-500 font-black">•</span>
                            <span>Vínculo de datos realizado por columna <span className="text-zinc-300">"barberia"</span> contra <span className="text-zinc-300">"nombre_barberia"</span>.</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
