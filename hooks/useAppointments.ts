import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Appointment, AppointmentFormData } from "@/types";

export function useAppointments(selectedDate: string) {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(false);
    const [monthlyRevenue, setMonthlyRevenue] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const getCitas = async () => {
        try {
            setLoading(true);

            // Fetch current day appointments
            const { data: dayData, error: dayError } = await supabase
                .from('citas')
                .select('*')
                .eq('Dia', selectedDate)
                .order('Hora', { ascending: true });

            if (dayError) throw dayError;
            if (dayData) setAppointments(dayData as Appointment[]);

            // Fetch monthly revenue (current month)
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const { data: monthData, error: monthError } = await supabase
                .from('citas')
                .select('Precio')
                .gte('Dia', startOfMonth);

            if (!monthError && monthData) {
                const total = monthData.reduce((acc, curr) => acc + (Number(curr.Precio) || 0), 0);
                setMonthlyRevenue(total);
            }

        } catch (err: any) {
            setError(err.message);
            console.log("Error de Supabase:", err.message);
        } finally {
            setLoading(false);
        }
    };

    const saveCita = async (formData: AppointmentFormData, editingId: number | null) => {
        try {
            let error;

            if (editingId) {
                // --- EDITAR ---
                const { error: updateError } = await supabase
                    .from('citas')
                    .update({
                        Nombre: formData.Nombre,
                        Servicio: formData.Servicio,
                        Dia: formData.Dia,
                        Hora: formData.Hora,
                        Telefono: formData.Telefono,
                        Precio: formData.Precio,
                        confirmada: formData.confirmada
                    })
                    .eq('id', editingId);
                error = updateError;
            } else {
                // --- CREAR ---
                const { error: insertError } = await supabase
                    .from('citas')
                    .insert([{
                        Nombre: formData.Nombre,
                        Servicio: formData.Servicio,
                        Dia: formData.Dia,
                        Hora: formData.Hora,
                        Telefono: formData.Telefono,
                        Precio: formData.Precio,
                        confirmada: formData.confirmada ?? false
                    }]);
                error = insertError;
            }

            if (error) throw error;
            getCitas();
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    const toggleConfirmation = async (id: number, currentStatus: boolean) => {
        // ACTUALIZACIÓN OPTIMISTA: cambiamos el estado local de inmediato
        const originalAppointments = [...appointments];
        setAppointments(prev => prev.map(cita =>
            cita.id === id ? { ...cita, confirmada: !currentStatus } : cita
        ));

        try {
            console.log(`Intentando cambiar cita ${id} a confirmada: ${!currentStatus}`);
            const { data, error } = await supabase
                .from('citas')
                .update({ confirmada: !currentStatus })
                .eq('id', id)
                .select();

            if (error) throw error;

            if (!data || data.length === 0) {
                console.warn("⚠️ No se actualizó ninguna fila. ¿Permisos RLS?");
                throw new Error("No tienes permisos para actualizar esta cita");
            }

            console.log("✅ DB actualizada con éxito:", data[0]);
            // No llamamos a getCitas() aquí para evitar parpadeos, 
            // confiamos en el estado optimista y en la suscripción Realtime.
            return { success: true };
        } catch (err: any) {
            console.error("❌ Error en persistencia:", err.message);
            // REVERSIÓN: si falla la DB, volvemos al estado anterior
            setAppointments(originalAppointments);
            return { success: false, error: err.message };
        }
    };

    const deleteCita = async (id: number) => {
        try {
            const { error } = await supabase.from('citas').delete().eq('id', id);
            if (error) throw error;
            getCitas();
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    useEffect(() => {
        getCitas();
        const subscription = supabase
            .channel('citas-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'citas' }, () => {
                // Pequeño retardo para evitar que el fetch ocurra antes de que 
                // la DB haya terminado de propagar el cambio
                setTimeout(() => getCitas(), 500);
            })
            .subscribe();
        return () => { supabase.removeChannel(subscription); };
    }, [selectedDate]);

    return { appointments, monthlyRevenue, loading, error, saveCita, deleteCita, toggleConfirmation, refreshAppointments: getCitas };
}
