"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    Clock, MapPin, Phone, Scissors, Loader2, User, DollarSign,
    Target, Plus, Trash2, ChevronRight, ChevronLeft, Check,
    Building2, Sparkles, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarUpload } from '@/components/AvatarUpload';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimeRange {
    desde: string;
    hasta: string;
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

interface BarberDaySchedule {
    dia: number;
    activo: boolean;
    turnos: { inicio: string; fin: string }[];
}

interface Barber {
    id?: string;
    nombre: string;
    horario_semanal: BarberDaySchedule[];
    'jefe/dueño'?: boolean;
}

interface Service {
    id?: string;
    perfil_id?: string;
    nombre: string;
    precio: number;
    duracion: number;
}

interface AddressFields {
    calle: string;
    numero: string;
    piso: string;   // opcional
    ciudad: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_SCHEDULE: WeeklySchedule = {
    lunes: [], martes: [], miércoles: [], jueves: [],
    viernes: [], sábado: [], domingo: []
};

const ORDERED_DAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const STEPS = [
    { num: 1, label: 'Información', icon: User },
    { num: 2, label: 'Dirección', icon: MapPin },
    { num: 3, label: 'Equipo', icon: Scissors },
    { num: 4, label: 'Horario', icon: Clock },
    { num: 5, label: 'Servicios', icon: Sparkles },
    { num: 6, label: 'Metas', icon: Target },
];

// ─── Slide variants ───────────────────────────────────────────────────────────

const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ConfigurationPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);

    // Form states
    const [formData, setFormData] = useState({
        nombre_barberia: '',
        Direccion: '',
        telefono: '',
        pagos: '',
        productos: '',
        info: '',
        nombre_encargado: '',
        objetivo_ingresos: '',
        objetivo_cortes: '',
        objetivo_productos: '',
        capacidad_slots: '1',
        Autonomo: false,
    });

    // Logo
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);

    // Address fields
    const [addressFields, setAddressFields] = useState<AddressFields>({ calle: '', numero: '', piso: '', ciudad: '' });

    // Services
    const [servicesList, setServicesList] = useState<Service[]>([]);
    const [newService, setNewService] = useState<Service>({ nombre: '', precio: 0, duracion: 30 });
    const [deletedServiceIds, setDeletedServiceIds] = useState<string[]>([]);

    // Barbers
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [newBarber, setNewBarber] = useState<Barber>({
        nombre: '', horario_semanal: getDefaultBarberSchedule(), 'jefe/dueño': false
    });
    const [deletedBarberIds, setDeletedBarberIds] = useState<string[]>([]);
    const [isAddingBarber, setIsAddingBarber] = useState(false);

    // Shop schedule
    const [shopSchedule, setShopSchedule] = useState<WeeklySchedule>(INITIAL_SCHEDULE);
    const [editingDay, setEditingDay] = useState<string | null>(null);

    // ─── Load user & data ──────────────────────────────────────────────────────

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            let currentUser = session?.user;

            if (!currentUser) {
                for (let i = 0; i < 4; i++) {
                    await new Promise(r => setTimeout(r, 500));
                    const { data: { session: s } } = await supabase.auth.getSession();
                    if (s?.user) { currentUser = s.user; break; }
                }
            }
            if (!currentUser) { router.push('/'); return; }
            setUser(currentUser);

            const { data: profile } = await supabase
                .from('perfiles').select('*').eq('id', currentUser.id).single();

            if (profile) {
                setFormData({
                    nombre_barberia: profile.nombre_barberia || '',
                    Direccion: profile.Direccion || '',
                    telefono: profile.telefono || '',
                    pagos: profile.pagos || '',
                    productos: profile.productos || '',
                    info: profile.info || '',
                    nombre_encargado: profile.nombre_encargado || '',
                    objetivo_ingresos: String(profile.objetivo_ingresos || ''),
                    objetivo_cortes: String(profile.objetivo_cortes || ''),
                    objetivo_productos: String(profile.objetivo_productos || ''),
                    capacidad_slots: String(profile.capacidad_slots || '1'),
                    Autonomo: !!profile.Autonomo,
                });
                // Intentar precarga de la dirección guardada en el primer campo
                if (profile.Direccion) {
                    setAddressFields(p => ({ ...p, calle: profile.Direccion }));
                }
                setCurrentAvatarUrl(profile.logo_url || null);

                if (profile.horario_semanal && !Array.isArray(profile.horario_semanal)) {
                    setShopSchedule(profile.horario_semanal);
                }
            }

            const { data: barbersData } = await supabase
                .from('barberos').select('*').eq('barberia_id', currentUser.id).order('nombre');
            if (barbersData) {
                setBarbers(barbersData.map(b => ({
                    id: b.id, nombre: b.nombre,
                    horario_semanal: b.horario_semanal || getDefaultBarberSchedule(),
                    'jefe/dueño': !!b['jefe/dueño']
                })));
            }

            const { data: services } = await supabase
                .from('servicios').select('*').eq('perfil_id', currentUser.id).order('precio');
            if (services) setServicesList(services);
        };
        checkUser();
    }, [router]);



    // ─── Shop schedule helpers ────────────────────────────────────────────────

    const isDayOpen = (k: string) => shopSchedule[k]?.length > 0;
    const toggleDay = (k: string) => {
        setShopSchedule(p => ({
            ...p, [k]: isDayOpen(k) ? [] : [{ desde: '09:00', hasta: '20:00' }]
        }));
    };
    const updateRange = (k: string, i: number, f: 'desde' | 'hasta', v: string) => {
        const ranges = [...shopSchedule[k]];
        ranges[i] = { ...ranges[i], [f]: v };
        setShopSchedule(p => ({ ...p, [k]: ranges }));
    };
    const addRange = (k: string) =>
        setShopSchedule(p => ({ ...p, [k]: [...p[k], { desde: '14:00', hasta: '18:00' }] }));
    const removeRange = (k: string, i: number) => {
        const ranges = [...shopSchedule[k]];
        ranges.splice(i, 1);
        setShopSchedule(p => ({ ...p, [k]: ranges }));
    };

    // ─── Barber handlers ──────────────────────────────────────────────────────

    const handleAddBarber = () => {
        if (!newBarber.nombre.trim()) { toast.error('El nombre del barbero es obligatorio'); return; }
        let updated = [...barbers];
        if (newBarber['jefe/dueño']) updated = updated.map(b => ({ ...b, 'jefe/dueño': false }));
        setBarbers([...updated, { ...newBarber }]);
        setNewBarber({ nombre: '', horario_semanal: getDefaultBarberSchedule(), 'jefe/dueño': false });
        setIsAddingBarber(false);
    };

    const handleCopyMondayToAll = () => {
        const mon = newBarber.horario_semanal[1];
        const updated = newBarber.horario_semanal.map((d, i) =>
            i === 0 || i === 6 ? d : { ...d, activo: mon.activo, turnos: JSON.parse(JSON.stringify(mon.turnos)) }
        );
        setNewBarber({ ...newBarber, horario_semanal: updated });
        toast.success('Horario de Lunes copiado a días laborales');
    };

    const handleDeleteBarber = (i: number) => {
        const b = barbers[i];
        if (b.id) setDeletedBarberIds(p => [...p, b.id!]);
        setBarbers(p => p.filter((_, idx) => idx !== i));
    };

    // ─── Service handlers ─────────────────────────────────────────────────────

    const handleAddService = () => {
        if (!newService.nombre || newService.precio <= 0) {
            toast.error('El nombre y el precio son obligatorios'); return;
        }
        setServicesList(p => [...p, { ...newService }]);
        setNewService({ nombre: '', precio: 0, duracion: 30 });
    };

    const handleDeleteService = (i: number) => {
        const s = servicesList[i];
        if (s.id) setDeletedServiceIds(p => [...p, s.id!]);
        setServicesList(p => p.filter((_, idx) => idx !== i));
    };

    // ─── Submit ───────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!user) return;
        setLoading(true);
        try {
            let finalLogoUrl = currentAvatarUrl;
            if (avatarFile) {
                const ext = avatarFile.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${ext}`;
                const { error: uploadError } = await supabase.storage
                    .from('logos_barberias').upload(fileName, avatarFile, { upsert: true });
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('logos_barberias').getPublicUrl(fileName);
                finalLogoUrl = urlData.publicUrl;
            }

            const { error: profileError } = await supabase.from('perfiles').upsert({
                id: user.id,
                nombre_barberia: formData.nombre_barberia || user.user_metadata?.barberia_nombre || 'Mi Barbería',
                logo_url: finalLogoUrl,
                Direccion: `${addressFields.calle}${addressFields.numero ? ', ' + addressFields.numero : ''}${addressFields.piso ? ', ' + addressFields.piso : ''}${addressFields.ciudad ? ', ' + addressFields.ciudad : ''}`,
                telefono: formData.telefono,
                pagos: formData.pagos,
                productos: formData.productos,
                info: formData.info,
                nombre_encargado: formData.nombre_encargado,
                objetivo_ingresos: parseFloat(formData.objetivo_ingresos) || 0,
                objetivo_cortes: parseInt(formData.objetivo_cortes) || 0,
                objetivo_productos: parseInt(formData.objetivo_productos) || 0,
                capacidad_slots: parseInt(formData.capacidad_slots) || 1,
                horario_semanal: shopSchedule,
                onboarding_completado: true,
                Autonomo: formData.Autonomo,
            }, { onConflict: 'id' });
            if (profileError) throw profileError;

            if (deletedBarberIds.length > 0) {
                const { error } = await supabase.from('barberos').delete().in('id', deletedBarberIds);
                if (error) throw error;
            }
            for (const b of barbers) {
                const payload: any = { nombre: b.nombre, horario_semanal: b.horario_semanal, barberia_id: user.id, 'jefe/dueño': !!b['jefe/dueño'] };
                if (b.id) payload.id = b.id;
                const { error } = await supabase.from('barberos').upsert(payload);
                if (error) throw error;
            }

            if (deletedServiceIds.length > 0) {
                const { error } = await supabase.from('servicios').delete().in('id', deletedServiceIds);
                if (error) throw error;
            }
            for (const s of servicesList) {
                const payload: any = { perfil_id: user.id, nombre: s.nombre, precio: s.precio, duracion: s.duracion };
                if (s.id) payload.id = s.id;
                const { error } = await supabase.from('servicios').upsert(payload);
                if (error) throw error;
            }

            toast.success('¡Configuración guardada correctamente!');
            router.push('/inicio');
            router.refresh();
        } catch (err: any) {
            toast.error('Error al guardar: ' + (err.message || 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    };

    // ─── Step navigation ──────────────────────────────────────────────────────

    const validateStep = (): boolean => {
        if (step === 1) {
            if (!String(formData.nombre_encargado).trim()) { toast.error('Introduce tu nombre'); return false; }
            if (!String(formData.nombre_barberia).trim()) { toast.error('Introduce el nombre de la barbería'); return false; }
            if (!String(formData.telefono).trim()) { toast.error('Introduce el teléfono'); return false; }
        }
        if (step === 2) {
            if (!addressFields.calle.trim()) { toast.error('La calle es obligatoria'); return false; }
            if (!addressFields.numero.trim()) { toast.error('El número es obligatorio'); return false; }
            if (!addressFields.ciudad.trim()) { toast.error('La ciudad es obligatoria'); return false; }
        }
        return true;
    };

    const goNext = () => {
        if (!validateStep()) return;
        setDirection(1);
        setStep(s => Math.min(s + 1, 6));
    };

    const goPrev = () => {
        setDirection(-1);
        setStep(s => Math.max(s - 1, 1));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(p => ({ ...p, [name]: value }));
    };

    // ─── Loading guard ────────────────────────────────────────────────────────

    if (!user) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
        );
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl"
            >
                {/* Header */}
                <div className="text-center mb-6 md:mb-8">
                    <h1 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter">
                        Configura tu <span className="text-amber-500">Barbería</span>
                    </h1>
                    <p className="text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-[2px] mt-1">
                        Último paso para activar tu cuenta
                    </p>
                </div>

                {/* Progress bar */}
                <ProgressBar currentStep={step} />

                {/* Card */}
                <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-[24px] md:rounded-[32px] p-5 md:p-10 shadow-2xl overflow-hidden mt-6">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={step}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.28, ease: 'easeInOut' }}
                        >
                            {step === 1 && (
                                <Step1
                                    formData={formData}
                                    handleChange={handleChange}
                                    currentAvatarUrl={currentAvatarUrl}
                                    setAvatarFile={setAvatarFile}
                                    loading={loading}
                                />
                            )}
                            {step === 2 && (
                                <Step2
                                    addressFields={addressFields}
                                    setAddressFields={setAddressFields}
                                />
                            )}
                            {step === 3 && (
                                <Step3
                                    barbers={barbers}
                                    newBarber={newBarber}
                                    setNewBarber={setNewBarber}
                                    isAddingBarber={isAddingBarber}
                                    setIsAddingBarber={setIsAddingBarber}
                                    handleAddBarber={handleAddBarber}
                                    handleDeleteBarber={handleDeleteBarber}
                                    handleCopyMondayToAll={handleCopyMondayToAll}
                                    isAutonomo={formData.Autonomo}
                                    setBarbers={setBarbers}
                                />
                            )}
                            {step === 4 && (
                                <Step4
                                    shopSchedule={shopSchedule}
                                    isDayOpen={isDayOpen}
                                    toggleDay={toggleDay}
                                    onEditDay={(day: string) => setEditingDay(day)}
                                />
                            )}
                            {step === 5 && (
                                <Step5
                                    servicesList={servicesList}
                                    newService={newService}
                                    setNewService={setNewService}
                                    handleAddService={handleAddService}
                                    handleDeleteService={handleDeleteService}
                                />
                            )}
                            {step === 6 && (
                                <Step6
                                    formData={formData}
                                    handleChange={handleChange}
                                    setFormData={setFormData}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation buttons */}
                    <div className="flex gap-3 mt-7">
                        {step > 1 && (
                            <button
                                type="button"
                                onClick={goPrev}
                                className="flex items-center gap-2 px-5 py-3.5 rounded-xl md:rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Atrás
                            </button>
                        )}
                        {step < 6 ? (
                            <button
                                type="button"
                                onClick={goNext}
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl md:rounded-2xl font-black text-sm uppercase tracking-wide transition-all shadow-[0_8px_24px_-8px_rgba(245,158,11,0.5)] hover:shadow-[0_12px_32px_-8px_rgba(245,158,11,0.6)]"
                            >
                                Continuar
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-3.5 bg-amber-500 text-black rounded-xl md:rounded-2xl font-black text-sm uppercase tracking-wide transition-all shadow-[0_8px_24px_-8px_rgba(245,158,11,0.5)]",
                                    loading ? "opacity-70 cursor-wait" : "hover:bg-amber-400 hover:shadow-[0_12px_32px_-8px_rgba(245,158,11,0.6)]"
                                )}
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Finalizar
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Hours Modal */}
            <AnimatePresence>
                {editingDay && (
                    <HoursModal
                        dayKey={editingDay}
                        ranges={shopSchedule[editingDay]}
                        onClose={() => setEditingDay(null)}
                        onUpdate={(newRanges: TimeRange[]) => {
                            setShopSchedule(p => ({ ...p, [editingDay]: newRanges }));
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function getDefaultBarberSchedule(): BarberDaySchedule[] {
    return Array.from({ length: 7 }, (_, i) => ({
        dia: i,
        activo: i >= 1 && i <= 5,
        turnos: i >= 1 && i <= 5 ? [{ inicio: '09:00', fin: '20:00' }] : []
    }));
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ currentStep }: { currentStep: number }) {
    return (
        <div className="flex items-center justify-center gap-0">
            {STEPS.map((s, idx) => {
                const done = currentStep > s.num;
                const active = currentStep === s.num;
                const Icon = s.icon;
                return (
                    <React.Fragment key={s.num}>
                        <div className="flex flex-col items-center gap-1">
                            <div className={cn(
                                "w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                                done ? "bg-amber-500 border-amber-500 text-black"
                                    : active ? "bg-amber-500/20 border-amber-500 text-amber-400"
                                        : "bg-zinc-900 border-zinc-700 text-zinc-600"
                            )}>
                                {done
                                    ? <Check className="w-4 h-4" />
                                    : <Icon className="w-3.5 h-3.5" />
                                }
                            </div>
                            <span className={cn(
                                "text-[9px] font-bold uppercase tracking-wider hidden md:block",
                                active ? "text-amber-400" : done ? "text-amber-600" : "text-zinc-600"
                            )}>{s.label}</span>
                        </div>
                        {idx < STEPS.length - 1 && (
                            <div className={cn(
                                "h-[2px] flex-1 mx-1 md:mx-2 transition-all duration-500",
                                currentStep > s.num ? "bg-amber-500" : "bg-zinc-800"
                            )} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

// ─── Step 1: Info personal ────────────────────────────────────────────────────

function Step1({ formData, handleChange, currentAvatarUrl, setAvatarFile, loading }: any) {
    return (
        <div className="space-y-5">
            <StepTitle icon={User} title="Información básica" subtitle="Cuéntanos sobre ti y tu barbería" />

            <div className="flex justify-center">
                <AvatarUpload currentImageUrl={currentAvatarUrl} onFileSelect={setAvatarFile} loading={loading} />
            </div>

            <div className="grid grid-cols-1 gap-4">
                <Field label="Tu nombre" icon={User}>
                    <input
                        type="text"
                        name="nombre_encargado"
                        placeholder="Ej: Juan Pérez"
                        value={formData.nombre_encargado}
                        onChange={handleChange}
                        className={inputCls}
                    />
                </Field>
                <Field label="Nombre de la barbería" icon={Building2}>
                    <input
                        type="text"
                        name="nombre_barberia"
                        placeholder="Ej: Barber King"
                        value={formData.nombre_barberia}
                        onChange={handleChange}
                        className={inputCls}
                    />
                </Field>
                <Field label="Teléfono" icon={Phone}>
                    <input
                        type="tel"
                        name="telefono"
                        placeholder="Ej: 600 000 000"
                        value={formData.telefono}
                        onChange={handleChange}
                        className={inputCls}
                    />
                </Field>
            </div>
        </div>
    );
}

// ─── Step 2: Dirección ────────────────────────────────────────────────────────

function Step2({ addressFields, setAddressFields }: any) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setAddressFields((p: any) => ({ ...p, [name]: value }));
    };

    return (
        <div className="space-y-5">
            <StepTitle icon={MapPin} title="Dirección de la barbería" subtitle="Introduce los detalles de ubicación" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <Field label="Calle" icon={MapPin}>
                        <input
                            type="text"
                            name="calle"
                            placeholder="Ej: Calle Gran Vía"
                            value={addressFields.calle}
                            onChange={handleChange}
                            className={inputCls}
                        />
                    </Field>
                </div>
                <Field label="Número" icon={MapPin}>
                    <input
                        type="text"
                        name="numero"
                        placeholder="Ej: 1"
                        value={addressFields.numero}
                        onChange={handleChange}
                        className={inputCls}
                    />
                </Field>
                <Field label="Piso/Letra (Opcional)" icon={MapPin}>
                    <input
                        type="text"
                        name="piso"
                        placeholder="Ej: 2B"
                        value={addressFields.piso}
                        onChange={handleChange}
                        className={inputCls}
                    />
                </Field>
                <div className="md:col-span-2">
                    <Field label="Ciudad" icon={Building2}>
                        <input
                            type="text"
                            name="ciudad"
                            placeholder="Ej: Madrid"
                            value={addressFields.ciudad}
                            onChange={handleChange}
                            className={inputCls}
                        />
                    </Field>
                </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 flex items-start gap-3">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-400">Los clientes verán esta dirección completa para sus citas: {`${addressFields.calle || '...'}${addressFields.numero ? ', ' + addressFields.numero : ''}${addressFields.piso ? ', ' + addressFields.piso : ''}${addressFields.ciudad ? ', ' + addressFields.ciudad : ''}`}</p>
            </div>
        </div>
    );
}

// ─── Step 3: Barberos ─────────────────────────────────────────────────────────

function Step3({ barbers, newBarber, setNewBarber, isAddingBarber, setIsAddingBarber, handleAddBarber, handleDeleteBarber, handleCopyMondayToAll, isAutonomo, setBarbers }: any) {
    const DAY_NAMES_LOCAL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    return (
        <div className="space-y-5">
            <StepTitle icon={Scissors} title="Tu equipo" subtitle="Añade los barberos y su horario semanal" />

            {!isAddingBarber ? (
                <button
                    type="button"
                    onClick={() => setIsAddingBarber(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-zinc-700 text-amber-500 font-bold text-sm hover:bg-zinc-800/50 transition-all"
                >
                    <Plus className="w-4 h-4" /> Añadir Barbero
                </button>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-800/40 rounded-2xl border border-zinc-700/50 p-4 space-y-4"
                >
                    <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold text-white">Nuevo Barbero</h4>
                        <button type="button" onClick={() => setIsAddingBarber(false)} className="text-zinc-500 hover:text-white">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    <input
                        type="text"
                        placeholder="Nombre del barbero"
                        value={newBarber.nombre}
                        onChange={(e: any) => setNewBarber({ ...newBarber, nombre: e.target.value })}
                        className={inputCls}
                    />

                    {isAutonomo && (
                        <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                            <span className="text-xs font-bold text-white uppercase italic">¿Es el dueño/jefe?</span>
                            <Toggle
                                checked={newBarber['jefe/dueño']}
                                onChange={(v: boolean) => setNewBarber((p: any) => ({ ...p, 'jefe/dueño': v }))}
                            />
                        </div>
                    )}

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-zinc-400">Horario Semanal</label>
                            <button type="button" onClick={handleCopyMondayToAll} className="text-xs text-amber-500 hover:text-amber-400">
                                📋 Copiar Lunes a Todos
                            </button>
                        </div>

                        {DAY_NAMES_LOCAL.map((dayName, dayIdx) => (
                            <div key={dayIdx} className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-sm text-white">{dayName}</span>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={newBarber.horario_semanal[dayIdx].activo}
                                            onChange={(e: any) => {
                                                const updated = [...newBarber.horario_semanal];
                                                updated[dayIdx].activo = e.target.checked;
                                                if (e.target.checked && updated[dayIdx].turnos.length === 0) {
                                                    updated[dayIdx].turnos = [{ inicio: '09:00', fin: '20:00' }];
                                                }
                                                setNewBarber({ ...newBarber, horario_semanal: updated });
                                            }}
                                            className="w-4 h-4 rounded border-zinc-700 text-amber-500"
                                        />
                                        <span className="text-xs text-zinc-400">Activo</span>
                                    </label>
                                </div>

                                {newBarber.horario_semanal[dayIdx].activo && (
                                    <div className="space-y-2">
                                        {newBarber.horario_semanal[dayIdx].turnos.map((turno: any, tIdx: number) => (
                                            <div key={tIdx} className="grid grid-cols-2 gap-2">
                                                <input type="time" value={turno.inicio}
                                                    onChange={(e: any) => {
                                                        const u = [...newBarber.horario_semanal];
                                                        u[dayIdx].turnos[tIdx].inicio = e.target.value;
                                                        setNewBarber({ ...newBarber, horario_semanal: u });
                                                    }}
                                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white" />
                                                <div className="flex gap-1">
                                                    <input type="time" value={turno.fin}
                                                        onChange={(e: any) => {
                                                            const u = [...newBarber.horario_semanal];
                                                            u[dayIdx].turnos[tIdx].fin = e.target.value;
                                                            setNewBarber({ ...newBarber, horario_semanal: u });
                                                        }}
                                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white" />
                                                    {newBarber.horario_semanal[dayIdx].turnos.length > 1 && (
                                                        <button type="button"
                                                            onClick={() => {
                                                                const u = [...newBarber.horario_semanal];
                                                                u[dayIdx].turnos.splice(tIdx, 1);
                                                                setNewBarber({ ...newBarber, horario_semanal: u });
                                                            }}
                                                            className="px-2 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400">×</button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {newBarber.horario_semanal[dayIdx].turnos.length < 2 && (
                                            <button type="button"
                                                onClick={() => {
                                                    const u = [...newBarber.horario_semanal];
                                                    u[dayIdx].turnos.push({ inicio: '14:00', fin: '16:00' });
                                                    setNewBarber({ ...newBarber, horario_semanal: u });
                                                }}
                                                className="text-xs text-amber-500 hover:text-amber-400">+ Añadir turno</button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <button type="button" onClick={handleAddBarber}
                        className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-amber-500 font-bold py-2.5 rounded-xl border border-zinc-700 transition-all">
                        <Plus className="w-4 h-4" /> Confirmar Barbero
                    </button>
                </motion.div>
            )}

            {barbers.length > 0 && (
                <div className="space-y-2">
                    {barbers.map((b: Barber, i: number) => (
                        <div key={b.id || i} className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-sm">{b.nombre}</span>
                                    {b['jefe/dueño'] && <span className="text-[8px] font-black bg-amber-500 text-black px-1.5 py-0.5 rounded-full uppercase">Dueño</span>}
                                </div>
                                <div className="text-xs text-zinc-500 mt-0.5">
                                    {b.horario_semanal.filter(d => d.activo).map(d => ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d.dia]).join(', ')}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {isAutonomo && (
                                    <Toggle
                                        checked={!!b['jefe/dueño']}
                                        onChange={(v: boolean) => {
                                            let updated = [...barbers];
                                            if (v) updated = updated.map(x => ({ ...x, 'jefe/dueño': false }));
                                            updated[i] = { ...updated[i], 'jefe/dueño': v };
                                            setBarbers(updated);
                                        }}
                                    />
                                )}
                                <button type="button" onClick={() => handleDeleteBarber(i)} className="text-zinc-500 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {barbers.length === 0 && !isAddingBarber && (
                <p className="text-center text-zinc-600 text-sm py-4 italic">No hay barberos añadidos aún.</p>
            )}
        </div>
    );
}

// ─── Step 4: Horario barbería ─────────────────────────────────────────────────

function Step4({ shopSchedule, isDayOpen, toggleDay, onEditDay }: any) {
    const ORDERED = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2 mb-4">
                <StepTitle icon={Clock} title="Horario de apertura" subtitle="¿Cuándo pueden reservar tus clientes?" />
            </div>

            <div className="divide-y divide-zinc-800 border-y border-zinc-800">
                {ORDERED.map(dayKey => {
                    const isOpen = isDayOpen(dayKey);
                    const ranges = shopSchedule[dayKey] || [];

                    return (
                        <div key={dayKey} className="flex items-center justify-between py-4 group">
                            <div className="flex items-center gap-4">
                                <Toggle
                                    checked={isOpen}
                                    onChange={() => toggleDay(dayKey)}
                                />
                                <span className={cn(
                                    "font-bold text-sm capitalize transition-colors",
                                    isOpen ? "text-white" : "text-zinc-600"
                                )}>
                                    {dayKey}
                                </span>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    {isOpen ? (
                                        <div className="space-y-0.5">
                                            {ranges.map((r: any, i: number) => (
                                                <div key={i} className="text-xs font-bold text-amber-500/80">
                                                    {r.desde} - {r.hasta}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-xs font-bold text-zinc-600 uppercase italic">Cerrado</span>
                                    )}
                                </div>

                                {isOpen && (
                                    <button
                                        type="button"
                                        onClick={() => onEditDay(dayKey)}
                                        className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function HoursModal({ dayKey, ranges, onClose, onUpdate }: any) {
    const localRanges = [...ranges];

    const handleUpdate = (idx: number, field: string, value: string) => {
        const newRanges = [...localRanges];
        newRanges[idx] = { ...newRanges[idx], [field]: value };
        onUpdate(newRanges);
    };

    const handleAdd = () => {
        onUpdate([...localRanges, { desde: '16:00', hasta: '20:00' }]);
    };

    const handleRemove = (idx: number) => {
        const newRanges = localRanges.filter((_, i) => i !== idx);
        onUpdate(newRanges);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[32px] p-6 shadow-2xl"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">
                        Editar <span className="text-amber-500">{dayKey}</span>
                    </h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white p-2">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4 mb-6">
                    {localRanges.map((range, idx) => (
                        <div key={idx} className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Turno {idx + 1}</span>
                                {localRanges.length > 1 && (
                                    <button onClick={() => handleRemove(idx)} className="text-red-500/60 hover:text-red-500 text-xs font-bold uppercase">
                                        Eliminar
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase ml-1">Inicio</label>
                                    <input
                                        type="time"
                                        value={range.desde}
                                        onChange={(e) => handleUpdate(idx, 'desde', e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase ml-1">Fin</label>
                                    <input
                                        type="time"
                                        value={range.hasta}
                                        onChange={(e) => handleUpdate(idx, 'fin', e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {localRanges.length < 2 && (
                    <button
                        onClick={handleAdd}
                        className="w-full py-3 mb-6 rounded-xl border border-dashed border-zinc-700 text-zinc-500 text-xs font-bold uppercase hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Añadir otro turno
                    </button>
                )}

                <button
                    onClick={onClose}
                    className="w-full py-4 rounded-2xl bg-amber-500 text-black font-black uppercase italic tracking-wider hover:bg-amber-400 transition-all"
                >
                    Listo
                </button>
            </motion.div>
        </div>
    );
}

// ─── Step 5: Servicios ────────────────────────────────────────────────────────

function Step5({ servicesList, newService, setNewService, handleAddService, handleDeleteService }: any) {
    return (
        <div className="space-y-5">
            <StepTitle icon={Scissors} title="Servicios ofrecidos" subtitle="Añade los servicios que ofrece tu barbería" />

            <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold">Nombre del servicio</span>
                        <input type="text" placeholder="Ej: Corte Clásico"
                            value={newService.nombre}
                            onChange={(e: any) => setNewService({ ...newService, nombre: e.target.value })}
                            className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold">Precio (€)</span>
                            <input type="number" min="0" step="0.5" placeholder="15"
                                value={newService.precio || ''}
                                onChange={(e: any) => setNewService({ ...newService, precio: parseFloat(e.target.value) })}
                                className={inputCls} />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold">Duración (min)</span>
                            <input type="number" min="5" step="5" placeholder="30"
                                value={newService.duracion}
                                onChange={(e: any) => setNewService({ ...newService, duracion: parseInt(e.target.value) })}
                                className={inputCls} />
                        </div>
                    </div>
                </div>
                <button type="button" onClick={handleAddService}
                    className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-black py-2.5 rounded-xl text-sm transition-all">
                    <Plus className="w-4 h-4" /> Añadir Servicio
                </button>
            </div>

            <div className="space-y-2">
                {servicesList.length === 0 && (
                    <p className="text-center text-zinc-600 text-sm py-2 italic">No hay servicios añadidos aún.</p>
                )}
                {servicesList.map((s: Service, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
                        <div className="flex items-center gap-4">
                            <span className="font-medium text-sm text-white">{s.nombre}</span>
                            <span className="text-xs text-zinc-500">{s.duracion} min</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-amber-500">{s.precio}€</span>
                            <button type="button" onClick={() => handleDeleteService(i)} className="text-zinc-500 hover:text-red-500 transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Step 6: Metas + Autónomo ─────────────────────────────────────────────────

function Step6({ formData, handleChange, setFormData }: any) {
    return (
        <div className="space-y-5">
            <StepTitle icon={Target} title="Metas mensuales" subtitle="Define tus objetivos para hacer un mejor seguimiento" />

            <div className="grid grid-cols-1 gap-4">
                <Field label="Objetivo de ingresos (€)" icon={DollarSign}>
                    <input type="number" name="objetivo_ingresos" min="0" step="any" placeholder="Ej: 3000"
                        value={formData.objetivo_ingresos} onChange={handleChange} className={inputCls} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Meta cortes" icon={Scissors}>
                        <input type="number" name="objetivo_cortes" min="0" placeholder="Ej: 150"
                            value={formData.objetivo_cortes} onChange={handleChange} className={inputCls} />
                    </Field>
                    <Field label="Meta productos" icon={Target}>
                        <input type="number" name="objetivo_productos" min="0" placeholder="Ej: 40"
                            value={formData.objetivo_productos} onChange={handleChange} className={inputCls} />
                    </Field>
                </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/15 p-4 md:p-5 rounded-2xl flex items-center justify-between gap-4 hover:bg-amber-500/10 transition-all">
                <div className="space-y-1">
                    <h3 className="text-sm font-black uppercase italic text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-amber-500" />
                        ¿Eres un barbero autónomo?
                    </h3>
                    <p className="text-[10px] md:text-xs text-zinc-500 font-medium">Marca esta opción si trabajas solo y no tienes empleados a tu cargo.</p>
                </div>
                <Toggle
                    checked={formData.Autonomo}
                    onChange={(v: boolean) => setFormData((p: any) => ({ ...p, Autonomo: v }))}
                />
            </div>
        </div>
    );
}

// ─── Shared UI components ─────────────────────────────────────────────────────

function StepTitle({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
    return (
        <div className="space-y-1 mb-1">
            <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-amber-500" />
                <h2 className="text-base font-black uppercase tracking-tight text-white">{title}</h2>
            </div>
            <p className="text-xs text-zinc-500 ml-6">{subtitle}</p>
        </div>
    );
}

function Field({ label, icon: Icon, children }: { label: string; icon: any; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-zinc-500 uppercase ml-1">
                <Icon className="w-3 h-3 text-amber-500" />
                {label}
            </label>
            {children}
        </div>
    );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
            <div className="w-14 h-7 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-zinc-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-white shadow-lg" />
        </label>
    );
}

const inputCls = "w-full p-3.5 rounded-xl bg-zinc-800/40 border border-zinc-700/50 text-sm text-white outline-none focus:border-amber-500 transition-all placeholder:text-zinc-600 shadow-inner";
