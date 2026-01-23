'use strict';

import React from 'react';
import { Paywall } from '@/components/Paywall';

export const metadata = {
    title: 'Precios | Nelux Barbershop',
    description: 'Elige el plan que mejor se adapte a tu barbería y empieza a crecer hoy mismo.',
};

export default function PricingPage() {
    return (
        <main className="min-h-screen bg-[#0a0a0a]">
            {/* Nav placeholder for pricing page if needed, but Paywall has a back/home flow usually or is standalone */}
            <div className="pt-8 px-6 max-w-7xl mx-auto">
                <a
                    href="/"
                    className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
                >
                    ← Volver al inicio
                </a>
            </div>
            <Paywall variant="pricing" isSection={false} />
        </main>
    );
}
