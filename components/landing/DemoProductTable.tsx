"use client";

import React from 'react';
import { Package, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

interface DemoProduct {
    id: number;
    nombre: string;
    precio: number;
    stock: number;
    vendidos: number;
}

const DemoProductTable: React.FC = () => {
    // Hardcoded demo products
    const products: DemoProduct[] = [
        { id: 1, nombre: 'Polvos L3vel 3', precio: 15, stock: 12, vendidos: 34 },
        { id: 2, nombre: 'Aceite Barba Gold', precio: 22, stock: 8, vendidos: 21 },
        { id: 3, nombre: 'Polvos Slick Gorilla', precio: 20, stock: 3, vendidos: 45 },
        { id: 4, nombre: 'Aftershave Classic', precio: 14, stock: 15, vendidos: 18 },
    ];

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl md:rounded-[2rem] backdrop-blur-sm shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 md:px-6 md:py-4 border-b border-zinc-800 bg-zinc-800/20">
                <h3 className="font-bold text-sm md:text-lg flex items-center gap-3 text-zinc-300">
                    <Package className="text-amber-500 w-4 h-4 md:w-5 md:h-5" />
                    Inventario — <span className="text-zinc-500 font-normal">{products.length} productos</span>
                </h3>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="text-zinc-500 text-[9px] md:text-xs uppercase tracking-[0.15em] bg-black/40">
                        <tr>
                            <th className="px-4 py-3 md:px-6 md:py-4 font-bold">Producto</th>
                            <th className="px-4 py-3 md:px-6 md:py-4 font-bold text-center">Stock</th>
                            <th className="hidden md:table-cell px-4 py-3 md:px-6 md:py-4 font-bold text-center">Vendidos</th>
                            <th className="px-4 py-3 md:px-6 md:py-4 font-bold text-amber-500/80">Precio</th>
                            <th className="px-4 py-3 md:px-6 md:py-4 font-bold text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40">
                        {products.map((prod, index) => (
                            <motion.tr
                                key={prod.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                className="hover:bg-amber-500/[0.03] transition-all group"
                            >
                                <td className="px-4 py-3 md:px-6 md:py-5 font-bold text-zinc-100 text-sm md:text-base group-hover:text-amber-500 transition-colors uppercase tracking-tight">
                                    {prod.nombre}
                                </td>
                                <td className={`px-4 py-3 md:px-6 md:py-5 text-center text-sm md:text-lg font-bold ${prod.stock < 5 ? 'text-red-500' : 'text-zinc-300'}`}>
                                    {prod.stock}
                                </td>
                                <td className="hidden md:table-cell px-4 py-3 md:px-6 md:py-5 text-center text-zinc-500 text-sm md:text-lg">
                                    {prod.vendidos}
                                </td>
                                <td className="px-4 py-3 md:px-6 md:py-5 text-base md:text-xl font-black text-amber-500/90">
                                    {prod.precio}€
                                </td>
                                <td className="px-4 py-3 md:px-6 md:py-5 text-right">
                                    <button className="bg-amber-500 hover:bg-amber-600 text-black px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase tracking-tight transition-all shadow-lg flex items-center gap-1.5 ml-auto">
                                        <ShoppingCart className="w-3 h-3 md:w-4 md:h-4" />
                                        Vender
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DemoProductTable;
