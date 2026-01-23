"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Save, Clock, MapPin, Phone, CreditCard, ShoppingBag, Info, Scissors, Loader2, User, DollarSign, Target } from 'lucide-react';
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
        info: '',
        nombre_encargado: '',
        objetivo_ingresos: '',
        objetivo_cortes: '',
        objetivo_productos: ''
    });

    useEffect(() => {
        const checkUser = async () => {
            console.log("Config Page: [CYCLE] checkUser triggered");
            // 1. Intentar obtener sesión actual
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) console.error("Config Page: Session error", sessionError);

            let currentUser = session?.user;
            console.log("Config Page: Initial session check", { hasUser: !!currentUser, email: currentUser?.email });

            if (!currentUser) {
                console.log("Config Page: No initial session, retrying for 2 seconds...");
                // Reintentos agresivos durante 2 segundos
                for (let i = 0; i < 4; i++) {
                    await new Promise(r => setTimeout(r, 500));
                    const { data: { session: retrySession } } = await supabase.auth.getSession();
                    if (retrySession?.user) {
                        currentUser = retrySession.user;
                        console.log("Config Page: Session found after retry", { i, email: currentUser.email });
                        break;
                    }
                    console.log(`Config Page: Retry ${i + 1} failed...`);
                }
            }

            if (!currentUser) {
                console.warn("Config Page: Still no session after all retries. Redirecting to root (/). Current Path:", window.location.pathname);
                router.push('/');
                return;
            }

            setUser(currentUser);
            console.log("Config Page: User state set successfully:", currentUser.id);

            // Fetch existing profile data
            console.log("Config Page: Fetching profile for", currentUser.id);
            const { data: profile, error: profileError } = await supabase
                .from('perfiles')
                .select('*')
                .eq('id', currentUser.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                console.error("Config Page: Profile fetch error", profileError);
            }

            console.log("Config Page: Profile result", { hasProfile: !!profile });

            if (profile) {
                setFormData({
                    servicios: profile.servicios || '',
                    horario: profile.horario || '',
                    Direccion: profile.Direccion || '',
                    telefono: profile.telefono || '',
                    pagos: profile.pagos || '',
                    productos: profile.productos || '',
                    info: profile.info || '',
                    nombre_encargado: profile.nombre_encargado || '',
                    objetivo_ingresos: String(profile.objetivo_ingresos || ''),
                    objetivo_cortes: String(profile.objetivo_cortes || ''),
                    objetivo_productos: String(profile.objetivo_productos || '')
                });
            }
        };
        checkUser();

        // Bloqueo de navegación desactivado temporalmente para depuración
        /*
        const handlePopState = (e: PopStateEvent) => {
            window.history.pushState(null, '', window.location.pathname);
            toast.error('Debes completar la configuración para continuar');
        };

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
        */
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
                    info: formData.info,
                    nombre_encargado: formData.nombre_encargado,
                    objetivo_ingresos: parseFloat(formData.objetivo_ingresos) || 0,
                    objetivo_cortes: parseInt(formData.objetivo_cortes) || 0,
                    objetivo_productos: parseInt(formData.objetivo_productos) || 0
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
            router.push('/inicio');
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

                        {/* Nombre del Encargado */}
                        <div className="space-y-1.5 md:space-y-2">
                            <label className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-zinc-500 uppercase ml-1">
                                <User className="w-3 h-3 text-amber-500" />
                                Nombre del encargado
                            </label>
                            <input
                                type="text"
                                name="nombre_encargado"
                                placeholder="Ej: Juan Pérez"
                                value={formData.nombre_encargado}
                                onChange={handleChange}
                                required
                                className="w-full p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-zinc-800/30 border border-zinc-700/50 text-sm text-white outline-none focus:border-amber-500 transition-all placeholder:text-zinc-600 shadow-inner"
                            />
                        </div>

                        {/* Separador/Título Objetivos */}
                        <div className="md:col-span-2 pt-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Target className="w-4 h-4 text-amber-500" />
                                <h3 className="text-xs font-black uppercase text-white tracking-wider">Objetivos Mensuales</h3>
                                <div className="h-[1px] flex-1 bg-zinc-800 ml-2"></div>
                            </div>
                        </div>

                        {/* Objetivo Ingresos Mensual */}
                        <div className="space-y-1.5 md:space-y-2">
                            <label className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-zinc-500 uppercase ml-1">
                                <DollarSign className="w-3 h-3 text-amber-500" />
                                Ingresos Mensuales (€)
                            </label>
                            <input
                                type="number"
                                name="objetivo_ingresos"
                                min="0"
                                step="any"
                                onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                placeholder="Ej: 3000"
                                value={formData.objetivo_ingresos}
                                onChange={handleChange}
                                required
                                className="w-full p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-zinc-800/30 border border-zinc-700/50 text-sm text-white outline-none focus:border-amber-500 transition-all placeholder:text-zinc-600 shadow-inner"
                            />
                        </div>

                        {/* Contenedor para Cortes y Productos Mensuales */}
                        <div className="grid grid-cols-2 gap-4 md:gap-6 md:col-span-1">
                            <div className="space-y-1.5 md:space-y-2">
                                <label className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-zinc-500 uppercase ml-1">
                                    <Scissors className="w-3 h-3 text-amber-500" />
                                    Cortes
                                </label>
                                <input
                                    type="number"
                                    name="objetivo_cortes"
                                    min="0"
                                    step="1"
                                    onKeyDown={(e) => ['e', 'E', '+', '-', '.', ','].includes(e.key) && e.preventDefault()}
                                    placeholder="Ej: 150"
                                    value={formData.objetivo_cortes}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-zinc-800/30 border border-zinc-700/50 text-sm text-white outline-none focus:border-amber-500 transition-all placeholder:text-zinc-600 shadow-inner"
                                />
                            </div>
                            <div className="space-y-1.5 md:space-y-2">
                                <label className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-zinc-500 uppercase ml-1">
                                    <ShoppingBag className="w-3 h-3 text-amber-500" />
                                    Productos
                                </label>
                                <input
                                    type="number"
                                    name="objetivo_productos"
                                    min="0"
                                    step="1"
                                    onKeyDown={(e) => ['e', 'E', '+', '-', '.', ','].includes(e.key) && e.preventDefault()}
                                    placeholder="Ej: 40"
                                    value={formData.objetivo_productos}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-zinc-800/30 border border-zinc-700/50 text-sm text-white outline-none focus:border-amber-500 transition-all placeholder:text-zinc-600 shadow-inner"
                                />
                            </div>
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
        </div >
    );
}
