"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Plus, Trash2, Calendar, Save, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { TimePicker24h } from '@/components/ui/TimePicker24h';
import { cn } from '@/lib/utils';

interface BarberDaySchedule {
    dia: number;
    activo: boolean;
    turnos: { inicio: string, fin: string }[];
}

interface Barber {
    id: string;
    nombre: string;
    horario_semanal: BarberDaySchedule[];
    salario_base?: number | null;
    porcentaje_comision?: number | null;
    'jefe/dueño'?: boolean;
}

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const getDefaultBarberSchedule = (): BarberDaySchedule[] => {
    return Array.from({ length: 7 }, (_, index) => ({
        dia: index,
        activo: index >= 1 && index <= 5,
        turnos: index >= 1 && index <= 5 ? [{ inicio: '09:00', fin: '20:00' }] : []
    }));
};

interface BarberManagerProps {
    perfilId: string;
}

// ─── Modal de Edición de Barbero ────────────────────────────────────────────

interface BarberModalProps {
    barber: Barber;
    allBarbers: Barber[];
    saving: boolean;
    onClose: () => void;
    onSave: (barberId: string) => void;
    onUpdateDay: (e: React.MouseEvent | null, barberId: string, dayIndex: number, field: string, value: any) => void;
    onUpdateField: (barberId: string, field: 'salario_base' | 'porcentaje_comision' | 'jefe/dueño', value: any) => void;
    onUpdateTurn: (barberId: string, dayIndex: number, turnIndex: number, field: 'inicio' | 'fin', value: string) => void;
}

function BarberModal({ barber, saving, onClose, onSave, onUpdateDay, onUpdateField, onUpdateTurn }: BarberModalProps) {
    const [expandedDays, setExpandedDays] = useState<string[]>([]);

    const toggleDay = (idx: number) => {
        const key = `${idx}`;
        setExpandedDays(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    };

    const getInitials = (name: string) =>
        name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative w-full sm:max-w-lg bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90dvh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header del modal */}
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                            <span className="text-sm font-black text-amber-400">{getInitials(barber.nombre)}</span>
                        </div>
                        <div>
                            <h3 className="text-white font-black text-base leading-tight">{barber.nombre}</h3>
                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Editar barbero</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Contenido scrollable */}
                <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

                    {/* Toggle Dueño */}
                    <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80 flex items-center justify-between hover:border-amber-500/30 transition-all">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                barber['jefe/dueño'] ? "bg-amber-500/20 text-amber-500" : "bg-zinc-900 text-zinc-600"
                            )}>
                                <User className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase text-white tracking-widest leading-none">Dueño / Jefe de Barbería</h4>
                                <p className="text-[9px] text-zinc-500 font-bold mt-1 uppercase">Solo puede haber uno designado</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                            <input
                                type="checkbox"
                                checked={!!barber['jefe/dueño']}
                                onChange={(e) => onUpdateField(barber.id, 'jefe/dueño', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-zinc-500 after:border-zinc-500 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-white peer-checked:after:border-white shadow-lg" />
                        </label>
                    </div>

                    {/* Horario semanal */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Horario Semanal</span>
                        </div>
                        <div className="space-y-1.5">
                            {barber.horario_semanal.map((day, idx) => {
                                const isDayExpanded = expandedDays.includes(`${idx}`);
                                return (
                                    <div key={idx} className="bg-zinc-900/60 rounded-xl border border-zinc-800/60 overflow-hidden">
                                        <div
                                            onClick={() => day.activo && toggleDay(idx)}
                                            className={cn(
                                                "px-4 py-3 flex items-center justify-between",
                                                day.activo && "cursor-pointer hover:bg-zinc-800/40 transition-colors"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold text-white w-20">{DAY_NAMES[day.dia]}</span>
                                                <span className={cn(
                                                    "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider",
                                                    day.activo ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-800 text-zinc-500"
                                                )}>
                                                    {day.activo ? 'Activo' : 'Libre'}
                                                </span>
                                                {day.activo && !isDayExpanded && day.turnos.length > 0 && (
                                                    <span className="text-[9px] text-zinc-500">
                                                        {day.turnos.map(t => `${t.inicio}–${t.fin}`).join(' · ')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={day.activo}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => {
                                                        const val = e.target.checked;
                                                        onUpdateDay(null, barber.id, idx, 'activo', val);
                                                        if (val && day.turnos.length === 0) {
                                                            onUpdateDay(null, barber.id, idx, 'turnos', [{ inicio: '09:00', fin: '20:00' }]);
                                                        }
                                                        if (val) setExpandedDays(p => [...p, `${idx}`]);
                                                    }}
                                                    className="w-4 h-4 rounded border-zinc-700 text-amber-500 focus:ring-amber-500 accent-amber-500"
                                                />
                                                {day.activo && (isDayExpanded
                                                    ? <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
                                                    : <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                                                )}
                                            </div>
                                        </div>

                                        {day.activo && isDayExpanded && (
                                            <div className="px-4 pb-3 pt-2 border-t border-zinc-800/40 space-y-2 animate-in slide-in-from-top-1 duration-150">
                                                {day.turnos.map((turno, tIdx) => (
                                                    <div key={tIdx} className="flex items-center gap-2">
                                                        <div className="grid grid-cols-2 gap-2 flex-1">
                                                            <TimePicker24h
                                                                value={turno.inicio}
                                                                onChange={(val) => onUpdateTurn(barber.id, idx, tIdx, 'inicio', val)}
                                                            />
                                                            <TimePicker24h
                                                                value={turno.fin}
                                                                onChange={(val) => onUpdateTurn(barber.id, idx, tIdx, 'fin', val)}
                                                            />
                                                        </div>
                                                        {day.turnos.length > 1 && (
                                                            <button
                                                                onClick={() => {
                                                                    const updated = [...day.turnos];
                                                                    updated.splice(tIdx, 1);
                                                                    onUpdateDay(null, barber.id, idx, 'turnos', updated);
                                                                }}
                                                                className="text-zinc-500 hover:text-red-500 transition-colors"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                {day.turnos.length < 2 && (
                                                    <button
                                                        onClick={() => {
                                                            const updated = [...day.turnos, { inicio: '14:00', fin: '16:00' }];
                                                            onUpdateDay(null, barber.id, idx, 'turnos', updated);
                                                        }}
                                                        className="text-[9px] font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors"
                                                    >
                                                        <Plus className="w-3 h-3" /> AÑADIR TURNO
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer con botón guardar */}
                <div className="px-5 py-4 border-t border-zinc-800 shrink-0">
                    <button
                        onClick={() => onSave(barber.id)}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-sm uppercase tracking-wide rounded-xl transition-all shadow-[0_4px_16px_-4px_rgba(245,158,11,0.4)] disabled:opacity-60 disabled:cursor-wait"
                    >
                        {saving
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Save className="w-4 h-4" />
                        }
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── BarberManager ───────────────────────────────────────────────────────────

export const BarberManager: React.FC<BarberManagerProps> = ({ perfilId }) => {
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newBarberName, setNewBarberName] = useState('');
    const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
    const [barbersWithChanges, setBarbersWithChanges] = useState<string[]>([]);

    const fetchBarbers = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('barberos')
                .select('*')
                .eq('barberia_id', perfilId)
                .order('nombre', { ascending: true });

            if (error) throw error;
            setBarbers(data || []);
        } catch (error: any) {
            toast.error('Error al cargar barberos: ' + error.message);
        } finally {
            setLoading(false);
        }
    }, [perfilId]);

    useEffect(() => {
        fetchBarbers();
    }, [fetchBarbers]);

    // Sync selectedBarber with barbers state when barbers changes
    useEffect(() => {
        if (selectedBarber) {
            const updated = barbers.find(b => b.id === selectedBarber.id);
            if (updated) setSelectedBarber(updated);
        }
    }, [barbers]);

    const handleAddBarber = async () => {
        if (!newBarberName.trim()) {
            toast.error('El nombre es obligatorio');
            return;
        }

        setSaving(true);
        try {
            const { data, error } = await supabase
                .from('barberos')
                .insert({
                    nombre: newBarberName,
                    barberia_id: perfilId,
                    horario_semanal: getDefaultBarberSchedule(),
                    salario_base: 0,
                    porcentaje_comision: 0
                })
                .select()
                .single();

            if (error) throw error;

            setBarbers(prev => [...prev, data]);
            setNewBarberName('');
            setShowAddForm(false);
            toast.success('Barbero añadido');
        } catch (error: any) {
            toast.error('Error: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteBarber = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este barbero?')) return;

        try {
            const { error } = await supabase
                .from('barberos')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setBarbers(prev => prev.filter(b => b.id !== id));
            if (selectedBarber?.id === id) setSelectedBarber(null);
            toast.success('Barbero eliminado');
        } catch (error: any) {
            toast.error('Error: ' + error.message);
        }
    };

    const handleSaveBarber = async (barberId: string) => {
        const barber = barbers.find(b => b.id === barberId);
        if (!barber) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('barberos')
                .update({
                    horario_semanal: barber.horario_semanal,
                    salario_base: barber.salario_base,
                    porcentaje_comision: barber.porcentaje_comision,
                    'jefe/dueño': !!barber['jefe/dueño']
                })
                .eq('id', barberId);

            if (error) throw error;

            // Also persist other barbers that had jefe/dueño toggled off
            const others = barbersWithChanges.filter(id => id !== barberId);
            for (const otherId of others) {
                const other = barbers.find(b => b.id === otherId);
                if (!other) continue;
                await supabase.from('barberos').update({ 'jefe/dueño': !!other['jefe/dueño'] }).eq('id', otherId);
            }

            setBarbersWithChanges(prev => prev.filter(id => id !== barberId && !others.includes(id)));
            toast.success(`Cambios de ${barber.nombre} guardados`);
            setSelectedBarber(null);
        } catch (error: any) {
            toast.error(`Error al guardar a ${barber.nombre}: ` + error.message);
        } finally {
            setSaving(false);
        }
    };

    const updateBarberDay = (e: React.MouseEvent | null, barberId: string, dayIndex: number, field: string, value: any) => {
        if (e && field === 'activo') e.stopPropagation();
        setBarbers(prev => prev.map(b => {
            if (b.id !== barberId) return b;
            const updatedSchedule = [...b.horario_semanal];
            updatedSchedule[dayIndex] = { ...updatedSchedule[dayIndex], [field]: value };
            return { ...b, horario_semanal: updatedSchedule };
        }));
        if (!barbersWithChanges.includes(barberId)) {
            setBarbersWithChanges(prev => [...prev, barberId]);
        }
    };

    const updateBarberField = (barberId: string, field: 'salario_base' | 'porcentaje_comision' | 'jefe/dueño', value: any) => {
        setBarbers(prev => {
            let updated = prev.map(b => {
                if (b.id !== barberId) return b;
                return { ...b, [field]: value };
            });

            if (field === 'jefe/dueño' && value === true) {
                updated = updated.map(b => (b.id === barberId ? b : { ...b, 'jefe/dueño': false }));
                const others = updated.filter(b => b.id !== barberId && !barbersWithChanges.includes(b.id));
                setBarbersWithChanges(prevChanges => [
                    ...prevChanges,
                    barberId,
                    ...others.map(o => o.id)
                ].filter((v, i, a) => a.indexOf(v) === i));
            } else if (!barbersWithChanges.includes(barberId)) {
                setBarbersWithChanges(prevChanges => [...prevChanges, barberId]);
            }

            return updated;
        });
    };

    const updateBarberTurn = (barberId: string, dayIndex: number, turnIndex: number, field: 'inicio' | 'fin', value: string) => {
        setBarbers(prev => prev.map(b => {
            if (b.id !== barberId) return b;
            const updatedSchedule = [...b.horario_semanal];
            const updatedTurns = [...updatedSchedule[dayIndex].turnos];
            updatedTurns[turnIndex] = { ...updatedTurns[turnIndex], [field]: value };
            updatedSchedule[dayIndex] = { ...updatedSchedule[dayIndex], turnos: updatedTurns };
            return { ...b, horario_semanal: updatedSchedule };
        }));
        if (!barbersWithChanges.includes(barberId)) {
            setBarbersWithChanges(prev => [...prev, barberId]);
        }
    };

    if (loading) return (
        <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
    );

    const getInitials = (name: string) =>
        name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const activeDayNames = (barber: Barber) =>
        barber.horario_semanal
            .filter(d => d.activo)
            .map(d => ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'][d.dia]);

    return (
        <>
            <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <User className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white leading-tight">Gestión de Equipo</h2>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                                {barbers.length} {barbers.length === 1 ? 'barbero' : 'barberos'} registrados
                            </p>
                        </div>
                    </div>
                </div>

                {showAddForm && (
                    <div className="bg-zinc-900/60 p-4 rounded-xl border border-amber-500/30 space-y-3 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-500 uppercase">Nuevo Barbero</span>
                            <button onClick={() => setShowAddForm(false)} className="text-zinc-500 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="Nombre completo"
                            value={newBarberName}
                            onChange={(e) => setNewBarberName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddBarber()}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none"
                        />
                        <button
                            onClick={handleAddBarber}
                            disabled={saving}
                            className="w-full py-2.5 bg-amber-500 text-black font-bold text-sm rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirmar Registro'}
                        </button>
                    </div>
                )}

                <div className="space-y-3">
                    {barbers.length === 0 ? (
                        <div className="text-center py-8 space-y-2">
                            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
                                <User className="w-5 h-5 text-zinc-600" />
                            </div>
                            <p className="text-zinc-500 text-sm">Sin barberos registrados</p>
                            <p className="text-zinc-600 text-xs">Añade a tu equipo para gestionar sus horarios</p>
                        </div>
                    ) : (
                        barbers.map((barber) => (
                            <div
                                key={barber.id}
                                className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors"
                            >
                                <div className="p-3 sm:p-4 flex items-center justify-between">
                                    {/* Clic en el row para abrir modal */}
                                    <button
                                        className="flex items-center gap-3 min-w-0 flex-1 text-left"
                                        onClick={() => setSelectedBarber(barber)}
                                    >
                                        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                                            <span className="text-[10px] sm:text-xs font-black text-amber-400">{getInitials(barber.nombre)}</span>
                                        </div>
                                        <div className="min-w-0 flex flex-col justify-center">
                                            <div className="flex items-center gap-2 flex-nowrap overflow-hidden">
                                                <h3 className="text-white font-bold text-xs sm:text-sm truncate">{barber.nombre}</h3>
                                                {barber['jefe/dueño'] && (
                                                    <span className="text-[8px] font-black bg-amber-500 text-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-sm shrink-0">Dueño</span>
                                                )}
                                                {barbersWithChanges.includes(barber.id) && (
                                                    <span className="text-[8px] font-black bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full uppercase tracking-tighter shrink-0 hidden sm:inline-block">Sin guardar</span>
                                                )}
                                            </div>
                                            <div className="hidden sm:flex gap-1 mt-1.5 flex-wrap">
                                                {activeDayNames(barber).length > 0 ? (
                                                    activeDayNames(barber).map(d => (
                                                        <span key={d} className="text-[9px] font-bold bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded uppercase">{d}</span>
                                                    ))
                                                ) : (
                                                    <span className="text-[9px] font-bold text-zinc-600 uppercase">Sin días activos</span>
                                                )}
                                            </div>
                                        </div>
                                    </button>

                                    {/* Botón eliminar */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteBarber(barber.id); }}
                                        className="p-1.5 sm:p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors shrink-0 ml-2"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}

                    {!showAddForm && (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-zinc-700 hover:border-amber-500/40 text-zinc-500 hover:text-amber-500 text-xs font-bold uppercase rounded-xl transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Añadir Barbero
                        </button>
                    )}
                </div>
            </div>

            {/* Modal de edición */}
            {selectedBarber && (
                <BarberModal
                    barber={selectedBarber}
                    allBarbers={barbers}
                    saving={saving}
                    onClose={() => {
                        // Descartar cambios: recargar barberos desde la DB
                        setBarbersWithChanges(prev => prev.filter(id => id !== selectedBarber.id));
                        fetchBarbers();
                        setSelectedBarber(null);
                    }}
                    onSave={handleSaveBarber}
                    onUpdateDay={updateBarberDay}
                    onUpdateField={updateBarberField}
                    onUpdateTurn={updateBarberTurn}
                />
            )}
        </>
    );
};
