"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { Package, DollarSign, Image as ImageIcon, ShoppingCart, Plus, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/Skeleton';
import { SellProductModal } from '@/components/productos/SellProductModal';
import { AddProductModal } from '@/components/productos/AddProductModal';
import { EditProductModal } from '@/components/productos/EditProductModal';
import { toast } from 'sonner';

export default function ProductosPage() {
    const [productos, setProductos] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchProductos = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('productos')
                .select('*')
                .order('nombre', { ascending: true });

            if (error) throw error;
            setProductos(data || []);
        } catch (error: any) {
            console.error('Error fetching products:', error.message || error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = async (nombre: string, precio: number, stock: number) => {
        try {
            const { error } = await supabase
                .from('productos')
                .insert([{
                    nombre,
                    precio,
                    venta: 0,
                    stock
                }]);

            if (error) throw error;

            toast.success(`Producto añadido: ${nombre}`);
            fetchProductos();
        } catch (error: any) {
            console.error('Error añadiendo producto:', error);
            toast.error('Error al añadir el producto');
        }
    };

    const handleUpdateProduct = async (id: number, nombre: string, precio: number, stock: number) => {
        try {
            const { error } = await supabase
                .from('productos')
                .update({ nombre, precio, stock })
                .eq('id', id);

            if (error) throw error;

            toast.success(`Producto actualizado: ${nombre}`);
            fetchProductos();
        } catch (error: any) {
            console.error('Error actualizando producto:', error);
            toast.error('Error al actualizar el producto');
        }
    };

    const handleDeleteProduct = async (id: number) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este producto?')) return;

        try {
            const { error } = await supabase
                .from('productos')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Producto eliminado');
            fetchProductos();
        } catch (error: any) {
            console.error('Error eliminando producto:', error);
            toast.error('Error al eliminar el producto');
        }
    };

    const handleSellProduct = async (cantidad: number) => {
        if (!selectedProduct) return;

        // Validar Stock
        if ((selectedProduct.stock || 0) < cantidad) {
            toast.error(`Stock insuficiente. Solo quedan ${selectedProduct.stock || 0} unidades.`);
            return;
        }

        const totalPrecio = Number(selectedProduct.precio) * cantidad;
        const now = new Date();
        const horaActual = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
        const diaActual = now.toISOString().split('T')[0];

        try {
            const saleNombre = selectedProduct.nombre; // Sin prefijo ahora
            const saleTlf = cantidad;
            const salePrecio = totalPrecio;

            console.log('Intentando insertar cita de venta ajustada:', {
                Nombre: saleNombre,
                Telefono: saleTlf,
                Precio: salePrecio,
                Dia: diaActual,
                Hora: horaActual
            });

            // 1. Crear Cita Especial (Venta)
            let ventaId = null;
            const maxRetries = 3;

            for (let i = 0; i < maxRetries; i++) {
                const { data: citaData, error: citaError } = await supabase
                    .from('citas')
                    .insert([{
                        Nombre: saleNombre,
                        Telefono: String(saleTlf),
                        confirmada: true,
                        Hora: horaActual,
                        Dia: diaActual,
                        Precio: salePrecio,
                        Servicio: 'Venta de Producto',
                        producto: true
                    }])
                    .select();

                if (citaError) {
                    if (citaError.code === '23505') {
                        // Silently retry on duplicate key
                        continue;
                    }
                    console.error('Error de Supabase al insertar cita:', citaError.message, citaError.details);
                    throw citaError;
                }

                // Si tuvo éxito, salimos del bucle
                console.log('Venta registrada correctamente en citas:', citaData);
                ventaId = citaData;
                break;
            }

            if (!ventaId) {
                throw new Error("No se pudo registrar la venta. Por favor intente de nuevo.");
            }

            // 2. Actualizar contador de ventas y restar stock
            const { error: prodError } = await supabase
                .from('productos')
                .update({
                    venta: (selectedProduct.venta || 0) + cantidad,
                    stock: (selectedProduct.stock || 0) - cantidad
                })
                .eq('id', selectedProduct.id);

            if (prodError) {
                console.warn("Error al actualizar producto:", prodError.message);
            }

            toast.success(`Venta registrada: ${cantidad}x ${selectedProduct.nombre}`);
            fetchProductos();
            setIsSellModalOpen(false); // Cerramos el modal tras el éxito
        } catch (error: any) {
            console.error('Error completo en handleSellProduct:', error);
            const errorMsg = error.message || (typeof error === 'string' ? error : 'Error desconocido');
            toast.error(`No se pudo registrar la venta: ${errorMsg}`);
        }
    };

    useEffect(() => {
        fetchProductos();
    }, []);

    return (
        <main className="flex-1 p-4 md:p-10 max-w-4xl md:max-w-6xl mx-auto w-full pb-24 md:pb-10">
            <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase mb-2">
                        Gestión de <span className="text-amber-500">Productos</span>
                    </h1>
                    <p className="text-zinc-500 font-medium text-sm md:text-base">Control de stock y precios a la venta.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="group bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 md:px-6 md:py-4 rounded-xl md:rounded-[1.5rem] text-xs md:text-base font-black uppercase tracking-tighter transition-all shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 md:gap-3 active:scale-95"
                >
                    <Plus className="w-4 h-4 md:w-5 md:h-5 group-hover:rotate-90 transition-transform duration-300" strokeWidth={3} />
                    Nuevo Producto
                </button>
            </header>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg md:rounded-[2rem] overflow-hidden backdrop-blur-sm shadow-2xl">
                <div className="px-3 py-1.5 md:px-8 md:py-6 border-b border-zinc-800 bg-zinc-800/20">
                    <h3 className="font-bold text-[10px] md:text-xl flex items-center gap-2 md:gap-4 text-zinc-300">
                        <Package size={12} className="text-amber-500 w-3 h-3 md:w-5 md:h-5" /> Inventario — <span className="text-zinc-500 font-normal">{productos.length} items</span>
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="text-zinc-500 text-[8px] md:text-xs uppercase tracking-[0.2em] bg-black/40">
                            <tr>
                                <th className="px-3 py-1.5 md:px-8 md:py-5 font-bold">Imagen</th>
                                <th className="px-3 py-1.5 md:px-8 md:py-5 font-bold">Producto</th>
                                <th className="px-3 py-1.5 md:px-8 md:py-5 font-bold text-center">Stock</th>
                                <th className="px-3 py-1.5 md:px-8 md:py-5 font-bold text-center">Vendidos</th>
                                <th className="px-3 py-1.5 md:px-8 md:py-5 font-bold text-amber-500/80">Precio</th>
                                <th className="px-3 py-1.5 md:px-8 md:py-5 font-bold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/40">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-3 py-2 md:px-8 md:py-6"><Skeleton className="h-10 w-10 md:h-16 md:w-16 rounded-xl" /></td>
                                        <td className="px-3 py-2 md:px-8 md:py-6"><Skeleton className="h-5 w-40" /></td>
                                        <td className="px-3 py-2 md:px-8 md:py-6"><Skeleton className="h-5 w-20 mx-auto" /></td>
                                        <td className="px-3 py-2 md:px-8 md:py-6"><Skeleton className="h-5 w-20 mx-auto" /></td>
                                        <td className="px-3 py-2 md:px-8 md:py-6"><Skeleton className="h-5 w-16" /></td>
                                        <td className="px-3 py-2 md:px-8 md:py-6"><Skeleton className="h-10 w-24 ml-auto mr-4" /></td>
                                    </tr>
                                ))
                            ) : (
                                <AnimatePresence mode='popLayout'>
                                    {productos.map((prod, index) => (
                                        <motion.tr
                                            key={prod.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ duration: 0.2, delay: index * 0.05 }}
                                            className="hover:bg-amber-500/[0.03] transition-all group"
                                        >
                                            <td className="px-3 py-2 md:px-8 md:py-6">
                                                {prod.foto ? (
                                                    <div className="h-8 w-8 md:h-20 md:w-20 rounded-lg md:rounded-2xl overflow-hidden border border-zinc-800 group-hover:border-amber-500/50 transition-colors bg-black shadow-lg">
                                                        <img
                                                            src={prod.foto}
                                                            alt={prod.nombre}
                                                            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="h-8 w-8 md:h-20 md:w-20 rounded-lg md:rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-600">
                                                        <ImageIcon className="w-3 h-3 md:w-8 md:h-8" />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 md:px-8 md:py-6 font-bold text-zinc-100 text-[9px] md:text-xl group-hover:text-amber-500 transition-colors uppercase tracking-tight">
                                                {prod.nombre}
                                            </td>
                                            <td className={`px-3 py-2 md:px-8 md:py-6 text-center text-[10px] md:text-lg font-bold ${(prod.stock || 0) < 5 ? 'text-red-500' : 'text-zinc-300'}`}>
                                                {prod.stock || 0}
                                            </td>
                                            <td className="px-3 py-2 md:px-8 md:py-6 text-center text-zinc-500 text-[10px] md:text-lg">
                                                {prod.venta || 0}
                                            </td>
                                            <td className="px-3 py-2 md:px-8 md:py-6 text-[10px] md:text-2xl font-black text-amber-500/90 italic">
                                                {prod.precio}€
                                            </td>
                                            <td className="px-3 py-2 md:px-8 md:py-6 text-right">
                                                <div className="flex justify-end gap-2 md:gap-3 items-center">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedProduct(prod);
                                                            setIsSellModalOpen(true);
                                                        }}
                                                        className="bg-amber-500 hover:bg-amber-600 text-black px-3 py-1.5 md:px-6 md:py-3 rounded-lg md:rounded-2xl text-[9px] md:text-sm font-black uppercase tracking-tighter transition-all shadow-lg active:scale-95 flex items-center gap-1 md:gap-2 disabled:opacity-50 disabled:grayscale mr-2"
                                                        disabled={(prod.stock || 0) <= 0}
                                                        title="Vender"
                                                    >
                                                        <ShoppingCart className="w-3 h-3 md:w-4 md:h-4" />
                                                        <span className="hidden md:inline">{(prod.stock || 0) > 0 ? 'Vender' : 'Agotado'}</span>
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            setSelectedProduct(prod);
                                                            setIsEditModalOpen(true);
                                                        }}
                                                        className="p-1.5 md:p-3 bg-zinc-800 hover:bg-blue-500/20 hover:text-blue-500 text-zinc-400 rounded-lg md:rounded-xl transition-all border border-transparent hover:border-blue-500/50"
                                                        title="Editar"
                                                    >
                                                        <Pencil className="w-3 h-3 md:w-5 md:h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProduct(prod.id)}
                                                        className="p-1.5 md:p-3 bg-zinc-800 hover:bg-red-500/20 hover:text-red-500 text-zinc-400 rounded-lg md:rounded-xl transition-all border border-transparent hover:border-red-500/50"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="w-3 h-3 md:w-5 md:h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            )}
                            {!loading && productos.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-3 py-10 md:py-20 text-center text-zinc-600 italic uppercase tracking-widest text-xs md:text-sm">
                                        No hay productos registrados
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <SellProductModal
                isOpen={isSellModalOpen}
                onClose={() => setIsSellModalOpen(false)}
                onConfirm={handleSellProduct}
                product={selectedProduct}
            />

            <AddProductModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onConfirm={handleAddProduct}
            />

            <EditProductModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onConfirm={handleUpdateProduct}
                product={selectedProduct}
            />
        </main>
    );
}
