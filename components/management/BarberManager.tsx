"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Plus, Trash2, Calendar, Clock, Save, Loader2, ChevronDown, ChevronUp, X } from 'lucide-react';
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
}

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const getDefaultBarberSchedule = (): BarberDaySchedule[] => {
    return Array.from({ length: 7 }, (_, index) => ({
        dia: index,
        activo: index >= 1 && index <= 5,  // Lu-Vi activo
        turnos: index >= 1 && index <= 5 ? [{ inicio: '09:00', fin: '20:00' }] : []
    }));
};

interface BarberManagerProps {
    perfilId: string;
}

export const BarberManager: React.FC<BarberManagerProps> = ({ perfilId }) => {
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newBarberName, setNewBarberName] = useState('');
    const [expandedBarberId, setExpandedBarberId] = useState<string | null>(null);
    const [expandedDays, setExpandedDays] = useState<string[]>([]); // "barberId-dayIndex"
    const [barbersWithChanges, setBarbersWithChanges] = useState<string[]>([]); // track which barbers need saving

    const toggleExpandDay = (barberId: string, dayIndex: number) => {
        const key = `${barberId}-${dayIndex}`;
        setExpandedDays(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

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

    // Auto-save logic for barber schedules
    useEffect(() => {
        if (barbersWithChanges.length === 0) return;

        const timer = setTimeout(async () => {
            const barberId = barbersWithChanges[0];
            const barber = barbers.find(b => b.id === barberId);
            if (!barber) return;

            setSaving(barberId);
            try {
                const { error } = await supabase
                    .from('barberos')
                    .update({ horario_semanal: barber.horario_semanal })
                    .eq('id', barberId);

                if (error) throw error;
                setBarbersWithChanges(prev => prev.filter(id => id !== barberId));
            } catch (error: any) {
                console.error('Error auto-saving barber:', error);
                toast.error(`Error al guardar a ${barber.nombre}`);
            } finally {
                setSaving(null);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [barbers, barbersWithChanges]);

    const handleAddBarber = async () => {
        if (!newBarberName.trim()) {
            toast.error('El nombre es obligatorio');
            return;
        }

        setSaving('new');
        try {
            const { data, error } = await supabase
                .from('barberos')
                .insert({
                    nombre: newBarberName,
                    barberia_id: perfilId,
                    horario_semanal: getDefaultBarberSchedule()
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
            setSaving(null);
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
            toast.success('Barbero eliminado');
        } catch (error: any) {
            toast.error('Error: ' + error.message);
        }
    };

    // handleUpdateSchedule is now handled by auto-save useEffect

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

        if (field === 'activo' && value && !expandedDays.includes(`${barberId}-${dayIndex}`)) {
            toggleExpandDay(barberId, dayIndex);
        }
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                        <User className="w-5 h-5 text-amber-500" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">Gestion de Equipo</h2>
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
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white focus:border-amber-500 outline-none"
                    />
                    <button
                        onClick={handleAddBarber}
                        disabled={saving === 'new'}
                        className="w-full py-2 bg-amber-500 text-black font-bold text-sm rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
                    >
                        {saving === 'new' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirmar Registro'}
                    </button>
                </div>
            )}

            <div className="space-y-3">
                {barbers.length === 0 ? (
                    <p className="text-zinc-500 text-center py-4 text-sm italic">
                        No hay barberos registrados.
                    </p>
                ) : (
                    barbers.map((barber) => (
                        <div key={barber.id} className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                                        <User className="w-5 h-5 text-zinc-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-sm">{barber.nombre}</h3>
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                                            {barber.horario_semanal.filter(d => d.activo).length} días activos
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setExpandedBarberId(expandedBarberId === barber.id ? null : barber.id)}
                                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                                    >
                                        {expandedBarberId === barber.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteBarber(barber.id)}
                                        className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {expandedBarberId === barber.id && (
                                <div className="px-4 pb-4 space-y-4 border-t border-zinc-800/50 pt-4 animate-in slide-in-from-top-2 duration-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                            <Calendar className="w-3 h-3" /> Horario Individual
                                        </span>
                                        <div className="text-[10px] font-black uppercase tracking-widest">
                                            {saving === barber.id ? (
                                                <span className="text-amber-500 flex items-center gap-1">
                                                    <Loader2 className="w-3 h-3 animate-spin" /> Guardando...
                                                </span>
                                            ) : (
                                                <span className="text-emerald-500/80">✓ Sincronizado</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-1">
                                        {barber.horario_semanal.map((day, idx) => {
                                            const isDayExpanded = expandedDays.includes(`${barber.id}-${idx}`);
                                            return (
                                                <div key={idx} className="bg-zinc-950/50 rounded-lg border border-zinc-800/50 overflow-hidden">
                                                    <div
                                                        onClick={() => toggleExpandDay(barber.id, idx)}
                                                        className="p-2 flex items-center justify-between cursor-pointer hover:bg-zinc-900/50 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-bold text-white w-14">{DAY_NAMES[day.dia]}</span>
                                                            <span className={cn(
                                                                "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider",
                                                                day.activo ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-800 text-zinc-500"
                                                            )}>
                                                                {day.activo ? 'Activo' : 'Libre'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={day.activo}
                                                                onClick={(e) => e.stopPropagation()}
                                                                onChange={(e) => {
                                                                    const val = e.target.checked;
                                                                    updateBarberDay(null, barber.id, idx, 'activo', val);
                                                                    if (val && day.turnos.length === 0) {
                                                                        updateBarberDay(null, barber.id, idx, 'turnos', [{ inicio: '09:00', fin: '20:00' }]);
                                                                    }
                                                                }}
                                                                className="w-3 h-3 rounded border-zinc-700 text-amber-500 focus:ring-amber-500"
                                                            />
                                                            {day.activo && (isDayExpanded ? <ChevronUp className="w-3 h-3 text-zinc-500" /> : <ChevronDown className="w-3 h-3 text-zinc-500" />)}
                                                        </div>
                                                    </div>

                                                    {day.activo && isDayExpanded && (
                                                        <div className="px-2 pb-2 space-y-2 pt-1 border-t border-zinc-800/20 animate-in slide-in-from-top-1 duration-200">
                                                            {day.turnos.map((turno, tIdx) => (
                                                                <div key={tIdx} className="flex items-center gap-2">
                                                                    <div className="grid grid-cols-2 gap-2 flex-1">
                                                                        <TimePicker24h
                                                                            value={turno.inicio}
                                                                            onChange={(val) => updateBarberTurn(barber.id, idx, tIdx, 'inicio', val)}
                                                                        />
                                                                        <TimePicker24h
                                                                            value={turno.fin}
                                                                            onChange={(val) => updateBarberTurn(barber.id, idx, tIdx, 'fin', val)}
                                                                        />
                                                                    </div>
                                                                    {day.turnos.length > 1 && (
                                                                        <button
                                                                            onClick={() => {
                                                                                const updatedTurns = [...day.turnos];
                                                                                updatedTurns.splice(tIdx, 1);
                                                                                updateBarberDay(null, barber.id, idx, 'turnos', updatedTurns);
                                                                            }}
                                                                            className="text-zinc-500 hover:text-red-500"
                                                                        >
                                                                            <X className="w-3 h-3" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                            {day.turnos.length < 2 && (
                                                                <button
                                                                    onClick={() => {
                                                                        const updatedTurns = [...day.turnos, { inicio: '14:00', fin: '16:00' }];
                                                                        updateBarberDay(null, barber.id, idx, 'turnos', updatedTurns);
                                                                    }}
                                                                    className="text-[9px] font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1"
                                                                >
                                                                    <Plus className="w-2.5 h-2.5" /> AÑADIR TURNO
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}

                {!showAddForm && (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold uppercase rounded-xl border border-zinc-800 border-dashed transition-all mt-2"
                    >
                        <Plus className="w-4 h-4" />
                        Añadir Nuevo Barbero
                    </button>
                )}
            </div>
        </div>
    );
};
