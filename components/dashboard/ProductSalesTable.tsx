"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShoppingBag, MoreHorizontal, Pencil, Trash2, FileText } from 'lucide-react';
import { Appointment } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/Skeleton';

interface ProductSalesTableProps {
    sales: Appointment[];
    onEdit: (sale: Appointment) => void;
    onDelete: (item: Appointment) => void;
    onGenerateInvoice?: (sale: Appointment) => void;
    loading?: boolean;
}

function ActionsDropdown({ sale, onEdit, onDelete, onGenerateInvoice }: {
    sale: Appointment
    onEdit: (s: Appointment) => void
    onDelete: (s: Appointment) => void
    onGenerateInvoice?: (s: Appointment) => void
}) {
    const [open, setOpen] = useState(false)
    const [coords, setCoords] = useState({ bottom: 0, right: 0 })
    const triggerRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        if (open) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [open])

    const handleOpen = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect()
            setCoords({
                // Distance from bottom of screen to top of button - 6px gap
                bottom: window.innerHeight - rect.top + 6,
                right: window.innerWidth - rect.right,
            })
        }
        setOpen(v => !v)
    }

    const menu = open ? (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 4 }}
                transition={{ duration: 0.12 }}
                style={{ position: 'fixed', bottom: coords.bottom, right: coords.right, zIndex: 9999 }}
                className="w-48 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden"
            >
                {onGenerateInvoice && (
                    <button
                        onClick={() => { onGenerateInvoice(sale); setOpen(false) }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-zinc-300 hover:bg-amber-500/10 hover:text-amber-400 transition-all text-[11px] font-bold uppercase tracking-widest"
                    >
                        <FileText className="w-3.5 h-3.5" />
                        Generar Factura
                    </button>
                )}
                <button
                    onClick={() => { onEdit(sale); setOpen(false) }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-zinc-300 hover:bg-blue-500/10 hover:text-blue-400 transition-all text-[11px] font-bold uppercase tracking-widest"
                >
                    <Pencil className="w-3.5 h-3.5" />
                    Editar
                </button>
                <button
                    onClick={() => { onDelete(sale); setOpen(false) }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-zinc-300 hover:bg-red-500/10 hover:text-red-400 transition-all text-[11px] font-bold uppercase tracking-widest border-t border-zinc-800"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar
                </button>
            </motion.div>
        </AnimatePresence>
    ) : null

    return (
        <div className="relative">
            <button
                onClick={handleOpen}
                ref={triggerRef}
                className="p-1 md:p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-sm md:rounded-xl transition-all border border-transparent hover:border-zinc-600"
            >
                <MoreHorizontal className="w-2.5 h-2.5 md:w-4 md:h-4" />
            </button>
            {menu && createPortal(menu, document.body)}
        </div>
    )
}

export const ProductSalesTable: React.FC<ProductSalesTableProps> = ({ sales, onEdit, onDelete, onGenerateInvoice, loading }) => {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg md:rounded-[2rem] overflow-hidden backdrop-blur-sm shadow-2xl mt-8">
            <div className="px-3 py-1.5 md:px-8 md:py-6 border-b border-zinc-800 bg-amber-500/5">
                <h3 className="font-bold text-[10px] md:text-xl flex items-center gap-2 md:gap-4 text-amber-500">
                    <ShoppingBag size={12} className="text-amber-500 w-3 h-3 md:w-5 md:h-5" /> Ventas de Productos
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="text-zinc-500 text-[8px] md:text-xs uppercase tracking-[0.2em] bg-black/40">
                        <tr>
                            <th className="px-3 py-1.5 md:px-8 md:py-5 font-bold">Nombre</th>
                            <th className="px-3 py-1.5 md:px-8 md:py-5 font-bold text-center">Cantidad</th>
                            <th className="px-3 py-1.5 md:px-8 md:py-5 font-bold text-amber-500/80">Precio</th>
                            <th className="px-3 py-1.5 md:px-8 md:py-5 font-bold">Hora</th>
                            <th className="px-3 py-1.5 md:px-8 md:py-5 font-bold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40">
                        {loading ? (
                            Array.from({ length: 2 }).map((_, i) => (
                                <tr key={i}>
                                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                                    <td className="px-6 py-4 text-center"><Skeleton className="h-5 w-8 mx-auto" /></td>
                                    <td className="px-6 py-4"><Skeleton className="h-5 w-12" /></td>
                                    <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                                    <td className="px-6 py-4"><div className="flex justify-end"><Skeleton className="h-7 w-7 rounded-lg" /></div></td>
                                </tr>
                            ))
                        ) : (
                            <AnimatePresence mode='popLayout'>
                                {sales.length > 0 ? (
                                    sales.map((sale, index) => (
                                        <motion.tr
                                            key={sale.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.2, delay: index * 0.05 }}
                                            className="hover:bg-amber-500/[0.03] transition-all group"
                                        >
                                            <td className="px-3 py-1 md:px-8 md:py-6 font-bold text-zinc-100 text-[11px] md:text-lg">
                                                {sale.Nombre}
                                            </td>
                                            <td className="px-3 py-1 md:px-8 md:py-6 text-center text-zinc-400 text-[11px] md:text-lg">
                                                {sale.Telefono}
                                            </td>
                                            <td className="px-3 py-1 md:px-8 md:py-6 text-xs md:text-xl font-black text-amber-500/90 italic">
                                                {sale.Precio}€
                                            </td>
                                            <td className="px-3 py-1 md:px-8 md:py-6 text-zinc-500 text-[10px] md:text-base">
                                                {sale.Hora ? sale.Hora.slice(0, 5) : "--:--"}
                                            </td>
                                            <td className="px-3 py-1 md:px-8 md:py-6 text-right">
                                                <div className="flex justify-end">
                                                    <ActionsDropdown
                                                        sale={sale}
                                                        onEdit={onEdit}
                                                        onDelete={onDelete}
                                                        onGenerateInvoice={onGenerateInvoice}
                                                    />
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-10 text-center text-zinc-600 italic uppercase tracking-widest text-[9px] md:text-xs">
                                            Sin ventas hoy
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
