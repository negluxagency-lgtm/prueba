import React from 'react';
import { Plus, TrendingUp } from 'lucide-react';
import { Appointment } from '@/types';

interface DashboardStatsProps {
    appointments: Appointment[];
    monthlyRevenue: number;
    onNewAppointment: () => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ appointments, monthlyRevenue, onNewAppointment }) => {
    const totalGanancias = appointments.reduce((total, cita) => total + (Number(cita.Precio) || 0), 0);

    return (
        <div className="flex flex-col md:flex-row items-end md:items-center gap-2 h-full w-full">
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full h-full">
                <div className="bg-zinc-900/80 border border-zinc-800 p-2.5 md:p-6 rounded-xl md:rounded-3xl flex-1 flex flex-col justify-center">
                    <p className="text-[7px] md:text-[10px] text-zinc-500 uppercase font-black mb-0.5 md:mb-1">Citas</p>
                    <p className="text-base md:text-3xl font-bold">{appointments.filter(a => a.confirmada && !a.producto).length}</p>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800 p-2.5 md:p-6 rounded-xl md:rounded-3xl flex-1 border-l-2 md:border-l-4 border-l-amber-500 shadow-xl flex flex-col justify-center">
                    <p className="text-[7px] md:text-[10px] text-zinc-500 uppercase font-black mb-0.5 md:mb-1">Caja Esperada</p>
                    <p className="text-base md:text-3xl font-bold text-amber-500">{totalGanancias}€</p>
                </div>
                {/* CAJA REAL (SOLO CONFIRMADAS) */}
                <div className="bg-zinc-900/80 border border-zinc-800 p-2.5 md:p-6 rounded-xl md:rounded-3xl flex-1 border-l-2 md:border-l-4 border-l-emerald-500 shadow-xl flex flex-col justify-center">
                    <p className="text-[7px] md:text-[10px] text-zinc-500 uppercase font-black mb-0.5 md:mb-1">Caja Real</p>
                    <p className="text-base md:text-3xl font-bold text-emerald-500">
                        {monthlyRevenue}€
                    </p>
                </div>
            </div>
            <button
                onClick={onNewAppointment}
                className="fixed bottom-24 right-4 z-50 md:static bg-amber-500 hover:bg-amber-600 text-black p-4 md:p-4 rounded-full md:rounded-2xl transition-all active:scale-95 shrink-0 md:ml-4 flex items-center justify-center border-2 border-black/10 md:border-transparent"
            >
                <Plus className="w-6 h-6 md:w-7 md:h-7" strokeWidth={3} />
            </button>
        </div>
    );
};
