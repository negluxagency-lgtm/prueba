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

    // 🛡️ RATE LIMITING (SQL Based)
    const { headers } = await import('next/headers');
    const headerList = await headers();
    const ip = headerList.get('x-forwarded-for') || 'unknown';

    // 1. Limpiar intentos viejos (> 15 min) para esta IP
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    // Usamos supabaseAdmin para saltar RLS en rate_limits
    await supabaseAdmin
        .from('rate_limits')
        .delete()
        .eq('ip', ip)
        .lt('last_attempt', fifteenMinutesAgo);

    // 2. Verificar intentos actuales
    const { data: limitData } = await supabaseAdmin
        .from('rate_limits')
        .select('attempts')
        .eq('ip', ip)
        .single();

    if (limitData && limitData.attempts >= 5) {
        console.warn(`🛑 Rate Limit Exceeded for IP: ${ip} (God Mode)`);
        return { error: 'Demasiados intentos. Espera 15 minutos.' };
    }

    // 3. Registrar/Incrementar intento
    if (limitData) {
        await supabaseAdmin
            .from('rate_limits')
            .update({
                attempts: limitData.attempts + 1,
                last_attempt: new Date().toISOString()
            })
            .eq('ip', ip);
    } else {
        await supabaseAdmin
            .from('rate_limits')
            .insert([{ ip, attempts: 1 }]);
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
