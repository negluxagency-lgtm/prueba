import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

interface DashboardHeaderProps {
    selectedDate: string;
    setSelectedDate: (date: string) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ selectedDate, setSelectedDate }) => {
    return (
        <header className="mb-2 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
            <div>
                <h1 className="text-2xl md:text-4xl font-black italic tracking-tighter uppercase leading-tight">
                    Wolf <span className="text-amber-500 text-3xl md:text-5xl">Barbershop</span>
                </h1>
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-4 mt-4 md:mt-2">
                    <span className="hidden md:flex items-center gap-1.5 md:gap-2 text-zinc-500 font-medium text-[10px] md:text-sm">
                        <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse"></span> Live
                    </span>
                    <div className="relative group w-fit mt-2 md:mt-0">
                        <input
                            type="date" value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 text-amber-500 text-[10px] md:text-sm font-bold px-2.5 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl focus:outline-none focus:border-amber-500 transition-all cursor-pointer appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full"
                        />
                        <CalendarIcon className="hidden md:block absolute right-2.5 md:right-3 top-2 md:top-3 text-amber-500 pointer-events-none opacity-50 w-[10px] h-[10px] md:w-3 md:h-3" />
                    </div>
                </div>
            </div>
        </header>
    );
};
