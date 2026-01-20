"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Save, Clock, MapPin, Phone, CreditCard, ShoppingBag, Info, Scissors, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ConfigurationPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Form states
    const [formData, setFormData] = useState({
        servicios: '',
        horario: '',
        Direccion: '',
        telefono: '',
        pagos: '',
        productos: '',
        info: ''
    });

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/');
                return;
            }
            setUser(user);
        };
        checkUser();

        // Bloqueo de navegación hacia atrás
        const handlePopState = (e: PopStateEvent) => {
            window.history.pushState(null, '', window.location.pathname);
            toast.error('Debes completar la configuración para continuar');
        };

        // Bloqueo de cierre/recarga de pestaña
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };

        window.history.pushState(null, '', window.location.pathname);
        window.addEventListener('popstate', handlePopState);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            console.log('Iniciando guardado de perfil para usuario:', user.id);
            console.log('Datos a enviar:', formData);

            const { data, error } = await supabase
                .from('perfiles')
                .upsert({
                    id: user.id,
                    nombre_barberia: user.user_metadata?.barberia_nombre || 'Mi Barbería',
                    servicios: formData.servicios,
                    horario: formData.horario,
                    Direccion: formData.Direccion,
                    telefono: formData.telefono,
                    pagos: formData.pagos,
                    productos: formData.productos,
                    info: formData.info
                }, {
                    onConflict: 'id'
                })
                .select();

            if (error) {
                console.error('Error de Supabase devuelto:', error);
                throw error;
            }

            console.log('Respuesta exitosa de Supabase:', data);

            if (!data || data.length === 0) {
                console.warn('Supabase no devolvió datos. Es posible que el registro no se haya creado/actualizado.');
            }

            toast.success('Configuración guardada correctamente');
            router.push('/');
            router.refresh();
        } catch (error: any) {
            console.error('Error al actualizar perfil (Objeto completo):', JSON.stringify(error, null, 2));
            console.error('Error Message:', error.message);
            console.error('Error Code:', error.code);
            console.error('Error Details:', error.details);
            console.error('Error Hint:', error.hint);

            const errorMsg = error.message || error.error_description || 'Error desconocido';
            toast.error('Error al guardar: ' + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (!user) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-3 md:p-8 flex flex-col justify-center">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto w-full space-y-6 md:space-y-8 py-6"
            >
                {/* Header */}
                <div className="text-center space-y-1">
                    <h1 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter">
                        Configuración <span className="text-amber-500">Barbería</span>
                    </h1>
                    <p className="text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-[2px]">
                        Ultimo paso para activar tu cuenta
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800 rounded-[24px] md:rounded-[32px] p-5 md:p-10 shadow-2xl space-y-6 md:space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {/* Teléfono */}
                        <div className="space-y-1.5 md:space-y-2">
                            <label className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-zinc-500 uppercase ml-1">
                                <Phone className="w-3 h-3 text-amber-500" />
                                Teléfono
                            </label>
                            <input
                                type="tel"
                                name="telefono"
                                placeholder="Ej: 600000000"
                                value={formData.telefono}
                                onChange={handleChange}
                                required
                                className="w-full p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-zinc-800/30 border border-zinc-700/50 text-sm text-white outline-none focus:border-amber-500 transition-all placeholder:text-zinc-600 shadow-inner"
                            />
                        </div>

                        {/* Horario */}
                        <div className="space-y-1.5 md:space-y-2">
                            <label className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-zinc-500 uppercase ml-1">
                                <Clock className="w-3 h-3 text-amber-500" />
                                Horario
                            </label>
                            <input
                                type="text"
                                name="horario"
                                placeholder="Lunes a Sábado 10-14..."
                                value={formData.horario}
                                onChange={handleChange}
                                required
                                className="w-full p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-zinc-800/30 border border-zinc-700/50 text-sm text-white outline-none focus:border-amber-500 transition-all placeholder:text-zinc-600 shadow-inner"
                            />
                        </div>

                        {/* Dirección */}
                        <div className="md:col-span-2 space-y-1.5 md:space-y-2">
                            <label className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-zinc-500 uppercase ml-1">
                                <MapPin className="w-3 h-3 text-amber-500" />
                                Dirección
                            </label>
                            <input
                                type="text"
                                name="Direccion"
                                placeholder="Calle, Número, Ciudad..."
                                value={formData.Direccion}
                                onChange={handleChange}
                                required
                                className="w-full p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-zinc-800/30 border border-zinc-700/50 text-sm text-white outline-none focus:border-amber-500 transition-all placeholder:text-zinc-600 shadow-inner"
                            />
                        </div>

                        {/* Servicios */}
                        <div className="md:col-span-2 space-y-1.5 md:space-y-2">
                            <label className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-zinc-500 uppercase ml-1">
                                <Scissors className="w-3 h-3 text-amber-500" />
                                Servicios
                            </label>
                            <textarea
                                name="servicios"
                                placeholder="Corte - 15€, Barba - 7€..."
                                value={formData.servicios}
                                onChange={handleChange}
                                required
                                rows={2}
                                className="w-full p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-zinc-800/30 border border-zinc-700/50 text-sm text-white outline-none focus:border-amber-500 transition-all placeholder:text-zinc-600 resize-none shadow-inner"
                            />
                        </div>

                        {/* Métodos de Pago */}
                        <div className="space-y-1.5 md:space-y-2">
                            <label className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-zinc-500 uppercase ml-1">
                                <CreditCard className="w-3 h-3 text-amber-500" />
                                Métodos de Pago
                            </label>
                            <input
                                type="text"
                                name="pagos"
                                placeholder="Efectivo, Bizum..."
                                value={formData.pagos}
                                onChange={handleChange}
                                required
                                className="w-full p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-zinc-800/30 border border-zinc-700/50 text-sm text-white outline-none focus:border-amber-500 transition-all placeholder:text-zinc-600 shadow-inner"
                            />
                        </div>

                        {/* Productos */}
                        <div className="space-y-1.5 md:space-y-2">
                            <label className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-zinc-500 uppercase ml-1">
                                <ShoppingBag className="w-3 h-3 text-amber-500" />
                                Productos
                            </label>
                            <textarea
                                name="productos"
                                placeholder="Gomina, Cera, Champú..."
                                value={formData.productos}
                                onChange={handleChange}
                                required
                                rows={1}
                                className="w-full p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-zinc-800/30 border border-zinc-700/50 text-sm text-white outline-none focus:border-amber-500 transition-all placeholder:text-zinc-600 resize-none shadow-inner"
                            />
                        </div>

                        {/* Otra información */}
                        <div className="md:col-span-2 space-y-1.5 md:space-y-2">
                            <label className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-zinc-500 uppercase ml-1">
                                <Info className="w-3 h-3 text-amber-500" />
                                Otra información <span className="lowercase font-normal text-zinc-600">(Opcional)</span>
                            </label>
                            <textarea
                                name="info"
                                placeholder="Información adicional..."
                                value={formData.info}
                                onChange={handleChange}
                                rows={2}
                                className="w-full p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-zinc-800/30 border border-zinc-700/50 text-sm text-white outline-none focus:border-amber-500 transition-all placeholder:text-zinc-600 resize-none shadow-inner"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={cn(
                            "w-full py-4 md:py-5 bg-amber-500 text-black rounded-xl md:rounded-[20px] text-sm md:text-base font-black uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-[0_10px_30px_-10px_rgba(245,158,11,0.5)]",
                            loading ? "opacity-70 cursor-wait" : "hover:bg-amber-600 hover:shadow-[0_15px_40px_-10px_rgba(245,158,11,0.6)]"
                        )}
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                        ) : (
                            <>
                                <Save className="w-5 h-5 md:w-6 md:h-6" />
                                Finalizar Registro
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
