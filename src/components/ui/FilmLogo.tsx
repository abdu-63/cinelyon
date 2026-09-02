// src/components/ui/FilmLogo.tsx
// Affiche le ClearLogo transparent d'un film (style Apple / Infuse / Letterboxd) sur le backdrop.
// Gère l'affichage instantané depuis le cache (0ms) et l'animation fluide sans flash.
'use client';

import React, { useState, useEffect } from 'react';
import { useFilmLogo, getCachedLogo, FilmLogoResult } from '@/hooks/useFilmLogo';

interface FilmLogoProps {
  title: string;
  releaseYear: string | null;
  afficheUrl: string | null;
  /** Logo initial préchargé côté serveur ou cache */
  initialLogo?: FilmLogoResult | null;
  /** Callback pour notifier le parent si un logo valide est prêt */
  onLogoLoaded?: (hasLogo: boolean) => void;
  className?: string;
}

export const FilmLogo = React.memo(function FilmLogo({
  title,
  releaseYear,
  afficheUrl,
  initialLogo,
  onLogoLoaded,
  className = '',
}: FilmLogoProps) {
  // Lecture synchrone immédiate de la préférence
  const [useOriginalLogo, setUseOriginalLogo] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('cinelyon_useOriginalTitleLogo') === 'true';
      } catch {}
    }
    return false;
  });

  // Écoute des changements de réglages
  useEffect(() => {
    const handleSettingsChange = () => {
      try {
        const updated = localStorage.getItem('cinelyon_useOriginalTitleLogo');
        if (updated !== null) {
          setUseOriginalLogo(updated === 'true');
        }
      } catch {}
    };

    window.addEventListener('cinelyon:settings-changed', handleSettingsChange);
    return () => window.removeEventListener('cinelyon:settings-changed', handleSettingsChange);
  }, []);

  const { data, isLoading } = useFilmLogo(
    title,
    releaseYear,
    afficheUrl,
    useOriginalLogo,
    initialLogo
  );

  const [imageLoaded, setImageLoaded] = useState(() => {
    if (initialLogo?.logoUrl) return true;
    const cached = getCachedLogo(title, releaseYear, useOriginalLogo);
    return !!cached?.logoUrl;
  });

  useEffect(() => {
    if (!isLoading) {
      if (data?.logoUrl) {
        // Précharger l'image pour s'assurer qu'elle est décodée avant d'enlever le titre texte
        const img = new Image();
        img.src = data.logoUrl;
        if (img.complete) {
          setImageLoaded(true);
          onLogoLoaded?.(true);
        } else {
          img.onload = () => {
            setImageLoaded(true);
            onLogoLoaded?.(true);
          };
          img.onerror = () => {
            onLogoLoaded?.(false);
          };
        }
      } else {
        onLogoLoaded?.(false);
      }
    }
  }, [isLoading, data?.logoUrl, onLogoLoaded]);

  if (!data?.logoUrl) return null;

  const { logoUrl, aspectRatio } = data;

  return (
    <div
      className={`relative z-10 pointer-events-none select-none ${
        imageLoaded ? 'opacity-100' : 'opacity-0'
      } ${initialLogo?.logoUrl ? '' : 'transition-opacity duration-200 ease-out'} ${className}`}
    >
      <img
        src={logoUrl}
        alt={`${title} Logo`}
        className="max-h-[64px] sm:max-h-[80px] md:max-h-[96px] max-w-[75%] sm:max-w-[65%] object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)]"
        style={aspectRatio ? { aspectRatio: `${aspectRatio}` } : undefined}
        loading="eager"
        decoding="async"
        // @ts-ignore
        fetchPriority="high"
        onLoad={() => {
          setImageLoaded(true);
          onLogoLoaded?.(true);
        }}
      />
    </div>
  );
});
