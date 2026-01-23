"use client";

import React, { useState } from 'react';
import { DetailedRevenueChart } from '@/components/trends/DetailedRevenueChart';
import { TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTrends } from '@/hooks/useTrends';
import { MetricType } from '@/components/trends/DetailedRevenueChart';
import { MonthlyTrends } from '@/components/dashboard/MonthlyTrends';

export default function TrendsPage() {
  const { loading, chartData, metrics, previousMetrics, range, setRange } = useTrends();
  const [activeMetric, setActiveMetric] = React.useState<MetricType>('revenue');
  const [objectives, setObjectives] = useState({
    ingresos: 0,
    cortes: 0,
    productos: 0
  });
  const [loadingObjectives, setLoadingObjectives] = useState(true);

  React.useEffect(() => {
    const fetchObjectives = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('perfiles')
        .select('objetivo_ingresos, objetivo_cortes, objetivo_productos')
        .eq('id', user.id)
        .single();

      if (profile) {
        setObjectives({
          ingresos: Number(profile.objetivo_ingresos) || 0,
          cortes: Number(profile.objetivo_cortes) || 0,
          productos: Number(profile.objetivo_productos) || 0
        });
      }
      setLoadingObjectives(false);
    };
    fetchObjectives();
  }, []);

  return (
    <main className="flex-1 p-2 md:p-10 max-w-4xl md:max-w-6xl mx-auto w-full pb-24 md:pb-10">
      <header className="mb-4 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase mb-2">
          Analytics <span className="text-amber-500">Center</span>
        </h1>
        <p className="text-zinc-500 font-medium text-sm md:text-base">Análisis de rendimiento real.</p>
      </header>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
        {[
          { id: 'revenue' as MetricType, label: 'Ingresos', val: `${metrics.totalRevenue}€`, icon: DollarSign, trend: range, color: 'text-green-500' },
          { id: 'clients' as MetricType, label: 'Citas', val: metrics.totalClients, icon: Calendar, trend: range, color: 'text-amber-500' },
          { id: 'avgTicket' as MetricType, label: 'Ticket Medio', val: `${metrics.avgTicket}€`, icon: TrendingUp, trend: 'Avg', color: 'text-blue-500' },
          { id: 'noShows' as MetricType, label: 'No-Shows', val: metrics.noShows, icon: Users, trend: range, color: 'text-red-500' },
        ].map((stat, i) => (
          <div
            key={i}
            onClick={() => setActiveMetric(stat.id)}
            className={`cursor-pointer bg-zinc-900/80 border p-4 md:p-6 rounded-2xl md:rounded-3xl flex flex-col justify-between transition-all animate-in fade-in zoom-in duration-300 ${activeMetric === stat.id
              ? 'border-amber-500 ring-1 ring-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
              : 'border-zinc-800 hover:border-zinc-700'
              }`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex justify-between items-start mb-2 md:mb-4">
              <div className={`p-2 md:p-3 rounded-lg md:rounded-xl bg-zinc-800/50 ${stat.color}`}>
                <stat.icon className="w-[18px] h-[18px] md:w-5 md:h-5" />
              </div>
              <span className="text-[8px] md:text-[10px] font-bold bg-zinc-800 px-1.5 py-0.5 md:px-2 md:py-1 rounded md:rounded-lg text-zinc-400 capitalize">
                {stat.trend === 'week' ? 'Semana' : stat.trend === 'month' ? 'Mes' : stat.trend === 'year' ? 'Año' : stat.trend}
              </span>
            </div>
            <div>
              <p className="text-zinc-500 text-[8px] md:text-[10px] uppercase font-black mb-1">{stat.label}</p>
              {loading ? (
                <div className="h-6 md:h-8 w-12 md:w-16 bg-zinc-800 rounded animate-pulse" />
              ) : (
                <p className="text-xl md:text-2xl font-bold text-white">{stat.val}</p>
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
          revenue={metrics.totalRevenue}
          cuts={metrics.totalCuts}
          products={metrics.totalProducts}
          objRevenue={objectives.ingresos}
          objCuts={objectives.cortes}
          objProducts={objectives.productos}
          loading={loadingObjectives}
        />
      </div>
    </main>
  );
}