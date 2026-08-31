// src/components/ui/FilmLogo.tsx
// Affiche le ClearLogo transparent d'un film (style Apple / Infuse / Letterboxd) sur le backdrop.
// Gère l'animation d'apparition et notifie le parent de la présence ou non d'un logo.
'use client';

import React, { useState, useEffect } from 'react';
import { useFilmLogo } from '@/hooks/useFilmLogo';

interface FilmLogoProps {
  title: string;
  releaseYear: string | null;
  afficheUrl: string | null;
  /** Callback pour notifier le parent si un logo valide a été trouvé */
  onLogoLoaded?: (hasLogo: boolean) => void;
  className?: string;
}

export const FilmLogo = React.memo(function FilmLogo({
  title,
  releaseYear,
  afficheUrl,
  onLogoLoaded,
  className = '',
}: FilmLogoProps) {
  const [useOriginalLogo, setUseOriginalLogo] = useState(false);
  const [isPreferenceLoaded, setIsPreferenceLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cinelyon_useOriginalTitleLogo');
      if (stored !== null) {
        setUseOriginalLogo(stored === 'true');
      }
    } catch {}
    setIsPreferenceLoaded(true);

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
    useOriginalLogo && isPreferenceLoaded
  );

  useEffect(() => {
    if (!isLoading && isPreferenceLoaded) {
      if (onLogoLoaded) {
        onLogoLoaded(!!data?.logoUrl);
      }
    }
  }, [isLoading, data?.logoUrl, onLogoLoaded, isPreferenceLoaded]);

  if (isLoading || !data?.logoUrl) return null;

  const { logoUrl, aspectRatio } = data;

  return (
    <div className={`relative z-10 transition-opacity duration-300 pointer-events-none select-none ${className}`}>
      <img
        src={logoUrl}
        alt={`${title} Logo`}
        className="max-h-[64px] sm:max-h-[80px] md:max-h-[96px] max-w-[70%] sm:max-w-[60%] object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
        style={aspectRatio ? { aspectRatio: `${aspectRatio}` } : undefined}
        loading="eager"
      />
    </div>
  );
});
