"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Save, Clock, MapPin, Phone, CreditCard, ShoppingBag, Info, Scissors, Loader2, User, DollarSign, Target, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ConfigurationPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Form states
    const [formData, setFormData] = useState({
        Direccion: '',
        telefono: '',
        pagos: '',
        productos: '',
        info: '',
        nombre_encargado: '',
        objetivo_ingresos: '',
        objetivo_cortes: '',
        objetivo_productos: '',
        capacidad_slots: '1'
    });

    // Nueva lógica de Servicios (Relacional)
    interface Service {
        id?: string; // Opcional para nuevos servicios
        perfil_id?: string;
        nombre: string;
        precio: number;
        duracion: number;
    }

    // Weekly Schedule State
    interface DaySchedule {
        dia_semana: number; // 0 (Sunday) to 6 (Saturday)
        hora_apertura: string; // "HH:MM"
        hora_cierre: string; // "HH:MM"
        esta_abierto: boolean;
        hora_inicio_pausa?: string | null;
        hora_fin_pausa?: string | null;
    }

    const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    // Default schedule: Mon-Fri Open 09:00-20:00, Sat-Sun Closed
    const getDefaultSchedule = (): DaySchedule[] => [
        { dia_semana: 0, hora_apertura: '09:00', hora_cierre: '20:00', esta_abierto: false, hora_inicio_pausa: null, hora_fin_pausa: null }, // Domingo
        { dia_semana: 1, hora_apertura: '09:00', hora_cierre: '20:00', esta_abierto: true, hora_inicio_pausa: null, hora_fin_pausa: null },  // Lunes
        { dia_semana: 2, hora_apertura: '09:00', hora_cierre: '20:00', esta_abierto: true, hora_inicio_pausa: null, hora_fin_pausa: null },  // Martes
        { dia_semana: 3, hora_apertura: '09:00', hora_cierre: '20:00', esta_abierto: true, hora_inicio_pausa: null, hora_fin_pausa: null },  // Miércoles
        { dia_semana: 4, hora_apertura: '09:00', hora_cierre: '20:00', esta_abierto: true, hora_inicio_pausa: null, hora_fin_pausa: null },  // Jueves
        { dia_semana: 5, hora_apertura: '09:00', hora_cierre: '20:00', esta_abierto: true, hora_inicio_pausa: null, hora_fin_pausa: null },  // Viernes
        { dia_semana: 6, hora_apertura: '09:00', hora_cierre: '20:00', esta_abierto: false, hora_inicio_pausa: null, hora_fin_pausa: null }, // Sábado
    ];

    const [schedule, setSchedule] = useState<DaySchedule[]>(getDefaultSchedule());

    const [servicesList, setServicesList] = useState<Service[]>([]);
    const [newService, setNewService] = useState<Service>({ nombre: '', precio: 0, duracion: 30 });
    const [deletedServiceIds, setDeletedServiceIds] = useState<string[]>([]); // Para el bonus de eliminación

    useEffect(() => {
        const checkUser = async () => {
            console.log("Config Page: [CYCLE] checkUser triggered");

            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) console.error("Config Page: Session error", sessionError);

            let currentUser = session?.user;

            if (!currentUser) {
                // ... (Retries logic kept same but shortened for brevity in thought, keeping implementation robust)
                for (let i = 0; i < 4; i++) {
                    await new Promise(r => setTimeout(r, 500));
                    const { data: { session: retrySession } } = await supabase.auth.getSession();
                    if (retrySession?.user) {
                        currentUser = retrySession.user;
                        break;
                    }
                }
            }

            if (!currentUser) {
                router.push('/');
                return;
            }

            setUser(currentUser);

            // Fetch existing profile data
            const { data: profile } = await supabase
                .from('perfiles')
                .select('*')
                .eq('id', currentUser.id)
                .single();

            if (profile) {
                setFormData({
                    Direccion: profile.Direccion || '',
                    telefono: profile.telefono || '',
                    pagos: profile.pagos || '',
                    productos: profile.productos || '',
                    info: profile.info || '',
                    nombre_encargado: profile.nombre_encargado || '',
                    objetivo_ingresos: String(profile.objetivo_ingresos || ''),
                    objetivo_cortes: String(profile.objetivo_cortes || ''),
                    objetivo_productos: String(profile.objetivo_productos || ''),
                    capacidad_slots: String(profile.capacidad_slots || '1')
                });

                // Fetch Servicios (Relational)
                const { data: services } = await supabase
                    .from('servicios')
                    .select('*')
                    .eq('perfil_id', currentUser.id)
                    .order('precio', { ascending: true });

                if (services) {
                    setServicesList(services);
                }

                // Fetch Horarios Laborales
                const { data: horarios } = await supabase
                    .from('horarios_laborales')
                    .select('*')
                    .eq('perfil_id', currentUser.id)
                    .order('dia_semana', { ascending: true });

                if (horarios && horarios.length > 0) {
                    // Map DB data to state format
                    const mappedSchedule = getDefaultSchedule().map(day => {
                        const dbDay = horarios.find((h: any) => h.dia_semana === day.dia_semana);
                        if (dbDay) {
                            return {
                                dia_semana: dbDay.dia_semana,
                                hora_apertura: dbDay.hora_apertura?.slice(0, 5) || '09:00',
                                hora_cierre: dbDay.hora_cierre?.slice(0, 5) || '20:00',
                                esta_abierto: dbDay.esta_abierto,
                                hora_inicio_pausa: dbDay.hora_inicio_pausa?.slice(0, 5) || null,
                                hora_fin_pausa: dbDay.hora_fin_pausa?.slice(0, 5) || null
                            };
                        }
                        return day;
                    });
                    setSchedule(mappedSchedule);
                }
            }
        };
        checkUser();
    }, [router]);

    // Service Handlers
    const handleAddService = () => {
        if (!newService.nombre || newService.precio <= 0) {
            toast.error("El nombre y el precio son obligatorios");
            return;
        }
        setServicesList([...servicesList, { ...newService }]);
        setNewService({ nombre: '', precio: 0, duracion: 30 }); // Reset
    };

    const handleDeleteService = (index: number) => {
        const serviceToDelete = servicesList[index];
        if (serviceToDelete.id) {
            setDeletedServiceIds([...deletedServiceIds, serviceToDelete.id]);
        }
        const updated = [...servicesList];
        updated.splice(index, 1);
        setServicesList(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            // Paso 1: Actualizar Perfil (sin servicios ni horario - ahora relacional)
            const { error: profileError } = await supabase
                .from('perfiles')
                .upsert({
                    id: user.id,
                    nombre_barberia: user.user_metadata?.barberia_nombre || 'Mi Barbería',
                    Direccion: formData.Direccion,
                    telefono: formData.telefono,
                    pagos: formData.pagos,
                    productos: formData.productos,
                    info: formData.info,
                    nombre_encargado: formData.nombre_encargado,
                    objetivo_ingresos: parseFloat(formData.objetivo_ingresos) || 0,
                    objetivo_cortes: parseInt(formData.objetivo_cortes) || 0,
                    objetivo_productos: parseInt(formData.objetivo_productos) || 0,
                    capacidad_slots: parseInt(formData.capacidad_slots) || 1,
                    onboarding_completado: true
                }, { onConflict: 'id' });

            if (profileError) throw profileError;

            // Paso 2: Manejar Servicios

            // 2a. Eliminar servicios borrados
            if (deletedServiceIds.length > 0) {
                const { error: deleteError } = await supabase
                    .from('servicios')
                    .delete()
                    .in('id', deletedServiceIds);
                if (deleteError) throw deleteError;
            }

            // 2b. Upsert servicios actuales (Modificado: Iterar para limpiar payload)
            if (servicesList.length > 0) {
                // Iteramos para manejar cada servicio individualmente y evitar conflictos de tipos/nulls en bulk
                for (const s of servicesList) {
                    const serviceToSave: any = {
                        perfil_id: user.id,
                        nombre: s.nombre,
                        precio: s.precio,
                        duracion: s.duracion
                    };

                    // Solo añadimos 'id' si existe (es un servicio existente)
                    // Esto evita enviar 'id: null' o 'id: undefined' que rompe el NOT NULL constraint
                    if (s.id) {
                        serviceToSave.id = s.id;
                    }

                    const { error: upsertError } = await supabase
                        .from('servicios')
                        .upsert(serviceToSave);

                    if (upsertError) {
                        console.error('Error guardando servicio:', s.nombre, upsertError);
                        throw upsertError;
                    }
                }
            }

            // Paso 3: Guardar Horarios Laborales
            for (const day of schedule) {
                const { error: scheduleError } = await supabase
                    .from('horarios_laborales')
                    .upsert({
                        perfil_id: user.id,
                        dia_semana: day.dia_semana,
                        hora_apertura: day.hora_apertura,
                        hora_cierre: day.hora_cierre,
                        esta_abierto: day.esta_abierto,
                        hora_inicio_pausa: day.hora_inicio_pausa || null,
                        hora_fin_pausa: day.hora_fin_pausa || null
                    }, { onConflict: 'perfil_id, dia_semana' });

                if (scheduleError) {
                    console.error('Error guardando horario día:', day.dia_semana, scheduleError);
                    throw scheduleError;
                }
            }

            toast.success('Configuración guardada correctamente');
            router.push('/inicio');
            router.refresh();
        } catch (error: any) {
            console.error('Error:', error);
            toast.error('Error al guardar: ' + (error.message || 'Error desconocido'));
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
                className="max-w-3xl mx-auto w-full space-y-4 md:space-y-8 py-4 md:py-6"
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

                <form onSubmit={handleSubmit} className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800 rounded-[24px] md:rounded-[32px] p-4 md:p-10 shadow-2xl space-y-5 md:space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

                        {/* --- Campos existentes (Teléfono, Encargado, Objetivos, etc) --- */}
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

                        {/* Objetivo Ingresos */}
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
                                placeholder="Ej: 3000"
                                value={formData.objetivo_ingresos}
                                onChange={handleChange}
                                required
                                className="w-full p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-zinc-800/30 border border-zinc-700/50 text-sm text-white outline-none focus:border-amber-500 transition-all placeholder:text-zinc-600 shadow-inner"
                            />
                        </div>

                        {/* Cortes y Productos */}
                        <div className="grid grid-cols-2 gap-3 md:gap-6 md:col-span-1">
                            <div className="space-y-1.5 md:space-y-2">
                                <label className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-zinc-500 uppercase ml-1">
                                    <Scissors className="w-3 h-3 text-amber-500" />
                                    Cortes
                                </label>
                                <input
                                    type="number"
                                    name="objetivo_cortes"
                                    min="0"
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
                                    placeholder="Ej: 40"
                                    value={formData.objetivo_productos}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-zinc-800/30 border border-zinc-700/50 text-sm text-white outline-none focus:border-amber-500 transition-all placeholder:text-zinc-600 shadow-inner"
                                />
                            </div>
                        </div>

                        {/* Capacidad por Slot */}
                        <div className="space-y-1.5 md:space-y-2">
                            <label className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-zinc-500 uppercase ml-1">
                                <Scissors className="w-3 h-3 text-amber-500" />
                                ¿Cuántos barberos trabajais a la vez?
                            </label>
                            <input
                                type="number"
                                name="capacidad_slots"
                                min="1"
                                max="10"
                                placeholder="Ej: 2"
                                value={formData.capacidad_slots}
                                onChange={handleChange}
                                required
                                className="w-full p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-zinc-800/30 border border-zinc-700/50 text-sm text-white outline-none focus:border-amber-500 transition-all placeholder:text-zinc-600 shadow-inner"
                            />
                        </div>

                        {/* --- HORARIO SEMANAL (Schedule Builder) --- */}
                        <div className="md:col-span-2 space-y-4 pt-2">
                            <label className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-zinc-500 uppercase ml-1">
                                <Clock className="w-3 h-3 text-amber-500" />
                                Horario Semanal
                            </label>

                            <div className="space-y-2">
                                {schedule.map((day, index) => (
                                    <div key={day.dia_semana} className="flex md:flex-row flex-col md:items-center gap-3 bg-zinc-800/30 p-3 rounded-xl border border-zinc-700/50">
                                        {/* Day Name + Toggle (Row en móvil) */}
                                        <div className="flex items-center justify-between md:justify-start md:gap-3">
                                            <span className="w-20 md:w-24 text-sm font-medium text-zinc-300">
                                                {DAY_NAMES[day.dia_semana]}
                                            </span>

                                            {/* Toggle Switch */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated = [...schedule];
                                                    updated[index].esta_abierto = !updated[index].esta_abierto;
                                                    setSchedule(updated);
                                                }}
                                                className={cn(
                                                    "w-12 h-6 rounded-full transition-colors relative flex-shrink-0",
                                                    day.esta_abierto ? "bg-amber-500" : "bg-zinc-700"
                                                )}
                                            >
                                                <span className={cn(
                                                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                                                    day.esta_abierto ? "left-7" : "left-1"
                                                )} />
                                            </button>
                                        </div>

                                        {/* Time Inputs or Closed Text */}
                                        {day.esta_abierto ? (
                                            <div className="flex flex-col gap-3 w-full">
                                                {/* Horarios principales (Apertura/Cierre) */}
                                                <div className="grid grid-cols-2 gap-2 md:flex md:items-center md:gap-2 md:flex-1">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[10px] text-zinc-500 font-bold uppercase">Apertura</span>
                                                        <input
                                                            type="time"
                                                            value={day.hora_apertura}
                                                            onChange={(e) => {
                                                                const updated = [...schedule];
                                                                updated[index].hora_apertura = e.target.value;
                                                                setSchedule(updated);
                                                            }}
                                                            className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white outline-none focus:border-amber-500 transition-colors"
                                                        />
                                                    </div>

                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[10px] text-zinc-500 font-bold uppercase">Cierre</span>
                                                        <input
                                                            type="time"
                                                            value={day.hora_cierre}
                                                            onChange={(e) => {
                                                                const updated = [...schedule];
                                                                updated[index].hora_cierre = e.target.value;
                                                                setSchedule(updated);
                                                            }}
                                                            className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white outline-none focus:border-amber-500 transition-colors"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Split Shift Toggle + Break Times */}
                                                <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <label className="flex items-center gap-1.5 cursor-pointer group">
                                                            <div className="relative">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!day.hora_inicio_pausa}
                                                                    onChange={(e) => {
                                                                        const updated = [...schedule];
                                                                        if (e.target.checked) {
                                                                            // Default break times
                                                                            updated[index].hora_inicio_pausa = '14:00';
                                                                            updated[index].hora_fin_pausa = '16:00';
                                                                        } else {
                                                                            updated[index].hora_inicio_pausa = null;
                                                                            updated[index].hora_fin_pausa = null;
                                                                        }
                                                                        setSchedule(updated);
                                                                    }}
                                                                    className="sr-only peer"
                                                                />
                                                                <div className="w-8 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                                                            </div>
                                                            <span className="text-xs uppercase font-bold text-zinc-400 group-hover:text-amber-500 transition-colors">¿Turno Partido?</span>
                                                        </label>
                                                    </div>

                                                    {/* Break Start/End (Only if split) */}
                                                    {day.hora_inicio_pausa && (
                                                        <div className="grid grid-cols-2 gap-2 md:flex md:items-center md:gap-2 animate-in fade-in slide-in-from-left-2">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-[10px] text-zinc-500 font-bold uppercase">Inic. Pausa</span>
                                                                <input
                                                                    type="time"
                                                                    value={day.hora_inicio_pausa}
                                                                    onChange={(e) => {
                                                                        const updated = [...schedule];
                                                                        updated[index].hora_inicio_pausa = e.target.value;
                                                                        setSchedule(updated);
                                                                    }}
                                                                    className="bg-zinc-900 border border-amber-900/50 rounded-lg px-2 py-1.5 text-sm text-white outline-none focus:border-amber-500 transition-colors"
                                                                />
                                                            </div>
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-[10px] text-zinc-500 font-bold uppercase">Fin Pausa</span>
                                                                <input
                                                                    type="time"
                                                                    value={day.hora_fin_pausa || ''}
                                                                    onChange={(e) => {
                                                                        const updated = [...schedule];
                                                                        updated[index].hora_fin_pausa = e.target.value;
                                                                        setSchedule(updated);
                                                                    }}
                                                                    className="bg-zinc-900 border border-amber-900/50 rounded-lg px-2 py-1.5 text-sm text-white outline-none focus:border-amber-500 transition-colors"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-zinc-600 text-sm italic md:ml-0">Cerrado</span>
                                        )}
                                    </div>
                                ))}
                            </div>
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


                        {/* --- LISTA DINÁMICA DE SERVICIOS (CAMBIO PRINCIPAL) --- */}
                        <div className="md:col-span-2 space-y-4 pt-2">
                            <label className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-zinc-500 uppercase ml-1">
                                <Scissors className="w-3 h-3 text-amber-500" />
                                Servicios Ofrecidos
                            </label>

                            {/* Inputs para añadir nuevo servicio */}
                            <div className="flex flex-col md:grid md:grid-cols-[2fr_1fr_1fr_auto] gap-3 md:gap-2 items-stretch md:items-end bg-zinc-800/30 p-3 md:p-3 rounded-xl border border-zinc-700/50">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Nombre</span>
                                    <input
                                        type="text"
                                        placeholder="Ej: Corte Clásico"
                                        value={newService.nombre}
                                        onChange={(e) => setNewService({ ...newService, nombre: e.target.value })}
                                        className="w-full bg-transparent border-b border-zinc-600 focus:border-amber-500 text-sm p-1 outline-none transition-colors"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3 md:contents">
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-zinc-500 uppercase font-bold">Precio (€)</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            placeholder="15"
                                            value={newService.precio || ''}
                                            onChange={(e) => setNewService({ ...newService, precio: parseFloat(e.target.value) })}
                                            className="w-full bg-transparent border-b border-zinc-600 focus:border-amber-500 text-sm p-1 outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-zinc-500 uppercase font-bold">Minutos</span>
                                        <input
                                            type="number"
                                            min="5"
                                            step="5"
                                            placeholder="30"
                                            value={newService.duracion}
                                            onChange={(e) => setNewService({ ...newService, duracion: parseInt(e.target.value) })}
                                            className="w-full bg-transparent border-b border-zinc-600 focus:border-amber-500 text-sm p-1 outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddService}
                                    className="bg-amber-500 text-black p-3 md:p-2 rounded-lg hover:bg-amber-400 transition-colors font-bold text-sm md:text-base flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span className="md:hidden">Añadir Servicio</span>
                                </button>
                            </div>

                            {/* Lista de servicios añadidos */}
                            <div className="space-y-2">
                                {servicesList.map((service, index) => (
                                    <div key={index} className="flex flex-col md:flex-row md:items-center md:justify-between bg-zinc-900/50 p-3 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors gap-2">
                                        <div className="flex items-center justify-between md:justify-start md:gap-4">
                                            <div className="font-medium text-sm text-white">{service.nombre}</div>
                                            <div className="text-xs text-zinc-400 md:block">{service.duracion} min</div>
                                        </div>
                                        <div className="flex items-center justify-between md:justify-end gap-4">
                                            <div className="font-bold text-amber-500">{service.precio}€</div>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteService(index)}
                                                className="text-zinc-500 hover:text-red-500 transition-colors p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {servicesList.length === 0 && (
                                    <div className="text-center py-4 text-zinc-600 text-sm italic">
                                        No hay servicios añadidos aún.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* --- Fin Lista Dinámica --- */}

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

                        {/* Productos (Texto simple) */}
                        <div className="space-y-1.5 md:space-y-2">
                            <label className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-zinc-500 uppercase ml-1">
                                <ShoppingBag className="w-3 h-3 text-amber-500" />
                                Productos (Lista)
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

                        {/* Otra info */}
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
