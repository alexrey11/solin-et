import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { SyncProvider } from '@/components/sync-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://solinet.cu'),
  title: 'SoliNet — Energía Solar Inteligente',
  description: 'Sistema operativo de la energía solar privada en Cuba',
  openGraph: {
    images: [{ url: '/og-default.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [{ url: '/og-default.png' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className={inter.className}>
        <ThemeProvider>
          <SyncProvider>
            {children}
            <Toaster />
          </SyncProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}