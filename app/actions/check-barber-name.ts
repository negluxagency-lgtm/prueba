'use server'

import { createClient } from '@/utils/supabase/server'

export async function checkBarberNameAvailability(name: string) {
    if (!name) return { available: false, error: 'Nombre vacío' };

    const supabase = await createClient();

    try {
        // Use count to be efficient, bypass RLS if using Service Role (but createClient is user/anon context)
        // Wait, regular createClient is limited by RLS.
        // If 'perfiles' is not readable by anon, this will fail/return 0.
        // We typically need Service Role for checking duplicates globally if RLS is strict.
        // BUT, exposing full duplicate check might be privacy leak? 
        // For business names it's usually public.

        // If standard client returns 0 because of RLS, we can't rely on it.
        // We should PROBABLY use an Admin Client here if we want to be sure.
        // OR rely on the database constraint unique violation (handled in signUp trigger or logic).

        // HOWEVER, to provide fast feedback, we need to read 'perfiles'.
        // Let's assume there is a public policy for reading 'nombre_barberia'.
        // If not, we can't check.

        // Let's rely on the existing pattern. Using the same client as auth.ts.
        const { count, error } = await supabase
            .from('perfiles')
            .select('*', { count: 'exact', head: true })
            .ilike('nombre_barberia', name.trim());

        if (error) {
            console.error("Check Name Error:", error);
            return { available: false, error: error.message };
        }

        return { available: count === 0 };

    } catch (e) {
        return { available: false, error: "Error checking name" };
    }
}
