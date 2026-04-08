import Link from 'next/link';
import Script from 'next/script';
import { Bot, TrendingUp, Zap, ArrowRight, CheckCircle2, MessageCircle, Package, Power, Smartphone, BrainCircuit, QrCode } from 'lucide-react';
import { Users, Clock, Receipt, Banknote } from 'lucide-react';
import dynamic from 'next/dynamic';

const DemoAppointmentTable = dynamic(() => import('@/components/landing/DemoAppointmentTable'));
const DemoRingChart = dynamic(() => import('@/components/landing/DemoRingChart'));
const DemoGrowthChart = dynamic(() => import('@/components/landing/DemoGrowthChart'));
const DemoChatPreview = dynamic(() => import('@/components/landing/DemoChatPreview'));
const DemoProductTable = dynamic(() => import('@/components/landing/DemoProductTable'));
const StaticBookingPreview = dynamic(() => import('@/components/landing/StaticBookingPreview'));
const DemoStaffVisual = dynamic(() => import('@/components/landing/DemoStaffVisual'));



export const metadata = {
    title: 'NeluxBarber - Software para Barberos y Barberías en España',
    description: 'NeluxBarber: software de gestión para barberías y barberos en España. Agenda citas, app de reservas sin descarga y control de tu equipo. Prueba gratis.',
    keywords: [
        'software para barberos', 'app para barberías', 'gestión barbería España',
        'programa barbería', 'agenda citas automatica barberia', 'software barberia gratis',
        'verifactu barberia', 'bot whatsapp barberia ia', 'app reservas barbería sin descargar',
    ],
    alternates: {
        canonical: 'https://nelux.es',
    },
    openGraph: {
        title: 'NeluxBarber - Software para Barberos y Barberías en España',
        description: 'NeluxBarber: software de gestión para barberías y barberos en España. Agenda citas, app de reservas sin descarga y control de tu equipo. Prueba gratis.',
        url: 'https://nelux.es',
        type: 'website',
    },
};

export default function InicioPage() {
    return (
        <>
            <main className="min-h-screen bg-zinc-950 overflow-x-hidden pt-6 md:pt-0 text-white">
                {/* Navigation */}
                <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
                    <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
                        <div className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-white">
                            Nelux<span className="text-amber-500">Barber</span>
                        </div>
                        <div className="flex items-center gap-2 md:gap-6">
                            <Link
                                href="/pricing"
                                className="hidden md:block text-zinc-500 hover:text-white text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors px-2 md:px-4 py-2"
                            >
                                Precios
                            </Link>
                            <Link
                                href="/login"
                                className="text-zinc-400 hover:text-white text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors px-2 md:px-4 py-2"
                            >
                                Acceder al Panel
                            </Link>
                            <Link
                                href="/register"
                                className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 text-[10px] md:text-xs font-bold uppercase tracking-widest px-4 md:px-6 py-2 md:py-3 rounded-xl transition-all"
                            >
                                Regístrate Gratis
                            </Link>
                        </div>
                    </div>
                </nav>

                {/* ═══════════════════════════════════════════════════════════════════════
                HERO SECTION
            ═══════════════════════════════════════════════════════════════════════ */}
                <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 md:px-8 lg:px-6 pt-32 md:pt-52 pb-12 md:pb-24">
                    {/* Radial gradient glow at top */}
                    <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none"
                        style={{
                            background: 'radial-gradient(ellipse at center top, rgba(245, 158, 11, 0.15) 0%, transparent 60%)',
                        }}
                    />


                    {/* Headline */}
                    <h1 className="relative z-10 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-center text-white leading-[1.1] md:leading-[1.05] max-w-5xl tracking-tight">
                        <span className="block mb-8 md:mb-0">
                            Corta más,{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600">
                                Gestiona menos
                            </span>
                        </span>
                        <span className="block text-white lg:mt-4"> El Software #1 para Barberías en España</span>
                    </h1>

                    {/* Subheadline */}
                    <p className="relative z-10 text-zinc-400 text-base md:text-xl text-center max-w-2xl mt-8 leading-relaxed px-4">
                        La evolución digital de tu barbería en España. Nuestro software integral te ayuda a enfocarte en lo que importa: corta más y gestiona menos con un panel de control avanzado.
                    </p>

                    {/* CTA Buttons */}
                    <div className="relative z-10 flex flex-col sm:flex-row gap-4 mt-12 w-full sm:w-auto px-6">
                        <Link
                            href="/register"
                            className="group flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black px-10 py-5 rounded-2xl text-xl transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transform hover:-translate-y-1"
                        >
                            Empieza Gratis
                            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="https://app.nelux.es/demo"
                            className="flex items-center justify-center gap-2 bg-zinc-900/50 hover:bg-zinc-800 text-white font-bold px-10 py-5 rounded-2xl text-xl transition-all border border-zinc-800 backdrop-blur-md"
                        >
                            Ver Demo Live
                        </Link>
                    </div>

                    {/* Trust Logos / Brands Subtitles */}
                    <div className="relative z-10 mt-16 md:mt-24 pt-8 border-t border-zinc-800/50 w-full max-w-4xl text-center">
                        <p className="text-zinc-600 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-8">Tecnología de última generación integrada</p>
                        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-40 grayscale transition-all hover:grayscale-0 hover:opacity-100">
                            <span className="text-xl md:text-2xl font-black italic tracking-tighter">Nelux<span className="text-amber-500">Cloud</span></span>
                            <span className="text-xl md:text-2xl font-black italic tracking-tighter uppercase"><span className="text-blue-500">Veri</span>Factu</span>
                            <span className="text-xl md:text-2xl font-black italic tracking-tighter">GPT-4o<span className="text-amber-500">AI</span></span>
                            <span className="text-xl md:text-2xl font-black italic tracking-tighter uppercase">SSL<span className="text-green-500">Secure</span></span>
                        </div>
                    </div>

                    {/* Trust indicators */}
                    <div className="relative z-10 flex flex-row flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-12 text-zinc-500 text-[10px] sm:text-xs md:text-sm">
                        <div className="flex items-center gap-2 group">
                            <CheckCircle2 className="w-4 h-4 text-amber-500/50 group-hover:text-amber-500 transition-colors" />
                            7 días de prueba total
                        </div>
                        <div className="flex items-center gap-2 group">
                            <CheckCircle2 className="w-4 h-4 text-blue-500/50 group-hover:text-blue-500 transition-colors" />
                            Sin tarjeta bancaria
                        </div>
                        <div className="flex items-center gap-2 group">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500/50 group-hover:text-emerald-500 transition-colors" />
                            Adaptado a la Ley Antifraude
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════════════════
                SECTION: VENTAJAS Y BENEFICIOS
            ═══════════════════════════════════════════════════════════════════════ */}
                <section className="relative py-16 md:py-24 px-4 md:px-8 lg:px-6 bg-zinc-900/20 border-y border-zinc-800/50">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-start">
                            {/* Detalles / Párrafo Explicativo (Izquierda) */}
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
                                        <TrendingUp className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <span className="text-amber-500 text-sm font-bold uppercase tracking-wider">La Evolución Digital</span>
                                </div>

                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
                                    La App para Barberías que asegura tu{' '}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                                        Éxito y Legalidad
                                    </span>
                                </h2>

                                <p className="text-zinc-400 text-base md:text-lg leading-relaxed mix-blend-lighten">
                                    NeluxBarber no es solo una agenda, es la estructura completa para escalar tu barbería sin perder la cabeza.
                                    Centralizamos tus reservas, tus ingresos, genera facturas adaptadas a <strong className="text-amber-500 font-bold">Veri*Factu 2026</strong>, las nóminas de tus barberos y el stock de productos en un único
                                    panel de control.
                                    Con el mejor software de gestión para barberos, recuperas el tiempo necesario para centrarte en lo importante: <strong className="text-white font-semibold">cortar pelo y hacer crecer tu marca</strong>.
                                </p>
                            </div>

                            {/* Lista de Ventajas (Derecha) */}
                            <div className="bg-zinc-950 border border-zinc-800/80 rounded-3xl p-8 md:p-10 shadow-xl shadow-black/50">
                                <div className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-amber-500" />
                                    ¿Qué ganas usando Nelux?
                                </div>
                                <ul className="space-y-6">
                                    {[
                                        { title: 'Panel Personalizado', desc: 'Landing exclusiva de reservas para tus clientes sin que tengan que descargar ninguna app ni registrarse.' },
                                        { title: 'Ahorro de Tiempo', desc: 'Las citas se agendan solas, olvídate de contestar llamadas y mensajes todo el día.' },
                                        { title: 'Adiós a los No-Shows', desc: 'Recordatorios automáticos por WhatsApp antes de la cita.' },
                                        { title: 'Control Total de Barberos', desc: 'Gestión de barberos, fichajes (entrada/salida) y facturación individual.' },
                                        { title: 'Ingresos y Contabilidad Centralizada', desc: 'Gráficas en tiempo real, facturas Veri*Factu (obligatorio 2026) y exportación legal.' }
                                    ].map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-4">
                                            <div className="mt-1 w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                                                <span className="text-amber-500 text-sm font-bold">{idx + 1}</span>
                                            </div>
                                            <div>
                                                <div className="text-white font-bold mb-1">{item.title}</div>
                                                <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════════════════
                SECTION A: PUBLIC BOOKING PAGE
            ═══════════════════════════════════════════════════════════════════════ */}
                <section className="relative py-16 md:py-24 lg:py-32 px-4 md:px-8 lg:px-6 bg-transparent md:bg-zinc-900/30">
                    {/* Subtle glow */}
                    <div
                        className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
                        style={{
                            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.05) 0%, transparent 70%)',
                        }}
                    />

                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center">
                            {/* Preview Right (Desktop) / Top (Mobile) */}
                            <div className="order-2 lg:order-2 flex justify-center w-full">
                                <StaticBookingPreview />
                            </div>

                            {/* Text Left (Desktop) / Bottom (Mobile) */}
                            <div className="order-1 lg:order-1">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/30">
                                        <Smartphone className="w-6 h-6 text-indigo-500" />
                                    </div>
                                    <span className="text-indigo-500 text-sm font-bold uppercase tracking-wider">Tu Web App</span>
                                </div>

                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
                                    Sin Descargas,{' '}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">
                                        Solo Reservas
                                    </span>
                                </h2>

                                <p className="text-zinc-400 text-base md:text-lg leading-relaxed mb-8">
                                    Tus clientes no quieren otra app ocupando espacio.
                                    Te creamos una <span className="text-white font-semibold">página de reservas personalizada</span> donde pueden agendar en segundos.
                                    Sin registrarse, sin contraseñas, directo al grano.
                                </p>

                                <ul className="space-y-4 mb-8">
                                    {[
                                        'Página web exclusiva (app.nelux.es/tu_barberia)',
                                        'No requiere descargar ninguna App',
                                        'Cliente no necesita crearse cuenta (Guest Mode)',
                                        'Selección de barbero y servicio visual',
                                    ].map((item, idx) => (
                                        <li key={idx} className="flex items-center gap-3 text-zinc-300">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>


                {/* ═══════════════════════════════════════════════════════════════════════
                SECTION B: FINANCIAL CONTROL
            ═══════════════════════════════════════════════════════════════════════ */}
                <section className="relative py-16 md:py-24 lg:py-32 px-4 md:px-8 lg:px-6 bg-transparent md:bg-zinc-900/30">
                    {/* Subtle glow - hidden on mobile */}
                    <div
                        className="hidden md:block absolute bottom-0 right-0 w-[600px] h-[400px] pointer-events-none"
                        style={{
                            background: 'radial-gradient(ellipse at bottom right, rgba(245, 158, 11, 0.08) 0%, transparent 60%)',
                        }}
                    />

                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-start">
                            {/* Graphics Left */}
                            <div className="order-2 lg:order-1 space-y-6">
                                <DemoRingChart />
                                <DemoGrowthChart />
                            </div>

                            {/* Text Right */}
                            <div className="order-1 lg:order-2">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/30">
                                        <TrendingUp className="w-6 h-6 text-green-500" />
                                    </div>
                                    <span className="text-green-500 text-sm font-bold uppercase tracking-wider">Control Financiero</span>
                                </div>

                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
                                    Tus Números,{' '}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">
                                        En Tiempo Real
                                    </span>
                                </h2>

                                <p className="text-zinc-400 text-base md:text-lg leading-relaxed mb-8">
                                    Olvídate de hojas de cálculo y cajas registradoras anticuadas.
                                    Visualiza tus ingresos diarios, tendencias semanales y objetivos mensuales en un panel diseñado para <span className="text-white font-semibold">tomar decisiones, no perder tiempo</span>.
                                </p>

                                <ul className="space-y-4 mb-8">
                                    {[
                                        'Dashboard de ingresos en tiempo real',
                                        'Gráficas de tendencias y crecimiento',
                                        'Objetivos diarios con seguimiento visual',
                                        'Métricas de rendimiento por servicio',
                                    ].map((item, idx) => (
                                        <li key={idx} className="flex items-center gap-3 text-zinc-300">
                                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════════════════
                SECTION B.5: STAFF & SCHEDULE MANAGEMENT
            ═══════════════════════════════════════════════════════════════════════ */}
                <section className="relative py-16 md:py-24 lg:py-32 px-4 md:px-8 lg:px-6">
                    {/* Subtle glow */}
                    <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
                        style={{
                            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)',
                        }}
                    />

                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-start">
                            {/* Text Left */}
                            <div className="order-1 lg:order-1">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/30">
                                        <Users className="w-6 h-6 text-indigo-500" />
                                    </div>
                                    <span className="text-indigo-500 text-sm font-bold uppercase tracking-wider">Gestión de Equipo</span>
                                </div>

                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
                                    Tu Equipo,{' '}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">
                                        Bajo Control
                                    </span>
                                </h2>

                                <p className="text-zinc-400 text-base md:text-lg leading-relaxed mb-8">
                                    Olvídate de los líos con los horarios y los cálculos de comisiones.
                                    Gestiona la jornada laboral completa de tu equipo, desde el fichaje de entrada hasta la liquidación final del mes. <span className="text-white font-semibold">Transparencia total para ti y tus barberos</span>.
                                </p>

                                <ul className="space-y-4 mb-8">
                                    {[
                                        'Control de presencia (Fichajes entry/exit)',
                                        'Gestión de turnos y horarios de apertura',
                                        'Cálculo automático de nóminas y comisiones',
                                        'Auditoría y exportación de jornadas en PDF',
                                    ].map((item, idx) => (
                                        <li key={idx} className="flex items-center gap-3 text-zinc-300">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Graphic Right */}
                            <div className="order-2 lg:order-2">
                                <DemoStaffVisual />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════════════════
                SECTION C: HYBRID AI (Merged Automation & Manual Control)
            ═══════════════════════════════════════════════════════════════════════ */}
                <section id="features" className="relative py-16 md:py-24 lg:py-32 px-4 md:px-8 lg:px-6">
                    {/* Subtle dual-tone glow */}
                    <div
                        className="absolute top-1/2 left-0 w-[500px] h-[500px] pointer-events-none -translate-y-1/2 opacity-30"
                        style={{
                            background: 'radial-gradient(ellipse at center left, rgba(245, 158, 11, 0.15) 0%, rgba(59, 130, 246, 0.1) 50%, transparent 80%)',
                        }}
                    />

                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center">
                            {/* Text Left */}
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-gradient-to-br from-amber-500/10 to-blue-500/10 rounded-xl border border-amber-500/30 flex gap-2">
                                        <BrainCircuit className="w-5 h-5 text-amber-500" />
                                        <div className="w-px h-5 bg-zinc-800" />
                                        <Power className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <span className="text-zinc-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                        <span className="text-amber-500">IA Híbrida</span>
                                        <span className="text-zinc-700">|</span>
                                        <span className="text-blue-500">Control Total</span>
                                    </span>
                                </div>

                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
                                    Agenda en Piloto Automático,{' '}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-white to-blue-400">
                                        Intervén cuando Tú Quieras
                                    </span>
                                </h2>

                                <p className="text-zinc-400 text-base md:text-lg leading-relaxed mb-8">
                                    Fusionamos la potencia de la Inteligencia Artificial con el mando humano absoluto.
                                    Deja que el bot agende citas <span className="text-amber-500 font-bold">24/7</span> mediante WhatsApp y Web, pero toma el mando de cualquier conversación con un solo clic.
                                    <span className="text-white font-semibold"> La IA agiliza, tú decides</span>.
                                </p>

                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                    {[
                                        { text: 'Chatbot IA 24/7 (WhatsApp Business)', color: 'amber' },
                                        { text: 'Intervención manual instantánea', color: 'blue' },
                                        { text: 'Sincronización total con tu agenda', color: 'amber' },
                                        { text: 'Historial completo de mensajes', color: 'blue' },
                                    ].map((item, idx) => (
                                        <li key={idx} className="flex items-center gap-3 text-zinc-300 text-sm">
                                            <div className={`w-2 h-2 rounded-full ${item.color === 'amber' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`} />
                                            {item.text}
                                        </li>
                                    ))}
                                </ul>

                            </div>

                            {/* Graphic Right */}
                            <div className="relative group mt-8 lg:mt-0">
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-blue-500/5 blur-[100px] -z-10 group-hover:opacity-75 transition-opacity" />
                                <DemoChatPreview />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════════════════
                SECTION D: PRODUCT SALES & STOCK
            ═══════════════════════════════════════════════════════════════════════ */}
                <section className="relative py-16 md:py-24 lg:py-32 px-4 md:px-8 lg:px-6 bg-transparent md:bg-zinc-900/30">
                    {/* Subtle glow - hidden on mobile */}
                    <div
                        className="hidden md:block absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] pointer-events-none"
                        style={{
                            background: 'radial-gradient(ellipse at center bottom, rgba(245, 158, 11, 0.08) 0%, transparent 60%)',
                        }}
                    />

                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-start">
                            {/* Product Table Left */}
                            <div className="order-2 lg:order-1">
                                <DemoProductTable />
                            </div>

                            {/* Text Right */}
                            <div className="order-1 lg:order-2">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
                                        <Package className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <span className="text-amber-500 text-sm font-bold uppercase tracking-wider">Venta de Productos</span>
                                </div>

                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
                                    Más que Cortes,{' '}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                                        Más Ingresos
                                    </span>
                                </h2>

                                <p className="text-zinc-400 text-base md:text-lg leading-relaxed mb-8">
                                    Gestiona tu inventario de productos, controla el stock en tiempo real y registra ventas con un solo clic.
                                    Cada venta se suma automáticamente a tus ingresos del día. <span className="text-white font-semibold">Cero papeleo, máximo beneficio</span>.
                                </p>

                                <ul className="space-y-4 mb-8">
                                    {[
                                        'Catálogo de productos con fotos',
                                        'Control de stock con alertas',
                                        'Registro de ventas instantáneo',
                                        'Historial de productos vendidos',
                                    ].map((item, idx) => (
                                        <li key={idx} className="flex items-center gap-3 text-zinc-300">
                                            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════════════════
                SECTION: PRICING (NUEVA)
            ═══════════════════════════════════════════════════════════════════════ */}
                <section id="pricing" className="hidden md:block relative py-16 md:py-24 lg:py-32 px-4 md:px-8 lg:px-6 bg-zinc-900/10">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16 md:mb-24">
                            <span className="text-amber-500 text-sm font-bold uppercase tracking-wider">Planes Flexibles</span>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mt-3 mb-6 leading-tight">
                                Escalabilidad a tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Medida</span>
                            </h2>
                            <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto">
                                Desde autónomos hasta cadenas de barberías. Todos los planes incluyen 7 días de prueba gratis. Sin meter tu tarjeta.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Plan Básico */}
                            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 flex flex-col transition-all hover:border-zinc-700">
                                <div className="mb-8">
                                    <div className="text-white text-xl font-bold mb-2">Básico</div>
                                    <p className="text-zinc-500 text-sm">Perfecto para empezar solo.</p>
                                </div>
                                <div className="mb-8">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-black text-white">19€</span>
                                        <span className="text-zinc-500 font-bold">/mes</span>
                                    </div>
                                </div>
                                <ul className="space-y-4 mb-10 overflow-hidden">
                                    {[
                                        '1 Barbero incluido',
                                        'Web de Reservas personalizada',
                                        'Facturación Veri*Factu 2026',
                                        'Agenda en tiempo real',
                                        'Gestión de Productos',
                                    ].map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-zinc-400 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Link href="/register" className="mt-auto block text-center bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-4 rounded-xl border border-zinc-800 transition-colors">
                                    Elegir Plan Básico
                                </Link>
                            </div>

                            {/* Plan Profesional - Destacado */}
                            <div className="relative bg-zinc-900 border-2 border-amber-500 rounded-3xl p-8 flex flex-col shadow-[0_0_40px_-10px_rgba(245,158,11,0.2)] transform md:scale-105 z-10">
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                                    Más Popular
                                </div>
                                <div className="mb-8">
                                    <div className="text-white text-2xl font-black mb-2 uppercase tracking-tight italic">Profesional</div>
                                    <p className="text-zinc-400 text-sm">Escala tu equipo y visibilidad.</p>
                                </div>
                                <div className="mb-8">
                                    <div className="flex items-baseline gap-1 text-white">
                                        <span className="text-5xl font-black">49€</span>
                                        <span className="text-zinc-500 font-bold">/mes</span>
                                    </div>
                                </div>
                                <ul className="space-y-4 mb-10">
                                    {[
                                        'Hasta 3 Barberos',
                                        'Todo lo del plan Básico',
                                        'Calculo de Comisiones autom.',
                                        'Control de Horarios y Fichajes',
                                        'Informes Financieros Avanzados',
                                        'Soporte Prioritario WhatsApp',
                                    ].map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-zinc-300 text-sm font-medium">
                                            <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Link href="/register" className="mt-auto block text-center bg-amber-500 hover:bg-amber-400 text-black font-black py-4 rounded-xl transition-colors shadow-lg shadow-amber-500/20">
                                    Empezar Gratis Ahora (Sin Tarjeta)
                                </Link>
                            </div>

                            {/* Plan Premium / IA */}
                            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 flex flex-col transition-all hover:border-zinc-700">
                                <div className="mb-8">
                                    <div className="text-white text-xl font-bold mb-2">Premium IA</div>
                                    <p className="text-zinc-500 text-sm">Automatización total 24/7.</p>
                                </div>
                                <div className="mb-8">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-black text-white">99€</span>
                                        <span className="text-zinc-500 font-bold">/mes</span>
                                    </div>
                                </div>
                                <ul className="space-y-4 mb-10 overflow-hidden">
                                    {[
                                        'Barberos Ilimitados',
                                        'Todo lo del plan Profesional',
                                        'IA agendando en WhatsApp 24/7',
                                        'Recordatorios IA Inteligentes',
                                        'Módulo Multi-sede (Opcional)',
                                    ].map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-zinc-400 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Link href="/register" className="mt-auto block text-center bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-4 rounded-xl border border-zinc-800 transition-colors">
                                    Contratar Plan IA
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="relative py-16 md:py-24 lg:py-32 px-4 md:px-8 lg:px-6 bg-zinc-950">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="text-center mb-12 md:mb-20">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
                                Cómo <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Funciona</span>
                            </h2>
                            <p className="text-zinc-400 text-base md:text-xl max-w-2xl mx-auto">
                                De 0 a piloto automático en 4 pasos. Sin complicaciones técnicas.
                            </p>
                        </div>

                        {/* Grid 2x2 en Desktop, Timeline Vertical en Móvil */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 lg:gap-8">
                            {/* Step 1 */}
                            <div className="relative group">
                                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 transition-all duration-300 hover:border-amber-500/30 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.1)]">
                                    {/* Step Number Background */}
                                    <div className="absolute top-4 right-4 text-7xl md:text-8xl font-black text-zinc-800 opacity-50 select-none">
                                        01
                                    </div>

                                    {/* Icon */}
                                    <div className="relative z-10 mb-6">
                                        <div className="inline-flex p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
                                            <Power className="w-8 h-8 text-amber-500" />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="relative z-10">
                                        <div className="text-xl md:text-2xl font-black text-white mb-3 uppercase tracking-tight">
                                            TU BARBERÍA ONLINE EN MINUTOS
                                        </div>
                                        <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
                                            Configura tu perfil, servicios y horarios en un par de clics. Tu nueva Web de Citas exclusiva se genera al instante. Sin registros tediosos para tus clientes: solo seleccionar y reservar. Tu negocio, digitalizado y listo para recibir citas.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="relative group">
                                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 transition-all duration-300 hover:border-amber-500/30 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.1)]">
                                    {/* Step Number Background */}
                                    <div className="absolute top-4 right-4 text-7xl md:text-8xl font-black text-zinc-800 opacity-50 select-none">
                                        02
                                    </div>

                                    {/* Icon */}
                                    <div className="relative z-10 mb-6">
                                        <div className="inline-flex p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
                                            <MessageCircle className="w-8 h-8 text-amber-500" />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="relative z-10">
                                        <div className="text-xl md:text-2xl font-black text-white mb-3 uppercase tracking-tight">
                                            RESERVAS SIN INTERRUPCIONES
                                        </div>
                                        <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
                                            Olvida interrumpir tus cortes para contestar llamadas. Tus clientes reservan desde su móvil mientras tú te centras en el degradado. Una experiencia premium que tus clientes agradecerán y que elevará el valor percibido de tu marca.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="relative group">
                                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 transition-all duration-300 hover:border-amber-500/30 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.1)]">
                                    {/* Step Number Background */}
                                    <div className="absolute top-4 right-4 text-7xl md:text-8xl font-black text-zinc-800 opacity-50 select-none">
                                        03
                                    </div>

                                    {/* Icon */}
                                    <div className="relative z-10 mb-6">
                                        <div className="inline-flex p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
                                            <BrainCircuit className="w-8 h-8 text-amber-500" />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="relative z-10">
                                        <div className="text-xl md:text-2xl font-black text-white mb-3 uppercase tracking-tight">
                                            AGENDA SIEMPRE LLENA Y SEGURA
                                        </div>
                                        <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
                                            Nuestra IA gestiona los huecos por ti las 24 horas. Sincronización en tiempo real: si un cliente cancela, el hueco se libera automáticamente para otro. Olvídate de los errores de citas duplicadas o huecos vacíos por descuido.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Step 4 */}
                            <div className="relative group">
                                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 transition-all duration-300 hover:border-amber-500/30 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.1)]">
                                    {/* Step Number Background */}
                                    <div className="absolute top-4 right-4 text-7xl md:text-8xl font-black text-zinc-800 opacity-50 select-none">
                                        04
                                    </div>

                                    {/* Icon */}
                                    <div className="relative z-10 mb-6">
                                        <div className="inline-flex p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
                                            <QrCode className="w-8 h-8 text-amber-500" />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="relative z-10">
                                        <div className="text-xl md:text-2xl font-black text-white mb-3 uppercase tracking-tight">
                                            TU NEGOCIO EN TU BOLSILLO
                                        </div>
                                        <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
                                            Controla ingresos, productos, nóminas y facturación legal al instante. Un panel central diseñado para que gestiones tu barbería desde cualquier parte del mundo. Libertad real para que dejes de ser un esclavo de la administración.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════════════════
                SECTION FAQ
            ═══════════════════════════════════════════════════════════════════════ */}
                <section className="relative py-16 md:py-24 lg:py-32 px-4 md:px-8 lg:px-6 bg-zinc-950" aria-label="Preguntas frecuentes sobre NeluxBarber">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12 md:mb-20">
                            <span className="text-amber-500 text-sm font-bold uppercase tracking-wider">FAQ</span>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mt-3 mb-4 leading-tight">
                                Preguntas <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Frecuentes</span>
                            </h2>
                            <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto">
                                Todo lo que necesitas saber sobre el software de gestión para barberías de NeluxBarber.
                            </p>
                        </div>

                        <div className="space-y-4" itemScope itemType="https://schema.org/FAQPage">
                            {[
                                {
                                    q: '¿Cuánto cuesta el software para barberos NeluxBarber?',
                                    a: 'NeluxBarber tiene 4 planes: Básico desde 19€/mes, Profesional desde 49€/mes, Premium desde 99€/mes y el plan IA Personalizada desde 149€/mes. Todos incluyen una prueba gratuita de 7 días sin tarjeta de crédito.'
                                },
                                {
                                    q: '¿Necesito descargar una app para que mis clientes reserven citas?',
                                    a: 'No. Tus clientes reservan directamente desde una página web personalizada (app.nelux.es/tu_barberia). No necesitan descargarse ninguna aplicación ni crearse una cuenta. Solo seleccionan el servicio, el barbero y la fecha en segundos.'
                                },
                                {
                                    q: '¿Cómo funciona el bot de WhatsApp con IA?',
                                    a: 'El bot de IA de NeluxBarber (disponible en el plan IA Personalizada) se conecta a tu número de WhatsApp Business y responde automáticamente a los clientes, agenda citas, confirma reservas y envía recordatorios las 24 horas del día, los 7 días de la semana. Puedes intervenir en cualquier conversación cuando quieras.'
                                },
                                {
                                    q: '¿Puedo gestionar varios barberos con NeluxBarber?',
                                    a: 'Sí. Los planes Profesional y Premium incluyen gestión completa de equipo: registro de barberos, control de presencia (fichajes entrada/salida), cálculo de comisiones, gestión de horarios y un portal exclusivo para que cada barbero vea su agenda y sus métricas.'
                                },
                                {
                                    q: '¿Puedo probar NeluxBarber gratis antes de suscribirme?',
                                    a: 'Sí. NeluxBarber ofrece una prueba gratuita de 7 días completamente funcional, sin necesidad de tarjeta de crédito. Puedes configurar tu barbería, importar clientes y probar todas las funcionalidades antes de comprometerte con cualquier plan.'
                                },
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
                                    itemScope
                                    itemProp="mainEntity"
                                    itemType="https://schema.org/Question"
                                >
                                    <details className="group">
                                        <summary className="flex items-center justify-between p-6 cursor-pointer list-none hover:bg-zinc-800/50 transition-colors">
                                            <div
                                                className="text-white font-bold text-sm md:text-base pr-4"
                                                itemProp="name"
                                            >
                                                {item.q}
                                            </div>
                                            <div className="shrink-0 w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold text-lg group-open:rotate-45 transition-transform">
                                                +
                                            </div>
                                        </summary>
                                        <div
                                            className="px-6 pb-6 text-zinc-400 text-sm md:text-base leading-relaxed border-t border-zinc-800 pt-4"
                                            itemScope
                                            itemProp="acceptedAnswer"
                                            itemType="https://schema.org/Answer"
                                        >
                                            <p itemProp="text">{item.a}</p>
                                        </div>
                                    </details>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════════════════
                CTA FOOTER SECTION
            ═══════════════════════════════════════════════════════════════════════ */}
                <section className="relative py-16 md:py-24 lg:py-32 px-4 md:px-8 lg:px-6">
                    {/* Gradient glow */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: 'radial-gradient(ellipse at center, rgba(245, 158, 11, 0.1) 0%, transparent 50%)',
                        }}
                    />

                    <div className="max-w-3xl mx-auto text-center relative z-10">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
                            ¿Listo para Despegar?
                        </h2>

                        <p className="text-zinc-400 text-base md:text-xl leading-relaxed mb-10">
                            Únete a las barberías que ya operan en piloto automático. Prueba gratuita de 7 días, sin compromiso. ¿Estás listo para que tu barbería pase al siguiente nivel?
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/register"
                                className="group inline-flex items-center justify-center gap-2 md:gap-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold px-6 py-3 md:px-10 md:py-5 rounded-xl md:rounded-2xl text-base md:text-xl transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 w-full sm:w-auto"
                            >
                                Empieza tu Prueba Gratis
                                <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
                            </Link>

                            <Link
                                href="/pricing"
                                className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold px-6 py-3 md:px-10 md:py-5 rounded-xl md:rounded-2xl text-base md:text-xl transition-all border border-zinc-800 w-full sm:w-auto"
                            >
                                Consultar Planes
                            </Link>
                        </div>

                        <p className="text-zinc-600 text-sm mt-6">
                            Sin tarjeta de crédito · Configura en minutos
                        </p>
                    </div>
                </section>

                <footer className="border-t border-zinc-800 py-8 px-4 md:px-8 lg:px-6">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 md:gap-4 text-zinc-500 text-sm">
                        <div className="flex flex-wrap justify-center md:justify-end items-center gap-4 md:gap-6 order-1 md:order-2">
                            <Link href="/" className="hover:text-white transition-colors" title="El mejor Software para Barberos">Software para Barberos</Link>
                            <Link href="/pricing" className="hover:text-white transition-colors">Ver Todos los Planes</Link>
                            <Link href="/login" className="hover:text-white transition-colors">Acceso a tu Barbería</Link>
                            <Link href="/register" className="hover:text-white transition-colors">Crear Barbería</Link>
                            <a href="https://nelux.es" target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 transition-colors font-bold">Nelux</a>
                        </div>
                        <div className="flex flex-col items-center md:items-start gap-1 order-2 md:order-1 border-t border-zinc-900 md:border-none pt-8 md:pt-0 w-full md:w-auto">
                            <p>© 2026 Nelux. El software #1 para barberías en España.</p>
                            <p className="flex items-center gap-3 text-xs mt-2 md:mt-1 font-medium">
                                <a href="tel:+34623064127" className="hover:text-white transition-colors flex items-center gap-1">
                                    <Smartphone className="w-3 h-3" /> +34 623 064 127
                                </a>
                                <span>|</span>
                                <a href="mailto:contacto@nelux.es" className="hover:text-white transition-colors">
                                    contacto@nelux.es
                                </a>
                            </p>
                        </div>
                    </div>
                </footer>
            </main>
            <Script
                id="schema-faq"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": [
                            {
                                "@type": "Question",
                                "name": "\u00bfCu\u00e1nto cuesta el software para barberos NeluxBarber?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "NeluxBarber tiene 4 planes: B\u00e1sico desde 19\u20ac/mes, Profesional desde 49\u20ac/mes, Premium desde 99\u20ac/mes y el plan IA Personalizada desde 149\u20ac/mes. Todos incluyen una prueba gratuita de 7 d\u00edas sin tarjeta de cr\u00e9dito."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "\u00bfNecesito descargar una app para que mis clientes reserven citas?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "No. Tus clientes reservan directamente desde una p\u00e1gina web personalizada. No necesitan descargarse ninguna aplicaci\u00f3n ni crearse una cuenta."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "\u00bfC\u00f3mo funciona el bot de WhatsApp con IA?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "El bot de IA se conecta a tu n\u00famero de WhatsApp Business y responde autom\u00e1ticamente a los clientes, agenda citas, confirma reservas y env\u00eda recordatorios las 24 horas del d\u00eda, los 7 d\u00edas de la semana."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "\u00bfPuedo gestionar varios barberos con NeluxBarber?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "S\u00ed. Los planes Profesional y Premium incluyen gesti\u00f3n completa de equipo: registro de barberos, control de presencia, c\u00e1lculo de comisiones, gesti\u00f3n de horarios y un portal exclusivo para cada barbero."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "\u00bfPuedo probar NeluxBarber gratis antes de suscribirme?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "S\u00ed. NeluxBarber ofrece una prueba gratuita de 7 d\u00edas completamente funcional, sin necesidad de tarjeta de cr\u00e9dito."
                                }
                            }
                        ]
                    })
                }}
            />
        </>
    );
}
