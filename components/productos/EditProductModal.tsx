"use client";

import React, { useState, useEffect } from 'react';
import { X, Package, DollarSign, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '@/types';
import { getProxiedUrl } from '@/utils/url-helper';

interface EditProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (id: number, nombre: string, precio: number, stock: number, file: File | null) => void;
    product: Product | null;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({ isOpen, onClose, onConfirm, product }) => {
    const [nombre, setNombre] = useState('');
    const [precio, setPrecio] = useState('');
    const [stock, setStock] = useState('0');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (product) {
            setNombre(product.nombre);
            setPrecio(product.precio.toString());
            setStock(product.stock ? product.stock.toString() : '0');
            setPreviewUrl(getProxiedUrl(product.foto) || null);
            setFile(null);
        }
    }, [product]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (nombre && precio && product) {
            onConfirm(product.id, nombre, Number(precio), Number(stock), file);
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
                                <div className="p-3 bg-blue-500/10 rounded-2xl">
                                    <Package className="text-blue-500 w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter">Editar <span className="text-blue-500 text-stroke-sm">Producto</span></h2>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="flex flex-col items-center gap-4 mb-6">
                                <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 w-full ml-1">Foto del Producto</label>
                                <div className="relative group w-40 h-40">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="w-full h-full bg-black/40 border-2 border-dashed border-zinc-800 rounded-[2rem] flex flex-col items-center justify-center overflow-hidden group-hover:border-blue-500 transition-all">
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <div className="w-8 h-8 text-zinc-600 mb-2 flex items-center justify-center">
                                                    <Package size={32} />
                                                </div>
                                                <span className="text-[9px] font-black uppercase text-zinc-500">Subir Imagen</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                                        <Save size={16} strokeWidth={3} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 ml-1">Nombre del Producto</label>
                                <div className="relative group">
                                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 transition-colors group-focus-within:text-blue-500" />
                                    <input
                                        autoFocus
                                        type="text"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        placeholder="Ej: Cera Mate Extreme"
                                        className="w-full bg-black/40 border-2 border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-blue-500 transition-all font-bold"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 ml-1">Precio (€)</label>
                                    <div className="relative group">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 transition-colors group-focus-within:text-blue-500" />
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={precio}
                                            onChange={(e) => setPrecio(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full bg-black/40 border-2 border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-blue-500 transition-all font-bold text-xl"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 ml-1">Stock Actual</label>
                                    <div className="relative group">
                                        <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 transition-colors group-focus-within:text-blue-500" />
                                        <input
                                            type="number"
                                            value={stock}
                                            onChange={(e) => setStock(e.target.value)}
                                            placeholder="0"
                                            className="w-full bg-black/40 border-2 border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-blue-500 transition-all font-bold text-xl"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-tighter transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 mt-8"
                            >
                                <Save size={20} strokeWidth={3} />
                                Guardar Cambios
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
