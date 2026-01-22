"use client";

import React from 'react';
import { Check, X, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface DemoAppointment {
    id: number;
    nombre: string;
    servicio: string;
    hora: string;
    estado: 'confirmada' | 'pendiente' | 'cancelada';
    precio: number;
}

const DemoAppointmentTable: React.FC = () => {
    // Hardcoded demo appointments with updated prices
    const appointments: DemoAppointment[] = [
        { id: 1, nombre: 'Carlos', servicio: 'Corte + Barba', hora: '10:00', estado: 'confirmada', precio: 20 },
        { id: 2, nombre: 'Javi', servicio: 'Corte', hora: '11:00', estado: 'confirmada', precio: 13 },
        { id: 3, nombre: 'Miguel', servicio: 'Barba', hora: '11:45', estado: 'confirmada', precio: 8 },
        { id: 4, nombre: 'Alex', servicio: 'Corte', hora: '12:00', estado: 'cancelada', precio: 13 },
    ];

    const getStatusStyles = (estado: DemoAppointment['estado']) => {
        switch (estado) {
            case 'confirmada':
                return 'bg-green-500/20 text-green-500 border-green-500/50';
            case 'pendiente':
                return 'bg-amber-500/20 text-amber-500 border-amber-500/50';
            case 'cancelada':
                return 'bg-red-500/20 text-red-500 border-red-500/50';
        }
    };

    const getStatusIcon = (estado: DemoAppointment['estado']) => {
        switch (estado) {
            case 'confirmada':
                return <Check className="w-3 h-3 md:w-4 md:h-4" strokeWidth={3} />;
            case 'pendiente':
                return <Clock className="w-3 h-3 md:w-4 md:h-4" strokeWidth={2} />;
            case 'cancelada':
                return <X className="w-3 h-3 md:w-4 md:h-4" strokeWidth={3} />;
        }
    };

    const getStatusLabel = (estado: DemoAppointment['estado']) => {
        switch (estado) {
            case 'confirmada':
                return 'CONFIRMADA';
            case 'pendiente':
                return 'PENDIENTE';
            case 'cancelada':
                return 'CANCELADA';
        }
    };

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl md:rounded-[2rem] backdrop-blur-sm shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 md:px-6 md:py-4 border-b border-zinc-800 bg-zinc-800/20">
                <h3 className="font-bold text-sm md:text-lg flex items-center gap-3 text-zinc-300">
                    <Clock className="text-amber-500 w-4 h-4 md:w-5 md:h-5" />
                    Agenda — <span className="text-zinc-500 font-normal">Hoy</span>
                </h3>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="text-zinc-500 text-[9px] md:text-xs uppercase tracking-[0.15em] bg-black/40">
                        <tr>
                            <th className="px-4 py-3 md:px-6 md:py-4 font-bold">Cliente</th>
                            <th className="px-4 py-3 md:px-6 md:py-4 font-bold">Servicio</th>
                            <th className="hidden md:table-cell px-4 py-3 md:px-6 md:py-4 font-bold text-center">Estado</th>
                            <th className="px-4 py-3 md:px-6 md:py-4 font-bold">Hora</th>
                            <th className="px-4 py-3 md:px-6 md:py-4 font-bold text-amber-500/80">Precio</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40">
                        {appointments.map((cita, index) => (
                            <motion.tr
                                key={cita.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                className="hover:bg-amber-500/[0.03] transition-all group"
                            >
                                <td className="px-4 py-3 md:px-6 md:py-5 font-bold text-zinc-100 text-sm md:text-base group-hover:text-amber-500 transition-colors">
                                    {cita.nombre}
                                </td>
                                <td className="px-4 py-3 md:px-6 md:py-5 text-zinc-400 text-xs md:text-sm">
                                    {cita.servicio}
                                </td>
                                <td className="hidden md:table-cell px-4 py-3 md:px-6 md:py-5 text-center">
                                    <span className={`inline-flex items-center gap-1.5 md:gap-2 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl text-[9px] md:text-xs font-black border ${getStatusStyles(cita.estado)}`}>
                                        {getStatusIcon(cita.estado)}
                                        {getStatusLabel(cita.estado)}
                                    </span>
                                </td>
                                <td className="px-4 py-3 md:px-6 md:py-5 text-amber-500 text-sm md:text-base font-bold">
                                    {cita.hora}
                                </td>
                                <td className="px-4 py-3 md:px-6 md:py-5 text-base md:text-xl font-black text-amber-500/90">
                                    {cita.precio}€
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DemoAppointmentTable;
