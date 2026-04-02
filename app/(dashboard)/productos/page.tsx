"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { Package, DollarSign, Image as ImageIcon, ShoppingCart, Plus, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProxiedUrl } from '@/utils/url-helper';
import { Skeleton } from '@/components/ui/Skeleton';
import { SellProductModal } from '@/components/productos/SellProductModal';
import { AddProductModal } from '@/components/productos/AddProductModal';
import { EditProductModal } from '@/components/productos/EditProductModal';
import { toast } from 'sonner';
import useSWR from 'swr';

export default function ProductosPage() {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // --- SWR ---
    const { 
        data: productos = [], 
        mutate, 
        isLoading: loading 
    } = useSWR('productos-list', async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        const { data, error } = await supabase
            .from('productos')
            .select('*')
            .eq('barberia_id', user.id)
            .order('nombre', { ascending: true });
        if (error) throw error;
        return data || [];
    });

    // --- REALTIME ---
    useEffect(() => {
        const channel = supabase
            .channel('realtime-productos')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, () => {
                mutate();
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [mutate]);

    const handleAddProduct = async (nombre: string, precio: number, stock: number, file: File | null) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Sesión no encontrada.');
                return;
            }

            let publicUrl = '';
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('productos').upload(fileName, file);
                if (uploadError) throw new Error(`Error subiendo imagen: ${uploadError.message}`);
                publicUrl = `/i/productos/${fileName}`;
            }

            const { data: profile } = await supabase.from('perfiles').select('nombre_barberia').eq('id', user.id).single();
            if (!profile?.nombre_barberia) {
                toast.error('No se pudo identificar tu barbería.');
                return;
            }

            const { error: dbError } = await supabase.from('productos').insert([{
                nombre, precio, venta: 0, stock, foto: publicUrl,
                barberia: profile.nombre_barberia,
                barberia_id: user.id
            }]);

            if (dbError) throw dbError;

            toast.success(`Producto añadido: ${nombre}`);
            mutate();
        } catch (error: any) {
            toast.error(`Error al añadir: ${error.message || 'Error desconocido'}`);
        }
    };

    const handleUpdateProduct = async (id: number, nombre: string, precio: number, stock: number, file: File | null) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let publicUrl = undefined;
            if (file) {
                const fileName = `${user.id}/${Date.now()}.${file.name.split('.').pop()}`;
                const { error: ue } = await supabase.storage.from('productos').upload(fileName, file);
                if (ue) throw ue;
                publicUrl = `/i/productos/${fileName}`;
            }

            const updateData: any = { nombre, precio, stock };
            if (publicUrl) updateData.foto = publicUrl;

            const { error } = await supabase.from('productos').update(updateData).eq('id', id);
            if (error) throw error;

            toast.success(`Producto actualizado: ${nombre}`);
            mutate();
        } catch (error: any) {
            toast.error('Error al actualizar el producto');
        }
    };

    const handleDeleteProduct = async (id: number) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este producto?')) return;
        try {
            const { error } = await supabase.from('productos').delete().eq('id', id);
            if (error) throw error;
            toast.success('Producto eliminado');
            mutate();
        } catch (error: any) {
            toast.error('Error al eliminar el producto');
        }
    };

    const handleSellProduct = async (cantidad: number, metodoPago: string) => {
        if (!selectedProduct) return;
        if ((selectedProduct.stock || 0) < cantidad) {
            toast.error(`Stock insuficiente.`);
            return;
        }
        try {
            const { registerProductSale } = await import('@/app/actions/register-product-sale');
            const result = await registerProductSale({
                productoId: selectedProduct.id,
                nombreProducto: selectedProduct.nombre,
                precioVenta: Number(selectedProduct.precio),
                cantidad: cantidad,
                metodoPago: metodoPago
            });
            if (!result.success) throw new Error(result.error || 'Error desconocido');
            toast.success(`Venta registrada: ${cantidad}x ${selectedProduct.nombre}`);
            mutate();
            setIsSellModalOpen(false);
        } catch (error: any) {
            toast.error(`No se pudo registrar la venta: ${error.message || 'Error'}`);
        }
    };

    return (
        <main className="flex-1 p-4 lg:p-10 max-w-4xl lg:max-w-6xl mx-auto w-full pb-24 lg:pb-10">
            <header className="mb-8 lg:mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-black italic tracking-tighter uppercase mb-2">
                        Gestión de <span className="text-amber-500">Productos</span>
                    </h1>
                    <p className="text-zinc-500 font-medium text-sm lg:text-base">Control de stock y precios a la venta.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="group bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 lg:px-6 lg:py-4 rounded-xl lg:rounded-[1.5rem] text-xs lg:text-base font-black uppercase tracking-tighter transition-all shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 lg:gap-3 active:scale-95"
                >
                    <Plus className="w-4 h-4 lg:w-5 lg:h-5 group-hover:rotate-90 transition-transform duration-300" strokeWidth={3} />
                    Nuevo Producto
                </button>
            </header>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg lg:rounded-[2rem] overflow-hidden backdrop-blur-sm shadow-2xl">
                <div className="px-3 py-1.5 lg:px-8 lg:py-6 border-b border-zinc-800 bg-zinc-800/20">
                    <h3 className="font-bold text-[10px] lg:text-xl flex items-center gap-2 lg:gap-4 text-zinc-300">
                        <Package size={12} className="text-amber-500 w-3 h-3 lg:w-5 lg:h-5" /> Inventario — <span className="text-zinc-500 font-normal">{productos.length} items</span>
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="text-zinc-500 text-[8px] lg:text-xs uppercase tracking-[0.2em] bg-black/40">
                            <tr>
                                <th className="px-3 py-1.5 lg:px-8 lg:py-5 font-bold">Imagen</th>
                                <th className="px-3 py-1.5 lg:px-8 lg:py-5 font-bold">Producto</th>
                                <th className="px-3 py-1.5 lg:px-8 lg:py-5 font-bold text-center">Stock</th>
                                <th className="px-3 py-1.5 lg:px-8 lg:py-5 font-bold text-center">Vendidos</th>
                                <th className="px-3 py-1.5 lg:px-8 lg:py-5 font-bold text-amber-500/80">Precio</th>
                                <th className="px-3 py-1.5 lg:px-8 lg:py-5 font-bold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/40">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-3 py-2 lg:px-8 lg:py-6"><Skeleton className="h-10 w-10 lg:h-16 lg:w-16 rounded-xl" /></td>
                                        <td className="px-3 py-2 lg:px-8 lg:py-6"><Skeleton className="h-5 w-40" /></td>
                                        <td className="px-3 py-2 lg:px-8 lg:py-6"><Skeleton className="h-5 w-20 mx-auto" /></td>
                                        <td className="px-3 py-2 lg:px-8 lg:py-6"><Skeleton className="h-5 w-20 mx-auto" /></td>
                                        <td className="px-3 py-2 lg:px-8 lg:py-6"><Skeleton className="h-5 w-16" /></td>
                                        <td className="px-3 py-2 lg:px-8 lg:py-6"><Skeleton className="h-10 w-24 ml-auto mr-4" /></td>
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
                                            <td className="px-3 py-2 lg:px-8 lg:py-6">
                                                {prod.foto ? (
                                                    <div className="h-8 w-8 lg:h-20 lg:w-20 rounded-lg lg:rounded-2xl overflow-hidden border border-zinc-800 group-hover:border-amber-500/50 transition-colors bg-black shadow-lg">
                                                        <img
                                                            src={getProxiedUrl(prod.foto)}
                                                            alt={prod.nombre}
                                                            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="h-8 w-8 lg:h-20 lg:w-20 rounded-lg lg:rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-600">
                                                        <ImageIcon className="w-3 h-3 lg:w-8 lg:h-8" />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 lg:px-8 lg:py-6 font-bold text-zinc-100 text-[9px] lg:text-xl group-hover:text-amber-500 transition-colors uppercase tracking-tight">
                                                {prod.nombre}
                                            </td>
                                            <td className={`px-3 py-2 lg:px-8 lg:py-6 text-center text-[10px] lg:text-lg font-bold ${(prod.stock || 0) < 5 ? 'text-red-500' : 'text-zinc-300'}`}>
                                                {prod.stock || 0}
                                            </td>
                                            <td className="px-3 py-2 lg:px-8 lg:py-6 text-center text-zinc-500 text-[10px] lg:text-lg">
                                                {prod.venta || 0}
                                            </td>
                                            <td className="px-3 py-2 lg:px-8 lg:py-6 text-[10px] lg:text-2xl font-black text-amber-500/90 italic">
                                                {prod.precio}€
                                            </td>
                                            <td className="px-3 py-2 lg:px-8 lg:py-6 text-right">
                                                <div className="flex justify-end gap-2 lg:gap-3 items-center">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedProduct(prod);
                                                            setIsSellModalOpen(true);
                                                        }}
                                                        className="bg-amber-500 hover:bg-amber-600 text-black px-3 py-1.5 lg:px-6 lg:py-3 rounded-lg lg:rounded-2xl text-[9px] lg:text-sm font-black uppercase tracking-tighter transition-all shadow-lg active:scale-95 flex items-center gap-1 lg:gap-2 disabled:opacity-50 disabled:grayscale mr-2"
                                                        disabled={(prod.stock || 0) <= 0}
                                                        title="Vender"
                                                    >
                                                        <ShoppingCart className="w-3 h-3 lg:w-4 lg:h-4" />
                                                        <span className="hidden lg:inline">{(prod.stock || 0) > 0 ? 'Vender' : 'Agotado'}</span>
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            setSelectedProduct(prod);
                                                            setIsEditModalOpen(true);
                                                        }}
                                                        className="p-1.5 lg:p-3 bg-zinc-800 hover:bg-blue-500/20 hover:text-blue-500 text-zinc-400 rounded-lg lg:rounded-xl transition-all border border-transparent hover:border-blue-500/50"
                                                        title="Editar"
                                                    >
                                                        <Pencil className="w-3 h-3 lg:w-5 lg:h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProduct(prod.id)}
                                                        className="p-1.5 lg:p-3 bg-zinc-800 hover:bg-red-500/20 hover:text-red-500 text-zinc-400 rounded-lg lg:rounded-xl transition-all border border-transparent hover:border-red-500/50"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="w-3 h-3 lg:w-5 lg:h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            )}
                            {!loading && productos.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-3 py-10 lg:py-20 text-center text-zinc-600 italic uppercase tracking-widest text-xs lg:text-sm">
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
