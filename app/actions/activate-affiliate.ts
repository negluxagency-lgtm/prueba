'use server'

import { createClient } from '@/utils/supabase/server'

export async function activateAffiliate() {
    try {
        const supabase = await createClient()

        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
            return { error: 'No autorizado' }
        }

        const userId = session.user.id

        const { data: currentProfile, error: fetchError } = await supabase
            .from('perfiles')
            .select('afiliado, codigo')
            .eq('id', userId)
            .single()

        if (fetchError) {
            return { error: 'Error al verificar el perfil' }
        }

        if (currentProfile?.afiliado) {
            return { error: 'Ya estás inscrito en el programa de afiliados' }
        }

        // El usuario ya tiene su código en la base de datos (creado en su suscripción)
        const finalCode = currentProfile?.codigo

        if (!finalCode) {
            return { error: 'Todavía no tienes un código de afiliado disponible. Esto ocurre si aún no tienes una suscripción activa.' }
        }

        const { error: updateError } = await supabase
            .from('perfiles')
            .update({ 
                afiliado: true
            })
            .eq('id', userId)

        if (updateError) {
            console.error('Error actualizando afiliado:', updateError)
            return { error: 'Error al activar el programa de afiliados' }
        }

        return { success: true, codigo: finalCode }
    } catch (error) {
        console.error('Error in activateAffiliate:', error)
        return { error: 'Error interno del servidor' }
    }
}
