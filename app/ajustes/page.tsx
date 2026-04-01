"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    ArrowLeft, Save, Loader2, User, MapPin, Sparkles,
    Target, Phone, DollarSign, Building2, Plus, Trash2,
    Info, CreditCard
} from 'lucide-react';
import { AvatarUpload } from '@/components/AvatarUpload';
import { getProxiedUrl } from '@/utils/url-helper';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Service {
    id?: string;
    barberia_id?: string;
    nombre: string;
    precio: number;
    duracion: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const inputCls = "w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm outline-none focus:border-amber-500 transition-all placeholder:text-zinc-600";
const textareaCls = "w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm outline-none focus:border-amber-500 transition-all placeholder:text-zinc-600 resize-none";
const labelCls = "block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5";

function SectionCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-zinc-800/60">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Icon className="w-5 h-5 text-amber-500" />
                </div>
                <h2 className="text-base font-bold text-white">{title}</h2>
            </div>
            {children}
        </div>
    );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AjustesPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userId, setUserId] = useState('');

    // Basic info
    const [formData, setFormData] = useState({
        nombre_barberia: '',
        telefono: '',
        pagos: '',
        info: '',
        nombre_encargado: '',
        objetivo_ingresos: '',
        objetivo_cortes: '',
        objetivo_productos: '',
        Autonomo: false,
        instagram: '@',
        tiktok: '@',
    });

    // Address
    const [direccion, setDireccion] = useState('');

    // Logo
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    // Services
    const [servicesList, setServicesList] = useState<Service[]>([]);
    const [deletedServiceIds, setDeletedServiceIds] = useState<string[]>([]);
    const [newService, setNewService] = useState<Service>({ nombre: '', precio: 0, duracion: 30 });
    const [addingService, setAddingService] = useState(false);

    // ─── Load ───────────────────────────────────────────────────────────────

    useEffect(() => {
        const load = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push('/'); return; }
            const uid = session.user.id;
            setUserId(uid);

            const { data: profile } = await supabase.from('perfiles').select('*').eq('id', uid).single();
            if (profile) {
                setFormData({
                    nombre_barberia: profile.nombre_barberia || '',
                    telefono: profile.telefono || '',
                    pagos: profile.pagos || '',
                    info: profile.info || '',
                    nombre_encargado: profile.nombre_encargado || '',
                    objetivo_ingresos: String(profile.objetivo_ingresos || ''),
                    objetivo_cortes: String(profile.objetivo_cortes || ''),
                    objetivo_productos: String(profile.objetivo_productos || ''),
                    Autonomo: !!profile.Autonomo,
                    instagram: profile.instagram || '@',
                    tiktok: profile.tiktok || '@',
                });
                setDireccion(profile.Direccion || '');
                setCurrentAvatarUrl(getProxiedUrl(profile.logo_url) || null);
            }

            const { data: services } = await supabase.from('servicios').select('*').eq('barberia_id', uid).order('precio');
            if (services) setServicesList(services);

            setLoading(false);
        };
        load();
    }, [router]);

    // ─── Logo upload ─────────────────────────────────────────────────────────

    const handleUploadLogo = async (): Promise<string | null> => {
        if (!avatarFile || !userId) return currentAvatarUrl;
        setUploadingLogo(true);
        try {
            const ext = avatarFile.name.split('.').pop();
            const fileName = `${userId}/${Date.now()}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from('logos_barberias').upload(fileName, avatarFile, { upsert: true });
            if (uploadError) throw uploadError;
            return `/i/logos_barberias/${fileName}`;
        } catch (e: any) {
            toast.error('Error al subir logo: ' + e.message);
            return currentAvatarUrl;
        } finally {
            setUploadingLogo(false);
        }
    };

    // ─── Save ────────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!userId) return;
        setSaving(true);
        try {
            const finalLogoUrl = await handleUploadLogo();

            // Update profile
            const { error: profileError } = await supabase.from('perfiles').update({
                nombre_barberia: formData.nombre_barberia,
                telefono: formData.telefono,
                pagos: formData.pagos,
                info: formData.info,
                nombre_encargado: formData.nombre_encargado,
                objetivo_ingresos: parseFloat(formData.objetivo_ingresos) || 0,
                objetivo_cortes: parseInt(formData.objetivo_cortes) || 0,
                objetivo_productos: parseInt(formData.objetivo_productos) || 0,
                Autonomo: formData.Autonomo,
                Direccion: direccion,
                instagram: formData.instagram && formData.instagram !== '@' ? formData.instagram : null,
                tiktok: formData.tiktok && formData.tiktok !== '@' ? formData.tiktok : null,
                ...(finalLogoUrl ? { logo_url: finalLogoUrl } : {}),
            }).eq('id', userId);
            if (profileError) throw profileError;

            // Delete removed services
            if (deletedServiceIds.length > 0) {
                const { error } = await supabase.from('servicios').delete().in('id', deletedServiceIds);
                if (error) throw error;
            }

            // Upsert services
            for (const s of servicesList) {
                const payload: any = { barberia_id: userId, nombre: s.nombre, precio: s.precio, duracion: s.duracion };
                if (s.id) payload.id = s.id;
                const { error } = await supabase.from('servicios').upsert(payload);
                if (error) throw error;
            }

            if (avatarFile && finalLogoUrl) setCurrentAvatarUrl(finalLogoUrl);
            setAvatarFile(null);
            setDeletedServiceIds([]);
            toast.success('¡Ajustes guardados correctamente!');
            setTimeout(() => {
                router.push('/perfil');
            }, 1000);
        } catch (err: any) {
            toast.error('Error al guardar: ' + (err.message || 'Error desconocido'));
        } finally {
            setSaving(false);
        }
    };

    // ─── Service helpers ─────────────────────────────────────────────────────

    const handleAddService = () => {
        if (!newService.nombre || newService.precio <= 0) {
            toast.error('Nombre y precio son obligatorios'); return;
        }
        setServicesList(p => [...p, { ...newService }]);
        setNewService({ nombre: '', precio: 0, duracion: 30 });
        setAddingService(false);
    };

    const handleDeleteService = (i: number) => {
        const s = servicesList[i];
        if (s.id) setDeletedServiceIds(p => [...p, s.id!]);
        setServicesList(p => p.filter((_, idx) => idx !== i));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(p => ({ ...p, [name]: value }));
    };

    // ─── Loading ─────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
        );
    }

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-zinc-800/60">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link
                        href="/perfil"
                        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-bold shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Volver</span>
                    </Link>
                    <h1 className="text-sm font-black uppercase tracking-widest text-white flex-1 text-center pr-8 sm:pr-20">
                        Ajustes de la <span className="text-amber-500">Barbería</span>
                    </h1>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

                {/* ── Información básica ── */}
                <SectionCard title="Información básica" icon={User}>
                    {/* Logo */}
                    <div className="flex items-start gap-6">
                        <div className="hidden sm:flex flex-col items-center gap-2 shrink-0">
                            <AvatarUpload
                                currentImageUrl={currentAvatarUrl}
                                onFileSelect={setAvatarFile}
                                loading={uploadingLogo}
                            />
                            {avatarFile && (
                                <span className="text-[10px] font-bold text-amber-500 uppercase">Pendiente de guardar</span>
                            )}
                        </div>
                        <div className="flex-1 space-y-4">
                            <div>
                                <label className={labelCls}>Tu nombre</label>
                                <input
                                    type="text"
                                    name="nombre_encargado"
                                    placeholder="Ej: Juan Pérez"
                                    value={formData.nombre_encargado}
                                    onChange={handleChange}
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Nombre de la barbería</label>
                                <input
                                    type="text"
                                    name="nombre_barberia"
                                    placeholder="Ej: Barber King"
                                    value={formData.nombre_barberia}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]/g, '');
                                        setFormData(p => ({ ...p, nombre_barberia: val }));
                                    }}
                                    className={inputCls}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Instagram (opcional)</label>
                            <input
                                type="text"
                                name="instagram"
                                placeholder="@miperfil"
                                value={formData.instagram}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const clean = val.startsWith('@') ? val : '@' + val.replace(/^@+/, '');
                                    setFormData(p => ({ ...p, instagram: clean }));
                                }}
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>TikTok (opcional)</label>
                            <input
                                type="text"
                                name="tiktok"
                                placeholder="@miperfil"
                                value={formData.tiktok}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const clean = val.startsWith('@') ? val : '@' + val.replace(/^@+/, '');
                                    setFormData(p => ({ ...p, tiktok: clean }));
                                }}
                                className={inputCls}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}><Phone className="inline w-3 h-3 mr-1" />Teléfono</label>
                            <input
                                type="tel"
                                name="telefono"
                                placeholder="Ej: 600 000 000"
                                value={formData.telefono}
                                onChange={handleChange}
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}><CreditCard className="inline w-3 h-3 mr-1" />Métodos de pago</label>
                            <input
                                type="text"
                                name="pagos"
                                placeholder="Ej: Efectivo, Tarjeta"
                                value={formData.pagos}
                                onChange={handleChange}
                                className={inputCls}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelCls}><Info className="inline w-3 h-3 mr-1" />Descripción / Info</label>
                        <textarea
                            name="info"
                            rows={3}
                            placeholder="Describe tu barbería, especialidades..."
                            value={formData.info}
                            onChange={handleChange}
                            className={textareaCls}
                        />
                    </div>
                </SectionCard>

                {/* ── Dirección ── */}
                <SectionCard title="Dirección" icon={MapPin}>
                    <div>
                        <label className={labelCls}>Dirección completa</label>
                        <input
                            type="text"
                            placeholder="Ej: Calle Gran Vía, 1, 2B, Madrid"
                            value={direccion}
                            onChange={(e) => setDireccion(e.target.value)}
                            className={inputCls}
                        />
                        <p className="text-[11px] text-zinc-600 mt-2">Esta dirección se muestra a tus clientes al agendar una cita.</p>
                    </div>
                </SectionCard>

                {/* ── Servicios ── */}
                <SectionCard title="Servicios" icon={Sparkles}>
                    <div className="space-y-2">
                        {servicesList.length === 0 && !addingService && (
                            <p className="text-zinc-600 text-sm text-center py-4 italic">No hay servicios. Añade el primero.</p>
                        )}
                        {servicesList.map((s, i) => (
                            <div key={i} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 group">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <span className="font-semibold text-white text-sm truncate">{s.nombre}</span>
                                    <span className="text-xs text-zinc-500 shrink-0">{s.duracion} min</span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="font-black text-amber-500 text-sm">{s.precio}€</span>
                                    <button
                                        onClick={() => handleDeleteService(i)}
                                        className="text-zinc-600 hover:text-red-500 transition-colors p-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {addingService ? (
                            <div className="bg-zinc-950 border border-amber-500/30 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
                                <div>
                                    <label className={labelCls}>Nombre del servicio</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Corte Clásico"
                                        value={newService.nombre}
                                        onChange={(e) => setNewService(p => ({ ...p, nombre: e.target.value }))}
                                        className={inputCls}
                                        autoFocus
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelCls}>Precio (€)</label>
                                        <input
                                            type="number" min="0" step="0.5"
                                            placeholder="15"
                                            value={newService.precio || ''}
                                            onChange={(e) => setNewService(p => ({ ...p, precio: parseFloat(e.target.value) }))}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Duración (min)</label>
                                        <input
                                            type="number" min="5" step="5"
                                            value={newService.duracion}
                                            onChange={(e) => setNewService(p => ({ ...p, duracion: parseInt(e.target.value) }))}
                                            className={inputCls}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={handleAddService}
                                        className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase rounded-xl transition-all"
                                    >
                                        Añadir Servicio
                                    </button>
                                    <button
                                        onClick={() => { setAddingService(false); setNewService({ nombre: '', precio: 0, duracion: 30 }); }}
                                        className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold text-xs rounded-xl transition-all"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setAddingService(true)}
                                className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-zinc-700 hover:border-amber-500/40 text-zinc-500 hover:text-amber-500 text-xs font-bold uppercase rounded-xl transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                Añadir Servicio
                            </button>
                        )}
                    </div>
                </SectionCard>

                {/* ── Metas y configuración ── */}
                <SectionCard title="Metas mensuales" icon={Target}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className={labelCls}><DollarSign className="inline w-3 h-3 mr-1" />Objetivo ingresos (€)</label>
                            <input
                                type="number" min="0"
                                name="objetivo_ingresos"
                                placeholder="Ej: 3000"
                                value={formData.objetivo_ingresos}
                                onChange={handleChange}
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Meta cortes</label>
                            <input
                                type="number" min="0"
                                name="objetivo_cortes"
                                placeholder="Ej: 150"
                                value={formData.objetivo_cortes}
                                onChange={handleChange}
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Meta productos</label>
                            <input
                                type="number" min="0"
                                name="objetivo_productos"
                                placeholder="Ej: 40"
                                value={formData.objetivo_productos}
                                onChange={handleChange}
                                className={inputCls}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl hover:bg-amber-500/10 transition-all">
                        <div>
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <User className="w-4 h-4 text-amber-500" />
                                ¿Eres un barbero autónomo?
                            </h3>
                            <p className="text-xs text-zinc-500 mt-0.5">Actívalo si trabajas solo y quieres que tu perfil aparezca como barbero principal.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                            <input
                                type="checkbox"
                                checked={formData.Autonomo}
                                onChange={(e) => setFormData(p => ({ ...p, Autonomo: e.target.checked }))}
                                className="sr-only peer"
                            />
                            <div className="w-14 h-7 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-zinc-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-white peer-checked:after:border-white shadow-lg" />
                        </label>
                    </div>
                </SectionCard>

                {/* ── Save button (bottom) ── */}
                <div className="flex justify-center pb-8">
                    <button
                        onClick={handleSubmit}
                        disabled={saving || uploadingLogo}
                        className="flex items-center gap-2 px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-sm uppercase tracking-wide rounded-2xl transition-all shadow-[0_8px_24px_-8px_rgba(245,158,11,0.5)] hover:shadow-[0_12px_32px_-8px_rgba(245,158,11,0.6)] disabled:opacity-60 disabled:cursor-wait"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Guardar Cambios
                    </button>
                </div>

            </div>
        </div>
    );
}
