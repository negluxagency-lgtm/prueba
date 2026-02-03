import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { AppointmentFormData } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface AppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: AppointmentFormData) => Promise<void>;
    initialData: AppointmentFormData;
    isEditing: boolean;
    services?: any[]; // New prop
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({ isOpen, onClose, onSave, initialData, isEditing, services = [] }) => {
    const [formData, setFormData] = useState<AppointmentFormData>(initialData);
    console.log('🎯 Modal received services:', services);

    useEffect(() => {
        setFormData(initialData);
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
    };

    const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedName = e.target.value;
        const selectedService = services?.find(s => s.nombre === selectedName);

        setFormData({
            ...formData,
            Precio: selectedService ? String(selectedService.precio) : formData.Precio
        });
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
                                {isEditing ? "Editar Cita" : "Nueva Cita"}
                            </h2>
                            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                            <input required className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Nombre" value={formData.Nombre || ""} onChange={(e) => setFormData({ ...formData, Nombre: e.target.value })} />
                            <input type="tel" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Telefono" value={formData.Telefono || ""} onChange={(e) => setFormData({ ...formData, Telefono: e.target.value })} />

                            {/* Dynamic Service Selector */}
                            <select
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                                defaultValue=""
                                onChange={handleServiceChange}
                            >
                                <option value="" disabled>Selecciona un servicio</option>
                                {services?.map((service: any) => (
                                    <option key={service.id} value={service.nombre}>
                                        {service.nombre} ({service.precio}€)
                                    </option>
                                ))}
                            </select>
                            <div className="grid grid-cols-2 gap-3">
                                <input type="date" required className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2 md:px-4 py-3 text-sm md:text-base text-white focus:outline-none focus:border-amber-500 transition-colors" value={formData.Dia || ""} onChange={(e) => setFormData({ ...formData, Dia: e.target.value })} />
                                <input type="time" required className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2 md:px-4 py-3 text-sm md:text-base text-white focus:outline-none focus:border-amber-500 transition-colors" value={formData.Hora || ""} onChange={(e) => setFormData({ ...formData, Hora: e.target.value })} />
                            </div>
                            <input type="number" required className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Precio (€)" value={formData.Precio || ""} onChange={(e) => setFormData({ ...formData, Precio: e.target.value })} />

                            <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black uppercase py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] active:scale-[0.98]">
                                {isEditing ? "Guardar Cambios" : "Confirmar Cita"}
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
