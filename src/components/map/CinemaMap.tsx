// src/components/map/CinemaMap.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { CINEMAS } from '@/lib/constants';
import { CinemaInfo } from '@/types';
import { MapPin, Navigation, Heart, ExternalLink, Bus, Train, Phone, X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import 'leaflet/dist/leaflet.css';

export default function CinemaMap() {
  const { isDark } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [selectedCinema, setSelectedCinema] = useState<CinemaInfo | null>(null);
  const [favoriteCinemas, setFavoriteCinemas] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'fav'>('all');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cinelyon_cinema_favs');
      if (stored) setFavoriteCinemas(JSON.parse(stored));
    } catch {}
  }, []);

  const toggleFavorite = (cinemaName: string) => {
    setFavoriteCinemas((prev) => {
      const next = prev.includes(cinemaName) ? prev.filter((c) => c !== cinemaName) : [...prev, cinemaName];
      try {
        localStorage.setItem('cinelyon_cinema_favs', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    let isMounted = true;

    // Charger dynamiquement Leaflet côté client
    import('leaflet').then((L) => {
      if (!mapContainerRef.current || mapInstanceRef.current || !isMounted) return;

      const map = L.map(mapContainerRef.current, {
        center: [45.764, 4.8357],
        zoom: 13,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Fond de carte stylisé (CartoDB Dark Matter en dark, Positron en clair)
      const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

      L.tileLayer(tileUrl, {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      // Ajouter les marqueurs cinémas
      CINEMAS.forEach((cinema) => {
        const customIcon = L.divIcon({
          className: 'custom-cinema-marker',
          html: `
            <div style="
              width: 34px;
              height: 34px;
              border-radius: 12px;
              background: linear-gradient(135deg, #444cf7, #7c3aed);
              border: 2px solid #ffffff;
              box-shadow: 0 4px 12px rgba(68, 76, 247, 0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              cursor: pointer;
              transition: transform 0.2s;
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19.82 2H4.18C2.97 2 2 2.97 2 4.18v15.64C2 21.03 2.97 22 4.18 22h15.64c1.21 0 2.18-.97 2.18-2.18V4.18C22 2.97 21.03 2 19.82 2Z"/>
                <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/>
              </svg>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const marker = L.marker([cinema.latitude, cinema.longitude], { icon: customIcon }).addTo(map);

        marker.on('click', () => {
          setSelectedCinema(cinema);
          map.flyTo([cinema.latitude, cinema.longitude], 15, { duration: 0.8 });
        });
      });

      mapInstanceRef.current = map;
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isDark]);

  const displayedCinemas = activeTab === 'all' ? CINEMAS : CINEMAS.filter((c) => favoriteCinemas.includes(c.name));

  return (
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[550px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
      {/* Conteneur Leaflet */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Barre de contrôles flottante en haut */}
      <div className="absolute top-4 left-4 right-4 sm:left-6 sm:w-auto z-10 flex items-center gap-2">
        <div className="liquid-glass-dock rounded-2xl p-1.5 flex items-center gap-1 shadow-xl border border-white/15">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'all' ? 'bg-[#444cf7] text-white shadow-sm' : 'text-neutral-300 hover:bg-white/10'
            }`}
          >
            Tous les cinémas ({CINEMAS.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fav')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'fav' ? 'bg-[#444cf7] text-white shadow-sm' : 'text-neutral-300 hover:bg-white/10'
            }`}
          >
            <Heart size={13} className={favoriteCinemas.length > 0 ? 'fill-rose-400 text-rose-400' : ''} />
            <span>Mes favoris ({favoriteCinemas.length})</span>
          </button>
        </div>
      </div>

      {/* Fiche Cinéma sélectionné */}
      {selectedCinema && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 z-10 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="liquid-glass rounded-3xl p-5 shadow-2xl border border-white/20 relative">
            <button
              type="button"
              onClick={() => setSelectedCinema(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white"
            >
              <X size={16} />
            </button>

            <div className="flex items-start justify-between gap-3 pr-6">
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#444cf7]">Cinéma Lyonnais</span>
                <h3 className="text-base font-normal text-white leading-tight mt-0.5">{selectedCinema.name}</h3>
                <p className="text-xs text-neutral-400 mt-1 flex items-start gap-1">
                  <MapPin size={13} className="shrink-0 text-neutral-500 mt-0.5" />
                  <span>{selectedCinema.address}</span>
                </p>
              </div>
            </div>

            {/* Arrêts TCL */}
            {selectedCinema.tclStops && selectedCinema.tclStops.length > 0 && (
              <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5">
                <span className="text-[11px] font-bold text-neutral-300 flex items-center gap-1">
                  <Train size={13} className="text-[#444cf7]" />
                  <span>Accès Transports TCL</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCinema.tclStops.map((stop, i) => (
                    <div
                      key={i}
                      className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] text-neutral-300 flex items-center gap-1.5"
                    >
                      <span className="font-semibold text-white">{stop.stationName}</span>
                      <span className="text-[10px] px-1 rounded bg-[#444cf7]/20 text-[#444cf7] font-mono font-bold">
                        {stop.lines.join(', ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Itinéraires */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                  selectedCinema.name + ' ' + selectedCinema.address
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-[#444cf7] hover:bg-[#3339c4] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <Navigation size={13} />
                <span>Y aller</span>
              </a>

              <button
                type="button"
                onClick={() => toggleFavorite(selectedCinema.name)}
                className={`p-2.5 rounded-xl border transition-all ${
                  favoriteCinemas.includes(selectedCinema.name)
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                    : 'bg-white/5 border-white/10 text-neutral-300 hover:text-white'
                }`}
                title="Ajouter aux favoris"
              >
                <Heart
                  size={16}
                  className={favoriteCinemas.includes(selectedCinema.name) ? 'fill-rose-500 text-rose-500' : ''}
                />
              </button>

              {selectedCinema.url && (
                <a
                  href={selectedCinema.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-colors"
                  title="Site officiel"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
