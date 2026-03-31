import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { getDashboardStats } from "@/app/actions/cash";
import { getLocalISOString } from "@/utils/date-helper";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const selectedDate = getLocalISOString();

    // Fetch todo en paralelo en el servidor
    const [profileRes, appointmentsRes, servicesRes, barbersRes, statsRes] = await Promise.all([
        supabase.from('perfiles').select('*').eq('id', user.id).single(),
        supabase.from('citas')
            .select('id, uuid, created_at, Nombre, servicio, Servicio_id, Dia, Hora, Telefono, Precio, confirmada, cancelada, barbero, barbero_id, pago')
            .eq('Dia', selectedDate)
            .eq('barberia_id', user.id)
            .order('Hora', { ascending: true }),
        supabase.from('servicios').select('id, nombre, precio').eq('barberia_id', user.id),
        supabase.from('barberos').select('id, nombre, foto').eq('barberia_id', user.id),
        getDashboardStats(user.id, selectedDate)
    ]);

    const profile = profileRes.data;
    
    // Preparar el fallback para SWR en el cliente
    const fallback: { [key: string]: any } = {
        [JSON.stringify(['shop-data', user.id])]: {
            services: servicesRes.data || [],
            barbers: barbersRes.data || [],
            profile: profile
        },
        [JSON.stringify(['appointments', selectedDate, user.id])]: appointmentsRes.data || [],
        [JSON.stringify(['user-plan', user.id])]: profile?.plan || 'basico',
        [JSON.stringify(['dashboard-metrics-server', selectedDate, user.id])]: statsRes.success ? {
            metrics: statsRes.data.metrics,
            objectives: {
                ingresos: Number(profile?.ingresos_dia) || 0,
                cortes: Number(profile?.cortes_dia) || 0,
                productos: Number(profile?.productos_dia) || 0
            },
            cajaInicial: statsRes.data.cajaInicial
        } : null
    };

    return (
        <DashboardContent 
            userId={user.id} 
            profile={profile} 
            fallback={fallback}
        />
    );
}