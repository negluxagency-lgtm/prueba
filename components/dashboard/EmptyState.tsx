import { CalendarPlus } from "lucide-react";

export function EmptyState({ onAction }: { onAction: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-full mb-6 relative group">
                <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <CalendarPlus size={48} className="text-amber-500 relative z-10" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-200 mb-2">Día Libre</h3>
            <p className="text-zinc-500 max-w-sm mb-8">
                No hay citas programadas para este día. ¡Es un buen momento para captar clientes o descansar!
            </p>
            <button
                onClick={onAction}
                className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-amber-500 transition-colors shadow-lg"
            >
                Crear Primera Cita
            </button>
        </div>
    );
}
