import "./globals.css";
import { Space_Grotesk } from 'next/font/google';
import { Toaster } from "@/components/ui/Toaster";
import type { Metadata } from 'next';
import { Sidebar } from "@/components/layout/Sidebar";
import AuthGuard from "@/components/AuthGuard";
import LogoutButton from "@/components/LogoutButton";

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
      <body className={`${spaceGrotesk.className} antialiased bg-black text-white selection:bg-amber-500/30`}>
        <AuthGuard>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />

            {/* CONTENIDO PRINCIPAL */}
            <div className="flex-1 overflow-y-auto bg-[#0a0a0a] relative pt-10 md:pt-0 pb-20 md:pb-0">
              <LogoutButton />
              {children}
            </div>

            <Toaster
              position="top-right"
              toastOptions={{
                className: 'bg-zinc-900 border border-zinc-800 text-white rounded-2xl shadow-2xl',
              }}
            />
          </div>
        </AuthGuard>
      </body>
    </html>
  );
}
