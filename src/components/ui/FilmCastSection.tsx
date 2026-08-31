// src/components/ui/FilmCastSection.tsx
'use client';

import React, { memo } from 'react';
import { useRouter } from 'next/navigation';
import { Users, User } from 'lucide-react';
import { CastMember } from '@/types';
import { useTranslation } from '@/i18n';
import { useFilmCast } from '@/hooks/useFilmCast';

interface FilmCastSectionProps {
  filmTitle: string;
  releaseYear: string | null;
  affiche: string | null;
  initialCast?: CastMember[];
}

export const FilmCastSection = memo(function FilmCastSection({
  filmTitle,
  releaseYear,
  affiche,
  initialCast = [],
}: FilmCastSectionProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: cast, isLoading } = useFilmCast(filmTitle, releaseYear, affiche, initialCast);

  const castList = cast || initialCast;

  if (isLoading && castList.length === 0) {
    return (
      <div className="space-y-3 px-1">
        <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-semibold text-sm">
          <Users size={16} className="text-primary" />
          <span>{t('filmDetail.cast')}</span>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center text-center shrink-0 w-[82px] animate-pulse">
              <div className="w-[68px] h-[68px] rounded-full bg-neutral-200 dark:bg-neutral-800 mb-1.5" />
              <div className="w-14 h-2.5 bg-neutral-200 dark:bg-neutral-800 rounded mb-1" />
              <div className="w-10 h-2 bg-neutral-200 dark:bg-neutral-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (castList.length === 0) {
    return null;
  }

  const handleActorClick = (actorName: string) => {
    router.push(`/?search=${encodeURIComponent(actorName)}`);
  };

  return (
    <div className="space-y-3 px-1">
      <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-semibold text-sm">
        <Users size={16} className="text-primary" />
        <span>{t('filmDetail.cast')}</span>
      </div>

      <div className="flex items-start gap-3 overflow-x-auto no-scrollbar pb-1.5 pt-0.5">
        {castList.map((actor) => (
          <button
            key={actor.id}
            type="button"
            onClick={() => handleActorClick(actor.name)}
            className="flex flex-col items-center text-center shrink-0 w-[82px] group focus:outline-none select-none active:scale-95 transition-transform"
          >
            {/* Avatar circulaire */}
            <div className="w-[68px] h-[68px] rounded-full overflow-hidden border border-black/10 dark:border-white/15 bg-neutral-200 dark:bg-[#1c1c1e] mb-1.5 shadow-sm group-hover:border-primary/50 group-hover:scale-105 transition-all">
              {actor.profile_path ? (
                <img
                  src={actor.profile_path}
                  alt={actor.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800">
                  <User size={26} />
                </div>
              )}
            </div>

            {/* Nom de l'acteur */}
            <span className="text-[11px] font-bold text-neutral-900 dark:text-white line-clamp-2 leading-[14px] mb-0.5 group-hover:text-primary transition-colors">
              {actor.name}
            </span>

            {/* Nom du personnage */}
            {actor.character && (
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-[13px] font-normal">
                {actor.character}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
});
