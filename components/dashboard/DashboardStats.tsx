import React from 'react';
import { Plus } from 'lucide-react';

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
            <div className="flex flex-row lg:flex-row gap-2 lg:gap-4 w-full h-full flex-1">
                <div className="bg-zinc-900/80 border border-zinc-800 p-2.5 lg:p-6 rounded-xl lg:rounded-3xl flex-1 flex flex-col justify-center min-w-[70px] lg:min-w-[120px]">
                    <p className="text-[8px] lg:text-xs text-zinc-500 uppercase font-black mb-0.5 lg:mb-1">Citas</p>
                    <p className="text-xl lg:text-3xl font-bold">{citas}</p>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800 p-2.5 lg:p-6 rounded-xl lg:rounded-3xl flex-1 border-l-2 lg:border-l-4 border-l-emerald-500 shadow-xl flex flex-col justify-center min-w-[90px] lg:min-w-[150px]">
                    <p className="text-[8px] lg:text-xs text-zinc-500 uppercase font-black mb-0.5 lg:mb-1">Caja Total</p>
                    <div className="flex items-baseline gap-1.5 lg:gap-2">
                        <p className="text-xl lg:text-3xl font-bold text-emerald-500">
                            {cajaTotal}€
                        </p>
                        {cajaInicial > 0 && (
                            <p className="text-[10px] lg:text-sm font-bold text-zinc-600">
                                + {cajaInicial}€
                            </p>
                        )}
                    </div>
                </div>
                {registerControl && (
                    <div className="flex-[1] flex items-stretch h-full w-full">
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
