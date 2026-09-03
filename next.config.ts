import type { NextConfig } from 'next';
import os from 'os';

function getLocalDevOrigins(): string[] {
  const origins: string[] = ['localhost:3000', '127.0.0.1:3000', '192.168.1.14', '192.168.1.16', '192.168.1.14:3000', '192.168.1.16:3000'];
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          origins.push(net.address);
          origins.push(`${net.address}:3000`);
        }
      }
    }
  } catch {}
  return Array.from(new Set(origins));
}

const nextConfig: NextConfig = {
  // Autorise l'iPhone et appareils locaux à accéder aux ressources de dev
  allowedDevOrigins: getLocalDevOrigins(),

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
