import "./globals.css";
import { Manrope } from 'next/font/google';
import { Toaster } from "@/components/ui/Toaster";
import type { Metadata } from 'next';


const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const viewport = {
  themeColor: '#f59e0b',
}

export const metadata: Metadata = {
  title: 'Nelux Barbershop - Operations',
  description: 'Premium Barber Management System',
  icons: {
    icon: 'data:image/svg+xml,%3csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3e%3ctext y=%22.9em%22 font-size=%2290%22%3e💈%3c/text%3e%3c/svg%3e',
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
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'bg-zinc-900 border border-zinc-800 text-white rounded-2xl shadow-2xl',
          }}
        />
      </body>
    </html>
  );
}
