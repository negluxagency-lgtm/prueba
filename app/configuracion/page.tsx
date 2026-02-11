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

    // --- NEW STRICT JSON SCHEDULE LOGIC ---
    // Import shared types (or define locally if preferred, but using local for component clarity during refactor)
    interface TimeRange {
        desde: string; // HH:mm
        hasta: string; // HH:mm
    }

    interface WeeklySchedule {
        lunes: TimeRange[];
        martes: TimeRange[];
        miércoles: TimeRange[];
        jueves: TimeRange[];
        viernes: TimeRange[];
        sábado: TimeRange[];
        domingo: TimeRange[];
        [key: string]: TimeRange[];
    }

    const INITIAL_SCHEDULE: WeeklySchedule = {
        lunes: [],
        martes: [],
        miércoles: [],
        jueves: [],
        viernes: [],
        sábado: [],
        domingo: []
    };

    const [shopSchedule, setShopSchedule] = useState<WeeklySchedule>(INITIAL_SCHEDULE);

    // Days in order for UI iteration
    const ORDERED_DAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

    // Helper to check if a day is "open" (has at least one range)
    const isDayOpen = (dayKey: string) => {
        return shopSchedule[dayKey] && shopSchedule[dayKey].length > 0;
    }

    // Toggle Day: If closed -> add default range. If open -> clear ranges.
    const toggleDay = (dayKey: string) => {
        const isOpen = isDayOpen(dayKey);
        if (isOpen) {
            // Close it (empty array)
            setShopSchedule(prev => ({ ...prev, [dayKey]: [] }));
        } else {
            // Open it (default range)
            setShopSchedule(prev => ({ ...prev, [dayKey]: [{ desde: '09:00', hasta: '20:00' }] }));
        }
    }

    // Update specific range
    const updateRange = (dayKey: string, index: number, field: 'desde' | 'hasta', value: string) => {
        const updatedRanges = [...shopSchedule[dayKey]];
        updatedRanges[index] = { ...updatedRanges[index], [field]: value };
        setShopSchedule(prev => ({ ...prev, [dayKey]: updatedRanges }));
    }

    // Add new range to a day
    const addRange = (dayKey: string) => {
        // Default new range, try to put it after the last one or default to afternoon
        setShopSchedule(prev => ({
            ...prev,
            [dayKey]: [...prev[dayKey], { desde: '14:00', hasta: '18:00' }]
        }));
    };

    // Remove a range
    const removeRange = (dayKey: string, index: number) => {
        const updatedRanges = [...shopSchedule[dayKey]];
        updatedRanges.splice(index, 1);
        setShopSchedule(prev => ({ ...prev, [dayKey]: updatedRanges }));
    };

    // Barber TimeRange (reuse TimeSlot)
    // Legacy Barber support for now (we might update this later or map it)
    interface BarberDaySchedule {
        dia: number;
        activo: boolean;
        turnos: { inicio: string, fin: string }[];
    }

    interface Barber {
        id?: string;
        nombre: string;
        horario_semanal: BarberDaySchedule[];
    }

    const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    // Default barber weekly schedule: Mon-Fri 09:00-20:00, Weekends closed
    const getDefaultBarberSchedule = (): BarberDaySchedule[] => {
        return Array.from({ length: 7 }, (_, index) => ({
            dia: index,
            activo: index >= 1 && index <= 5,  // Mon-Fri active
            turnos: index >= 1 && index <= 5 ? [{ inicio: '09:00', fin: '20:00' }] : []
        }));
    };

    const [servicesList, setServicesList] = useState<Service[]>([]);
    const [newService, setNewService] = useState<Service>({ nombre: '', precio: 0, duracion: 30 });
    const [deletedServiceIds, setDeletedServiceIds] = useState<string[]>([]);

    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [newBarber, setNewBarber] = useState<Barber>({
        nombre: '',
        horario_semanal: getDefaultBarberSchedule()
    });
    const [deletedBarberIds, setDeletedBarberIds] = useState<string[]>([]);

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

                // Fetch Barberos
                const { data: barbersData } = await supabase
                    .from('barberos')
                    .select('*')
                    .eq('barberia_id', currentUser.id)
                    .order('nombre', { ascending: true });

                if (barbersData) {
                    setBarbers(barbersData.map(b => ({
                        id: b.id,
                        nombre: b.nombre,
                        horario_semanal: b.horario_semanal || getDefaultBarberSchedule()
                    })));
                }

                // Fetch Servicios (Relational)
                const { data: services } = await supabase
                    .from('servicios')
                    .select('*')
                    .eq('perfil_id', currentUser.id)
                    .order('precio', { ascending: true });

                if (services) {
                    setServicesList(services);
                }

                // Load shop schedule from profile (JSONB)
                if (profile.horario_semanal) {
                    // Ensure it matches our new structure
                    if (Array.isArray(profile.horario_semanal)) {
                        setShopSchedule(INITIAL_SCHEDULE); // Reset legacy array
                    } else {
                        setShopSchedule(profile.horario_semanal);
                    }
                } else {
                    setShopSchedule(INITIAL_SCHEDULE);
                }
            }
        };
        checkUser();
    }, [router]);

    // Barber Handlers
    const handleAddBarber = () => {
        if (!newBarber.nombre.trim()) {
            toast.error("El nombre del barbero es obligatorio");
            return;
        }
        setBarbers([...barbers, { ...newBarber }]);
        setNewBarber({
            nombre: '',
            horario_semanal: getDefaultBarberSchedule()
        });
    };

    const handleCopyMondayToAll = () => {
        const mondaySchedule = newBarber.horario_semanal[1]; // Monday is index 1
        const updated = newBarber.horario_semanal.map((day, index) => {
            if (index === 0 || index === 6) return day; // Skip Sunday (0) and Saturday (6)
            return {
                ...day,
                activo: mondaySchedule.activo,
                turnos: JSON.parse(JSON.stringify(mondaySchedule.turnos)) // Deep copy
            };
        });
        setNewBarber({ ...newBarber, horario_semanal: updated });
        toast.success("Horario de Lunes copiado a días laborales");
    };

    const handleDeleteBarber = (index: number) => {
        const barberToDelete = barbers[index];
        if (barberToDelete.id) {
            setDeletedBarberIds([...deletedBarberIds, barberToDelete.id]);
        }
        const updated = [...barbers];
        updated.splice(index, 1);
        setBarbers(updated);
    };

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
                    horario_semanal: shopSchedule,  // NEW: Save shop schedule as JSONB
                    onboarding_completado: true
                }, { onConflict: 'id' });

            if (profileError) throw profileError;

            // Paso 2: Manejar Barberos

            // 2a. Eliminar barberos borrados
            if (deletedBarberIds.length > 0) {
                const { error: deleteBarberError } = await supabase
                    .from('barberos')
                    .delete()
                    .in('id', deletedBarberIds);
                if (deleteBarberError) throw deleteBarberError;
            }

            // 2b. Upsert barberos actuales
            for (const barber of barbers) {
                const barberToSave: any = {
                    nombre: barber.nombre,
                    horario_semanal: barber.horario_semanal,
                    barberia_id: user.id
                };

                if (barber.id) {
                    barberToSave.id = barber.id;
                }

                const { error: upsertBarberError } = await supabase
                    .from('barberos')
                    .upsert(barberToSave);

                if (upsertBarberError) {
                    console.error('Error guardando barbero:', barber.nombre, upsertBarberError);
                    throw upsertBarberError;
                }
            }

            // Paso 3: Manejar Servicios

            // 3a. Eliminar servicios borrados
            if (deletedServiceIds.length > 0) {
                const { error: deleteError } = await supabase
                    .from('servicios')
                    .delete()
                    .in('id', deletedServiceIds);
                if (deleteError) throw deleteError;
            }

            // 3b. Upsert servicios actuales
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

                        {/* Barbers Shift Builder */}
                        <div className="md:col-span-2 space-y-4 pt-4">
                            <label className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-zinc-500 uppercase ml-1">
                                <User className="w-3 h-3 text-amber-500" />
                                Barberos y Turnos
                            </label>

                            {/* Add new barber form */}
                            <div className="bg-zinc-800/30 p-4 rounded-2xl border border-zinc-700/50 space-y-4">
                                <input
                                    type="text"
                                    placeholder="Nombre del barbero"
                                    value={newBarber.nombre}
                                    onChange={(e) => setNewBarber({ ...newBarber, nombre: e.target.value })}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500 transition-all"
                                />

                                {/* Weekly Schedule Builder */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-zinc-400">Horario Semanal</label>
                                        <button
                                            type="button"
                                            onClick={handleCopyMondayToAll}
                                            className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1"
                                        >
                                            📋 Copiar Lunes a Todos
                                        </button>
                                    </div>

                                    {DAY_NAMES.map((dayName, dayIndex) => (
                                        <div key={dayIndex} className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 space-y-2">
                                            {/* Day header with switch */}
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-sm text-white">{dayName}</span>
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={newBarber.horario_semanal[dayIndex].activo}
                                                        onChange={(e) => {
                                                            const updated = [...newBarber.horario_semanal];
                                                            updated[dayIndex].activo = e.target.checked;
                                                            if (e.target.checked && updated[dayIndex].turnos.length === 0) {
                                                                updated[dayIndex].turnos = [{ inicio: '09:00', fin: '20:00' }];
                                                            }
                                                            setNewBarber({ ...newBarber, horario_semanal: updated });
                                                        }}
                                                        className="w-4 h-4 rounded border-zinc-700 text-amber-500 focus:ring-amber-500"
                                                    />
                                                    <span className="text-xs text-zinc-400">Activo</span>
                                                </label>
                                            </div>

                                            {/* Time ranges */}
                                            {newBarber.horario_semanal[dayIndex].activo && (
                                                <div className="space-y-2">
                                                    {newBarber.horario_semanal[dayIndex].turnos.map((turno, turnoIndex) => (
                                                        <div key={turnoIndex} className="grid grid-cols-2 gap-2">
                                                            <input
                                                                type="time"
                                                                value={turno.inicio}
                                                                onChange={(e) => {
                                                                    const updated = [...newBarber.horario_semanal];
                                                                    updated[dayIndex].turnos[turnoIndex].inicio = e.target.value;
                                                                    setNewBarber({ ...newBarber, horario_semanal: updated });
                                                                }}
                                                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
                                                            />
                                                            <div className="flex gap-1">
                                                                <input
                                                                    type="time"
                                                                    value={turno.fin}
                                                                    onChange={(e) => {
                                                                        const updated = [...newBarber.horario_semanal];
                                                                        updated[dayIndex].turnos[turnoIndex].fin = e.target.value;
                                                                        setNewBarber({ ...newBarber, horario_semanal: updated });
                                                                    }}
                                                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
                                                                />
                                                                {newBarber.horario_semanal[dayIndex].turnos.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const updated = [...newBarber.horario_semanal];
                                                                            updated[dayIndex].turnos.splice(turnoIndex, 1);
                                                                            setNewBarber({ ...newBarber, horario_semanal: updated });
                                                                        }}
                                                                        className="px-2 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400"
                                                                    >
                                                                        ×
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Add shift button */}
                                                    {newBarber.horario_semanal[dayIndex].turnos.length < 2 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const updated = [...newBarber.horario_semanal];
                                                                updated[dayIndex].turnos.push({ inicio: '14:00', fin: '16:00' });
                                                                setNewBarber({ ...newBarber, horario_semanal: updated });
                                                            }}
                                                            className="text-xs text-amber-500 hover:text-amber-400"
                                                        >
                                                            + Añadir turno
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleAddBarber}
                                    className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-amber-500 font-bold py-2.5 rounded-xl transition-all border border-zinc-700"
                                >
                                    <Plus className="w-4 h-4" />
                                    Añadir Barbero
                                </button>
                            </div>

                            {/* List of barbers */}
                            {barbers.length > 0 && (
                                <div className="space-y-2">
                                    {barbers.map((barber, index) => (
                                        <div key={barber.id || index} className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 flex justify-between items-start">
                                            <div>
                                                <div className="font-bold text-white text-sm">{barber.nombre}</div>
                                                <div className="text-xs text-zinc-400 mt-1">
                                                    {barber.horario_semanal
                                                        .filter(d => d.activo)
                                                        .map(d => DAY_NAMES[d.dia])
                                                        .join(', ')}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteBarber(index)}
                                                className="text-red-500 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* --- HORARIO DE LA BARBERÍA (NUEVO FORMATO JSON) --- */}
                        <div className="md:col-span-2 space-y-4 pt-2">
                            <label className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-zinc-500 uppercase ml-1">
                                <Clock className="w-3 h-3 text-amber-500" />
                                Horario de Apertura General
                            </label>

                            <div className="space-y-3">
                                {ORDERED_DAYS.map((dayKey) => {
                                    const isOpen = isDayOpen(dayKey);
                                    return (
                                        <div key={dayKey} className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-700/50 space-y-3">
                                            {/* Header del Día */}
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-sm text-white capitalize">{dayKey}</span>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <span className={`text-xs font-medium ${isOpen ? 'text-amber-500' : 'text-zinc-500'}`}>
                                                        {isOpen ? 'ABIERTO' : 'CERRADO'}
                                                    </span>
                                                    <div className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={isOpen}
                                                            onChange={() => toggleDay(dayKey)}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-zinc-700/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                                                    </div>
                                                </label>
                                            </div>

                                            {/* Rangos de Horario (Solo si está abierto) */}
                                            {isOpen && (
                                                <div className="space-y-3 pl-2 border-l-2 border-zinc-700/50 ml-1">
                                                    {shopSchedule[dayKey]?.map((range, index) => (
                                                        <div key={index} className="flex items-end gap-2 group animate-in fade-in slide-in-from-top-2 duration-300">
                                                            <div className="grid grid-cols-2 gap-2 flex-1">
                                                                <div className="space-y-1">
                                                                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Desde</label>
                                                                    <input
                                                                        type="time"
                                                                        value={range.desde}
                                                                        onChange={(e) => updateRange(dayKey, index, 'desde', e.target.value)}
                                                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none transition-colors"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Hasta</label>
                                                                    <input
                                                                        type="time"
                                                                        value={range.hasta}
                                                                        onChange={(e) => updateRange(dayKey, index, 'hasta', e.target.value)}
                                                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none transition-colors"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() => removeRange(dayKey, index)}
                                                                className="p-2.5 bg-zinc-900 hover:bg-red-900/30 text-zinc-500 hover:text-red-500 rounded-lg transition-colors border border-zinc-700 hover:border-red-800"
                                                                title="Eliminar franja"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}

                                                    {/* Botón Añadir Franja */}
                                                    <button
                                                        type="button"
                                                        onClick={() => addRange(dayKey)}
                                                        className="flex items-center gap-2 text-xs font-bold text-amber-500 hover:text-amber-400 mt-2 px-2 py-1 rounded hover:bg-amber-500/10 transition-colors w-fit"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        AÑADIR TURNO
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
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

                    </div >

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
                </form >
            </motion.div >
        </div >
    );
}
