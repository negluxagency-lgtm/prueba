import React, { useState, useEffect } from 'react';
import { X, Zap } from 'lucide-react';
import { AppointmentFormData } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { TimePicker24h } from '@/components/ui/TimePicker24h';

interface AppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: AppointmentFormData) => Promise<void>;
    initialData: AppointmentFormData;
    isEditing: boolean;
    services?: any[]; // New prop
    barbers?: { id: string, nombre: string }[]; // Updated prop
    showBarberSelector?: boolean; // New prop
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({ isOpen, onClose, onSave, initialData, isEditing, services = [], barbers = [], showBarberSelector = true }) => {
    const [formData, setFormData] = useState<AppointmentFormData>(initialData);
    const [isFastMode, setIsFastMode] = useState(false);
    console.log('🎯 Modal received services:', services);

    useEffect(() => {
        setFormData(initialData);
        setIsFastMode(false);
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Saneamiento de los datos numéricos para Supabase
        const cleanData: any = { ...formData };
        
        if (!cleanData.Telefono || cleanData.Telefono.toString().trim() === '') {
            cleanData.Telefono = null; // Enviar null para evitar error de sintaxis en numeric
        }

        if (cleanData.Precio) {
            cleanData.Precio = String(cleanData.Precio).replace(/[^0-9.]/g, '');
        }

        if (cleanData.duracion) {
            cleanData.duracion = String(cleanData.duracion).replace(/[^0-9]/g, '');
        }

        if (isFastMode) {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            
            const fastData = {
                ...cleanData,
                Nombre: '',
                Telefono: null,
                Dia: `${year}-${month}-${day}`,
                Hora: `${hours}:${minutes}`,
                confirmada: true
            };
            await onSave(fastData);
            return;
        }

        await onSave(cleanData);
    };

    const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedName = e.target.value;
        console.log('🎯 Service selected:', selectedName);
        const selectedService = services?.find(s => s.nombre === selectedName);

        const newFormData: any = {
            ...formData,
            servicio: selectedName,
            Servicio_id: selectedService?.id, // Capture ID with correct casing
            Precio: selectedService ? String(selectedService.precio).replace(/[^0-9.]/g, '') : formData.Precio,
            duracion: selectedService ? String(selectedService.duracion || '').replace(/[^0-9]/g, '') : (formData as any).duracion
        };
        console.log('📋 Updated formData:', newFormData);
        setFormData(newFormData);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[2.5rem] p-6 md:p-8 shadow-2xl overflow-hidden relative"
                    >
                        {/* Background Texture for Modal */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")` }}></div>

                        <div className="flex justify-between items-center mb-8 text-amber-500 relative z-10">
                            <h2 className="text-2xl font-black italic uppercase">
                                {isEditing ? "Editar Cita" : (isFastMode ? "Cita Rápida" : "Nueva Cita")}
                            </h2>
                            <div className="flex items-center gap-3">
                                {isFastMode && (
                                    <button type="button" onClick={() => setIsFastMode(false)} className="text-zinc-400 hover:text-white transition-colors text-xs font-bold uppercase underline">Volver</button>
                                )}
                                <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X size={24} /></button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                            {!isFastMode && (
                                <>
                                    <input required className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Nombre" value={formData.Nombre || ""} onChange={(e) => setFormData({ ...formData, Nombre: e.target.value })} />
                                    <input type="tel" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Telefono" value={formData.Telefono || ""} onChange={(e) => setFormData({ ...formData, Telefono: e.target.value })} />
                                </>
                            )}

                            {/* Dynamic Service Selector */}
                            <select
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                                value={formData.servicio || ""}
                                onChange={handleServiceChange}
                            >
                                <option value="" disabled>Selecciona un servicio</option>
                                {services?.map((service: any) => (
                                    <option key={service.id} value={service.nombre}>
                                        {service.nombre} ({service.precio}€)
                                    </option>
                                ))}
                            </select>

                            {/* Barber Selector - Hidden if showBarberSelector is false */}
                            {showBarberSelector && (
                                <select
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                                    value={formData.barbero_id || formData.barbero || ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const selectedBarber = barbers?.find(b => String(b.id) === val || b.nombre === val || String(b) === val);
                                        if (selectedBarber) {
                                            setFormData({ 
                                                ...formData, 
                                                barbero: selectedBarber.nombre || String(selectedBarber),
                                                barbero_id: String(selectedBarber.id) || undefined
                                            });
                                        } else {
                                            // Case empty
                                            setFormData({ ...formData, barbero: "", barbero_id: undefined })
                                        }
                                    }}
                                >
                                    <option value="">Selecciona un barbero (Opcional)</option>
                                    {barbers?.map((barber: any, index: number) => {
                                        const key = barber.id || index;
                                        const label = barber.nombre || barber;
                                        const value = barber.id ? String(barber.id) : label;
                                        return (
                                            <option key={key} value={value}>
                                                {label}
                                            </option>
                                        );
                                    })}
                                </select>
                            )}
                            {!isFastMode && (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-zinc-500 font-bold uppercase ml-2">Día</label>
                                            <input type="date" required className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm md:text-base text-white focus:outline-none focus:border-amber-500 transition-colors h-[52px]" value={formData.Dia || ""} onChange={(e) => setFormData({ ...formData, Dia: e.target.value })} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-zinc-500 font-bold uppercase ml-2">Hora (24h)</label>
                                            <TimePicker24h
                                                value={formData.Hora || "09:00"}
                                                onChange={(val) => setFormData({ ...formData, Hora: val })}
                                                className="h-[52px]" // Match height of native inputs
                                            />
                                        </div>
                                    </div>
                                    <input type="number" required className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Precio (€)" value={formData.Precio || ""} onChange={(e) => setFormData({ ...formData, Precio: e.target.value })} />
                                </>
                            )}

                            <select
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                                value={formData.pago || ""}
                                onChange={(e) => setFormData({ ...formData, pago: e.target.value || undefined })}
                            >
                                <option value="">Método de pago (Opcional)</option>
                                <option value="efectivo">Efectivo</option>
                                <option value="tarjeta">Tarjeta</option>
                                <option value="bizum">Bizum</option>
                                <option value="otra">Otra</option>
                            </select>

                            <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black uppercase py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] active:scale-[0.98]">
                                {isEditing ? "Guardar Cambios" : (isFastMode ? "Confirmar Cita Rápida" : "Confirmar Cita")}
                            </button>

                            {!isEditing && !isFastMode && (
                                <button 
                                    type="button" 
                                    onClick={() => setIsFastMode(true)} 
                                    className="w-full mt-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold uppercase py-4 rounded-2xl transition-all border border-zinc-700 flex items-center justify-center gap-2"
                                >
                                    <Zap className="w-4 h-4 text-amber-500" />
                                    Crear cita rápida
                                </button>
                            )}
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
