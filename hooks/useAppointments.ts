import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Appointment, AppointmentFormData } from "@/types";
import useSWR, { useSWRConfig } from "swr";
import { toast } from "sonner";

export type AppointmentStatus = 'pendiente' | 'confirmada' | 'cancelada';

export function useAppointments(selectedDate: string, userId: string | null) {
    const { mutate } = useSWRConfig();

    // 1. Fetch Plan del Usuario
    const { data: userPlan = 'basico' } = useSWR(
        userId ? ['user-plan', userId] : null,
        async () => {
            const { data } = await supabase
                .from('perfiles')
                .select('plan')
                .eq('id', userId)
                .single();
            return data?.plan || 'basico';
        }
    );

    // 2. Fetch Citas del Día
    const { 
        data: appointments = [], 
        error: appointmentsError, 
        isLoading: appointmentsLoading,
        mutate: mutateAppointments
    } = useSWR(
        userId && selectedDate ? ['appointments', selectedDate, userId] : null,
        async () => {
            const { data, error } = await supabase
                .from('citas')
                .select('id, uuid, created_at, Nombre, servicio, Servicio_id, Dia, Hora, Telefono, Precio, confirmada, cancelada, barbero, barbero_id, pago')
                .eq('Dia', selectedDate)
                .eq('barberia_id', userId)
                .order('Hora', { ascending: true });
            
            if (error) throw error;
            return data as Appointment[];
        }
    );

    // 3. Fetch Métricas Mensuales
    const now = new Date();
    const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const { data: monthlyMetrics } = useSWR(
        userId ? ['monthly-metrics', mesActual, userId] : null,
        async () => {
            const { data } = await supabase
                .from('metricas_mensuales')
                .select('ingresos, cortes, productos')
                .eq('barberia_id', userId)
                .eq('mes', mesActual)
                .single();
            return data || { ingresos: 0, cortes: 0, productos: 0 };
        }
    );

    const saveCita = async (formData: AppointmentFormData, editingId: number | null) => {
        try {
            if (!userId) throw new Error("No autenticado");

            const citaData = {
                Nombre: formData.Nombre,
                servicio: formData.servicio,
                Servicio_id: formData.Servicio_id,
                Dia: formData.Dia,
                Hora: formData.Hora,
                Telefono: formData.Telefono,
                Precio: formData.Precio,
                confirmada: formData.confirmada ?? false,
                barbero: formData.barbero || null,
                barbero_id: formData.barbero_id || null,
                barberia_id: userId,
                pago: formData.pago || null
            };

            if (editingId) {
                const { error } = await supabase
                    .from('citas')
                    .update(citaData)
                    .eq('id', editingId)
                    .eq('barberia_id', userId);
                if (error) throw error;
            } else {
                const { data: newCita, error } = await supabase
                    .from('citas')
                    .insert([citaData])
                    .select('uuid')
                    .single();
                
                if (error) throw error;
                // Si la fecha coincide, revalidar localmente
                if (formData.Dia === selectedDate) mutateAppointments();
                return { success: true, uuid: newCita?.uuid };
            }

            mutateAppointments();
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    const updateAppointmentStatus = async (id: number, verifyStatus: AppointmentStatus, pago?: string, barberId?: string, barberName?: string) => {
        let dbValues: any = { confirmada: null, cancelada: null };
        if (verifyStatus === 'confirmada') {
            dbValues = { 
                confirmada: true, 
                cancelada: false, 
                ...(pago ? { pago } : {}),
                ...(barberId ? { barbero_id: barberId, barbero: barberName } : {}) 
            };
        }
        if (verifyStatus === 'cancelada') dbValues = { confirmada: false, cancelada: true };

        // Optimistic Update
        const updatedAppointments = appointments.map(cita =>
            cita.id === id ? { ...cita, ...dbValues } : cita
        );

        try {
            // Actualizamos el caché local de inmediato
            mutateAppointments(updatedAppointments, false);

            const { data, error } = await supabase
                .from('citas')
                .update(dbValues)
                .eq('id', id)
                .eq('barberia_id', userId)
                .select();

            if (error) throw error;
            if (!data || data.length === 0) throw new Error("No permitido");

            // Revalidar para asegurar sincronía final
            mutateAppointments();
            return { success: true };
        } catch (err: any) {
            // Rollback en caso de error
            mutateAppointments();
            return { success: false, error: err.message };
        }
    };

    const deleteCita = async (id: number) => {
        // Optimistic Update
        const updatedAppointments = appointments.filter(c => c.id !== id);
        
        try {
            mutateAppointments(updatedAppointments, false);
            const { error } = await supabase.from('citas').delete().eq('id', id).eq('barberia_id', userId);
            if (error) throw error;
            
            mutateAppointments();
            return { success: true };
        } catch (err: any) {
            mutateAppointments();
            return { success: false, error: err.message };
        }
    };

    // Realtime Subscription
    useEffect(() => {
        if (!userId) return;

        const subscription = supabase
            .channel(`citas-${selectedDate}-${userId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'citas',
                filter: `barberia_id=eq.${userId}`
            }, () => {
                // Revalidamos SWR al detectar cambios
                mutateAppointments();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [selectedDate, userId, mutateAppointments]);

    return {
        appointments,
        monthlyRevenue: monthlyMetrics?.ingresos || 0,
        monthlyCuts: monthlyMetrics?.cortes || 0,
        monthlyProducts: monthlyMetrics?.productos || 0,
        userPlan,
        loading: appointmentsLoading,
        error: appointmentsError?.message || null,
        saveCita,
        deleteCita,
        updateAppointmentStatus,
        refreshAppointments: () => mutateAppointments()
    };
}

