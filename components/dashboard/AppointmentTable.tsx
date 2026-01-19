import React from 'react';
import { createPortal } from 'react-dom';
import { Check, Clock, MessageCircle, Pencil, Trash2 } from 'lucide-react';
import { Appointment } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';

interface AppointmentTableProps {
    appointments: Appointment[];
    selectedDate: string;
    onEdit: (cita: Appointment) => void;
    onDelete: (id: number) => void;
    onUpdateStatus: (id: number, status: 'pendiente' | 'confirmada' | 'cancelada') => void;
    loading?: boolean;
}

export const AppointmentTable: React.FC<AppointmentTableProps> = ({ appointments, selectedDate, onEdit, onDelete, onUpdateStatus, loading }) => {
    const fechaVisual = new Date(selectedDate + "T12:00:00").toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long'
    });
    const fechaFormateada = fechaVisual.charAt(0).toUpperCase() + fechaVisual.slice(1);

    const [menuState, setMenuState] = React.useState<{ id: number; x: number; y: number } | null>(null);

    // Encontrar la cita activa si hay menú abierto
    const activeAppointment = menuState ? appointments.find(a => a.id === menuState.id) : null;

    const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
        e.stopPropagation();
        e.preventDefault(); // Prevenir comportamientos por defecto touch

        // Si ya está abierto este ID, cerrar
        if (menuState?.id === id) {
            setMenuState(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        // Calcular posición centrada debajo del botón
        // Ajuste para móvil vs desktop si es necesario, pero fixed va bien
        setMenuState({
            id,
            x: rect.left + (rect.width / 2),
            y: rect.bottom + 5
        });
    };

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg md:rounded-[2rem] backdrop-blur-sm shadow-2xl relative">
            <div className="px-3 py-1.5 md:px-8 md:py-6 border-b border-zinc-800 bg-zinc-800/20">
                <h3 className="font-bold text-[10px] md:text-xl flex items-center gap-2 md:gap-4 text-zinc-300">
                    <Clock size={12} className="text-amber-500 w-3 h-3 md:w-5 md:h-5" /> Agenda — <span className="text-zinc-500 font-normal">{fechaFormateada}</span>
                </h3>
            </div>

            <div className="overflow-x-auto overflow-y-visible">
                <table className="w-full text-left border-collapse">
                    <thead className="text-zinc-500 text-[8px] md:text-xs uppercase tracking-[0.2em] bg-black/40">
                        <tr>
                            <th className="px-3 py-1.5 md:px-8 md:py-5 font-bold">Cliente</th>
                            <th className="px-3 py-1.5 md:px-8 md:py-5 font-bold text-center">WhatsApp</th>
                            <th className="px-3 py-1.5 md:px-8 md:py-5 font-bold text-center">Estado</th>
                            <th className="px-3 py-1.5 md:px-8 md:py-5 font-bold">Hora</th>
                            <th className="px-3 py-1.5 md:px-8 md:py-5 font-bold text-amber-500/80">Precio</th>
                            <th className="px-3 py-1.5 md:px-8 md:py-5 font-bold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40">
                        {loading ? (
                            // LOADING SKELETONS
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                                    <td className="px-6 py-4 text-center"><Skeleton className="h-7 w-24 mx-auto" /></td>
                                    <td className="px-6 py-4 text-center"><Skeleton className="h-7 w-20 mx-auto" /></td>
                                    <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                                    <td className="px-6 py-4"><Skeleton className="h-5 w-12" /></td>
                                    <td className="px-6 py-4"><div className="flex justify-end gap-2"><Skeleton className="h-7 w-7 rounded-lg" /><Skeleton className="h-7 w-7 rounded-lg" /></div></td>
                                </tr>
                            ))
                        ) : (
                            <AnimatePresence mode='popLayout'>
                                {appointments.length > 0 ? (
                                    appointments.map((cita, index) => (
                                        <motion.tr
                                            key={cita.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ duration: 0.2, delay: index * 0.05 }}
                                            className="hover:bg-amber-500/[0.03] transition-all group"
                                        >
                                            <td className="px-3 py-1 md:px-8 md:py-6 font-bold text-zinc-100 text-[11px] md:text-lg group-hover:text-amber-500 transition-colors">
                                                {cita.Nombre}
                                            </td>
                                            <td className="px-3 py-1 md:px-8 md:py-6 text-center">
                                                {cita.Telefono ? (
                                                    <Link
                                                        href={`/mensajes?tlf=${String(cita.Telefono).replace(/\+/g, '')}`}
                                                        className="inline-flex items-center gap-1 md:gap-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-green-500 px-1.5 py-0.5 md:px-4 md:py-2 rounded-sm md:rounded-xl text-[7px] md:text-xs transition-all border border-zinc-700/50"
                                                    >
                                                        <MessageCircle className="w-2 h-2 md:w-4 md:h-4" />
                                                        {cita.Telefono}
                                                    </Link>
                                                ) : (
                                                    <span className="text-zinc-600 text-[7px] md:text-xs italic">Sin Telefono</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-1 md:px-8 md:py-6 text-center">
                                                <div className="relative inline-block">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleOpenMenu(e, cita.id)}
                                                        className={`inline-flex items-center gap-1 md:gap-2 px-2 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[7px] md:text-xs font-black transition-all border ${cita.cancelada
                                                            ? 'bg-red-500/20 text-red-500 border-red-500/50 hover:bg-red-500/30'
                                                            : cita.confirmada
                                                                ? 'bg-green-500/20 text-green-500 border-green-500/50 hover:bg-green-500/30'
                                                                : 'bg-amber-500/20 text-amber-500 border-amber-500/50 hover:bg-amber-500/30'
                                                            }`}
                                                    >
                                                        <Check className={`w-2 h-2 md:w-4 md:h-4 opacity-100`} strokeWidth={4} />
                                                        {cita.cancelada ? 'CANCELADA' : cita.confirmada ? 'CONFIRMADA' : 'PENDIENTE'}
                                                    </button>
                                                </div>
                                            </td>

                                            <td className="px-3 py-1 md:px-8 md:py-6 text-amber-500 text-[11px] md:text-lg font-bold">
                                                {cita.Hora ? cita.Hora.slice(0, 5) : "--:--"}
                                            </td>
                                            <td className="px-3 py-1 md:px-8 md:py-6 text-xs md:text-xl font-black text-amber-500/90">{cita.Precio || 0}€</td>

                                            <td className="px-3 py-1 md:px-8 md:py-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => onEdit(cita)}
                                                        className="p-1 md:p-3 bg-zinc-800 hover:bg-blue-500/20 hover:text-blue-500 text-zinc-400 rounded-sm md:rounded-xl transition-all border border-transparent hover:border-blue-500/50"
                                                        title="Editar"
                                                    >
                                                        <Pencil className="w-2.5 h-2.5 md:w-5 md:h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => onDelete(cita.id)}
                                                        className="p-1 md:p-3 bg-zinc-800 hover:bg-red-500/20 hover:text-red-500 text-zinc-400 rounded-sm md:rounded-xl transition-all border border-transparent hover:border-red-500/50"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="w-2.5 h-2.5 md:w-5 md:h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-10 text-center text-zinc-600 italic uppercase tracking-widest text-[9px] md:text-xs">
                                            Sin citas hoy
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        )}
                    </tbody>
                </table>
            </div>

            {/* PORTAL/OVERLAY MENU (Fuera del overflow y de cualquier transform) */}
            {menuState && activeAppointment && createPortal(
                <>
                    {/* Backdrop Invisible */}
                    <div
                        className="fixed inset-0 z-[9998] cursor-default"
                        onClick={() => setMenuState(null)}
                    />

                    {/* Menú Posicionado */}
                    <div
                        className="fixed z-[9999] w-28 md:w-36 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/50 animate-in fade-in zoom-in-95 duration-100"
                        style={{
                            left: `${menuState.x}px`,
                            top: `${menuState.y}px`,
                            transform: 'translateX(-50%)'
                        }}
                    >
                        <button
                            onClick={() => {
                                onUpdateStatus(activeAppointment.id, 'pendiente');
                                setMenuState(null);
                            }}
                            className="w-full text-left px-2 py-2 md:px-4 md:py-3 text-[9px] md:text-xs font-bold text-amber-500 hover:bg-zinc-800/80 transition-colors flex items-center gap-2 md:gap-3"
                        >
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                            PENDIENTE
                        </button>
                        <button
                            onClick={() => {
                                onUpdateStatus(activeAppointment.id, 'confirmada');
                                setMenuState(null);
                            }}
                            className="w-full text-left px-2 py-2 md:px-4 md:py-3 text-[9px] md:text-xs font-bold text-green-500 hover:bg-zinc-800/80 transition-colors flex items-center gap-2 md:gap-3 border-t border-zinc-800/50"
                        >
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                            CONFIRMADA
                        </button>
                        <button
                            onClick={() => {
                                onUpdateStatus(activeAppointment.id, 'cancelada');
                                setMenuState(null);
                            }}
                            className="w-full text-left px-2 py-2 md:px-4 md:py-3 text-[9px] md:text-xs font-bold text-red-500 hover:bg-zinc-800/80 transition-colors flex items-center gap-2 md:gap-3 border-t border-zinc-800/50"
                        >
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                            CANCELADA
                        </button>
                    </div>
                </>,
                document.body
            )}
        </div>
    );
};
