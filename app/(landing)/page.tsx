import Link from 'next/link';
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
    title: 'NeluxBarber - El mejor Software para Barberos y Barberías en España',
    description: 'La app para barberías líder con software para barberos. Agenda citas automáticamente con IA, facturación adaptada a Veri*factu 2026, comisiones y gestión total.',
};

export default function InicioPage() {
    return (
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
            <section className="relative min-h-[80vh] md:min-h-[90vh] flex flex-col items-center justify-center px-4 md:px-8 lg:px-6 pt-24 md:pt-32 pb-12 md:pb-24">
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
                    El mejor Software para Barberos y Barberías en{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                        España
                    </span>
                </h1>

                {/* Subheadline */}
                <p className="relative z-10 text-zinc-400 text-base md:text-xl text-center max-w-2xl mt-6 leading-relaxed">
                    Corta más, gestiona menos. La evolución digital de tu barbería. Todo lo que necesitas en un mismo lugar.
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
                        href="https://app.nelux.es/demo"
                        className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all border border-zinc-700"
                    >
                        Ver Demo
                    </Link>
                </div>

                {/* Trust indicators */}
                <div className="relative z-10 flex flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-8 md:mt-12 text-zinc-500 text-[10px] sm:text-xs md:text-sm">
                    <div className="flex items-center gap-1.5 md:gap-2">
                        <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                        Sin tarjeta requerida
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                        <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                        Configura en 5 min
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                        <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                        Soporte 24/7
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
                                Centralizamos tus reservas, tu facturación adaptada a <strong className="text-amber-500 font-bold">Veri*Factu 2026</strong>, las nóminas de tus barberos y el stock de productos en un único
                                panel de control.
                                Con el mejor software de gestión para barberos, recuperas el tiempo necesario para centrarte en lo importante: <strong className="text-white font-semibold">cortar pelo y hacer crecer tu marca</strong>.
                            </p>
                        </div>

                        {/* Lista de Ventajas (Derecha) */}
                        <div className="bg-zinc-950 border border-zinc-800/80 rounded-3xl p-8 md:p-10 shadow-xl shadow-black/50">
                            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-amber-500" />
                                ¿Qué ganas usando Nelux?
                            </h3>
                            <ul className="space-y-6">
                                {[
                                    { title: 'Panel Personalizado', desc: 'Landing exclusiva de reservas para tus clientes sin que tengan que descargar ninguna app ni registrarse.' },
                                    { title: 'Ahorro de Tiempo', desc: 'Las citas se agendan solas, olvídate de contestar llamadas y mensajes todo el día.' },
                                    { title: 'Adiós a los No-Shows', desc: 'Recordatorios automáticos por WhatsApp antes de la cita.' },
                                    { title: 'Control Total de Barberos', desc: 'Gestión de barberos, fichajes (entrada/salida) y facturación individual.' },
                                    { title: 'Ingresos y Contabilidad Centralizada', desc: 'Gráficas en tiempo real, facturas Veri*Factu (obligatorio 2026) y exportación legal.' },
                                    { title: 'Bot WhatsApp con IA', desc: 'Olvídate de contestar WhatsApps, el bot agenda citas automáticamente y responde preguntas sobre tu barbería.' }
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-4">
                                        <div className="mt-1 w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                                            <span className="text-amber-500 text-sm font-bold">{idx + 1}</span>
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold mb-1">{item.title}</h4>
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
                SECTION A.5: THE BRAIN (AI & Automation)
            ═══════════════════════════════════════════════════════════════════════ */}
            <section id="features" className="relative py-16 md:py-24 lg:py-32 px-4 md:px-8 lg:px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-start">
                        {/* Text Left */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
                                    <Bot className="w-6 h-6 text-amber-500" />
                                </div>
                                <span className="text-amber-500 text-sm font-bold uppercase tracking-wider">Citas Automáticas</span>
                            </div>

                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
                                La IA para Barberos que{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                                    Nunca Duerme
                                </span>
                            </h2>

                            <p className="text-zinc-400 text-base md:text-lg leading-relaxed mb-8">
                                Desde <span className="text-white font-semibold">&quot;Hola&quot;</span> hasta{' '}
                                <span className="text-white font-semibold">&quot;Cita Confirmada&quot;</span> sin que toques el móvil.
                                Nuestro software incluye un chatbot AI impulsado por GPT que convierte interesados en clientes reales agendados <span className="text-amber-500 font-bold">24/7</span>.
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
                SECTION C: MANUAL INTERVENTION (WhatsApp Control)
            ═══════════════════════════════════════════════════════════════════════ */}
            <section className="relative py-16 md:py-24 lg:py-32 px-4 md:px-8 lg:px-6">
                {/* Subtle glow */}
                <div
                    className="absolute top-1/2 left-0 w-[400px] h-[400px] pointer-events-none -translate-y-1/2"
                    style={{
                        background: 'radial-gradient(ellipse at center left, rgba(59, 130, 246, 0.08) 0%, transparent 60%)',
                    }}
                />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-start">
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

                            <p className="text-zinc-400 text-base md:text-lg leading-relaxed mb-8">
                                Con el plan Premium, la IA trabaja por ti, pero tú decides cuándo intervenir.
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
                CÓMO FUNCIONA SECTION
            ═══════════════════════════════════════════════════════════════════════ */}
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
                                    <h3 className="text-xl md:text-2xl font-black text-white mb-3 uppercase tracking-tight">
                                        ACTIVA EL NÚCLEO
                                    </h3>
                                    <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
                                        Suscríbete desde 19€/mes y toma el mando. Sin comisiones ocultas. Configura tu perfil y horarios en un par de clics: tu nueva Web de Citas se genera de forma instantánea y totalmente personalizada. Tu negocio, digitalizado al momento.
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
                                    <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
                                        Abre las puertas de tu barbería en la web. Un portal conectado a tus servicios y equipo donde tus clientes reservan sin descargar apps ni registros tediosos. Olvídate de interrumpir cortes para contestar llamadas o mensajes.
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
                                    <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
                                        Deja que la IA trabaje por ti. Tu agenda se llena sola mediante la web o nuestro chat inteligente (GPT-5). Todo se sincroniza en tiempo real: si alguien reserva online, el hueco desaparece al instante. Cero conflictos, máxima ocupación.
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
                                    <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
                                        Gestiona cada rincón de tu barbería desde un único panel central web o app móvil. Controla tus ingresos, gastos, turnos, nóminas, facturación legal (<strong className="text-amber-500">Veri*Factu 2026</strong>), y stock. El software para barberos más moderno que necesitas para que tu negocio funcione en piloto automático.
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
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-zinc-500 text-sm">
                    <div className="flex flex-col items-center md:items-start gap-1">
                        <p>© 2026 Nelux. El software #1 para barberías. Todos los derechos reservados.</p>
                        <p className="flex items-center gap-3 text-xs mt-2 md:mt-1">
                            <a href="tel:+34623064127" className="hover:text-white transition-colors flex items-center gap-1">
                                <Smartphone className="w-3 h-3" /> +34 623 064 127
                            </a>
                            <span>|</span>
                            <a href="mailto:contacto@nelux.es" className="hover:text-white transition-colors">
                                contacto@nelux.es
                            </a>
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center md:justify-end items-center gap-4 md:gap-6 mt-4 md:mt-0">
                        <Link href="/" className="hover:text-white transition-colors" title="El mejor Software para Barberos">Software para Barberos</Link>
                        <Link href="/pricing" className="hover:text-white transition-colors">Planes y Precios</Link>
                        <Link href="/login" className="hover:text-white transition-colors">Iniciar sesión en la App</Link>
                        <Link href="/register" className="hover:text-white transition-colors">Crear Barbería</Link>
                    </div>
                </div>
            </footer>
        </main>
    );
}
