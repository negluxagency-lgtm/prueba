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

    // 1. Si el usuario es el propietario directo (su ID es el ID de la barbería), acceso concedido.
    if (user.id === barberiaId) {
        return user;
    }

    // 2. Si no coinciden, verificamos si es staff vinculado a esa barbería.
    const supabase = await createClient();
    const { data: profile, error } = await supabase
        .from('perfiles')
        .select('id, barberia_id')
        .eq('id', user.id)
        .single();

    if (error || !profile || profile.barberia_id !== barberiaId) {
        throw new Error('Acceso denegado: No tienes permisos sobre esta barbería.');
    }

    return user;
}
