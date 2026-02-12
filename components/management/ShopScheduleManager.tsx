"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, Plus, Trash2, Save, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { TimePicker24h } from '@/components/ui/TimePicker24h';

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

const INITIAL_SCHEDULE: WeeklySchedule = {
    lunes: [],
    martes: [],
    miércoles: [],
    jueves: [],
    viernes: [],
    sábado: [],
    domingo: []
};

const ORDERED_DAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

interface ShopScheduleManagerProps {
    perfilId: string;
    initialSchedule?: WeeklySchedule;
}

export const ShopScheduleManager: React.FC<ShopScheduleManagerProps> = ({ perfilId, initialSchedule }) => {
    const [schedule, setSchedule] = useState<WeeklySchedule>(initialSchedule || INITIAL_SCHEDULE);
    const [loading, setLoading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [expandedDays, setExpandedDays] = useState<string[]>([]);

    useEffect(() => {
        if (initialSchedule) {
            setSchedule(initialSchedule);
        }
    }, [initialSchedule]);

    // Auto-save logic with debounce
    useEffect(() => {
        if (!hasChanges) return;

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const { error } = await supabase
                    .from('perfiles')
                    .update({ horario_semanal: schedule })
                    .eq('id', perfilId);

                if (error) throw error;
                setHasChanges(false);
            } catch (error: any) {
                console.error('Error auto-saving:', error);
                toast.error('Error al auto-guardar: ' + error.message);
            } finally {
                setLoading(false);
            }
        }, 1000); // 1 second debounce

        return () => clearTimeout(timer);
    }, [schedule, hasChanges, perfilId]);

    const toggleExpandDay = (dayKey: string) => {
        setExpandedDays(prev =>
            prev.includes(dayKey) ? prev.filter(d => d !== dayKey) : [...prev, dayKey]
        );
    };

    const isDayOpen = (dayKey: string) => {
        return schedule[dayKey] && schedule[dayKey].length > 0;
    };

    const toggleDay = (e: React.MouseEvent, dayKey: string) => {
        e.stopPropagation();
        setHasChanges(true);
        if (isDayOpen(dayKey)) {
            setSchedule(prev => ({ ...prev, [dayKey]: [] }));
        } else {
            setSchedule(prev => ({ ...prev, [dayKey]: [{ desde: '09:00', hasta: '20:00' }] }));
            if (!expandedDays.includes(dayKey)) {
                setExpandedDays(prev => [...prev, dayKey]);
            }
        }
    };

    const updateRange = (dayKey: string, index: number, field: 'desde' | 'hasta', value: string) => {
        setHasChanges(true);
        const updatedRanges = [...schedule[dayKey]];
        updatedRanges[index] = { ...updatedRanges[index], [field]: value };
        setSchedule(prev => ({ ...prev, [dayKey]: updatedRanges }));
    };

    const addRange = (dayKey: string) => {
        setHasChanges(true);
        setSchedule(prev => ({
            ...prev,
            [dayKey]: [...prev[dayKey], { desde: '14:00', hasta: '18:00' }]
        }));
    };

    const removeRange = (dayKey: string, index: number) => {
        setHasChanges(true);
        const updatedRanges = [...schedule[dayKey]];
        updatedRanges.splice(index, 1);
        setSchedule(prev => ({ ...prev, [dayKey]: updatedRanges }));
    };

    // handleSave is now internal via useEffect auto-save

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                        <Clock className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white leading-tight">Horario de Apertura</h2>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                            {loading ? (
                                <span className="flex items-center gap-1 text-amber-500/80">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Guardando...
                                </span>
                            ) : (
                                <span className="text-emerald-500/80">✓ Sincronizado</span>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
                {ORDERED_DAYS.map((dayKey) => {
                    const isOpen = isDayOpen(dayKey);
                    const isExpanded = expandedDays.includes(dayKey);
                    return (
                        <div key={dayKey} className="bg-zinc-900/40 rounded-xl border border-zinc-800 overflow-hidden">
                            <div
                                onClick={() => toggleExpandDay(dayKey)}
                                className="p-3 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-xs text-white capitalize w-16">{dayKey}</span>
                                    <span className={cn(
                                        "text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider",
                                        isOpen ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-800 text-zinc-500"
                                    )}>
                                        {isOpen ? 'Abierto' : 'Cerrado'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="relative inline-flex items-center cursor-pointer" onClick={(e) => toggleDay(e, dayKey)}>
                                        <div className={cn(
                                            "w-8 h-4 bg-zinc-700/50 rounded-full transition-colors relative",
                                            isOpen && "bg-amber-600"
                                        )}>
                                            <div className={cn(
                                                "absolute top-[2px] left-[2px] bg-white rounded-full h-3 w-3 transition-transform",
                                                isOpen && "translate-x-4"
                                            )} />
                                        </div>
                                    </div>
                                    {isOpen ? (isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />) : null}
                                </div>
                            </div>

                            {isOpen && isExpanded && (
                                <div className="px-3 pb-3 space-y-3 pt-1 border-t border-zinc-800/50 animate-in slide-in-from-top-2 duration-200">
                                    {schedule[dayKey]?.map((range, index) => (
                                        <div key={index} className="flex items-end gap-2">
                                            <div className="grid grid-cols-2 gap-2 flex-1">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Desde</label>
                                                    <TimePicker24h
                                                        value={range.desde}
                                                        onChange={(val) => updateRange(dayKey, index, 'desde', val)}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Hasta</label>
                                                    <TimePicker24h
                                                        value={range.hasta}
                                                        onChange={(val) => updateRange(dayKey, index, 'hasta', val)}
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeRange(dayKey, index)}
                                                className="p-1.5 text-zinc-500 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => addRange(dayKey)}
                                        className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 hover:text-amber-400 mt-2"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        AÑADIR TURNO
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
