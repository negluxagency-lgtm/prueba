"use client";

import React, { useState } from 'react';
import { DetailedRevenueChart } from '@/components/trends/DetailedRevenueChart';
import { TrendingUp, Users, DollarSign, Calendar, Calculator, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTrends } from '@/hooks/useTrends';
import { useBarberStats } from '@/hooks/useBarberStats';
import { MetricType } from '@/components/trends/DetailedRevenueChart';
import { MonthlyTrends } from '@/components/dashboard/MonthlyTrends';
import BarberRankingCard from '@/components/trends/BarberRankingCard';
import SalaryCalculatorModal from '@/components/trends/SalaryCalculatorModal';
import QuickOvertimeModal from '@/components/trends/QuickOvertimeModal';

export default function TrendsPage() {
  const { loading, chartData, metrics, previousMetrics, range, setRange } = useTrends();
  const [activeMetric, setActiveMetric] = React.useState<MetricType>('revenue');
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showOvertimeModal, setShowOvertimeModal] = useState(false);

  // Barber stats: use current month for the ranking card
  const currentMonth = new Date().toISOString().substring(0, 7);
  const { stats: barberStats, loading: barberLoading } = useBarberStats(currentMonth);

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
          { id: 'clients' as MetricType, label: 'Citas', val: metrics.totalCuts, icon: Calendar, trend: range, color: 'text-amber-500' },
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

      {/* Barber Ranking */}
      <div className="mt-8">
        <BarberRankingCard
          stats={barberStats}
          loading={barberLoading}
          globalCutsGoal={objectives.cortes}
        />
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex items-center justify-center md:justify-center gap-3 md:gap-6 flex-wrap">
        <button
          onClick={() => setShowOvertimeModal(true)}
          className="flex items-center gap-2 md:gap-4 px-6 py-4 md:px-10 md:py-6 bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] text-zinc-300 hover:text-white font-black text-xs md:text-sm rounded-2xl md:rounded-[2rem] transition-all border border-zinc-800 shadow-xl group"
        >
          <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-zinc-900 flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
            <Clock className="w-4 h-4 md:w-6 md:h-6 text-zinc-500 group-hover:text-amber-500 transition-colors" />
          </div>
          Horas Extra
        </button>

        <button
          onClick={() => setShowSalaryModal(true)}
          className="flex items-center gap-2 md:gap-4 px-6 py-4 md:px-10 md:py-6 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-black font-black text-xs md:text-sm rounded-2xl md:rounded-[2rem] transition-all shadow-[0_10px_20px_rgba(245,158,11,0.2)] group"
        >
          <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-black/10 flex items-center justify-center group-hover:bg-black/20 transition-colors">
            <Calculator className="w-4 h-4 md:w-6 md:h-6" />
          </div>
          Liquidación
        </button>
      </div>

      {/* Modals */}
      {showSalaryModal && (
        <SalaryCalculatorModal onClose={() => setShowSalaryModal(false)} />
      )}
      {showOvertimeModal && (
        <QuickOvertimeModal onClose={() => setShowOvertimeModal(false)} />
      )}
    </main>
  );
}