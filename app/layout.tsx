import "./globals.css";
import { Manrope } from 'next/font/google';
import { Toaster } from "@/components/ui/Toaster";
import type { Metadata } from 'next';
import Script from 'next/script';


const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const viewport = {
  themeColor: '#f59e0b',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://nelux.es'),
  title: 'NeluxBarber | Software para Barberos y App de Reservas',
  description: 'El mejor software de gestión para barberías en España. Automatiza citas con IA, controla tu facturación Verifactu 2026, barberos y stock en una sola app.',
  keywords: [
    'software para barberos', 'app para barberías', 'gestión barbería', 'programa para barberías',
    'agenda citas barbería', 'software barbería España', 'app citas barbero', 'NeluxBarber',
    'verifactu barbería', 'bot whatsapp barbería', 'gestión equipo barberos', 'facturación barbería',
  ],
  authors: [{ name: 'Nelux', url: 'https://nelux.es' }],
  creator: 'Nelux',
  publisher: 'Nelux',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
  alternates: {
    canonical: 'https://nelux.es',
    languages: { 'es-ES': 'https://nelux.es' },
  },
  openGraph: {
    title: 'NeluxBarber | El Software Líder para Barberos en España',
    description: 'Automatiza tu barbería con IA. Agenda de citas, facturación Verifactu 2026 y gestión total en una misma app. Prueba gratis 7 días.',
    url: 'https://nelux.es',
    siteName: 'NeluxBarber',
    images: [
      {
        url: 'https://nelux.es/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Software NeluxBarber — Panel de control para barberías',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NeluxBarber | Software #1 para Barberos en España',
    description: 'Gestiona citas, facturación y equipo desde una sola app. Powered by AI. Prueba gratuita de 7 días.',
    images: ['https://nelux.es/og-image.jpg'],
    site: '@neluxbarber',
    creator: '@neluxbarber',
  },
  appleWebApp: {
    title: 'NeluxBarber',
    statusBarStyle: 'default',
    capable: true,
  },
  icons: {
    icon: [
      { url: '/favicon.ico?v=nelux2', sizes: 'any' },
      { url: '/favicon.svg?v=nelux2', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png?v=nelux2', type: 'image/png', sizes: '96x96' },
    ],
    apple: [
      { url: '/apple-touch-icon.png?v=nelux2', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico?v=nelux2',
    other: [
      { rel: 'manifest', url: '/manifest.json?v=nelux2' },
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg?v=nelux2', color: '#f59e0b' },
    ],
  }
};

import { SWRProvider } from "@/components/providers/SWRProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${manrope.className} antialiased bg-black text-white selection:bg-amber-500/30`}
        suppressHydrationWarning
      >
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-JPTSPNH3EW"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-JPTSPNH3EW');
          `}
        </Script>

        {/* reCAPTCHA Enterprise */}
        <Script 
          src="https://www.google.com/recaptcha/enterprise.js" 
          strategy="beforeInteractive" 
        />
        <SWRProvider>
            {children}
        </SWRProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'bg-zinc-900 border border-zinc-800 text-white rounded-2xl shadow-2xl',
          }}
        />
        <Script
          id="schema-software"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
             __html: JSON.stringify({
               "@context": "https://schema.org",
               "@type": "SoftwareApplication",
               "name": "NeluxBarber",
               "operatingSystem": "Web, iOS, Android",
               "applicationCategory": "BusinessApplication",
               "description": "Software integral para barberías y peluquerías en España. Automatización de citas con Inteligencia Artificial, cumplimiento legal Verifactu 2026 y gestión completa de equipo.",
               "url": "https://nelux.es",
               "inLanguage": "es-ES",
               "offers": {
                 "@type": "AggregateOffer",
                 "lowPrice": "19.00",
                 "highPrice": "149.00",
                 "priceCurrency": "EUR",
                 "offerCount": "4"
               },
               "aggregateRating": {
                 "@type": "AggregateRating",
                 "ratingValue": "4.9",
                 "ratingCount": "142",
                 "bestRating": "5"
               },
               "featureList": [
                 "Agenda de citas automática",
                 "Bot WhatsApp con IA",
                 "Facturación Verifactu 2026",
                 "Gestión de barberos y fichajes",
                 "Control de stock de productos",
                 "Portal de reservas personalizado"
               ]
             })
          }}
        />
        <Script
          id="schema-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
             __html: JSON.stringify({
               "@context": "https://schema.org",
               "@type": "Organization",
               "name": "Nelux",
               "url": "https://nelux.es",
               "logo": "https://nelux.es/favicon-96x96.png",
               "description": "Empresa española de software de gestión para barberías y peluquerías.",
               "email": "contacto@nelux.es",
               "telephone": "+34623064127",
               "address": {
                 "@type": "PostalAddress",
                 "addressCountry": "ES",
                 "addressLocality": "España"
               },
               "sameAs": [
                 "https://nelux.es"
               ]
             })
          }}
        />
        <Script
          id="schema-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
             __html: JSON.stringify({
               "@context": "https://schema.org",
               "@type": "WebSite",
               "name": "NeluxBarber",
               "url": "https://nelux.es",
               "description": "El mejor software para barberos y barberías en España.",
               "potentialAction": {
                 "@type": "SearchAction",
                 "target": "https://nelux.es/?q={search_term_string}",
                 "query-input": "required name=search_term_string"
               }
             })
          }}
        />
      </body>
    </html>
  );
}
