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
  description: 'El mejor software de gestión para barberías. Automatiza citas con IA, controla tu facturación (Veri*factu 2026), barberos y stock en una sola app.',
  openGraph: {
    title: 'NeluxBarber | El Software Líder para Barberos',
    description: 'Automatiza tu barbería con IA. Agenda de citas, facturación y gestión en una misma app.',
    url: 'https://nelux.es',
    siteName: 'NeluxBarber',
    images: [
      {
        url: 'https://nelux.es/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Software de gestión y panel de control NeluxBarber',
      },
    ],
    locale: 'es_ES',
    type: 'website',
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
    ],
  }
};

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
        {children}
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
               "description": "Software integral para barberías y peluquerías. Automatización de citas con Inteligencia Artificial y cumplimiento legal Verifactu.",
               "aggregateRating": {
                 "@type": "AggregateRating",
                 "ratingValue": "4.9",
                 "ratingCount": "142"
               },
               "offers": {
                 "@type": "AggregateOffer",
                 "lowPrice": "19.00",
                 "highPrice": "55.00",
                 "priceCurrency": "EUR"
               }
             })
          }}
        />
      </body>
    </html>
  );
}
