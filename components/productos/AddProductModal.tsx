"use client";

import React, { useState } from 'react';
import { X, Package, DollarSign, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (nombre: string, precio: number) => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [nombre, setNombre] = useState('');
    const [precio, setPrecio] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (nombre && precio) {
            onConfirm(nombre, Number(precio));
            setNombre('');
            setPrecio('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-2xl overflow-hidden"
                >
                    <div className="p-6 md:p-8">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-amber-500/10 rounded-2xl">
                                    <Package className="text-amber-500 w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter">Nuevo <span className="text-amber-500 text-stroke-sm">Producto</span></h2>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 ml-1">Nombre del Producto</label>
                                <div className="relative group">
                                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 transition-colors group-focus-within:text-amber-500" />
                                    <input
                                        autoFocus
                                        type="text"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        placeholder="Ej: Cera Mate Extreme"
                                        className="w-full bg-black/40 border-2 border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-amber-500 transition-all font-bold"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 ml-1">Precio de Venta (€)</label>
                                <div className="relative group">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 transition-colors group-focus-within:text-amber-500" />
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={precio}
                                        onChange={(e) => setPrecio(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-black/40 border-2 border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-amber-500 transition-all font-mono font-bold text-xl"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-amber-500 hover:bg-amber-600 text-black py-5 rounded-2xl font-black uppercase tracking-tighter transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 mt-8"
                            >
                                <Plus size={20} strokeWidth={3} />
                                Añadir al Inventario
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
