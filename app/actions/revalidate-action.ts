'use server'

import { revalidatePath } from 'next/cache'

/**
 * Acción de servidor para permitir la revalidación de rutas desde componentes de cliente.
 * Útil para limpiar el caché tras actualizaciones directas vía Supabase Client.
 */
export async function revalidatePathAction(path: string, type?: 'layout' | 'page') {
    try {
        revalidatePath(path, type);
        return { success: true };
    } catch (error: any) {
        console.error(`[revalidatePathAction] Error revalidating ${path}:`, error);
        return { success: false, error: error.message };
    }
}
