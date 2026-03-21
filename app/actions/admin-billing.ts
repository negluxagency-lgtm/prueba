'use server';

import supabaseAdmin from '@/lib/supabaseAdmin';
import { getRequiredSession } from '@/lib/auth-utils';

// 🛡️ REGLA: Esta Server Action se ejecuta SÓLO en el servidor.
// Encapsula la lógica de acceso privilegiado para no exponer supabaseAdmin en componentes.

export async function getAdminProfiles() {
    await getRequiredSession();
    // 1. Restricción de Entorno (Doble capa: Middleware + Action)
    if (process.env.NODE_ENV !== 'development') {
        throw new Error('Action not allowed in production');
    }

    const { data: profiles, error } = await supabaseAdmin
        .from('perfiles')
        .select('id, nombre_barberia, correo')
        .order('nombre_barberia', { ascending: true });

    if (error) {
        console.error('getAdminProfiles Error:', error.message);
        throw new Error('Failed to fetch profiles');
    }

    return profiles || [];
}

export async function getAdminBillingStats(barberiaId: string) {
    await getRequiredSession();
    if (process.env.NODE_ENV !== 'development') {
        throw new Error('Action not allowed in production');
    }

    if (!barberiaId) return null;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    const { data: appointments, error } = await supabaseAdmin
        .from('citas')
        .select('*')
        .eq('barberia_id', barberiaId)
        .gte('Dia', startOfMonth);

    if (error) {
        console.error('getAdminBillingStats Error:', error.message);
        throw new Error('Failed to fetch stats');
    }

    if (!appointments) return null;

    // Lógica de cálculo (idéntica a la original pero en servidor)
    const allCitas = appointments.filter(a => !a.producto);
    const totalApp = allCitas.length;
    const noShows = allCitas.filter(a => a.cancelada).length;
    const confirmed = allCitas.filter(a => a.confirmada && !a.cancelada);

    const revenueWithPrice = confirmed.reduce((sum, app) => sum + (Number(app.Precio) || 0), 0);
    const countWithoutPrice = confirmed.filter(a => !Number(a.Precio)).length;

    return {
        totalAppointments: totalApp,
        totalRevenue: revenueWithPrice,
        appointmentsWithoutPrice: countWithoutPrice,
        noShows: noShows
    };
}
