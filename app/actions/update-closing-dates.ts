'use server';

import { format, addMonths } from 'date-fns';
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

        // 4. Lógica de Reemplazo Inteligente
        // Identificamos qué mes está gestionando el usuario (lógica "antes del 25")
        const now = new Date();
        const targetDate = now.getDate() < 25 ? now : addMonths(now, 1);
        const targetMonthStr = format(targetDate, 'yyyy-MM');

        const existingDates: string[] = Array.isArray(profile?.fechas_cierre)
            ? profile.fechas_cierre
            : [];

        // Filtramos las fechas que NO pertenecen al mes que estamos editando
        const otherMonthsDates = existingDates.filter(d => !d.startsWith(targetMonthStr));

        // Combinamos las fechas de otros meses con las nuevas del mes actual
        // Usamos Set para evitar duplicados si el cliente envió fechas de otros meses por error o persistencia
        const unifiedDates = Array.from(new Set([...otherMonthsDates, ...dates]));

        // Ordenamos las fechas cronológicamente
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
