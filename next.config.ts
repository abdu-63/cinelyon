import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Optimisation des images depuis des domaines externes
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: '**.acsta.net' },
      { protocol: 'https', hostname: 'wsrv.nl' },
      { protocol: 'https', hostname: 'img.youtube.com' },
    ],
  },
  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/.well-known/:path*',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
    ];
  },
};

export default nextConfig;
