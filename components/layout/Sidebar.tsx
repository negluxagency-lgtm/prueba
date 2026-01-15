"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, TrendingUp, MessageSquare, Scissors } from "lucide-react";

export function Sidebar() {
    const pathname = usePathname();
    const isActive = (path: string) => pathname === path ? "text-amber-500" : "text-zinc-500";

    return (
        <aside className="fixed bottom-0 left-0 right-0 h-16 md:relative md:h-full md:w-20 bg-black/90 md:bg-black backdrop-blur-lg md:backdrop-blur-none border-t md:border-t-0 md:border-r border-zinc-800 flex md:flex-col items-center justify-around md:justify-start md:py-8 md:gap-10 shrink-0 z-50">
            <Link href="/" className="hidden md:block">
                <div className="p-3 bg-amber-500 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer active:scale-90 transition-transform">
                    <Scissors className="text-black" size={24} />
                </div>
            </Link>

            <nav className="flex md:flex-col items-center justify-around w-full md:w-auto md:gap-10">
                <Link href="/" className="p-4">
                    <Calendar className={`${isActive("/")} hover:text-amber-500 transition-colors cursor-pointer`} size={26} />
                </Link>

                <Link href="/trends" className="p-4">
                    <TrendingUp className={`${isActive("/trends")} hover:text-amber-500 transition-colors cursor-pointer`} size={26} />
                </Link>

                <Link href="/mensajes" className="p-4">
                    <MessageSquare className={`${isActive("/mensajes")} hover:text-amber-500 transition-colors cursor-pointer`} size={26} />
                </Link>
            </nav>
        </aside>
    );
}
