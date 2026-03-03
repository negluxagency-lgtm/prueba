"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, MessageSquare, Scissors, Package, CreditCard, User, FileText } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export function Sidebar() {
    const pathname = usePathname();
    const { plan } = useSubscription();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isActive = (path: string) => {
        if (!mounted) return "text-zinc-500";
        return pathname === path ? "text-amber-500" : "text-zinc-500";
    };

    return (
        <aside className="fixed bottom-0 left-0 right-0 h-16 md:relative md:h-full md:w-20 bg-black/90 md:bg-black backdrop-blur-lg md:backdrop-blur-none border-t md:border-t-0 md:border-r border-zinc-800 flex md:flex-col items-center justify-around md:justify-start md:py-8 md:gap-10 shrink-0 z-50">
            <nav className="flex md:flex-col items-center justify-around w-full md:w-auto md:gap-10">
                <Link href="/inicio" className="p-2 md:p-4">
                    <Scissors className={`${isActive("/inicio")} hover:text-amber-500 transition-colors cursor-pointer`} size={mounted && window.innerWidth < 768 ? 22 : 26} />
                </Link>

                <Link href="/trends" className="p-2 md:p-4">
                    <TrendingUp className={`${isActive("/trends")} hover:text-amber-500 transition-colors cursor-pointer`} size={mounted && window.innerWidth < 768 ? 22 : 26} />
                </Link>

                <Link href="/contabilidad" className="p-2 md:p-4">
                    <FileText className={`${isActive("/contabilidad")} hover:text-amber-500 transition-colors cursor-pointer`} size={mounted && window.innerWidth < 768 ? 22 : 26} />
                </Link>

                <Link href="/productos" className="p-2 md:p-4">
                    <Package className={`${isActive("/productos")} hover:text-amber-500 transition-colors cursor-pointer`} size={mounted && window.innerWidth < 768 ? 22 : 26} />
                </Link>

                {plan?.toLowerCase() === 'premium' && (
                    <Link href="/mensajes" className="p-2 md:p-4">
                        <MessageSquare className={`${isActive("/mensajes")} hover:text-amber-500 transition-colors cursor-pointer`} size={mounted && window.innerWidth < 768 ? 22 : 26} />
                    </Link>
                )}


                <Link href="/perfil" className="p-2 md:p-4">
                    <User className={`${isActive("/perfil")} hover:text-amber-500 transition-colors cursor-pointer`} size={mounted && window.innerWidth < 768 ? 22 : 26} />
                </Link>
            </nav>
        </aside>
    );
}
