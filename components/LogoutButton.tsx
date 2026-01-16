"use client";

import { supabase } from "@/lib/supabase";

export default function LogoutButton() {
    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <button
            onClick={handleLogout}
            className="absolute top-4 right-4 md:top-6 md:right-8 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-500 hover:text-white border border-zinc-800 px-3 py-1 md:px-4 md:py-2 rounded-xl text-[8px] md:text-xs font-black uppercase tracking-widest transition-all z-[40] backdrop-blur-xl shadow-2xl active:scale-95"
        >
            Salir
        </button>
    );
}
