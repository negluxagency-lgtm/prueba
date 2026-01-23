'use server'

import supabaseAdmin from '@/lib/supabaseAdmin'
import { createClient } from '@/utils/supabase/server'

export async function impersonateUser(formData: FormData) {
    const email = formData.get('email') as string

    // 🛡️ SEGURIDAD: Verificar que el usuario que llama sea un admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // RESTRICCIÓN: Solo emails autorizados pueden usar el God Mode
    const ADMIN_EMAILS = ['vanguardiait@gmail.com', 'juanmab94@gmail.com'] // Añadir emails de admin aquí

    if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
        console.error('Intento de impersonación no autorizado por:', user?.email)
        return { error: 'No tienes permisos para realizar esta acción.' }
    }

    // Generar link mágico con permisos de admin
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
    })

    if (error) {
        console.error('Error generando link:', error)
        return { error: error.message }
    }

    // Devolvemos el link completo para hacer clic
    return { url: data.properties?.action_link }
}
