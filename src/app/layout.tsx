// src/app/layout.tsx
// Layout racine — équivalent de base.html Flask

import type { Metadata } from 'next';
import '@/styles/globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ThemeScript } from '@/components/layout/ThemeScript';

export const metadata: Metadata = {
  title: 'CinéLyon — Séances de cinéma à Lyon',
  description: 'Découvrez toutes les séances de cinéma à Lyon et sa métropole. Horaires, films à l\'affiche, réservation en ligne.',
  manifest: '/manifest.json',
  themeColor: '#444cf7',
  openGraph: {
    type: 'website',
    url: 'https://cinelyon.fr/',
    title: 'CinéLyon',
    description: 'Découvrez les séances de cinéma à Lyon et ses alentours. Horaires, films, salles et plus encore.',
    images: ['/images/icon-512.png'],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@cinelyon',
    title: 'CinéLyon',
    description: 'Découvrez les séances de cinéma à Lyon et ses alentours.',
    images: ['/images/icon-512.png'],
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
        <link rel="preconnect" href="https://wsrv.nl" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fr.web.img4.acsta.net" />
        <link rel="dns-prefetch" href="https://fr.web.img6.acsta.net" />
        <ThemeScript />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
