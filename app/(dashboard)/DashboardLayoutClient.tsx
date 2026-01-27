"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import LogoutButton from "@/components/LogoutButton";
import { useSubscription } from "@/hooks/useSubscription";
import { Paywall } from "@/components/Paywall";
import { TrialBanner } from "@/components/TrialBanner";
import { TrialNoticeModal } from "@/components/TrialNoticeModal";

export default function DashboardLayoutClient({
    children,
    initialProfile,
    serverStatus
}: {
    children: React.ReactNode;
    initialProfile?: any;
    serverStatus?: string;
}) {
    const { status: clientStatus, loading, daysRemaining, isProfileComplete } = useSubscription();
    const router = useRouter();

    // Prioridad: Estado cliente (actualizado) > Estado servidor (inicial)
    const status = clientStatus || serverStatus;

    // Si tenemos estado del servidor, no estamos "cargando" visualmente (ya tenemos decisión)
    const isLoading = loading && !serverStatus;

    // FIX: Usar initialProfile mientras el hook carga (isProfileComplete empieza en false)
    const resolvedIsProfileComplete = !loading ? isProfileComplete : (initialProfile?.onboarding_completado === true);

    useEffect(() => {
        // Redirigir si el perfil no está completo (falta configuración inicial)
        if (!isLoading && resolvedIsProfileComplete === false && status) {
            router.replace('/configuracion');
        }
    }, [isLoading, resolvedIsProfileComplete, status, router]);

    // 0. Estado de Carga Global (solo si no tenemos ni perfil ni estado del servidor)
    if (isLoading && !initialProfile) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#0a0a0a]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-zinc-800 border-t-amber-500 rounded-full animate-spin"></div>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest animate-pulse">Cargando Imperio...</p>
                </div>
            </div>
        );
    }

    // 1. CASO BLOQUEO (IMPAGO) - Renderiza LAYOUT CON SIDEBAR + PAYWALL
    if (status === 'impago') {
        return (
            <div className="flex h-screen overflow-hidden flex-col md:flex-row">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a] relative">
                    <Paywall />
                </div>
                {/* Modal informativo por si acaso, aunque el Paywall ya es explícito */}
                <TrialNoticeModal userStatus={status} />
            </div>
        );
    }

    // 2. CASO ACCESO PERMITIDO (PAGADO o PRUEBA)
    return (
        <div className="flex h-screen overflow-hidden flex-col md:flex-row">
            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a] relative">
                {/* Banner solo si está en prueba */}
                {status === 'prueba' && (
                    <div className="fixed top-0 left-0 right-0 md:relative md:top-auto z-[60] shrink-0">
                        <TrialBanner daysRemaining={daysRemaining} />
                    </div>
                )}

                <div className={`flex-1 overflow-y-auto relative flex flex-col ${status === 'prueba' ? 'pt-[52px] md:pt-0' : ''}`}>
                    <div className="relative flex-1 pt-0 md:pt-0 pb-20 md:pb-0">
                        <LogoutButton />
                        {children}
                    </div>
                </div>
            </div>
            <TrialNoticeModal userStatus={status as any} />
        </div>
    );
}
