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
        <div className="flex w-full md:w-auto items-center justify-between md:justify-start gap-2">
            <div className="flex gap-2 md:gap-4 flex-1 md:flex-none overflow-x-auto scrollbar-hide pr-2 md:pr-0">
                <div className="bg-zinc-900/80 border border-zinc-800 p-3 md:p-6 rounded-xl md:rounded-3xl min-w-[80px] md:min-w-[120px]">
                    <p className="text-[8px] md:text-[10px] text-zinc-500 uppercase font-black mb-0.5 md:mb-1">Citas</p>
                    <p className="text-xl md:text-3xl font-mono font-bold">{appointments.length}</p>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800 p-3 md:p-6 rounded-xl md:rounded-3xl min-w-[100px] md:min-w-[140px] border-l-4 border-l-amber-500 shadow-xl">
                    <p className="text-[8px] md:text-[10px] text-zinc-500 uppercase font-black mb-0.5 md:mb-1">Caja Esperada Hoy</p>
                    <p className="text-xl md:text-3xl font-mono font-bold text-amber-500">{totalGanancias}€</p>
                </div>
                {/* CAJA REAL (SOLO CONFIRMADAS) */}
                <div className="bg-zinc-900/80 border border-zinc-800 p-3 md:p-6 rounded-xl md:rounded-3xl min-w-[100px] md:min-w-[140px] border-l-4 border-l-emerald-500 shadow-xl">
                    <p className="text-[8px] md:text-[10px] text-zinc-500 uppercase font-black mb-0.5 md:mb-1">Caja Real Hoy</p>
                    <p className="text-xl md:text-3xl font-mono font-bold text-emerald-500">
                        {appointments.filter(a => a.confirmada).reduce((acc, curr) => acc + (Number(curr.Precio) || 0), 0)}€
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
