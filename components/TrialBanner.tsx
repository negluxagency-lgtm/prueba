import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface TrialBannerProps {
    daysRemaining: number;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({ daysRemaining }) => {
    // Mantener la lógica de usuario por si queremos personalizar el saludo
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });
    }, []);

    return (
        <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full bg-indigo-600 text-white shadow-lg shadow-indigo-900/20 backdrop-blur-sm bg-opacity-95"
        >
            <div className="max-w-7xl mx-auto px-3 py-2 md:px-4 md:py-3 flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-6 text-xs md:text-sm lg:text-base text-center md:text-left">

                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-indigo-200 animate-pulse shrink-0" />
                    <span className="font-medium leading-tight">
                        Te quedan <span className="font-black bg-white/20 px-1.5 py-0.5 rounded text-white">{daysRemaining} días</span> de prueba. No incluye IA/mensajes.
                    </span>
                </div>

                <Link
                    href="/pricing"
                    className="group flex items-center gap-2 bg-white text-indigo-700 px-3 py-1 md:px-4 md:py-1.5 rounded-full font-bold hover:bg-indigo-50 transition-all active:scale-95 shadow-sm whitespace-nowrap"
                >
                    Suscríbete
                    <ArrowRight className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </motion.div>
    );
};
