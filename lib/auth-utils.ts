import { createClient } from '@/utils/supabase/server';

/**
 * Verifica que el usuario esté autenticado y devuelve su objeto User.
 * Lanza un error si no hay sesión válida para proteger las Server Actions.
 */
export async function getRequiredSession() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error('No autorizado: Se requiere una sesión válida.');
    }

    return user;
}

/**
 * Verifica si el usuario es el "dueño" de una barbería específica.
 * Útil para acciones que operan sobre datos de una barbería.
 */
export async function checkBarberiaOwnership(barberiaId: string) {
    const user = await getRequiredSession();
    const supabase = await createClient();

    const { data: profile, error } = await supabase
        .from('perfiles')
        .select('id')
        .eq('id', user.id)
        .eq('barberia_id', barberiaId)
        .single();

    if (error || !profile) {
        throw new Error('Acceso denegado: No tienes permisos sobre esta barbería.');
    }

    return user;
}
