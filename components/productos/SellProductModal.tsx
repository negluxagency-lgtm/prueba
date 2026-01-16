"use client";

import React, { useState } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { Product } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface SellProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (cantidad: number) => Promise<void>;
    product: Product | null;
}

export const SellProductModal: React.FC<SellProductModalProps> = ({ isOpen, onClose, onConfirm, product }) => {
    const [cantidad, setCantidad] = useState(1);
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        await onConfirm(cantidad);
        setLoading(false);
        onClose();
        setCantidad(1);
    };

    if (!product) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")` }}></div>

                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <h2 className="text-xl font-black italic uppercase text-amber-500">Registrar Venta</h2>
                            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X size={20} /></button>
                        </div>

                        <div className="mb-6 relative z-10">
                            <p className="text-zinc-400 text-xs uppercase font-bold mb-2">Producto</p>
                            <div className="flex items-center gap-4 bg-zinc-800/50 p-3 rounded-xl border border-zinc-800">
                                <img src={product.foto} className="w-12 h-12 rounded-lg object-cover" alt="" />
                                <div>
                                    <p className="text-white font-bold text-sm uppercase">{product.nombre}</p>
                                    <p className="text-amber-500 font-mono font-bold">{product.precio}€</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div>
                                <label className="text-zinc-400 text-[10px] uppercase font-bold mb-2 block">Cantidad a vender</label>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                                        className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-xl text-white flex items-center justify-center font-bold text-xl hover:bg-zinc-700 transition-colors"
                                    >-</button>
                                    <input
                                        type="number"
                                        value={cantidad}
                                        onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-center font-bold text-lg focus:outline-none focus:border-amber-500"
                                    />
                                    <button
                                        onClick={() => setCantidad(cantidad + 1)}
                                        className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-xl text-white flex items-center justify-center font-bold text-xl hover:bg-zinc-700 transition-colors"
                                    >+</button>
                                </div>
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex justify-between items-center mt-6">
                                <span className="text-amber-500 text-xs font-black uppercase tracking-widest">Total</span>
                                <span className="text-amber-500 text-2xl font-black italic">{(Number(product.precio) * cantidad).toFixed(2)}€</span>
                            </div>

                            <button
                                onClick={handleConfirm}
                                disabled={loading}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black uppercase py-4 rounded-xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 mt-4"
                            >
                                <ShoppingBag size={18} />
                                {loading ? 'Procesando...' : 'Confirmar Venta'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
