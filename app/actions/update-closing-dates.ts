'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateClosingDates(dates: string[]) {
    // 1. Instanciar Cliente Server-Side seguro
    const supabase = await createClient();

    // 2. Verificar Autenticación (Usuario real)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error("Usuario no autenticado");
    }

    try {
        // 3. Obtener fechas existentes de la BD
        const { data: profile, error: fetchError } = await supabase
            .from('perfiles')
            .select('fechas_cierre')
            .eq('id', user.id)
            .single();

        if (fetchError) throw fetchError;

        // 4. Lógica de Fusión y Deduplicación (Usando Set de Strings)
        // fechas_cierre es un JSONB, asumiendo array de strings.
        const existingDates: string[] = Array.isArray(profile?.fechas_cierre)
            ? profile.fechas_cierre
            : [];

        // Creamos un Set unificado y dispersamos a array nuevamente
        const unifiedDates = Array.from(new Set([...existingDates, ...dates]));

        // Ordenamos las fechas cronológicamente para mantener orden visual en BD (opcional pero limpio)
        unifiedDates.sort();

        // 5. Actualizar en Supabase
        const { error: updateError } = await supabase
            .from('perfiles')
            .update({
                fechas_cierre: unifiedDates,
                calendario_confirmado: true
            })
            .eq('id', user.id);

        if (updateError) throw updateError;

        // 6. Limpiar caché del Dashboard
        revalidatePath('/dashboard');
        revalidatePath('/', 'layout');

        return { success: true };

    } catch (error) {
        console.error("Error updating closing dates:", error);
        return { success: false, error: "Error al actualizar el calendario." };
    }
}
