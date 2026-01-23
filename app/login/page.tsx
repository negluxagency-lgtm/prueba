"use client";

import AuthGuard from "@/components/AuthGuard";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.replace('/inicio');
            }
        };
        checkSession();
    }, [router]);

    return (
        <AuthGuard>
            <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
                <div className="text-amber-500 font-bold animate-pulse">REDIRECCIONANDO AL DASHBOARD...</div>
            </div>
        </AuthGuard>
    );
}
