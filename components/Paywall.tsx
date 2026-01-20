import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, Star, Shield, X } from 'lucide-react';

interface PaywallProps {
    variant?: 'lock' | 'pricing';
}

export const Paywall = ({ variant = 'lock' }: PaywallProps) => {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });
    }, []);

    const getLink = (baseUrl: string) => {
        if (!user) return baseUrl;
        return `${baseUrl}?client_reference_id=${user.id}&prefilled_email=${user.email}`;
    };

    const PLANS = [
        {
            name: "Básico",
            price: "50€",
            period: "/mes",
            description: "Para barberos independientes que están empezando.",
            features: ["Agenda ilimitada", "Gestión de clientes", "Reportes básicos", "Sin tecnologías IA"],
            link: "https://buy.stripe.com/7sY4gy54TaRS9eL6vT28800",
            highlight: false,
            icon: Shield
        },
        {
            name: "Premium",
            price: "75€",
            period: "/mes",
            description: "El más popular. Potencia total para tu negocio.",
            features: ["Todo lo del Básico", "Citas automáticas (IA)", "Métricas avanzadas (IA)", "Soporte horas laborales"],
            link: "https://buy.stripe.com/5kQeVc40PbVWgHd2fD28802",
            highlight: true,
            icon: Star
        },
        {
            name: "Profesional",
            price: "99€",
            period: "/mes",
            description: "Para barberías profesionales.",
            features: ["Filtro Reviews Positivas", "Múltiples Barberos", "Soporte 24/7", "Consultoría Mensual"],
            link: "https://buy.stripe.com/bJe3cu8h50dedv18E128801",
            highlight: false,
            icon: Shield
        }
    ];

    const isLock = variant === 'lock';

    return (
        <div className="h-full w-full bg-[#0a0a0a] flex flex-col items-center justify-center p-4 md:p-8 pt-14 md:pt-8 overflow-y-auto relative">
            {/* Logout Button for Paywall */}
            <button
                onClick={() => supabase.auth.signOut()}
                className="absolute top-4 md:top-4 right-4 z-50 text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest bg-black/20 hover:bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm"
            >
                Cerrar Sesión
            </button>

            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.05),transparent_70%)] pointer-events-none" />

            <div className="max-w-5xl w-full relative z-10">
                <div className="text-center mb-8 md:mb-16 mt-8 md:mt-0">
                    <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white mb-3 md:mb-4 leading-tight">
                        {isLock ? (
                            <>Activa <span className="text-amber-500">Nelux Barbershop</span></>
                        ) : (
                            <>Mejora tu <span className="text-amber-500">Plan</span></>
                        )}
                    </h1>
                    <p className="text-zinc-400 text-sm md:text-xl max-w-2xl mx-auto px-4">
                        {isLock
                            ? "Tu periodo de prueba ha finalizado. Elige un plan para seguir gestionando tu imperio sin interrupciones."
                            : "Elige el plan que mejor se adapte a las necesidades de tu barbería."
                        }
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start pb-12 md:pb-0">
                    {PLANS.map((plan, index) => (
                        <div
                            key={index}
                            className={`
                                relative p-6 md:p-8 rounded-[2rem] border transition-all duration-300 group flex flex-col
                                ${plan.highlight
                                    ? 'bg-zinc-900/80 border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.1)] md:scale-105 z-20 order-first md:order-none'
                                    : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                                }
                            `}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black font-bold px-3 py-1 rounded-full text-xs md:text-sm uppercase tracking-wider shadow-lg whitespace-nowrap">
                                    Más Popular
                                </div>
                            )}

                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2.5 md:p-3 rounded-xl ${plan.highlight ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-800 text-zinc-400'}`}>
                                    <plan.icon className="w-5 h-5 md:w-6 md:h-6" />
                                </div>
                                <h3 className="text-lg md:text-xl font-bold text-white uppercase">{plan.name}</h3>
                            </div>

                            <div className="mb-4 md:mb-6">
                                <span className="text-3xl md:text-4xl font-black text-white">{plan.price}</span>
                                <span className="text-zinc-500 font-medium text-sm md:text-base">{plan.period}</span>
                            </div>

                            <p className="text-zinc-400 text-xs md:text-sm mb-6 md:mb-8 min-h-[40px] leading-relaxed">
                                {plan.description}
                            </p>

                            <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8 flex-1">
                                {plan.features.map((feature, i) => {
                                    // 🟢 LÓGICA DE ICONOS AÑADIDA AQUÍ
                                    const isNegative = feature === "Sin tecnologías IA";

                                    return (
                                        <li key={i} className="flex items-start gap-3 text-xs md:text-sm">
                                            {isNegative ? (
                                                <X className="w-4 h-4 md:w-5 md:h-5 shrink-0 text-zinc-600 mt-0.5" />
                                            ) : (
                                                <Check className={`w-4 h-4 md:w-5 md:h-5 shrink-0 ${plan.highlight ? 'text-amber-500' : 'text-zinc-500'} mt-0.5`} />
                                            )}
                                            <span className={`leading-tight ${isNegative ? "text-zinc-500" : "text-zinc-300"}`}>
                                                {feature}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>

                            <a
                                href={getLink(plan.link)}
                                className={`
                                    block w-full py-3 md:py-4 rounded-xl font-black text-center text-xs md:text-sm uppercase tracking-wide transition-all
                                    ${plan.highlight
                                        ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/20'
                                        : 'bg-zinc-800 text-white hover:bg-zinc-700'
                                    }
                                `}
                            >
                                Seleccionar Plan
                            </a>
                        </div>
                    ))}
                </div>

                <p className="text-center text-zinc-600 text-[10px] md:text-xs mt-8 md:mt-12 pb-8 md:pb-0">
                    🔒 Pagos procesados de forma segura por Stripe. Puedes cancelar en cualquier momento.
                </p>
            </div>
        </div>
    );
};