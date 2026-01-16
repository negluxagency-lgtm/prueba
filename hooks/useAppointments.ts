import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Appointment, AppointmentFormData } from "@/types";

export type AppointmentStatus = 'pendiente' | 'confirmada' | 'cancelada';

export function useAppointments(selectedDate: string) {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(false);
    const [monthlyRevenue, setMonthlyRevenue] = useState(0);
    const [monthlyCuts, setMonthlyCuts] = useState(0);
    const [monthlyProducts, setMonthlyProducts] = useState(0);
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

                // Conteo de cortes (no ventas) y productos (solo ventas)
                const { data: monthCountData } = await supabase
                    .from('citas')
                    .select('Servicio')
                    .gte('Dia', startOfMonth);

                if (monthCountData) {
                    const cuts = monthCountData.filter(c => c.Servicio !== 'Venta de Producto').length;
                    const prods = monthCountData.filter(c => c.Servicio === 'Venta de Producto').length;
                    setMonthlyCuts(cuts);
                    setMonthlyProducts(prods);
                }
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
                        confirmada: formData.confirmada,
                        producto: formData.productos
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
                        confirmada: formData.confirmada ?? false,
                        producto: formData.productos ?? false
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

    const updateAppointmentStatus = async (id: number, verifyStatus: AppointmentStatus) => {
        // Mapeo de estados a valores de BD
        let dbValues = { confirmada: false, cancelada: false };
        if (verifyStatus === 'confirmada') dbValues = { confirmada: true, cancelada: false };
        if (verifyStatus === 'cancelada') dbValues = { confirmada: false, cancelada: true };

        // Pendiente es { confirmada: false, cancelada: false }

        // ACTUALIZACIÓN OPTIMISTA
        const originalAppointments = [...appointments];
        setAppointments(prev => prev.map(cita =>
            cita.id === id ? { ...cita, ...dbValues } : cita
        ));

        try {
            console.log(`Cambiando cita ${id} a estado: ${verifyStatus}`);
            const { data, error } = await supabase
                .from('citas')
                .update(dbValues)
                .eq('id', id)
                .select();

            if (error) throw error;

            if (!data || data.length === 0) {
                console.warn("⚠️ No se actualizó ninguna fila. ¿Permisos RLS?");
                throw new Error("No tienes permisos para actualizar esta cita");
            }

            console.log("✅ DB actualizada con éxito:", data[0]);
            return { success: true };
        } catch (err: any) {
            console.error("❌ Error en persistencia:", err.message);
            // REVERSIÓN
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
                setTimeout(() => getCitas(), 500);
            })
            .subscribe();
        return () => { supabase.removeChannel(subscription); };
    }, [selectedDate]);

    return {
        appointments,
        monthlyRevenue,
        monthlyCuts,
        monthlyProducts,
        loading,
        error,
        saveCita,
        deleteCita,
        updateAppointmentStatus, // Nueva función expuesta
        refreshAppointments: getCitas
    };
}
