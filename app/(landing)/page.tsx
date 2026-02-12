import Link from 'next/link';
import { Bot, TrendingUp, Zap, ArrowRight, CheckCircle2, MessageCircle, Package, Power, Smartphone, BrainCircuit, QrCode } from 'lucide-react';
import DemoAppointmentTable from '@/components/landing/DemoAppointmentTable';
import DemoRingChart from '@/components/landing/DemoRingChart';
import DemoGrowthChart from '@/components/landing/DemoGrowthChart';
import DemoChatPreview from '@/components/landing/DemoChatPreview';
import DemoProductTable from '@/components/landing/DemoProductTable';
import DemoBookingPreview from '@/components/landing/DemoBookingPreview';

export const metadata = {
    title: 'Nelux - Tu Barbería en Piloto Automático',
    description: 'Deja que la IA gestione tus citas, reduzca los no-shows y organice tu imperio mientras tú solo te preocupas de cortar.',
};

export default function InicioPage() {
    return (
        <main className="min-h-screen bg-zinc-950 overflow-hidden">
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
                            Log In
                        </Link>
                        <Link
                            href="/register"
                            className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 text-[10px] md:text-xs font-bold uppercase tracking-widest px-4 md:px-6 py-2 md:py-3 rounded-xl transition-all"
                        >
                            Registro
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ═══════════════════════════════════════════════════════════════════════
                HERO SECTION
            ═══════════════════════════════════════════════════════════════════════ */}
            <section className="relative min-h-[80vh] md:min-h-[90vh] flex flex-col items-center justify-center px-4 md:px-6 pt-24 md:pt-32 pb-4 md:pb-4">
                {/* Radial gradient glow at top */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none"
                    style={{
                        background: 'radial-gradient(ellipse at center top, rgba(245, 158, 11, 0.15) 0%, transparent 60%)',
                    }}
                />

                {/* Badge */}
                <div className="relative z-10 flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-500 px-4 py-2 rounded-full mb-8">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Potenciado por Nelux AI</span>
                </div>

                {/* Headline */}
                <h1 className="relative z-10 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-center text-white leading-tight max-w-4xl">
                    Nelux Barber, tu Barbería en{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                        Piloto Automático
                    </span>
                </h1>

                {/* Subheadline */}
                <p className="relative z-10 text-zinc-400 text-lg md:text-xl text-center max-w-2xl mt-6 leading-relaxed">
                    Deja que la IA gestione tus citas, reduzca los no-shows y organice tu imperio mientras tú solo te preocupas de cortar.
                </p>

                {/* CTA Buttons */}
                <div className="relative z-10 flex flex-col sm:flex-row gap-4 mt-10">
                    <Link
                        href="/register"
                        className="group flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold px-8 py-4 rounded-2xl text-lg transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
                    >
                        Empieza Gratis
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                        href="#features"
                        className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all border border-zinc-700"
                    >
                        Ver Funciones
                    </Link>
                </div>

                {/* Trust indicators */}
                <div className="relative z-10 flex flex-col md:flex-row flex-wrap items-center justify-center gap-3 md:gap-6 mt-8 md:mt-12 text-zinc-500 text-xs md:text-sm">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Sin tarjeta requerida
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Configura en 5 minutos
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Soporte 24/7
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════════════
                SECTION A: THE BRAIN (AI & Automation)
            ═══════════════════════════════════════════════════════════════════════ */}
            <section id="features" className="relative py-12 md:pt-4 md:pb-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center">
                        {/* Text Left */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
                                    <Bot className="w-6 h-6 text-amber-500" />
                                </div>
                                <span className="text-amber-500 text-sm font-bold uppercase tracking-wider">IA Integrada</span>
                            </div>

                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
                                El Cerebro que{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                                    Nunca Duerme
                                </span>
                            </h2>

                            <p className="text-zinc-400 text-lg leading-relaxed mb-8">
                                Desde <span className="text-white font-semibold">&quot;Hola&quot;</span> hasta{' '}
                                <span className="text-white font-semibold">&quot;Cita Confirmada&quot;</span> sin que toques el móvil.
                                Nuestro bot impulsado por GPT convierte interesados en clientes reales <span className="text-amber-500 font-bold">24/7</span>.
                            </p>

                            <ul className="space-y-4 mb-8">
                                {[
                                    'Respuestas instantáneas por WhatsApp',
                                    'Confirmaciones y recordatorios automáticos',
                                    'Reducción de no-shows hasta un 70%',
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-3 text-zinc-300">
                                        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Graphic Right */}
                        <div className="order-2 lg:order-1">
                            <DemoAppointmentTable />
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════════════
                SECTION A.5: PUBLIC BOOKING PAGE
            ═══════════════════════════════════════════════════════════════════════ */}
            <section className="relative py-20 md:py-32 px-6 bg-transparent md:bg-zinc-900/30">
                {/* Subtle glow */}
                <div
                    className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.05) 0%, transparent 70%)',
                    }}
                />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        {/* Preview Right (Desktop) / Top (Mobile) */}
                        <div className="order-2 lg:order-2 flex justify-center">
                            <DemoBookingPreview />
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

                            <p className="text-zinc-400 text-lg leading-relaxed mb-8">
                                Tus clientes no quieren otra app ocupando espacio.
                                Te creamos una <span className="text-white font-semibold">página de reservas personalizada</span> donde pueden agendar en segundos.
                                Sin registrarse, sin contraseñas, directo al grano.
                            </p>

                            <ul className="space-y-4 mb-8">
                                {[
                                    'Página web exclusiva (nelux.app/tubarberia)',
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
            <section className="relative py-20 md:py-32 px-6 bg-transparent md:bg-zinc-900/30">
                {/* Subtle glow - hidden on mobile */}
                <div
                    className="hidden md:block absolute bottom-0 right-0 w-[600px] h-[400px] pointer-events-none"
                    style={{
                        background: 'radial-gradient(ellipse at bottom right, rgba(245, 158, 11, 0.08) 0%, transparent 60%)',
                    }}
                />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center">
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

                            <p className="text-zinc-400 text-lg leading-relaxed mb-8">
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
                SECTION C: MANUAL INTERVENTION (WhatsApp Control)
            ═══════════════════════════════════════════════════════════════════════ */}
            <section className="relative py-20 md:py-32 px-6">
                {/* Subtle glow */}
                <div
                    className="absolute top-1/2 left-0 w-[400px] h-[400px] pointer-events-none -translate-y-1/2"
                    style={{
                        background: 'radial-gradient(ellipse at center left, rgba(59, 130, 246, 0.08) 0%, transparent 60%)',
                    }}
                />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center">
                        {/* Text Left */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/30">
                                    <MessageCircle className="w-6 h-6 text-blue-500" />
                                </div>
                                <span className="text-blue-500 text-sm font-bold uppercase tracking-wider">Control Total</span>
                            </div>

                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
                                Tú Mandas,{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                                    Siempre
                                </span>
                            </h2>

                            <p className="text-zinc-400 text-lg leading-relaxed mb-8">
                                La IA trabaja por ti, pero tú decides cuándo intervenir.
                                Entra en cualquier conversación de WhatsApp, responde manualmente y vuelve a dejar que el bot continúe. <span className="text-white font-semibold">Sin fricción, sin límites</span>.
                            </p>

                            <ul className="space-y-4 mb-8">
                                {[
                                    'Intervén en cualquier momento con un clic',
                                    'El bot detecta cuando tomas el control',
                                    'Historial completo de conversaciones',
                                    'Responde desde el panel o tu móvil',
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-3 text-zinc-300">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Chat Preview Right */}
                        <div className="order-2">
                            <DemoChatPreview />
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════════════
                SECTION D: PRODUCT SALES & STOCK
            ═══════════════════════════════════════════════════════════════════════ */}
            <section className="relative py-20 md:py-32 px-6 bg-transparent md:bg-zinc-900/30">
                {/* Subtle glow - hidden on mobile */}
                <div
                    className="hidden md:block absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] pointer-events-none"
                    style={{
                        background: 'radial-gradient(ellipse at center bottom, rgba(245, 158, 11, 0.08) 0%, transparent 60%)',
                    }}
                />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center">
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

                            <p className="text-zinc-400 text-lg leading-relaxed mb-8">
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
                CÓMO FUNCIONA SECTION
            ═══════════════════════════════════════════════════════════════════════ */}
            <section className="relative py-20 md:py-32 px-6 bg-zinc-950">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12 md:mb-20">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
                            Cómo <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Funciona</span>
                        </h2>
                        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto">
                            De 0 a piloto automático en 4 pasos. Sin complicaciones técnicas.
                        </p>
                    </div>

                    {/* Grid 2x2 en Desktop, Timeline Vertical en Móvil */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
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
                                    <h3 className="text-xl md:text-2xl font-black text-white mb-3 uppercase tracking-tight">
                                        ACTIVA EL NÚCLEO
                                    </h3>
                                    <p className="text-zinc-400 leading-relaxed">
                                        Elige tu plan desde 49€/mes. Sin comisiones ni sorpresas. Configura tu perfil, tus horarios y se creará tu nueva Web de Citas Personalizada automáticamente. Tu negocio, digitalizado al instante.
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
                                        <Smartphone className="w-8 h-8 text-amber-500" />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="relative z-10">
                                    <h3 className="text-xl md:text-2xl font-black text-white mb-3 uppercase tracking-tight">
                                        LA LÍNEA ROJA
                                    </h3>
                                    <p className="text-zinc-400 leading-relaxed">
                                        Si lo necesitas, con el plan premium, te asignamos un número virtual exclusivo para la IA. Se acabó dar tu número personal o mezclar chats de amigos con clientes. Tu móvil vuelve a ser tuyo; la IA se encarga de la barrera de entrada en WhatsApp.
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
                                    <h3 className="text-xl md:text-2xl font-black text-white mb-3 uppercase tracking-tight">
                                        SINCRONIZACIÓN NEURONAL
                                    </h3>
                                    <p className="text-zinc-400 leading-relaxed">
                                        La magia ocurre aquí: Tu agenda se llena por dos vías. Los clientes reservan en tu Web o chatean con nuestra IA (GPT-5). Ambos sistemas están conectados en tiempo real: si alguien reserva por la web, la IA ya sabe que ese hueco está ocupado. Cero conflictos.
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
                                    <h3 className="text-xl md:text-2xl font-black text-white mb-3 uppercase tracking-tight">
                                        DESPLIEGUE VISUAL
                                    </h3>
                                    <p className="text-zinc-400 leading-relaxed">
                                        Recibirás el enlace único de tu web. Coloca el link en tu Bio de Instagram y en Google Maps. Ahora capturas citas automáticamente tanto del tráfico de redes sociales como de los clientes que pasan por delante de tu local.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════════════
                CTA FOOTER SECTION
            ═══════════════════════════════════════════════════════════════════════ */}
            <section className="relative py-24 md:py-32 px-6">
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

                    <p className="text-zinc-400 text-lg md:text-xl leading-relaxed mb-10">
                        Únete a las barberías que ya operan en piloto automático. Prueba gratuita de 7 días, sin compromiso (no incluye funciones IA WhatsApp). El plan de pago mensual incluye una comisión del 1% sobre la facturación agendada por IA.
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

            {/* Footer */}
            <footer className="border-t border-zinc-800 py-8 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-zinc-500 text-sm">
                    <p>© 2026 Nelux. Todos los derechos reservados.</p>
                    <div className="flex items-center gap-6">
                        <Link href="/register" className="hover:text-white transition-colors">Registro</Link>
                    </div>
                </div>
            </footer>
        </main>
    );
}
