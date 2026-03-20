import React from 'react';
import { Plus } from 'lucide-react';

interface DashboardStatsProps {
    citas: number;           // Total de citas del día (desde metricas_diarias)
    cajaEsperada: number;    // Caja Esperada del día (desde metricas_diarias)
    cajaReal: number;        // Caja Real del día (desde metricas_diarias)
    onNewAppointment: () => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ citas, cajaEsperada, cajaReal, onNewAppointment }) => {
    return (
        <div className="flex flex-col lg:flex-row items-end lg:items-center gap-2 h-full w-full">
            <div className="flex flex-col lg:flex-row gap-2 lg:gap-4 w-full h-full">
                <div className="bg-zinc-900/80 border border-zinc-800 p-2.5 lg:p-6 rounded-xl lg:rounded-3xl flex-1 flex flex-col justify-center">
                    <p className="text-[7px] lg:text-[10px] text-zinc-500 uppercase font-black mb-0.5 lg:mb-1">Citas</p>
                    <p className="text-base lg:text-3xl font-bold">{citas}</p>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800 p-2.5 lg:p-6 rounded-xl lg:rounded-3xl flex-1 border-l-2 lg:border-l-4 border-l-amber-500 shadow-xl flex flex-col justify-center">
                    <p className="text-[7px] lg:text-[10px] text-zinc-500 uppercase font-black mb-0.5 lg:mb-1">Caja Esperada</p>
                    <p className="text-base lg:text-3xl font-bold text-amber-500">{cajaEsperada}€</p>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800 p-2.5 lg:p-6 rounded-xl lg:rounded-3xl flex-1 border-l-2 lg:border-l-4 border-l-emerald-500 shadow-xl flex flex-col justify-center">
                    <p className="text-[7px] lg:text-[10px] text-zinc-500 uppercase font-black mb-0.5 lg:mb-1">Caja Real</p>
                    <p className="text-base lg:text-3xl font-bold text-emerald-500">
                        {cajaReal}€
                    </p>
                </div>
            </div>
            <button
                onClick={onNewAppointment}
                className="fixed bottom-24 right-4 z-50 lg:static bg-amber-500 hover:bg-amber-600 text-black p-4 lg:p-4 rounded-full lg:rounded-2xl transition-all active:scale-95 shrink-0 lg:ml-4 flex items-center justify-center border-2 border-black/10 lg:border-transparent"
            >
                <Plus className="w-6 h-6 lg:w-7 lg:h-7" strokeWidth={3} />
            </button>
        </div>
    );
};
