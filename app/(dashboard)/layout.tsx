"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import AuthGuard from "@/components/AuthGuard";
import LogoutButton from "@/components/LogoutButton";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
            <div className="flex h-screen overflow-hidden">
                <Sidebar />

                {/* CONTENIDO PRINCIPAL */}
                <div className="flex-1 overflow-y-auto bg-[#0a0a0a] relative pt-10 md:pt-0 pb-20 md:pb-0">
                    <LogoutButton />
                    {children}
                </div>
            </div>
        </AuthGuard>
    );
}
