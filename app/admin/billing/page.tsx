import BillingClient from './BillingClient';
import { AlertCircle } from 'lucide-react';
import { getAdminProfiles, getAdminBillingStats } from '@/app/actions/admin-billing';

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminBillingPage({ searchParams }: PageProps) {
    // 1. Restricción de Seguridad: Solo Local (Capa Visual)
    if (process.env.NODE_ENV !== 'development') {
        return (
            <div className="h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
                <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl max-w-md text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-white font-bold text-xl mb-2 italic uppercase">Acceso Denegado</h1>
                    <p className="text-zinc-400 text-sm">
                        Esta herramienta administrativa solo funciona en localhost. Los Server Actions están bloqueados en producción.
                    </p>
                </div>
            </div>
        );
    }

    // 2. Await searchParams (Formato Next.js 15+)
    const resolvedParams = await searchParams;
    const barberiaName = resolvedParams.barberia as string || '';

    // 3. Obtener Datos via Server Actions (Seguro)
    const profiles = await getAdminProfiles().catch(err => {
        console.error('Error loading profiles:', err);
        return [];
    });

    const stats = await getAdminBillingStats(barberiaName).catch(err => {
        console.error('Error loading stats:', err);
        return null;
    });

    return (
        <BillingClient
            profiles={profiles}
            selectedBarberia={barberiaName}
            stats={stats}
        />
    );
}
