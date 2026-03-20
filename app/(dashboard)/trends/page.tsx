"use client";

import React, { useState } from 'react';
import { DetailedRevenueChart } from '@/components/trends/DetailedRevenueChart';
import { TrendingUp, Users, DollarSign, Calendar, Calculator, Clock, Filter, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTrends } from '@/hooks/useTrends';
import { useBarberStats } from '@/hooks/useBarberStats';
import { MetricType } from '@/components/trends/DetailedRevenueChart';
import { MonthlyTrends } from '@/components/dashboard/MonthlyTrends';
import BarberRankingCard from '@/components/trends/BarberRankingCard';
import useSWR from 'swr';

export default function TrendsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7));
  const [activeMetric, setActiveMetric] = React.useState<MetricType>('revenue');

  // 1. Tendencias dinámicas para el gráfico y cards superiores
  const { loading, chartData, metrics, previousMetrics, range, setRange } = useTrends(selectedMonth);

  // 2. Tendencias fijas del mes para el pie de página (siempre 'month')
  const { metrics: monthlyMetrics, loading: loadingMonthly } = useTrends(selectedMonth, 'month');

  // 3. Estadísticas de barberos para el ranking (ya ligadas al mes seleccionado)
  const { stats: barberStats, loading: barberLoading } = useBarberStats(selectedMonth);

  const getFormattedMonth = () => {
    if (!selectedMonth) return '';
    try {
        const [year, month] = selectedMonth.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    } catch (e) {
        return selectedMonth;
    }
  };
  const selectedMonthText = getFormattedMonth();

  // --- SWR FOR OBJECTIVES ---
  const { 
    data: profileData, 
    isLoading: loadingObjectives 
  } = useSWR('user-objectives', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
      .from('perfiles')
      .select('objetivo_ingresos, objetivo_cortes, objetivo_productos, Autonomo')
      .eq('id', user.id)
      .single();
    return profile;
  });

  const objectives = {
    ingresos: Number(profileData?.objetivo_ingresos) || 0,
    cortes: Number(profileData?.objetivo_cortes) || 0,
    productos: Number(profileData?.objetivo_productos) || 0
  };
  const isAutonomo = !!profileData?.Autonomo;


  return (
    <main className="flex-1 p-2 lg:p-10 max-w-4xl lg:max-w-6xl mx-auto w-full pb-24 lg:pb-10">
      <header className="mb-8 lg:mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black italic tracking-tighter uppercase mb-2">
            Analytics <span className="text-amber-500">Center</span>
          </h1>
          <p className="text-zinc-500 font-medium text-sm lg:text-base">Análisis de rendimiento real.</p>
        </div>

        {/* GLOBAL MONTH SELECTOR */}
        <div className="flex items-center gap-3 self-start lg:self-auto">
          <div className="relative group/filter bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2 flex items-center gap-3 hover:border-amber-500/30 transition-all shadow-xl">
            <Filter className="w-4 h-4 text-zinc-500 group-hover:text-amber-500 transition-colors" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none text-sm font-black text-amber-500 outline-none cursor-pointer focus:ring-0 appearance-none uppercase tracking-widest [&::-webkit-calendar-picker-indicator]:invert"
            />
            {selectedMonth && (
              <button
                onClick={() => setSelectedMonth('')}
                className="p-1 hover:bg-zinc-800 rounded-full transition-colors"
                title="Limpiar filtro"
              >
                <X className="w-3.5 h-3.5 text-zinc-600 hover:text-white" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 lg:mb-12">
        {[
          { id: 'revenue' as MetricType, label: 'Ingresos', val: `${metrics.totalRevenue}€`, icon: DollarSign, trend: range, color: 'text-green-500' },
          { id: 'clients' as MetricType, label: 'Citas', val: metrics.totalClients, icon: Calendar, trend: range, color: 'text-amber-500' },
          { id: 'avgTicket' as MetricType, label: 'Ticket Medio', val: `${metrics.avgTicket}€`, icon: TrendingUp, trend: 'Avg', color: 'text-blue-500' },
          { id: 'noShows' as MetricType, label: 'No-Shows', val: metrics.noShows, icon: Users, trend: range, color: 'text-red-500' },
        ].map((stat, i) => (
          <div
            key={i}
            onClick={() => setActiveMetric(stat.id)}
            className={`cursor-pointer bg-zinc-900/80 border p-4 lg:p-6 rounded-2xl lg:rounded-3xl flex flex-col justify-between transition-all animate-in fade-in zoom-in duration-300 ${activeMetric === stat.id
              ? 'border-amber-500 ring-1 ring-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
              : 'border-zinc-800 hover:border-zinc-700'
              }`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex justify-between items-start mb-2 lg:mb-4">
              <div className={`p-2 lg:p-3 rounded-lg lg:rounded-xl bg-zinc-800/50 ${stat.color}`}>
                <stat.icon className="w-[18px] h-[18px] lg:w-5 lg:h-5" />
              </div>
              <span className="text-[8px] lg:text-[10px] font-bold bg-zinc-800 px-1.5 py-0.5 lg:px-2 lg:py-1 rounded lg:rounded-lg text-zinc-400 capitalize">
                {stat.trend === 'week' ? 'Semana' : stat.trend === 'month' ? 'Mes' : stat.trend === 'year' ? 'Año' : stat.trend}
              </span>
            </div>
            <div>
              <p className="text-zinc-500 text-[8px] lg:text-[10px] uppercase font-black mb-1">{stat.label}</p>
              {loading ? (
                <div className="h-6 lg:h-8 w-12 lg:w-16 bg-zinc-800 rounded animate-pulse" />
              ) : (
                <p className="text-xl lg:text-2xl font-bold text-white">{stat.val}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <DetailedRevenueChart
        data={chartData}
        activeMetric={activeMetric}
        loading={loading}
        range={range}
        setRange={setRange}
        metrics={metrics}
        previousMetrics={previousMetrics}
      />

      <div className="mt-8">
        <MonthlyTrends
          revenue={monthlyMetrics.totalRevenue}
          cuts={monthlyMetrics.totalCuts}
          cutsRevenue={monthlyMetrics.revenueCuts}
          products={monthlyMetrics.totalProducts}
          productsRevenue={monthlyMetrics.revenueProducts}
          objRevenue={objectives.ingresos}
          objCuts={objectives.cortes}
          objProducts={objectives.productos}
          loading={loadingMonthly || loadingObjectives}
          selectedMonthText={selectedMonthText}
        />
      </div>

      {/* Barber Ranking - Shown if there are multiple barbers */}
      {(!barberLoading && barberStats.length > 1) && (
        <div className="mt-8">
          <BarberRankingCard
            stats={barberStats}
            loading={barberLoading}
            globalCutsGoal={objectives.cortes}
            selectedMonthText={selectedMonthText}
          />
        </div>
      )}


    </main>
  );
}
