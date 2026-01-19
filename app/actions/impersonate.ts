'use server'

import supabaseAdmin from '@/lib/supabaseAdmin'

export async function impersonateUser(formData: FormData) {
    const email = formData.get('email') as string

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
