import "./globals.css";
import { Space_Grotesk } from 'next/font/google';
import { Toaster } from "@/components/ui/Toaster";
import type { Metadata } from 'next';
import { Sidebar } from "@/components/layout/Sidebar";

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Wolf Barbershop - Operations',
  description: 'Premium Barber Management System',
  themeColor: '#f59e0b',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💈</text></svg>',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${spaceGrotesk.className} flex flex-col md:flex-row h-screen bg-[#0a0a0a] text-zinc-100 overflow-hidden`}>
        <Sidebar />

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 overflow-y-auto bg-[#0a0a0a] relative pb-20 md:pb-0">
          {children}
        </div>

        <Toaster />
      </body>
    </html>
  );
}
