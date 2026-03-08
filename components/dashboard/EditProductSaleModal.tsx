"use client";

import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EditProductSaleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { cantidad: number; precioTotal: number; metodoPago: string }) => Promise<void>;
    sale: {
        id: string;
        Nombre: string;
        Telefono: string; // Cantidad
        Precio: number; // Precio Total
        pago: string;
    } | null;
}

export const EditProductSaleModal: React.FC<EditProductSaleModalProps> = ({ isOpen, onClose, onSave, sale }) => {
    const [cantidad, setCantidad] = useState<number>(0);
    const [precioTotal, setPrecioTotal] = useState<number>(0);
    const [metodoPago, setMetodoPago] = useState<string>("efectivo");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (sale) {
            setCantidad(Number(sale.Telefono) || 0);
            setPrecioTotal(Number(sale.Precio) || 0);
            setMetodoPago(sale.pago || "efectivo");
        }
    }, [sale]);

    const handleConfirm = async () => {
        if (cantidad <= 0 || precioTotal <= 0) return;
        setLoading(true);
        await onSave({ cantidad, precioTotal, metodoPago });
        setLoading(false);
        onClose();
    };

    if (!sale) return null;

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
                            <h2 className="text-xl font-black italic uppercase text-amber-500">Editar Venta</h2>
                            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X size={20} /></button>
                        </div>

                        <div className="mb-6 relative z-10">
                            <p className="text-zinc-400 text-xs uppercase font-bold mb-2">Producto Registrado</p>
                            <div className="flex items-center gap-4 bg-zinc-800/50 p-4 rounded-xl border border-zinc-800">
                                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                    <ShoppingBag className="text-amber-500" size={20} />
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm uppercase">{sale.Nombre}</p>
                                    <p className="text-zinc-500 text-[10px] uppercase font-bold">Venta ID: {sale.id.slice(0, 8)}...</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-zinc-400 text-[10px] uppercase font-bold mb-2 block">Cantidad</label>
                                    <input
                                        type="number"
                                        value={cantidad}
                                        onChange={(e) => setCantidad(Number(e.target.value))}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-center font-bold text-lg focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-zinc-400 text-[10px] uppercase font-bold mb-2 block">Pago</label>
                                    <select
                                        value={metodoPago}
                                        onChange={(e) => setMetodoPago(e.target.value)}
                                        className="w-full h-[52px] bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-3 text-white font-bold text-xs focus:outline-none focus:border-amber-500 appearance-none"
                                    >
                                        <option value="efectivo">Efectivo</option>
                                        <option value="tarjeta">Tarjeta</option>
                                        <option value="bizum">Bizum</option>
                                        <option value="otra">Otra</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-zinc-400 text-[10px] uppercase font-bold mb-2 block">Precio Total (€)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={precioTotal}
                                    onChange={(e) => setPrecioTotal(Number(e.target.value))}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-center font-black text-2xl focus:outline-none focus:border-amber-500 text-amber-500"
                                />
                                <p className="text-zinc-600 text-[9px] mt-2 italic">* El precio unitario calculado es {(precioTotal / (cantidad || 1)).toFixed(2)}€</p>
                            </div>

                            <button
                                onClick={handleConfirm}
                                disabled={loading || cantidad <= 0 || precioTotal <= 0}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black uppercase py-4 rounded-xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:grayscale"
                            >
                                <Save size={18} />
                                {loading ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
