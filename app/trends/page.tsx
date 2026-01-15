"use client";

import React from 'react';
import { DetailedRevenueChart } from '@/components/trends/DetailedRevenueChart';
import { TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';
import { useTrends } from '@/hooks/useTrends';

export default function TrendsPage() {
  const { loading, chartData, metrics, range, setRange } = useTrends();

  return (
    <main className="flex-1 p-3 md:p-10 max-w-4xl md:max-w-6xl mx-auto w-full pb-24 md:pb-10">
      <header className="mb-4 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase mb-2">
          Analytics <span className="text-amber-500">Center</span>
        </h1>
        <p className="text-zinc-500 font-medium text-sm md:text-base">Análisis de rendimiento real.</p>
      </header>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        {[
          { label: 'Ingresos', val: `${metrics.totalRevenue}€`, icon: DollarSign, trend: range, color: 'text-amber-500' },
          { label: 'Citas', val: metrics.totalClients, icon: Calendar, trend: range, color: 'text-blue-500' },
          { label: 'Ticket Medio', val: `${metrics.avgTicket}€`, icon: TrendingUp, trend: 'Avg', color: 'text-green-500' },
        ].map((stat, i) => (
          <div key={i} className={`bg-zinc-900/80 border border-zinc-800 p-4 md:p-6 rounded-2xl md:rounded-3xl flex flex-col justify-between hover:border-amber-500/30 transition-colors animate-in fade-in zoom-in duration-300 ${i === 2 ? 'col-span-2 md:col-span-1' : ''}`} style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex justify-between items-start mb-2 md:mb-4">
              <div className={`p-2 md:p-3 rounded-lg md:rounded-xl bg-zinc-800/50 ${stat.color}`}>
                <stat.icon className="w-[18px] h-[18px] md:w-5 md:h-5" />
              </div>
              <span className="text-[8px] md:text-[10px] font-bold bg-zinc-800 px-1.5 py-0.5 md:px-2 md:py-1 rounded md:rounded-lg text-zinc-400 capitalize">{
                stat.trend === 'week' ? 'Semana' :
                  stat.trend === 'month' ? 'Mes' :
                    stat.trend === 'year' ? 'Año' : stat.trend
              }</span>
            </div>
            <div>
              <p className="text-zinc-500 text-[8px] md:text-[10px] uppercase font-black mb-1">{stat.label}</p>
              {loading ? (
                <div className="h-6 md:h-8 w-12 md:w-16 bg-zinc-800 rounded animate-pulse" />
              ) : (
                <p className="text-xl md:text-2xl font-mono font-bold text-white">{stat.val}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <DetailedRevenueChart
        data={chartData}
        loading={loading}
        range={range}
        setRange={setRange}
      />
    </main>
  );
}