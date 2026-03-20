'use client';

import React from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { toast } from 'sonner';
import { ChartSkeleton } from '@/components/ui/SkeletonLoader';
import useSWR from 'swr';

interface CadenaStatsChartProps {
    barberiasIds: string[];
    selectedDate: string; // YYYY-MM-DD
}

interface BarberiaStats {
    id: string;
    nombre: string;
    ingresosAgrupados: number; // For the month
    cortesAgrupados: number; // For the month
    objetivoIngresos: number; // Assuming monthly: ingresos_dia * 26
    objetivoCortes: number; // Assuming monthly: cortes_dia * 26
}

export default function CadenaStatsChart({ barberiasIds, selectedDate }: CadenaStatsChartProps) {
    const { 
        data: stats = [], 
        isLoading 
    } = useSWR(
        barberiasIds?.length > 0 ? ['cadena-stats', barberiasIds, selectedDate.substring(0, 7)] : null,
        async () => {
            const refDate = new Date(selectedDate);
            const year = refDate.getFullYear();
            const month = refDate.getMonth();
            const startOfMonth = new Date(year, month, 1).toISOString().split('T')[0];
            const endOfMonthStr = new Date(year, month + 1, 0).toISOString().split('T')[0];

            const [profilesRes, appointmentsRes, salesRes] = await Promise.all([
                supabase.from('perfiles').select('id, nombre_barberia, ingresos_dia, cortes_dia').in('id', barberiasIds),
                supabase.from('citas').select('barberia_id, Precio, confirmada').in('barberia_id', barberiasIds).gte('Dia', startOfMonth).lte('Dia', endOfMonthStr).eq('confirmada', true),
                supabase.from('ventas_productos').select('barberia_id, precio').in('barberia_id', barberiasIds).gte('created_at', `${startOfMonth} 00:00:00`).lte('created_at', `${endOfMonthStr} 23:59:59`)
            ]);

            if (profilesRes.error) throw profilesRes.error;
            if (appointmentsRes.error) throw appointmentsRes.error;
            if (salesRes.error) throw salesRes.error;

            const statsMap: Record<string, BarberiaStats> = {};
            profilesRes.data?.forEach(p => {
                statsMap[p.id] = {
                    id: p.id,
                    nombre: p.nombre_barberia || 'Barbería',
                    ingresosAgrupados: 0,
                    cortesAgrupados: 0,
                    objetivoIngresos: (Number(p.ingresos_dia) || 0) * 26,
                    objetivoCortes: (Number(p.cortes_dia) || 0) * 26
                };
            });

            appointmentsRes.data?.forEach(cita => {
                if (statsMap[cita.barberia_id]) {
                    statsMap[cita.barberia_id].ingresosAgrupados += (Number(cita.Precio) || 0);
                    statsMap[cita.barberia_id].cortesAgrupados += 1;
                }
            });

            salesRes.data?.forEach(venta => {
                if (statsMap[venta.barberia_id]) {
                    statsMap[venta.barberia_id].ingresosAgrupados += (Number(venta.precio) || 0);
                }
            });

            return Object.values(statsMap);
        },
        {
            revalidateOnFocus: true,
            onError: (err) => {
                console.error("Error fetching cadena stats:", err);
                toast.error("Error al cargar estadísticas de la cadena");
            }
        }
    );

    if (isLoading) return <ChartSkeleton />;
    if (!barberiasIds || barberiasIds.length === 0) return null;

    const CustomTooltip = ({ active, payload, label, suffix = '' }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-xl shadow-2xl">
                    <p className="font-bold text-white mb-2">{label}</p>
                    {payload.map((entry: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between gap-4 text-xs mt-1">
                            <span style={{ color: entry.color }} className="font-bold">
                                {entry.name}:
                            </span>
                            <span className="text-white font-mono">
                                {entry.value}{suffix}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Chart 1: Revenue */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-[2rem] shadow-xl">
                <div className="mb-6">
                    <h3 className="text-xl font-black italic tracking-tighter uppercase text-white leading-none">
                        Rendimiento de <span className="text-amber-500">Ingresos</span>
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2 block">
                        Ingresos mensuales vs Objetivos
                    </p>
                </div>
                
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }} barSize={24} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#27272a" />
                            <XAxis type="number" stroke="#71717a" fontSize={10} tickFormatter={(val) => `${val}€`} />
                            <YAxis dataKey="nombre" type="category" stroke="#a1a1aa" fontSize={11} width={100} />
                            <Tooltip content={<CustomTooltip suffix="€" />} cursor={{ fill: '#27272a', opacity: 0.4 }} />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} iconType="circle" />
                            <Bar dataKey="ingresosAgrupados" name="Real" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="objetivoIngresos" name="Objetivo" fill="#27272a" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Chart 2: Cuts */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-[2rem] shadow-xl">
                <div className="mb-6">
                    <h3 className="text-xl font-black italic tracking-tighter uppercase text-white leading-none">
                        Rendimiento de <span className="text-blue-400">Cortes</span>
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2 block">
                        Cortes mensuales vs Objetivos
                    </p>
                </div>
                
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }} barSize={24} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#27272a" />
                            <XAxis type="number" stroke="#71717a" fontSize={10} />
                            <YAxis dataKey="nombre" type="category" stroke="#a1a1aa" fontSize={11} width={100} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#27272a', opacity: 0.4 }} />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} iconType="circle" />
                            <Bar dataKey="cortesAgrupados" name="Real" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="objetivoCortes" name="Objetivo" fill="#27272a" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

