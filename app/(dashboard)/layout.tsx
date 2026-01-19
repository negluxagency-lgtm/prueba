"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import AuthGuard from "@/components/AuthGuard";
import LogoutButton from "@/components/LogoutButton";
import { useSubscription } from "@/hooks/useSubscription";
import { Paywall } from "@/components/Paywall";
import { TrialBanner } from "@/components/TrialBanner";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { status, loading, daysRemaining } = useSubscription();

    return (
        <AuthGuard>
            {/* 0. Estado de Carga Global */}
            {loading ? (
                <div className="h-screen w-full flex items-center justify-center bg-[#0a0a0a]">
                    {/* Spinner Elegante */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-zinc-800 border-t-amber-500 rounded-full animate-spin"></div>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest animate-pulse">Cargando Imperio...</p>
                    </div>
                </div>
            ) : status === 'impago' ? (
                // 1. CASO BLOQUEO (IMPAGO) - Renderiza SOLO el Paywall
                <Paywall />
            ) : (
                // 2. CASO ACCESO PERMITIDO (PAGADO o PRUEBA)
                <div className="flex h-screen overflow-hidden flex-col md:flex-row">

                    <Sidebar />

                    {/* CONTENIDO PRINCIPAL */}
                    <div className="flex-1 overflow-y-auto bg-[#0a0a0a] relative flex flex-col">

                        {/* Banner solo si está en prueba */}
                        {status === 'prueba' && (
                            <TrialBanner daysRemaining={daysRemaining} />
                        )}

                        <div className="relative flex-1 pt-10 md:pt-0 pb-20 md:pb-0">
                            <LogoutButton />
                            {children}
                        </div>
                    </div>
                </div>
            )}
        </AuthGuard>
    );
}
