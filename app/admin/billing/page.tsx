import { createClient } from '@supabase/supabase-js';
import BillingClient from './BillingClient';
import { AlertCircle } from 'lucide-react';

// 🛡️ REGLA DE ORO: Supabase Admin SOLO en el Servidor
// Utilizamos el cliente directo de supabase-js para usar la Service Key y saltar el RLS.
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminBillingPage({ searchParams }: PageProps) {
    // 1. Restricción de Seguridad: Solo Local
    if (process.env.NODE_ENV !== 'development') {
        return (
            <div className="h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
                <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl max-w-md text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-white font-bold text-xl mb-2 italic uppercase">Acceso Denegado</h1>
                    <p className="text-zinc-400 text-sm">
                        Esta herramienta administrativa solo funciona en localhost. La Service Key nunca se expone al navegador.
                    </p>
                </div>
            </div>
        );
    }

    // 2. Await searchParams (Formato Next.js 15+)
    const resolvedParams = await searchParams;
    const barberiaName = resolvedParams.barberia as string || '';

    // 3. Obtener Lista de Barberías (By-passing RLS con SERVICE_ROLE_KEY)
    const { data: profiles, error: pError } = await supabaseAdmin
        .from('perfiles')
        .select('nombre_barberia, correo')
        .order('nombre_barberia', { ascending: true });

    if (pError) {
        console.error('Error fetching profiles with Service Key:', pError.message);
    }

    // 4. Obtener Estadísticas si hay una barbería seleccionada
    let stats = null;
    if (barberiaName) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

        const { data: appointments, error: cError } = await supabaseAdmin
            .from('citas')
            .select('*')
            .eq('barberia', barberiaName)
            .gte('Dia', startOfMonth);

        if (!cError && appointments) {
            // Filtrar solo citas (no ventas de productos)
            const allCitas = appointments.filter(a => !a.producto);
            const totalApp = allCitas.length;
            const noShows = allCitas.filter(a => a.cancelada).length;

            // Citas que cuentan para ingresos (Confirmadas y NO canceladas)
            const confirmed = allCitas.filter(a => a.confirmada && !a.cancelada);

            // Separamos las que tienen precio de las que no
            const revenueWithPrice = confirmed.reduce((sum, app) => sum + (Number(app.Precio) || 0), 0);
            const countWithoutPrice = confirmed.filter(a => !Number(a.Precio)).length;

            stats = {
                totalAppointments: totalApp,
                totalRevenue: revenueWithPrice,
                appointmentsWithoutPrice: countWithoutPrice,
                noShows: noShows
            };
        } else if (cError) {
            console.error('Error fetching appointments with Service Key:', cError.message);
        }
    }

    return (
        <BillingClient
            profiles={profiles || []}
            selectedBarberia={barberiaName}
            stats={stats}
        />
    );
}
