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
                        Precio: formData.Precio
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
                        Precio: formData.Precio
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
            .on('postgres_changes', { event: '*', schema: 'public', table: 'citas' }, () => getCitas())
            .subscribe();
        return () => { supabase.removeChannel(subscription); };
    }, [selectedDate]);

    return { appointments, monthlyRevenue, loading, error, saveCita, deleteCita, refreshAppointments: getCitas };
}
