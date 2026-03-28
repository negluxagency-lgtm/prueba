'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, Star, Shield, X, Rocket, Zap, Heart, TrendingUp, Loader2 } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import ManageSubscriptionButton from '@/components/ManageSubscriptionButton';

interface PaywallProps {
    variant?: 'lock' | 'pricing';
    isSection?: boolean;
    showAllPlans?: boolean; // Si true, siempre muestra los 4 planes. Si false, filtra por plan actual cuando está pagado.
}

export const Paywall = ({ variant = 'lock', isSection = false, showAllPlans = false }: PaywallProps) => {
    const [user, setUser] = useState<any>(null);
    const { status, plan: paidPlan, loading: subLoading } = useSubscription();
    const [expandedPlans, setExpandedPlans] = useState<number[]>([]);
    const [expandedIa, setExpandedIa] = useState(false);

    const togglePlan = (idx: number) => {
        setExpandedPlans(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });
    }, []);

    const getLink = (baseUrl: string) => {
        if (!user) return '/register';
        // client_reference_id usa el UUID de Supabase Auth que coincide con perfiles.id
        return `${baseUrl}?client_reference_id=${user.id}&prefilled_email=${user.email}`;
    };

    const ALL_PLANS = [
        {
            name: "Básico",
            price: "19€",
            period: "/mes",
            description: "Para barberos independientes que están empezando.",
            features: ["Agenda ilimitada", "Página de citas personalizada", "Gestión de gastos e ingresos", "Gestión de clientes", "Reportes básicos", "Gestión de productos"],
            perfilFeatures: [
                "Agenda ilimitada",
                "Página de citas personalizada",
                "Gestión de gastos e ingresos",
                "Gestión de clientes",
                "Gestión de productos"
            ],
            link: "https://buy.stripe.com/5kQ00i2WL7FG1Mj3jH28803",
            highlight: false,
            icon: Shield
        },
        {
            name: "Profesional",
            price: "49€",
            period: "/mes",
            description: "El más popular. Potencia total para tu negocio.",
            features: ["Todo lo del plan Básico", "Métricas avanzadas", "Gestión de equipo y fichajes", "Portal personalizdo para tus barberos", "Recordatorios de citas por WhatsApp", "Gestión de Facturas y Salarios (Cumplimiento Veri*factu obligatorio 2026)"],
            perfilFeatures: [
                "Agenda ilimitada",
                "Página de citas personalizada",
                "Gestión de gastos e ingresos",
                "Gestión de clientes",
                "Gestión de productos",
                "Métricas avanzadas",
                "Gestión de equipo y fichajes",
                "Portal personalizdo para tus barberos",
                "Recordatorios de citas por WhatsApp"
            ],
            link: "https://buy.stripe.com/fZu8wOcxl1hi0Ifg6t28804",
            highlight: true,
            icon: Star
        },
        {
            name: "Premium",
            price: "99€",
            period: "/mes",
            description: "Para barberías profesionales.",
            features: ["Todo lo del plan Profesional", "Soporte 24/7", "Consultoría mensual", "Gestión Contable Total", "Filtro Reviews positivas de Google"],
            perfilFeatures: [
                "Agenda ilimitada",
                "Página de citas personalizada",
                "Gestión de gastos e ingresos",
                "Gestión de clientes",
                "Gestión de productos",
                "Métricas avanzadas",
                "Gestión de equipo y fichajes",
                "Portal personalizdo para tus barberos",
                "Recordatorios de citas por WhatsApp",
                "Soporte 24/7",
                "Consultoría mensual",
                "Gestión Contable Total",
                "Filtro Reviews positivas de Google"
            ],
            link: "https://buy.stripe.com/5kQeVc40PbVWgHd2fD28802",
            highlight: false,
            icon: Shield
        },
        {
            name: "IA Personalizada",
            price: "149€",
            period: "/mes",
            description: "Una IA personalizada para tu barbería para que nunca jamás tengas que agendar una cita manualmente, da igual por donde te coctacten.",
            perfilDescription: "Enhorabuena, con este plan tienes debloqueado el software al completo incluyendo: Agenda ilimitada, Página de citas personalizada, Gestión de gastos e ingresos, Gestión de equipo, fichajes y salarios, soporte inmediato, Consultoría mensual.\n\nY lo más importante, una IA personalizada de tu barbería que contestará a tus llamadas y mensajes.",
            features: ["Todo lo del plan Premium", "Apartado de mensajes con clientes", "Tu IA personalizada responde WhatsApp, al teléfono y agenda citas 24/7", "Soporte inmediato"],
            perfilFeatures: [],
            link: "https://wa.me/34623064127",
            highlight: false,
            icon: Shield,
            isContact: true
        }
    ];

    const isLock = variant === 'lock';
    const isCurrentPlanView = status === 'pagado' && !showAllPlans;

    // Filtrar planes si ya está pagado (solo si showAllPlans === false)
    const displayPlans = (!showAllPlans && status === 'pagado' && paidPlan)
        ? ALL_PLANS.filter(p => {
              const nameLower = p.name.toLowerCase();
              const paidLower = paidPlan.toLowerCase();
              return nameLower === paidLower || (nameLower === 'ia personalizada' && paidLower === 'ia');
          })
        : ALL_PLANS;

    const normalPlans = displayPlans.filter(p => !p.isContact);
    const iaPlan = displayPlans.find(p => p.isContact);

    if (subLoading) {
        if (isSection) {
            return (
                <div className="w-full flex justify-center py-12">
                    <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                </div>
            );
        }
        return null;
    }

    return (
        <div className={`${isSection ? '' : 'h-full w-full bg-[#0a0a0a] flex flex-col items-center justify-start p-4 lg:p-8 pt-20 lg:pt-8 overflow-y-auto relative'}`}>
            {/* Logout Button for Paywall */}
            {!isSection && variant !== 'pricing' && (
                <button
                    onClick={() => supabase.auth.signOut()}
                    className="fixed top-4 lg:top-4 right-4 z-50 text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest bg-black/40 hover:bg-black/60 px-3 py-1.5 rounded-lg backdrop-blur-md border border-zinc-800/50"
                >
                    Cerrar Sesión
                </button>
            )}

            {/* Background Ambience */}
            {!isSection && (
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.05),transparent_70%)] pointer-events-none" />
            )}

            <div className="max-w-5xl w-full relative z-10 pb-0 lg:pb-0">
                <div className="text-center mb-8 lg:mb-16 mt-8 lg:mt-0">
                    <h1 className="text-3xl lg:text-5xl font-black italic uppercase tracking-tighter text-white mb-3 lg:mb-4 leading-tight">
                        {isCurrentPlanView ? (
                            <>Tu <span className="text-amber-500">Plan Actual</span></>
                        ) : isLock ? (
                            <>Activa <span className="text-amber-500">Nelux Barbershop</span></>
                        ) : (
                            <>Planes <span className="text-amber-500">Disponibles</span></>
                        )}
                    </h1>
                    <p className="text-zinc-400 text-sm lg:text-xl max-w-2xl mx-auto px-4">
                        {status === 'pagado' && variant !== 'pricing'
                            ? "Aquí tienes las características incluidas en tu suscripción actual."
                            : isLock
                                ? "Elige un plan para seguir gestionando tu imperio sin interrupciones."
                                : "Elige el plan que mejor se adapte a las necesidades de tu barbería."
                        }
                    </p>
                    {(!status || status !== 'pagado') && (
                        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs lg:text-sm font-bold tracking-wide">
                            <Zap className="w-4 h-4" />
                            <span>Prueba gratuita de 7 días. <span className="text-white">Sin tarjeta de crédito.</span></span>
                        </div>
                    )}
                </div>



                <div className={`grid grid-cols-1 gap-6 lg:gap-8 items-start pb-6 lg:pb-0 ${(!isSection && normalPlans.length > 1) ? 'lg:grid-cols-3' : 'lg:max-w-md mx-auto w-full'}`}>
                    {normalPlans.map((plan, index) => (
                        <div
                            key={index}
                            className={`
                                relative p-6 lg:p-8 rounded-[2rem] border transition-all duration-300 group flex flex-col
                                bg-zinc-900/40 border-zinc-800 hover:border-amber-500/20 hover:bg-zinc-900/60 shadow-xl
                            `}
                        >
                            {(plan.highlight && normalPlans.length > 1) && (
                                <div className="absolute -top-3 lg:-top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black font-bold px-3 py-1 rounded-full text-xs lg:text-sm uppercase tracking-wider shadow-lg whitespace-nowrap">
                                    Más Popular
                                </div>
                            )}

                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2.5 lg:p-3 rounded-xl bg-zinc-800 text-zinc-400 group-hover:text-amber-500 transition-colors`}>
                                    <plan.icon className="w-5 h-5 lg:w-6 lg:h-6" />
                                </div>
                                <h3 className="text-lg lg:text-xl font-bold text-white uppercase">{plan.name}</h3>
                            </div>

                            <div className="mb-4 lg:mb-6">
                                <span className="text-3xl lg:text-4xl font-black text-white">{plan.price}</span>
                                <span className="text-zinc-500 font-medium text-sm lg:text-base">{plan.period}</span>
                            </div>

                            <p className="text-zinc-400 text-xs lg:text-sm mb-6 lg:mb-8 min-h-[40px] leading-relaxed">
                                {isCurrentPlanView && plan.perfilDescription ? plan.perfilDescription : plan.description}
                            </p>

                            <ul className="space-y-3 lg:space-y-4 mb-6 lg:mb-8 flex-1">
                                {(isCurrentPlanView ? plan.perfilFeatures : plan.features).map((feature, i) => {
                                    const isNegative = feature === "Sin tecnologías IA";
                                    const isHiddenOnMobile = !expandedPlans.includes(index) && i >= 3;

                                    return (
                                        <li key={i} className={`items-start gap-3 text-xs lg:text-sm ${isHiddenOnMobile ? (isSection ? 'hidden' : 'hidden lg:flex') : 'flex'}`}>
                                            {isNegative ? (
                                                <X className="w-4 h-4 lg:w-5 lg:h-5 shrink-0 text-zinc-600 mt-0.5" />
                                            ) : (
                                                <Check className={`w-4 h-4 lg:w-5 lg:h-5 shrink-0 text-amber-500/50 group-hover:text-amber-500 transition-colors mt-0.5`} />
                                            )}
                                            <span className={`leading-tight ${isNegative ? "text-zinc-500" : "text-zinc-300"}`}>
                                                {feature}
                                            </span>
                                        </li>
                                    );
                                })}
                                
                                {(isCurrentPlanView ? plan.perfilFeatures : plan.features).length > 3 && (
                                    <button 
                                        onClick={() => togglePlan(index)}
                                        className={`${isSection ? '' : 'lg:hidden'} w-full text-center mt-4 text-[10px] font-bold uppercase tracking-widest text-amber-500/80 hover:text-amber-400 transition-colors py-2.5 border border-dashed border-amber-500/20 rounded-xl`}
                                    >
                                        {expandedPlans.includes(index) ? 'Ver menos' : 'Ver todos los beneficios'}
                                    </button>
                                )}
                            </ul>

                            {status !== 'pagado' && (
                                <a
                                    href={plan.isContact ? plan.link : getLink(plan.link)}
                                    target={plan.isContact ? "_blank" : undefined}
                                    rel={plan.isContact ? "noopener noreferrer" : undefined}
                                    className={`
                                            block w-full py-3 lg:py-4 rounded-xl font-black text-center text-[10px] lg:text-xs uppercase tracking-wide transition-all
                                            bg-zinc-800 text-white hover:bg-amber-500 hover:text-black shadow-lg
                                        `}
                                >
                                    {plan.isContact ? 'Contactar' : (user ? 'Seleccionar Plan' : 'Empezar prueba gratis de 7 días')}
                                </a>
                            )}
                        </div>
                    ))}
                </div>

                {/* Tarjeta Exclusiva: IA Personalizada */}
                {iaPlan && (
                    <div className={`mt-8 lg:mt-12 w-full mx-auto ${isSection ? 'max-w-3xl' : 'max-w-4xl'}`}>
                        <div className={`
                            relative border transition-all duration-300 group flex flex-col ${isSection ? '' : 'lg:flex-row'} items-center bg-zinc-900/60 border-amber-500/30 hover:border-amber-500/60 shadow-2xl overflow-hidden
                            ${isSection ? 'p-6 gap-6 rounded-3xl' : 'p-6 lg:p-10 gap-8 lg:gap-12 rounded-[2rem]'}
                        `}>
                            {/* Brillo de fondo sutil */}
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-50 pointer-events-none" />

                            <div className="flex-1 text-center lg:text-left relative z-10 w-full">
                                <div className={`flex flex-col lg:flex-row lg:items-center mb-6 ${isSection ? 'gap-4' : 'gap-4 lg:gap-6'}`}>
                                    <div className={`mx-auto lg:mx-0 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 text-amber-500 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.2)] ${isSection ? 'p-3' : 'p-4'}`}>
                                        <iaPlan.icon className={`${isSection ? 'w-6 h-6 lg:w-8 lg:h-8' : 'w-8 h-8 lg:w-10 lg:h-10'}`} />
                                    </div>
                                    <div>
                                        <h3 className={`font-black text-white uppercase tracking-tight flex flex-col lg:flex-row items-center gap-2 ${isSection ? 'text-xl lg:text-2xl' : 'text-2xl lg:text-3xl'}`}>
                                            {iaPlan.name}
                                            <span className="text-[10px] lg:text-xs bg-amber-500 text-black px-2 py-1 rounded-full uppercase tracking-widest self-center lg:self-auto mt-2 lg:mt-0">
                                                Exclusivo
                                            </span>
                                        </h3>
                                        <div className="mt-2 flex items-baseline justify-center lg:justify-start gap-1">
                                            <span className={`font-black text-white ${isSection ? 'text-2xl lg:text-3xl' : 'text-3xl lg:text-4xl'}`}>{iaPlan.price}</span>
                                            <span className={`font-medium text-zinc-500 ${isSection ? 'text-xs lg:text-sm' : 'text-sm lg:text-base'}`}>{iaPlan.period}</span>
                                        </div>
                                    </div>
                                </div>

                                <p className={`text-zinc-300 leading-relaxed max-w-2xl mx-auto lg:mx-0 border-l-2 border-amber-500/30 pl-4 mb-6 ${isSection ? 'text-xs lg:text-sm' : 'text-sm lg:text-base'} ${isCurrentPlanView ? 'whitespace-pre-wrap' : 'italic'}`}>
                                    {isCurrentPlanView && iaPlan.perfilDescription ? iaPlan.perfilDescription : `"${iaPlan.description}"`}
                                </p>

                                <ul className={`grid gap-3 lg:gap-4 mb-8 lg:mb-0 text-left ${isSection ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                                    {(isCurrentPlanView ? iaPlan.perfilFeatures : iaPlan.features).map((feature, i) => {
                                        const isHiddenOnMobile = !expandedIa && i >= 3;
                                        return (
                                        <li key={i} className={`items-start gap-3 ${isSection ? 'text-[10px] lg:text-xs' : 'text-xs lg:text-sm'} ${isHiddenOnMobile ? (isSection ? 'hidden' : 'hidden lg:flex') : 'flex'}`}>
                                            <Check className={`shrink-0 text-amber-500 mt-0.5 ${isSection ? 'w-3 h-3 lg:w-4 lg:h-4' : 'w-4 h-4 lg:w-5 lg:h-5'}`} />
                                            <span className="leading-tight text-zinc-300 font-medium">
                                                {feature}
                                            </span>
                                        </li>
                                    )})}
                                    
                                    {(isCurrentPlanView ? iaPlan.perfilFeatures : iaPlan.features).length > 3 && (
                                        <button 
                                            onClick={() => setExpandedIa(!expandedIa)}
                                            className={`${isSection ? '' : 'lg:hidden'} w-full text-center mt-2 text-[10px] font-bold uppercase tracking-widest text-amber-500/80 hover:text-amber-400 transition-colors py-2.5 border border-dashed border-amber-500/20 rounded-xl md:col-span-2`}
                                        >
                                            {expandedIa ? 'Ver menos' : 'Ver todos los beneficios'}
                                        </button>
                                    )}
                                </ul>
                            </div>

                            <div className={`w-full shrink-0 relative z-10 flex flex-col justify-center ${isSection ? 'lg:w-48' : 'lg:w-72'}`}>
                                {status !== 'pagado' && (
                                    <a
                                        href={iaPlan.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`
                                            block w-full rounded-2xl font-black text-center uppercase tracking-widest transition-all bg-amber-500 text-black hover:bg-amber-400 hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] hover:scale-105
                                            ${isSection ? 'py-3 lg:py-4 text-[10px] lg:text-xs' : 'py-4 lg:py-5 text-xs lg:text-sm'}
                                        `}
                                    >
                                        Contactar con Ventas
                                    </a>
                                )}
                                <p className={`text-zinc-500 text-center mt-4 font-medium uppercase tracking-widest ${isSection ? 'text-[8px]' : 'text-[10px]'}`}>
                                    Requiere Evaluación Previa
                                </p>
                            </div>
                        </div>
                        {!isSection && (
                            <p className={`text-center font-bold mt-6 text-amber-500/80 hover:text-amber-500 transition-colors ${isSection ? 'text-sm' : 'text-base lg:text-lg'}`}>
                                ¿Tienes una cadena de barberías o franquicia? <a href="https://wa.me/34623064127" target="_blank" rel="noopener noreferrer" className="underline decoration-amber-500/50 underline-offset-4 hover:decoration-amber-500 transition-colors cursor-pointer">Contáctanos para una solución a medida.</a>
                            </p>
                        )}
                    </div>
                )}

                {/* Persuasive Sections for Pricing Variant (solo en página completa, no embebida) */}
                {!isLock && !isSection && (
                    <div className="mt-6 lg:mt-16 border-t border-zinc-800/50 pt-8">
                        <div className="text-center mb-16">
                            <h2 className="text-2xl lg:text-4xl font-black italic uppercase tracking-tighter text-white mb-4">
                                ¿Por qué elegir <span className="text-amber-500">Nelux</span>?
                            </h2>
                            <p className="text-zinc-500 max-w-xl mx-auto">
                                Diseñado por y para barberos que quieren escalar su negocio sin perder el control.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
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
                                <h4 className="text-white font-bold uppercase tracking-wide mb-3">Citas Automáticas</h4>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    Libera 10+ horas semanales delegando la gestión de citas con nuestros sistemas automáticos.
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

                        <div className="mt-20 bg-gradient-to-br from-zinc-900/50 to-zinc-900/10 border border-zinc-800 p-8 lg:p-12 rounded-[2.5rem] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Heart className="w-32 h-32 text-amber-500" />
                            </div>
                            <div className="relative z-10 max-w-2xl">
                                <h3 className="text-xl lg:text-2xl font-black text-white italic uppercase mb-4">
                                    Únete a la <span className="text-amber-500">Revolución</span> del Sector
                                </h3>
                                <p className="text-zinc-400 text-sm lg:text-base leading-relaxed mb-8">
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

                {(variant === 'pricing' || variant === 'lock') && !isSection && user && (
                    <div className="mt-12 flex justify-center">
                        <ManageSubscriptionButton
                            className="bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 hover:bg-zinc-800 transition-all text-xs font-bold uppercase tracking-widest px-6 py-6 rounded-xl"
                            variant="outline"
                        />
                    </div>
                )}

                {variant !== 'pricing' && !user && (
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

                <p className={`text-center text-zinc-600 text-[10px] lg:text-xs ${isSection ? 'mt-4' : 'mt-8 lg:mt-12'}`}>
                    🔒 Pagos procesados de forma segura por Stripe. Puedes cancelar en cualquier momento.
                </p>
            </div>
        </div>
    );
};
