import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Autorise l'iPhone sur le réseau local à accéder au serveur de dev
  allowedDevOrigins: ['192.168.1.16'],

  // Optimisation des images depuis des domaines externes
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: '**.acsta.net' },
      { protocol: 'https', hostname: 'wsrv.nl' },
      { protocol: 'https', hostname: 'img.youtube.com' },
    ],
  },

  // Transpilation des packages ESM pour compatibilité iOS 15.1
  transpilePackages: ['framer-motion', 'lucide-react'],

  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/.well-known/:path*',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
    ];
  },

  // Redirections d'alias et compatibilité URLs
  async redirects() {
    return [
      {
        source: '/privacy',
        destination: '/politique-de-confidentialite',
        permanent: true,
      },
      {
        source: '/terms',
        destination: '/cgu',
        permanent: true,
      },
      {
        source: '/support',
        destination: '/suggestions',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
