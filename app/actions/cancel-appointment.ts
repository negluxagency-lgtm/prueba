'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { getRequiredSession } from '@/lib/auth-utils';

export async function cancelAppointmentByUuid(uuid: string): Promise<{ success: boolean; error?: string }> {
    await getRequiredSession();
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // First verify the appointment still exists and hasn't passed
        const { data: cita, error: fetchError } = await supabase
            .from('citas')
            .select('id, Dia, cancelada, confirmada')
            .eq('uuid', uuid)
            .single()

        if (fetchError || !cita) {
            return { success: false, error: 'Cita no encontrada.' }
        }

        // Check if already cancelled
        if (cita.cancelada) {
            return { success: false, error: 'La cita ya estaba cancelada.' }
        }

        // Check expiry
        const today = new Date().toISOString().split('T')[0]
        if (cita.Dia < today) {
            return { success: false, error: 'Este enlace ha expirado.' }
        }

        const { error: updateError } = await supabase
            .from('citas')
            .update({ cancelada: true, confirmada: false })
            .eq('uuid', uuid)

        if (updateError) throw updateError

        revalidatePath(`/cita/${uuid}`)
        return { success: true }
    } catch (err: any) {
        return { success: false, error: err.message || 'Error desconocido.' }
    }
}
