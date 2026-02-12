"use client";

import { useState, useEffect } from "react";
import { format, addMonths, startOfToday } from "date-fns";
import { es } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import { updateClosingDates } from "@/app/actions/update-closing-dates";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import "react-day-picker/dist/style.css";

interface MonthlyClosingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    currentClosingDates?: string[];
}

export default function MonthlyClosingModal({ isOpen, onClose, onSuccess, currentClosingDates = [] }: MonthlyClosingModalProps) {
    const [selectedDates, setSelectedDates] = useState<Date[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const router = useRouter();

    // Inteligencia de Mes: Si es antes del 25, gestiona mes actual. Si es 25 o más, gestiona mes siguiente.
    const now = new Date();
    const targetMonth = now.getDate() < 25 ? now : addMonths(now, 1);

    // Initialize with current dates if provided
    useEffect(() => {
        if (isOpen && !initialized && currentClosingDates.length > 0) {
            const parsedDates = currentClosingDates.map(d => new Date(d));
            setSelectedDates(parsedDates);
            setInitialized(true);
        }
    }, [isOpen, initialized, currentClosingDates]);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            const dateStrings = selectedDates.map((date) =>
                format(date, "yyyy-MM-dd")
            );
            const result = await updateClosingDates(dateStrings);

            if (result.success) {
                toast.success("Calendario confirmado correctamente.");
                onSuccess?.();
                onClose();
                router.refresh();
            } else {
                toast.error(result.error || "Error al guardar fechas.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error de conexión.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getButtonText = () => {
        if (isSubmitting) return "Guardando...";
        if (selectedDates.length === 0) return "Confirmar que ABRO todo el mes";
        return `Confirmar ${selectedDates.length} día(s) de Cierre`;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 pointer-events-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6 w-full max-w-md md:max-w-xl flex flex-col items-center animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto relative">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl md:text-2xl font-bold text-white mb-2 text-center">
                    Planificación Mensual
                </h2>

                <p className="text-zinc-400 text-sm md:text-base text-center mb-6 px-4">
                    Para que la IA gestione correctamente tus citas de <span className="text-white font-bold capitalize">{format(targetMonth, 'MMMM', { locale: es })}</span>,
                    necesitamos saber qué días <span className="text-amber-500 font-medium font-bold">cerrarás</span>.
                    (Marca también los festivos o domingos si no abres).
                </p>

                {/* CONTENEDOR DEL CALENDARIO */}
                <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-4 mb-6 w-full flex justify-center">
                    {/* ✅ CORRECCIÓN CLAVE: Usamos variables CSS para el tamaño.
              Esto permite que la librería centre el hover correctamente.
              - Móvil: 40px
              - Escritorio: 52px (Espacioso)
          */}
                    <div
                        className="
            [--rdp-cell-size:40px] md:[--rdp-cell-size:52px]
            [--rdp-caption-font-size:1.1rem] md:[--rdp-caption-font-size:1.25rem]
            [--rdp-accent-color:#f59e0b] [--rdp-background-color:#18181b]
            w-full flex justify-center"
                    >
                        <DayPicker
                            mode="multiple"
                            selected={selectedDates}
                            onSelect={(dates) => setSelectedDates(dates || [])}
                            locale={es}
                            defaultMonth={targetMonth}
                            fromMonth={targetMonth}
                            toMonth={targetMonth}
                            disableNavigation
                            disabled={[{ before: startOfToday() }]}
                            classNames={{
                                root: "p-2",
                                month: "space-y-4",
                                caption: "flex justify-center pt-1 relative items-center text-amber-500 capitalize font-bold",
                                nav_button: "h-7 w-7 bg-transparent hover:opacity-50 text-zinc-400 hover:text-white transition-colors",
                                table: "w-full border-collapse",
                                head_cell: "text-zinc-500 font-normal text-[0.9rem] md:text-base pb-3",
                                // Eliminamos tamaños fijos aquí para que usen la variable CSS
                                cell: "text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                                // Botón base: hover gris y bordes redondeados
                                day: "h-full w-full p-0 font-normal rounded-md hover:bg-zinc-800 text-zinc-100 transition-all",
                                // Día seleccionado: Usamos !important (!) para asegurar que sobrescribe el hover base
                                day_selected: "bg-amber-500 !text-black hover:!bg-amber-400 font-bold",
                                day_today: "text-amber-500 font-bold border border-amber-500/50",
                                day_outside: "text-zinc-700 opacity-50",
                                day_disabled: "text-zinc-800 opacity-30",
                            }}
                            // ✅ CORRECCIÓN CLAVE 2: Usamos modifiersStyles como seguro
                            // Esto garantiza que el color ámbar se aplique sí o sí a los seleccionados.
                            modifiersStyles={{
                                selected: {
                                    backgroundColor: "#f59e0b", // Amber 500
                                    color: "black",
                                    fontWeight: "bold",
                                    borderRadius: "0.375rem", // rounded-md
                                },
                            }}
                        />
                    </div>
                </div>

                <div className="w-full space-y-3">
                    <div className="flex flex-wrap gap-2 justify-center min-h-[24px]">
                        {selectedDates.length > 0 ? (
                            <p className="text-sm text-zinc-400">
                                <span className="text-amber-500 font-bold">
                                    {selectedDates.length}
                                </span>{" "}
                                días seleccionados para cierre.
                            </p>
                        ) : (
                            <p className="text-sm text-zinc-600 italic">
                                Si no seleccionas días, asumiremos que abres todo el mes.
                            </p>
                        )}
                    </div>

                    <button
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                    >
                        {getButtonText()}
                    </button>
                </div>
            </div>
        </div>
    );
}