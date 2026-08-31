// src/app/map/page.tsx
'use client';

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

const CinemaMap = dynamic(() => import('@/components/map/CinemaMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[calc(100vh-140px)] min-h-[550px] rounded-3xl liquid-glass border border-white/10 flex items-center justify-center text-neutral-400 text-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary animate-pulse">
          <MapPin size={20} />
        </div>
        <p>Chargement de la carte des cinémas de Lyon...</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      {/* Title & Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <MapPin className="text-primary" size={26} />
            <span>Carte des Cinémas & Réseau TCL</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Explorez les 19 salles de cinéma de l&apos;agglomération lyonnaise et trouvez l&apos;itinéraire idéal en métro, tram ou bus.
          </p>
        </div>
      </div>

      {/* Dynamic Map Component */}
      <CinemaMap />
    </div>
  );
}
