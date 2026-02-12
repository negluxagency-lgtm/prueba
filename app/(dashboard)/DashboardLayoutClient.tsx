"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import LogoutButton from "@/components/LogoutButton";
import { useSubscription } from "@/hooks/useSubscription";
import { Paywall } from "@/components/Paywall";
import { TrialBanner } from "@/components/TrialBanner";
import { TrialNoticeModal } from "@/components/TrialNoticeModal";
import MonthlyClosingModal from "@/components/MonthlyClosingModal";
import { AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DashboardLayoutClient({
    children,
    initialProfile,
    serverStatus,
    calendarioConfirmed
}: {
    children: React.ReactNode;
    initialProfile?: any;
    serverStatus?: string;
    calendarioConfirmed?: boolean;
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
                    <Paywall showAllPlans={true} />
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
                    {/* Banner de Confirmación de Calendario (NUEVO) */}
                    {!isLoading && calendarioConfirmed === false && (
                        <div className="bg-amber-500/10 border-b border-amber-500/20 p-3 md:p-4 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 animate-in slide-in-from-top duration-500">
                            <div className="flex items-center gap-2 text-amber-500">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-xs md:text-sm font-bold uppercase tracking-wider">
                                    Acción Requerida: Planificación mensual pendiente
                                </p>
                            </div>
                            <Link
                                href="/perfil"
                                className="flex items-center gap-2 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-[10px] md:text-xs font-black uppercase rounded-full transition-all hover:scale-105 active:scale-95"
                            >
                                Gestionar Cierres
                                <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    )}

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
