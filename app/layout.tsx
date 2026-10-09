import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { SyncProvider } from '@/components/sync-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.solinet.de5.net'),
  title: 'SoliNet — Energía Solar Inteligente',
  description:
    'El sistema operativo de la energía solar privada en Cuba. Gestiona tu solinera o reserva cargas en solineras cercanas.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SoliNet',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'SoliNet — Energía Solar Inteligente',
    description: 'El sistema operativo de la energía solar privada en Cuba',
    images: [{ url: '/icon-512x512.png' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SoliNet',
    description: 'El sistema operativo de la energía solar privada en Cuba',
    images: [{ url: '/icon-512x512.png' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512x512.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="SoliNet" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#FF8C00" />
      </head>
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