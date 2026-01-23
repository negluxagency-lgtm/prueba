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
    initialProfile
}: {
    children: React.ReactNode;
    initialProfile?: any;
}) {
    const { status, loading, daysRemaining, isProfileComplete } = useSubscription();
    const router = useRouter();

    useEffect(() => {
        // Redirigir si el perfil no está completo (falta configuración inicial)
        if (!loading && !isProfileComplete && status) {
            router.replace('/configuracion');
        }
    }, [loading, isProfileComplete, status, router]);

    // 0. Estado de Carga Global
    if (loading && !initialProfile) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#0a0a0a]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-zinc-800 border-t-amber-500 rounded-full animate-spin"></div>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest animate-pulse">Cargando Imperio...</p>
                </div>
            </div>
        );
    }

    if (status === 'impago') {
        // 1. CASO BLOQUEO (IMPAGO) - Renderiza SOLO el Paywall
        return (
            <div className="fixed inset-0 z-[100]">
                <Paywall />
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
            <TrialNoticeModal userStatus={status} />
        </div>
    );
}
