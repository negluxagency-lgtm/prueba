import React from 'react';
import { Plus, CalendarDays, Wallet } from 'lucide-react';

interface DashboardStatsProps {
    citas: number;           // Total de citas del día (desde metricas_diarias)
    cajaTotal: number;       // Caja Total del día (desde metricas_diarias)
    cajaInicial?: number;    // Fondo inicial (desde arqueos_caja)
    onNewAppointment: () => void;
    registerControl?: React.ReactNode;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ citas, cajaTotal, cajaInicial = 0, onNewAppointment, registerControl }) => {
    return (
        <div className="flex flex-col lg:flex-row items-stretch lg:items-stretch gap-2 lg:gap-4 h-full w-full">
            <div className="flex flex-row gap-2 lg:gap-4 w-full h-full flex-1">
                {/* Caja Citas */}
                <div className="bg-zinc-900/80 border border-zinc-800 p-3 lg:p-6 rounded-xl lg:rounded-3xl flex-1 flex flex-col justify-between min-w-[70px] lg:min-w-[120px] min-h-[90px] lg:min-h-[140px] relative overflow-hidden group hover:border-zinc-700 transition-colors shadow-xl">
                    <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full pointer-events-none group-hover:bg-amber-500/20 transition-all duration-700" />
                    
                    <div className="flex items-start justify-between mb-4 lg:mb-8 relative z-10 w-full">
                        <p className="text-[8px] lg:text-xs text-zinc-500 uppercase font-black tracking-widest mt-1">Citas</p>
                        <div className="w-6 h-6 lg:w-10 lg:h-10 rounded-full lg:rounded-[14px] bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform duration-500">
                            <CalendarDays className="w-3 h-3 lg:w-5 lg:h-5 text-amber-500" strokeWidth={2} />
                        </div>
                    </div>
                    
                    <div className="relative z-10">
                        <p className="text-2xl lg:text-5xl font-black text-white tracking-tighter drop-shadow-sm">{citas}</p>
                    </div>
                </div>

                {/* Caja Facturación */}
                <div className="bg-zinc-900/80 border border-zinc-800 p-3 lg:p-6 rounded-xl lg:rounded-3xl flex-1 flex flex-col justify-between min-w-[90px] lg:min-w-[150px] min-h-[90px] lg:min-h-[140px] relative overflow-hidden group hover:border-zinc-700 transition-colors shadow-xl">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700" />

                    <div className="flex items-start justify-between mb-4 lg:mb-8 relative z-10 w-full">
                        <p className="text-[8px] lg:text-xs text-zinc-500 uppercase font-black tracking-widest mt-1">Ingresos</p>
                        <div className="w-6 h-6 lg:w-10 lg:h-10 rounded-full lg:rounded-[14px] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                            <Wallet className="w-3 h-3 lg:w-5 lg:h-5 text-emerald-500" strokeWidth={2} />
                        </div>
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex flex-wrap items-baseline gap-1.5 lg:gap-2">
                            <p className="text-2xl lg:text-5xl font-black text-emerald-400 tracking-tighter drop-shadow-[0_0_15px_rgba(52,211,153,0.15)]">
                                {cajaTotal}<span className="text-lg lg:text-3xl font-bold text-emerald-500/70 ml-0.5">€</span>
                            </p>
                            {cajaInicial > 0 && (
                                <>
                                    {/* Móvil: número gris simple */}
                                    <span className="lg:hidden text-sm font-bold text-zinc-600">+{cajaInicial}€</span>
                                    {/* Desktop: pill con label */}
                                    <div className="hidden lg:flex items-baseline gap-1 bg-zinc-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/10">
                                        <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Apertura</span>
                                        <span className="text-xs font-black text-zinc-300">+{cajaInicial}€</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Control Caja (CashRegisterManager) */}
                {registerControl && (
                    <div className="flex-[1] flex items-stretch w-full min-h-[90px] lg:min-h-[140px]">
                        {registerControl}
                    </div>
                )}
            </div>
            <div className="flex items-center justify-center lg:self-stretch lg:h-auto">
                <button
                    onClick={onNewAppointment}
                    className="fixed bottom-24 right-4 z-50 lg:static bg-amber-500 hover:bg-amber-600 text-black p-4 lg:p-5 rounded-full lg:rounded-2xl transition-all active:scale-95 shrink-0 flex items-center justify-center border-2 border-black/10 lg:border-transparent"
                >
                    <Plus className="w-6 h-6 lg:w-8 lg:h-8" strokeWidth={3} />
                </button>
            </div>
        </div>
    );
};
