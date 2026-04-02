"use client";

import React, { useState } from 'react';
import { DetailedRevenueChart } from '@/components/trends/DetailedRevenueChart';
import {
  TrendingUp, Users, DollarSign, Calendar, Filter, X,
  Scissors, ShoppingBag, ArrowUpRight, Target
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTrends } from '@/hooks/useTrends';
import { useBarberStats } from '@/hooks/useBarberStats';
import { MetricType } from '@/components/trends/DetailedRevenueChart';
import BarberRankingCard from '@/components/trends/BarberRankingCard';
import useSWR, { mutate as globalMutate } from 'swr';

// ─── Inline TrendItem (sin tarjeta individual) ─────────────────────────────
interface TrendItemProps {
  label: string;
  actual: number;
  objetivo: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  barColor: string;
  unit?: string;
  subValue?: string;
  isLast?: boolean;
}

function TrendItem({ label, actual, objetivo, icon, color, bgColor, barColor, unit = '', subValue, isLast }: TrendItemProps) {
  const percentage = objetivo > 0 ? Math.min(Math.round((actual / objetivo) * 100), 100) : 0;
  const realPercentage = objetivo > 0 ? Math.round((actual / objetivo) * 100) : 0;

  return (
    <div className={`py-4 px-1 flex flex-col gap-3 ${!isLast ? 'border-b border-zinc-800/60' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl flex items-center justify-center ${bgColor} ${color}`}>
            <div className="w-4 h-4 *:w-full *:h-full">{icon}</div>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{label}</p>
            <div className="flex items-baseline gap-1.5">
              <h4 className="text-lg font-bold text-white">{actual.toLocaleString()}{unit}</h4>
              {subValue && (
                <span className="text-[10px] text-zinc-400 font-bold">({subValue})</span>
              )}
            </div>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800/60 font-bold text-[10px] ${color}`}>
          <ArrowUpRight size={11} />
          {realPercentage}%
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-[9px] font-bold uppercase tracking-tighter">
          <span className="text-zinc-600">Progreso</span>
          <span className="text-zinc-400">Meta: {objetivo.toLocaleString()}{unit}</span>
        </div>
        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function TrendsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7));
  const [activeMetric, setActiveMetric] = React.useState<MetricType>('revenue');

  // 1. Resolver el ID de barbería (Soporte Staff)
  const { data: shopId, isLoading: idLoading } = useSWR('resolved-shop-id', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Intentar buscar en perfiles (Jefe/Admin)
    const { data: profile } = await supabase.from('perfiles').select('id').eq('id', user.id).single();
    if (profile) return profile.id;

    // Si no es admin, buscar en barberos para ver a qué barbería pertenece
    const { data: barber } = await supabase.from('barberos').select('barberia_id').eq('user_id', user.id).single();
    return barber?.barberia_id || user.id;
  });

  const { loading, chartData, metrics, previousMetrics, range, setRange } = useTrends(shopId, selectedMonth);
  const { metrics: monthlyMetrics, loading: loadingMonthly } = useTrends(shopId, selectedMonth, 'month');
  const { stats: barberStats, loading: barberLoading } = useBarberStats(selectedMonth, shopId);

  const getFormattedMonth = () => {
    if (!selectedMonth) return '';
    try {
      const [year, month] = selectedMonth.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    } catch { return selectedMonth; }
  };
  const selectedMonthText = getFormattedMonth();

  const { data: profileData, isLoading: loadingObjectives } = useSWR(shopId ? ['user-objectives', shopId] : null, async () => {
    const { data: profile } = await supabase
      .from('perfiles')
      .select('objetivo_ingresos, objetivo_cortes, objetivo_productos, Autonomo')
      .eq('id', shopId)
      .single();
    return profile;
  });

  const objectives = {
    ingresos: Number(profileData?.objetivo_ingresos) || 0,
    cortes: Number(profileData?.objetivo_cortes) || 0,
    productos: Number(profileData?.objetivo_productos) || 0,
  };

  const kpis = [
    { id: 'revenue' as MetricType,   label: 'Ingresos',    val: `${metrics.totalRevenue}€`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'clients' as MetricType,   label: 'Citas',       val: metrics.totalClients,         icon: Calendar,  color: 'text-amber-500',   bg: 'bg-amber-500/10'  },
    { id: 'avgTicket' as MetricType, label: 'Ticket Medio',val: `${metrics.avgTicket}€`,      icon: TrendingUp, color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
    { id: 'noShows' as MetricType,   label: 'No-Shows',    val: metrics.noShows,              icon: Users,     color: 'text-red-400',     bg: 'bg-red-500/10'    },
  ];

  const isLoadingSplitView = loadingMonthly || loadingObjectives || idLoading;

  return (
    <main className="flex-1 px-3 pt-4 pb-24 lg:px-10 lg:pt-8 lg:pb-10 max-w-[1600px] mx-auto w-full">

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <header className="mb-6 lg:mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-4xl font-black italic tracking-tighter uppercase mb-1">
            Analytics <span className="text-amber-500">Center</span>
          </h1>
          <p className="text-zinc-500 font-medium text-xs lg:text-sm">Centro de mando · {selectedMonthText || 'Todos los períodos'}</p>
        </div>
        <div className="relative group/filter bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2 flex items-center gap-3 hover:border-amber-500/30 transition-all shadow-xl self-start lg:self-auto">
          <Filter className="w-4 h-4 text-zinc-500 group-hover/filter:text-amber-500 transition-colors" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent border-none text-sm font-black text-amber-500 outline-none cursor-pointer focus:ring-0 appearance-none uppercase tracking-widest [&::-webkit-calendar-picker-indicator]:invert"
          />
          {selectedMonth && (
            <button onClick={() => setSelectedMonth('')} className="p-1 hover:bg-zinc-800 rounded-full transition-colors">
              <X className="w-3.5 h-3.5 text-zinc-600 hover:text-white" />
            </button>
          )}
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          ZONA HERO: KPIs + Gráfico en paralelo
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 mb-6 lg:mb-7 lg:items-stretch">

        {/* KPIs: columna lateral compacta en lg, grid 2x2 en móvil */}
        <div className="lg:col-span-3 grid grid-cols-2 lg:flex lg:flex-col gap-3">
          {kpis.map((kpi, i) => (
            <button
              key={i}
              onClick={() => setActiveMetric(kpi.id)}
              className={`w-full text-left bg-zinc-900/70 border rounded-2xl p-3 lg:p-4 flex flex-col justify-between transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] lg:flex-1 ${
                activeMetric === kpi.id
                  ? 'border-amber-500 ring-1 ring-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.08)]'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className={`inline-flex p-2 rounded-xl ${kpi.bg} ${kpi.color} mb-2 lg:mb-3`}>
                <kpi.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] lg:text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-0.5">{kpi.label}</p>
                {loading ? (
                  <div className="h-6 w-16 bg-zinc-800 rounded animate-pulse" />
                ) : (
                  <p className="text-lg lg:text-xl font-black text-white">{kpi.val}</p>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Gráfico principal: 9 columnas */}
        <div className="lg:col-span-9 lg:h-full">
          <DetailedRevenueChart
            data={chartData}
            activeMetric={activeMetric}
            loading={loading}
            range={range}
            setRange={setRange}
            metrics={metrics}
            previousMetrics={previousMetrics}
            className="lg:h-full"
          />
        </div>

      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SPLIT-VIEW: Objetivos Mensuales | Rendimiento del Equipo
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">

        {/* ── Columna Izquierda: Rendimiento del Equipo (25%) ─────────────── */}
        <div className="lg:col-span-3">
          {barberLoading ? (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 lg:p-6 space-y-4 h-full">
              <div className="h-6 w-48 bg-zinc-800 rounded animate-pulse" />
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 bg-zinc-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : barberStats.length > 1 ? (
            <BarberRankingCard
              stats={barberStats}
              loading={barberLoading}
              globalCutsGoal={objectives.cortes}
              selectedMonthText={selectedMonthText}
            />
          ) : (
            /* Estado vacío si solo hay un barbero */
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center h-full min-h-[200px] text-center gap-3">
              <Users className="w-8 h-8 text-zinc-700" />
              <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest">Rendimiento del Equipo</p>
              <p className="text-zinc-700 text-xs">Disponible con 2 o más barberos registrados</p>
            </div>
          )}
        </div>

        {/* ── Columna Derecha: Objetivos Mensuales (75%) ───────────────────── */}
        <div className="lg:col-span-9">
          <div className={`bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 lg:p-6 h-full transition-opacity duration-300 ${isLoadingSplitView ? 'opacity-50 animate-pulse pointer-events-none' : ''}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-amber-500/10 rounded-xl">
                  <Target className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-white">Objetivos Mensuales</h2>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {selectedMonthText || 'Mes actual'}
                  </p>
                </div>
              </div>
              {/* Progreso global */}
              {objectives.ingresos > 0 && (
                <div className="text-right hidden sm:block">
                  <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">Meta Global</p>
                  <p className="text-sm font-black text-amber-500">{objectives.ingresos.toLocaleString()}€</p>
                </div>
              )}
            </div>

            {/* Items de metas — sin tarjetas individuales, solo lista premium */}
            <div className="divide-y-0">
              <TrendItem
                label="Ingresos Totales"
                actual={monthlyMetrics.totalRevenue}
                objetivo={objectives.ingresos}
                unit="€"
                icon={<DollarSign />}
                color="text-emerald-400"
                bgColor="bg-emerald-500/10"
                barColor="bg-emerald-500"
              />
              <TrendItem
                label="Cortes Realizados"
                actual={monthlyMetrics.totalCuts}
                subValue={
                  monthlyMetrics.revenueCuts > 0
                    ? `${monthlyMetrics.revenueCuts.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€`
                    : undefined
                }
                objetivo={objectives.cortes}
                icon={<Scissors />}
                color="text-blue-400"
                bgColor="bg-blue-500/10"
                barColor="bg-blue-500"
              />
              <TrendItem
                label="Productos Vendidos"
                actual={monthlyMetrics.totalProducts}
                subValue={
                  monthlyMetrics.revenueProducts > 0
                    ? `${monthlyMetrics.revenueProducts.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€`
                    : undefined
                }
                objetivo={objectives.productos}
                icon={<ShoppingBag />}
                color="text-rose-400"
                bgColor="bg-rose-500/10"
                barColor="bg-rose-500"
                isLast
              />
            </div>
          </div>
        </div>

      </section>

    </main>
  );
}
