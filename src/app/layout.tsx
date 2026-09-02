// src/app/layout.tsx
// Layout racine — Providers, Navigation Hybride et Modales Globales

import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import Footer from '@/components/layout/Footer';
import { GlobalModals } from '@/components/layout/GlobalModals';
import { ThemeProvider } from '@/context/ThemeContext';
import { I18nProvider } from '@/i18n';
import { QueryClientProvider } from '@/context/QueryClientProvider';
import { THEME_SCRIPT_CODE } from '@/components/layout/ThemeScript';

export const viewport: Viewport = {
  themeColor: '#121214',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://cinelyon.fr'),
  title: {
    default: 'CinéLyon',
    template: '%s — CinéLyon',
  },
  description:
    'Découvrez toutes les séances de cinéma à Lyon et sa métropole. Horaires, films à l\'affiche, formats IMAX/3D/Dolby, avis et itinéraires TCL.',
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    url: 'https://cinelyon.fr/',
    title: 'CinéLyon — Séances de cinéma à Lyon',
    description: '19 cinémas de la métropole lyonnaise, horaires en temps réel, filtres et pauses ciné.',
    images: [
      {
        url: '/images/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'CinéLyon',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@cinelyon',
    title: 'CinéLyon — Séances de cinéma à Lyon',
    description: 'Découvrez toutes les séances de cinéma à Lyon et ses alentours.',
    images: ['/images/icon-512x512.png'],
  },
  icons: {
    icon: '/images/favicon.png',
    apple: '/images/apple-touch-icon-180x180.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Polyfills universels WebKit iOS 15.1 & Initialisation du thème FOUC-free */}
        <script
          id="cinelyon-legacy-polyfills"
          dangerouslySetInnerHTML={{ __html: THEME_SCRIPT_CODE }}
          suppressHydrationWarning
        />
        <link
          rel="preload"
          href="/font/HealTheWebA-Regular.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/font/montserrat_extrabold.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://wsrv.nl" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://image.tmdb.org" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fr.web.img4.acsta.net" />
        <link rel="dns-prefetch" href="https://fr.web.img6.acsta.net" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
      </head>
      <body className="min-h-screen flex flex-col bg-[#f5f6f8] dark:bg-[#121214] text-neutral-900 dark:text-white selection:bg-[#444cf7] selection:text-white antialiased transition-colors duration-150">
        <QueryClientProvider>
          <ThemeProvider>
            <I18nProvider>
              {/* Main Content */}
              <div className="flex-1">{children}</div>

              {/* ChatBot AI & Settings Modal (chargés dynamiquement côté client) */}
              <GlobalModals />

              {/* Footer */}
              <Footer />
            </I18nProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
