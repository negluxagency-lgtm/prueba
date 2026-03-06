import React from 'react';
import { createPortal } from 'react-dom';
import { Check, Clock, MessageCircle, Settings2, Receipt, Pencil, Trash2, Banknote, CreditCard, Smartphone, MoreHorizontal } from 'lucide-react';
import { Appointment } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';
import { PaymentMethodModal, PaymentMethod } from './PaymentMethodModal';

interface AppointmentTableProps {
    appointments: Appointment[];
    selectedDate: string;
    userPlan?: string;
    onEdit: (cita: Appointment) => void;
    onDelete: (item: Appointment) => void;
    onUpdateStatus: (id: number, status: 'pendiente' | 'confirmada' | 'cancelada', pago?: string) => void;
    onGenerateInvoice?: (cita: Appointment) => void;
    loading?: boolean;
    barbers?: any[]; // { id, nombre } objects
}

const PAGO_ICONS: Record<string, React.ReactNode> = {
    efectivo: <Banknote className="w-2.5 h-2.5 md:w-3 md:h-3" />,
    tarjeta: <CreditCard className="w-2.5 h-2.5 md:w-3 md:h-3" />,
    bizum: <Smartphone className="w-2.5 h-2.5 md:w-3 md:h-3" />,
    otra: <MoreHorizontal className="w-2.5 h-2.5 md:w-3 md:h-3" />,
};

const PAGO_COLORS: Record<string, string> = {
    efectivo: 'bg-green-500/10 text-green-400 border-green-500/20',
    tarjeta: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    bizum: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    otra: 'bg-zinc-800 text-zinc-400 border-zinc-700',
};

export const AppointmentTable: React.FC<AppointmentTableProps> = ({ appointments, selectedDate, userPlan, onEdit, onDelete, onUpdateStatus, onGenerateInvoice, loading, barbers = [] }) => {
    const fechaVisual = new Date(selectedDate + "T12:00:00").toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long'
    });
    const fechaFormateada = fechaVisual.charAt(0).toUpperCase() + fechaVisual.slice(1);

    const [menuState, setMenuState] = React.useState<{ id: number; x: number; y: number; type: 'status' | 'actions' } | null>(null);
    const [paymentModal, setPaymentModal] = React.useState<{ id: number } | null>(null);

    // Encontrar la cita activa si hay menú abierto
    const activeAppointment = menuState ? appointments.find(a => a.id === menuState.id) : null;

    const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, id: number, type: 'status' | 'actions') => {
        e.stopPropagation();
        e.preventDefault();

        if (menuState?.id === id && menuState?.type === type) {
            setMenuState(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        setMenuState({
            id,
            type,
            x: rect.left + (rect.width / 2),
            y: window.innerHeight - rect.top + 5
        });
    };


    const handleConfirmClick = (id: number) => {
        setMenuState(null);
        setPaymentModal({ id });
    };

    const handlePaymentSelect = (method: PaymentMethod) => {
        if (paymentModal) {
            onUpdateStatus(paymentModal.id, 'confirmada', method);
            setPaymentModal(null);
        }
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
                            <th className="px-2 py-1.5 md:px-4 md:py-3 font-bold text-center">Cliente</th>
                            <th className="px-2 py-1.5 md:px-4 md:py-3 font-bold text-center">Servicio</th>
                            <th className="px-2 py-1.5 md:px-4 md:py-3 font-bold text-center">Hora</th>
                            {(userPlan === 'Premium' || userPlan === 'Profesional') && (
                                <th className="px-2 py-1.5 md:px-4 md:py-3 font-bold text-center">Barbero</th>
                            )}
                            <th className="px-2 py-1.5 md:px-4 md:py-3 font-bold text-center">Estado</th>
                            <th className="px-2 py-1.5 md:px-4 md:py-3 font-bold text-amber-500/80 text-center">Precio</th>
                            <th className="px-2 py-1.5 md:px-4 md:py-3 font-bold text-center">WhatsApp</th>
                            <th className="px-2 py-1.5 md:px-4 md:py-3 font-bold text-zinc-400/80 text-center">Pago</th>
                            <th className="px-2 py-1.5 md:px-4 md:py-3 font-bold text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40">
                        {loading ? (
                            // LOADING SKELETONS
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    <td className="px-2 py-4 md:px-4 md:py-3 text-center"><Skeleton className="h-5 w-24 md:w-32 mx-auto" /></td>
                                    <td className="px-2 py-4 md:px-4 md:py-3 text-center"><Skeleton className="h-4 w-16 md:w-24 mx-auto" /></td>
                                    <td className="px-2 py-4 md:px-4 md:py-3 text-center"><Skeleton className="h-5 w-12 md:w-16 mx-auto" /></td>
                                    {(userPlan === 'Premium' || userPlan === 'Profesional') && (
                                        <td className="px-2 py-4 md:px-4 md:py-3 text-center"><Skeleton className="h-4 w-16 md:w-24 mx-auto" /></td>
                                    )}
                                    <td className="px-2 py-4 md:px-4 md:py-3 text-center"><Skeleton className="h-7 w-20 md:w-24 mx-auto rounded-lg" /></td>
                                    <td className="px-2 py-4 md:px-4 md:py-3 text-center"><Skeleton className="h-5 w-8 md:w-12 mx-auto" /></td>
                                    <td className="px-2 py-4 md:px-4 md:py-3 text-center"><Skeleton className="h-7 w-16 md:w-20 mx-auto rounded-lg" /></td>
                                    <td className="px-2 py-4 md:px-4 md:py-3 text-center"><Skeleton className="h-6 w-12 md:w-16 mx-auto rounded-lg" /></td>
                                    <td className="px-2 py-4 md:px-4 md:py-3 text-center"><div className="flex justify-center"><Skeleton className="h-7 w-7 rounded-lg" /></div></td>
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
                                            <td className="px-2 py-1 md:px-4 md:py-3 font-bold text-zinc-100 text-[11px] md:text-sm group-hover:text-amber-500 transition-colors text-center">
                                                {cita.Nombre}
                                            </td>
                                            <td className="px-2 py-1 md:px-4 md:py-3 text-zinc-300 text-[10px] md:text-xs font-medium text-center">
                                                {cita.servicio || <span className="text-zinc-600 italic">--</span>}
                                            </td>
                                            <td className="px-2 py-1 md:px-4 md:py-3 text-amber-500 text-[11px] md:text-sm font-bold text-center">
                                                {cita.Hora ? cita.Hora.slice(0, 5) : "--:--"}
                                            </td>
                                            {(userPlan === 'Premium' || userPlan === 'Profesional') && (
                                                <td className="px-2 py-1 md:px-4 md:py-3 text-zinc-300 text-[10px] md:text-xs font-medium text-center">
                                                    {(() => {
                                                        if (!cita.barbero) return <span className="text-zinc-600 italic">Sin asignar</span>;
                                                        const barberObj = barbers.find(b => b.id === cita.barbero);
                                                        return barberObj ? barberObj.nombre : cita.barbero;
                                                    })()}
                                                </td>
                                            )}
                                            <td className="px-2 py-1 md:px-4 md:py-3 text-center">
                                                <div className="relative inline-block">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleOpenMenu(e, cita.id, 'status')}
                                                        className={`inline-flex items-center gap-1 md:gap-1.5 px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[7px] md:text-[10px] font-black transition-all border ${cita.cancelada
                                                            ? 'bg-red-500/20 text-red-500 border-red-500/50 hover:bg-red-500/30'
                                                            : cita.confirmada
                                                                ? 'bg-green-500/20 text-green-500 border-green-500/50 hover:bg-green-500/30'
                                                                : 'bg-amber-500/20 text-amber-500 border-amber-500/50 hover:bg-amber-500/30'
                                                            }`}
                                                    >
                                                        <Check className={`w-2 h-2 md:w-3 md:h-3 opacity-100`} strokeWidth={4} />
                                                        {cita.cancelada ? 'CANCELADA' : cita.confirmada ? 'CONFIRMADA' : 'PENDIENTE'}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-2 py-1 md:px-4 md:py-3 text-xs md:text-base font-black text-amber-500/90 text-center">{cita.Precio || 0}€</td>
                                            <td className="px-2 py-1 md:px-4 md:py-3 text-center">
                                                {cita.Telefono ? (
                                                    (userPlan === 'Premium' || userPlan === 'Profesional') ? (
                                                        <Link
                                                            href={`/mensajes?tlf=${String(cita.Telefono).replace(/\+/g, '')}`}
                                                            className="inline-flex items-center gap-1 md:gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-green-500 px-1.5 py-0.5 md:px-3 md:py-1.5 rounded-sm md:rounded-lg text-[7px] md:text-xs transition-all border border-zinc-700/50"
                                                        >
                                                            <MessageCircle className="w-2 h-2 md:w-3 md:h-3" />
                                                            {cita.Telefono}
                                                        </Link>
                                                    ) : (
                                                        <div
                                                            className="inline-flex items-center gap-1 md:gap-2 bg-zinc-800 text-zinc-300 px-1.5 py-0.5 md:px-3 md:py-1.5 rounded-sm md:rounded-lg text-[7px] md:text-xs transition-all border border-zinc-700/50"
                                                        >
                                                            <MessageCircle className="w-2 h-2 md:w-3 md:h-3" />
                                                            {cita.Telefono}
                                                        </div>
                                                    )
                                                ) : (
                                                    <span className="text-zinc-600 text-[7px] md:text-xs italic">Sin Tlf</span>
                                                )}
                                            </td>
                                            <td className="px-2 py-1 md:px-4 md:py-3 text-center">
                                                {cita.pago ? (
                                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg border text-[7px] md:text-[10px] font-black uppercase tracking-widest ${PAGO_COLORS[cita.pago] || PAGO_COLORS.otra}`}>
                                                        {PAGO_ICONS[cita.pago]}
                                                        <span className="hidden md:inline">{cita.pago}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-700 text-[7px] md:text-xs italic">--</span>
                                                )}
                                            </td>
                                            <td className="px-2 py-1 md:px-4 md:py-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleOpenMenu(e, cita.id, 'actions')}
                                                    className="p-1.5 md:p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-amber-500 rounded-lg transition-all border border-zinc-700/50 hover:border-amber-500/50"
                                                >
                                                    <Settings2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={(userPlan === 'Premium' || userPlan === 'Profesional') ? 9 : 8} className="px-8 py-10 text-center text-zinc-600 italic uppercase tracking-widest text-[9px] md:text-xs">
                                            Sin citas hoy
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        )}
                    </tbody>
                </table>
            </div>

            {/* PORTAL/OVERLAY MENU */}
            {menuState && activeAppointment && createPortal(
                <>
                    <div
                        className="fixed inset-0 z-[9998] cursor-default"
                        onClick={() => setMenuState(null)}
                    />

                    <div
                        className="fixed z-[9999] w-36 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/50 animate-in fade-in slide-in-from-bottom-2 duration-100"
                        style={{
                            left: `${menuState.x}px`,
                            bottom: `${menuState.y}px`,
                            transform: 'translateX(-50%)'
                        }}
                    >

                        {menuState.type === 'status' ? (
                            <div className="bg-zinc-950">
                                <button
                                    onClick={() => {
                                        onUpdateStatus(activeAppointment.id, 'pendiente');
                                        setMenuState(null);
                                    }}
                                    className="w-full text-left px-3 py-2 md:px-4 md:py-3 text-[9px] md:text-xs font-bold text-amber-500 hover:bg-zinc-800/80 transition-colors flex items-center gap-2 md:gap-3"
                                >
                                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                                    PENDIENTE
                                </button>
                                <button
                                    onClick={() => handleConfirmClick(activeAppointment.id)}
                                    className="w-full text-left px-3 py-2 md:px-4 md:py-3 text-[9px] md:text-xs font-bold text-green-500 hover:bg-zinc-800/80 transition-colors flex items-center gap-2 md:gap-3 border-t border-zinc-800/50"
                                >
                                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                                    CONFIRMADA
                                </button>
                                <button
                                    onClick={() => {
                                        onUpdateStatus(activeAppointment.id, 'cancelada');
                                        setMenuState(null);
                                    }}
                                    className="w-full text-left px-3 py-2 md:px-4 md:py-3 text-[9px] md:text-xs font-bold text-red-500 hover:bg-zinc-800/80 transition-colors flex items-center gap-2 md:gap-3 border-t border-zinc-800/50"
                                >
                                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                                    CANCELADA
                                </button>
                            </div>
                        ) : (
                            <div className="p-1">
                                {onGenerateInvoice && (
                                    <button
                                        onClick={() => {
                                            onGenerateInvoice(activeAppointment);
                                            setMenuState(null);
                                        }}
                                        className="w-full text-left px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-xs font-bold text-white hover:bg-amber-500 hover:text-black transition-all flex items-center gap-3 group"
                                    >
                                        <Receipt className="w-4 h-4 opacity-60 group-hover:opacity-100" />
                                        Hacer Factura
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        onEdit(activeAppointment);
                                        setMenuState(null);
                                    }}
                                    className="w-full text-left px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-xs font-bold text-zinc-400 hover:bg-white/10 hover:text-white transition-all flex items-center gap-3"
                                >
                                    <Pencil className="w-4 h-4 opacity-60" />
                                    Editar Cita
                                </button>
                                <button
                                    onClick={() => {
                                        onDelete(activeAppointment);
                                        setMenuState(null);
                                    }}
                                    className="w-full text-left px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-xs font-bold text-red-500/70 hover:bg-red-500/10 hover:text-red-500 transition-all flex items-center gap-3 border-t border-zinc-800/50 mt-1 pt-2"
                                >
                                    <Trash2 className="w-4 h-4 opacity-60" />
                                    Eliminar
                                </button>
                            </div>
                        )}
                    </div>
                </>,
                document.body
            )}

            {/* Payment Method Modal */}
            <PaymentMethodModal
                isOpen={!!paymentModal}
                onClose={() => setPaymentModal(null)}
                onSelect={handlePaymentSelect}
            />
        </div>
    );
};
