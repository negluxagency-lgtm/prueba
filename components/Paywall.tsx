'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, Star, Shield, X, Rocket, Zap, Heart, TrendingUp } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

interface PaywallProps {
    variant?: 'lock' | 'pricing';
    isSection?: boolean;
}

export const Paywall = ({ variant = 'lock', isSection = false }: PaywallProps) => {
    const [user, setUser] = useState<any>(null);
    const { status, plan: paidPlan, loading: subLoading } = useSubscription();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });
    }, []);

    const getLink = (baseUrl: string) => {
        if (!user) return baseUrl;
        return `${baseUrl}?client_reference_id=${user.id}&prefilled_email=${user.email}`;
    };

    const ALL_PLANS = [
        {
            name: "Básico",
            price: "49€",
            period: "/mes",
            description: "Para barberos independientes que están empezando.",
            features: ["Agenda ilimitada", "Gestión de clientes", "Reportes básicos", "Gestión de productos", "Sin tecnologías IA"],
            link: "https://buy.stripe.com/7sY4gy54TaRS9eL6vT28800",
            highlight: false,
            icon: Shield
        },
        {
            name: "Profesional",
            price: "75€",
            period: "/mes",
            description: "El más popular. Potencia total para tu negocio.",
            features: ["Todo lo del Básico", "Citas automáticas (IA)", "Métricas avanzadas (IA)", "Soporte preferente", "Recordatorio de citas"],
            link: "https://buy.stripe.com/bJe3cu8h50dedv18E128801",
            highlight: true,
            icon: Star
        },
        {
            name: "Premium",
            price: "99€",
            period: "/mes",
            description: "Para barberías profesionales.",
            features: ["Toda la tecnología IA", "Filtro Reviews Positivas", "Múltiples Barberos", "Soporte 24/7", "Recordatorio de citas"],
            link: "https://buy.stripe.com/5kQeVc40PbVWgHd2fD28802",
            highlight: false,
            icon: Shield
        }
    ];

    const isLock = variant === 'lock';

    // Filtrar planes si ya está pagado
    const displayPlans = (status === 'pagado' && paidPlan)
        ? ALL_PLANS.filter(p => p.name.toLowerCase() === paidPlan.toLowerCase())
        : ALL_PLANS;

    if (subLoading) return null;

    return (
        <div className={`${isSection ? '' : 'h-full w-full bg-[#0a0a0a] flex flex-col items-center justify-center p-4 md:p-8 pt-14 md:pt-8 overflow-y-auto relative'}`}>
            {/* Logout Button for Paywall */}
            {!isSection && (
                <button
                    onClick={() => supabase.auth.signOut()}
                    className="absolute top-4 md:top-4 right-4 z-50 text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest bg-black/20 hover:bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm"
                >
                    Cerrar Sesión
                </button>
            )}

            {/* Background Ambience */}
            {!isSection && (
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.05),transparent_70%)] pointer-events-none" />
            )}

            <div className="max-w-5xl w-full relative z-10">
                <div className="text-center mb-8 md:mb-16 mt-8 md:mt-0">
                    <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white mb-3 md:mb-4 leading-tight">
                        {status === 'pagado' ? (
                            <>Tu <span className="text-amber-500">Plan Actual</span></>
                        ) : isLock ? (
                            <>Activa <span className="text-amber-500">Nelux Barbershop</span></>
                        ) : (
                            <>Mejora tu <span className="text-amber-500">Plan</span></>
                        )}
                    </h1>
                    <p className="text-zinc-400 text-sm md:text-xl max-w-2xl mx-auto px-4">
                        {status === 'pagado'
                            ? "Aquí tienes las características incluidas en tu suscripción actual."
                            : isLock
                                ? "Tu periodo de prueba ha finalizado. Elige un plan para seguir gestionando tu imperio sin interrupciones."
                                : "Elige el plan que mejor se adapte a las necesidades de tu barbería."
                        }
                    </p>
                </div>

                {status !== 'pagado' && (
                    <div className="mb-8 md:mb-12 max-w-3xl mx-auto">
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 md:p-6 flex items-start gap-4">
                            <div className="p-2 bg-amber-500/20 rounded-lg shrink-0">
                                <Zap className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                                <h4 className="text-amber-500 font-bold text-sm uppercase tracking-wider mb-1">Información sobre Planes IA</h4>
                                <p className="text-zinc-400 text-xs md:text-sm leading-relaxed">
                                    Los planes que incluyen <span className="text-white font-bold">Citas automáticas (IA)</span> conllevan un cargo adicional del <span className="text-white font-bold">1% de lo facturado</span> a través de estas citas. Este importe se factura a final de mes para cubrir el coste de la línea de teléfono exclusiva y asegurar un uso óptimo de la IA.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className={`grid grid-cols-1 gap-6 md:gap-8 items-start pb-6 md:pb-0 ${displayPlans.length > 1 ? 'md:grid-cols-3' : 'md:max-w-md mx-auto'}`}>
                    {displayPlans.map((plan, index) => (
                        <div
                            key={index}
                            className={`
                                relative p-6 md:p-8 rounded-[2rem] border transition-all duration-300 group flex flex-col
                                ${plan.highlight || displayPlans.length === 1
                                    ? 'bg-zinc-900/80 border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.1)] md:scale-105 z-20'
                                    : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                                }
                            `}
                        >
                            {(plan.highlight && displayPlans.length > 1) && (
                                <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black font-bold px-3 py-1 rounded-full text-xs md:text-sm uppercase tracking-wider shadow-lg whitespace-nowrap">
                                    Más Popular
                                </div>
                            )}

                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2.5 md:p-3 rounded-xl ${plan.highlight || displayPlans.length === 1 ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-800 text-zinc-400'}`}>
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
                                    const isNegative = feature === "Sin tecnologías IA";

                                    return (
                                        <li key={i} className="flex items-start gap-3 text-xs md:text-sm">
                                            {isNegative ? (
                                                <X className="w-4 h-4 md:w-5 md:h-5 shrink-0 text-zinc-600 mt-0.5" />
                                            ) : (
                                                <Check className={`w-4 h-4 md:w-5 md:h-5 shrink-0 ${plan.highlight || displayPlans.length === 1 ? 'text-amber-500' : 'text-zinc-500'} mt-0.5`} />
                                            )}
                                            <span className={`leading-tight ${isNegative ? "text-zinc-500" : "text-zinc-300"}`}>
                                                {feature}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>

                            {status !== 'pagado' && (
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
                            )}
                        </div>
                    ))}
                </div>

                {/* Persuasive Sections for Pricing Variant */}
                {!isLock && (
                    <div className="mt-6 md:mt-16 border-t border-zinc-800/50 pt-8">
                        <div className="text-center mb-16">
                            <h2 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter text-white mb-4">
                                ¿Por qué elegir <span className="text-amber-500">Nelux</span>?
                            </h2>
                            <p className="text-zinc-500 max-w-xl mx-auto">
                                Diseñado por y para barberos que quieren escalar su negocio sin perder el control.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            <div className="text-center group">
                                <div className="inline-flex p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 mb-6 group-hover:scale-110 transition-transform">
                                    <Rocket className="w-8 h-8 text-amber-500" />
                                </div>
                                <h4 className="text-white font-bold uppercase tracking-wide mb-3">Escalabilidad Real</h4>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    Pasa de un sillón a una cadena de barberías con herramientas que crecen contigo.
                                </p>
                            </div>

                            <div className="text-center group">
                                <div className="inline-flex p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 mb-6 group-hover:scale-110 transition-transform">
                                    <Zap className="w-8 h-8 text-amber-500" />
                                </div>
                                <h4 className="text-white font-bold uppercase tracking-wide mb-3">Automatización IA</h4>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    Libera 10+ horas semanales delegando la gestión de citas a nuestra inteligencia artificial.
                                </p>
                            </div>

                            <div className="text-center group">
                                <div className="inline-flex p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 mb-6 group-hover:scale-110 transition-transform">
                                    <TrendingUp className="w-8 h-8 text-amber-500" />
                                </div>
                                <h4 className="text-white font-bold uppercase tracking-wide mb-3">Maximiza Ingresos</h4>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    Reduce no-shows y optimiza huecos libres para facturar hasta un 30% más cada mes.
                                </p>
                            </div>
                        </div>

                        <div className="mt-20 bg-gradient-to-br from-zinc-900/50 to-zinc-900/10 border border-zinc-800 p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Heart className="w-32 h-32 text-amber-500" />
                            </div>
                            <div className="relative z-10 max-w-2xl">
                                <h3 className="text-xl md:text-2xl font-black text-white italic uppercase mb-4">
                                    Únete a la <span className="text-amber-500">Revolución</span> del Sector
                                </h3>
                                <p className="text-zinc-400 text-sm md:text-base leading-relaxed mb-8">
                                    No somos solo un software de gestión. Somos tu socio estratégico. Entendemos el arte de la barbería y la importancia de un servicio impecable.
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-zinc-800">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        <span className="text-zinc-300 text-xs font-bold uppercase tracking-widest">Soporte 24/7</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-zinc-800">
                                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                                        <span className="text-zinc-300 text-xs font-bold uppercase tracking-widest">Actualizaciones Semanales</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {variant !== 'pricing' && (
                    <div className="mt-12 flex justify-center">
                        <a
                            href="https://billing.stripe.com/p/login/7sY4gy54TaRS9eL6vT28800"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 hover:bg-zinc-800 transition-all text-xs font-bold uppercase tracking-widest group"
                        >
                            <Shield className="w-4 h-4 group-hover:text-amber-500 transition-colors" />
                            Gestionar Suscripción
                        </a>
                    </div>
                )}

                <p className="text-center text-zinc-600 text-[10px] md:text-xs mt-8 md:mt-12 pb-8 md:pb-0">
                    🔒 Pagos procesados de forma segura por Stripe. Puedes cancelar en cualquier momento.
                </p>
            </div>
        </div>
    );
};