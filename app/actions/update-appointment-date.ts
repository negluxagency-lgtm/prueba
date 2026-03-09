'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function updateAppointmentDate(
    uuid: string,
    newDia: string,
    newHora: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data: cita, error: fetchError } = await supabase
            .from('citas')
            .select('id, Dia, cancelada')
            .eq('uuid', uuid)
            .single()

        if (fetchError || !cita) return { success: false, error: 'Cita no encontrada.' }
        if (cita.cancelada) return { success: false, error: 'La cita está cancelada.' }

        // Don't allow editing past appointments
        const today = new Date().toISOString().split('T')[0]
        if (cita.Dia < today) return { success: false, error: 'Este enlace ha expirado.' }

        // New date must be in the future too
        if (newDia < today) return { success: false, error: 'La nueva fecha debe ser futura.' }

        const { error: updateError } = await supabase
            .from('citas')
            .update({ Dia: newDia, Hora: newHora, confirmada: false })
            .eq('uuid', uuid)

        if (updateError) throw updateError

        revalidatePath(`/cita/${uuid}`)
        return { success: true }
    } catch (err: any) {
        return { success: false, error: err.message || 'Error desconocido.' }
    }
}
