// src/components/ui/FilmCard.tsx
'use client';

import React, { memo, useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Heart, ChevronRight } from 'lucide-react';
import { Film, DateLabel } from '@/types';
import { useTranslation } from '@/i18n';
import { formatDayLabel, formatLocalizedDayLabel, formatTime, getDeltaForDate } from '@/utils/dateUtils';
import { isPastSeance, hasVisibleSeances, getDateLabelByDay } from '@/utils/showtimes';
import { formatLocalizedGenres, formatLocalizedDuration } from '@/utils/filmLocalizationUtils';
import { formatSeanceLang } from '@/utils/languageUtils';
import { DaySeances } from '@/components/ui/DaySeances';
import { preloadFilmLogo } from '@/hooks/useFilmLogo';

interface FilmCardProps {
  film: Film;
  isFavorite: boolean;
  onToggleFavorite: (filmId: string) => void;
  dates: DateLabel[];
  selectedDelta?: number | null;
  hidePastSessions?: boolean;
  onOpenDetail?: (film: Film) => void;
}

export const FilmCard = memo(function FilmCard({
  film,
  isFavorite,
  onToggleFavorite,
  dates = [],
  selectedDelta = null,
  hidePastSessions = false,
  onOpenDetail,
}: FilmCardProps) {
  const { locale } = useTranslation();

  const localizedGenres = useMemo(
    () => formatLocalizedGenres(film.genres, locale),
    [film.genres, locale]
  );
  const localizedDuration = useMemo(
    () => formatLocalizedDuration(film.duree, locale),
    [film.duree, locale]
  );

  // Jours ayant au moins une séance visible pour ce film
  const validDayLabels = useMemo(() => {
    const seancesDays = Object.keys(film.seancesByDay || {});
    return seancesDays.filter((dayLabel) => {
      const seancesThisDay = film.seancesByDay[dayLabel];
      if (!seancesThisDay) return false;
      const count = Object.values(seancesThisDay).reduce((acc, arr) => acc + arr.length, 0);
      return count > 0;
    });
  }, [film.seancesByDay]);

  // Si on a un delta sélectionné (ex: jour J+1), on active cet onglet
  const initialActiveDay = useMemo(() => {
    if (selectedDelta !== null) {
      const targetDate = dates.find((d) => d.index === selectedDelta);
      if (targetDate) {
        const label = formatDayLabel(targetDate);
        if (validDayLabels.includes(label)) return label;
      }
    }
    return validDayLabels[0] || '';
  }, [selectedDelta, dates, validDayLabels]);

  const [activeDayLabel, setActiveDayLabel] = useState<string>(initialActiveDay);

  useEffect(() => {
    if (initialActiveDay) {
      setActiveDayLabel(initialActiveDay);
    }
  }, [initialActiveDay]);

  const visibleDayLabels = useMemo(() => {
    if (selectedDelta !== null) {
      const targetDate = dates.find((d) => d.index === selectedDelta);
      if (targetDate) {
        const label = formatDayLabel(targetDate);
        if (validDayLabels.includes(label)) return [label];
      }
      return [];
    }
    return validDayLabels;
  }, [validDayLabels, selectedDelta, dates]);

  const seancesForDay = film.seancesByDay[activeDayLabel] ?? {};

  // Date ISO correspondant au jour actif sélectionné
  const selectedIsoDate = useMemo(() => {
    const dObj = getDateLabelByDay(activeDayLabel, dates);
    return dObj?.isoDate || '';
  }, [activeDayLabel, dates]);

  // Calcul du nombre de séances visibles pour le jour actif
  const activeDayVisibleCount = useMemo(() => {
    let count = 0;
    for (const sList of Object.values(seancesForDay)) {
      for (const s of sList) {
        if (!hidePastSessions || !isPastSeance(s.time, activeDayLabel, dates)) {
          count++;
        }
      }
    }
    return count;
  }, [activeDayLabel, seancesForDay, selectedIsoDate, hidePastSessions]);

  const cleanRating = useMemo(() => {
    if (!film.rating || film.rating === 'Note inconnue') return null;
    return film.rating.replace(/\/5$/, '');
  }, [film.rating]);

  return (
    <div className="w-full mb-3">
      {/* ── 1. Carte Blanche Apple / Sombre Apple (Portage exact de cinelyon-app) ── */}
      <div className="group relative rounded-[18px] sm:rounded-[20px] overflow-hidden bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200 ease-out">
        <Link
          href={`/film/${film.slug}`}
          prefetch={true}
          onMouseEnter={() => preloadFilmLogo(film.title, film.release_year, film.affiche)}
          onTouchStart={() => preloadFilmLogo(film.title, film.release_year, film.affiche)}
          onClick={(e) => {
            if (onOpenDetail && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
              e.preventDefault();
              onOpenDetail(film);
            }
          }}
          className="flex items-start md:items-stretch cursor-pointer select-none"
        >
          {/* Affiche (Mobile: 100x144px strict / Desktop: agrandie & étirée pour combler la hauteur) */}
          <div className="relative shrink-0 w-[100px] h-[144px] md:w-[155px] md:h-auto md:self-stretch md:min-h-[175px] overflow-hidden bg-neutral-900">
            <img
              src={film.affiche || '/images/nocontent.png'}
              alt={film.title}
              className="w-full h-full object-cover rounded-l-[18px] sm:rounded-l-[20px]"
              loading="lazy"
            />
            {film.isNew && (
              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-primary text-[8.5px] font-normal tracking-wider text-primary-contrast shadow-sm z-10">
                NOUVEAU
              </div>
            )}
          </div>

          {/* Info Film */}
          <div className="flex-1 min-w-0 p-2.5 sm:p-3 md:p-3.5 flex flex-col justify-between self-stretch">
            <div>
              {/* Ligne Titre + Favori */}
              <div className="flex items-start justify-between gap-1">
                <h3 className="font-normal text-[14px] sm:text-[15px] leading-[18px] text-neutral-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2 pr-0.5">
                  {film.title}
                  {film.release_year && film.release_year !== 'inconnue' && (
                    <span className="font-normal text-neutral-500 dark:text-neutral-400 text-[12px] sm:text-[13px]"> ({film.release_year})</span>
                  )}
                </h3>

                {/* Bouton Favori */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleFavorite(film.filmId);
                  }}
                  className="p-1 -mr-1 -mt-0.5 text-neutral-400 hover:text-rose-500 transition-transform active:scale-90 touch-manipulation z-10"
                  aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                  <Heart
                    size={20}
                    className={`transition-colors ${isFavorite ? 'fill-[#ff6b6b] text-[#ff6b6b]' : 'text-neutral-400 dark:text-neutral-400'}`}
                  />
                </button>
              </div>

              {/* Métadonnées */}
              <div className="space-y-0.5 text-[10.5px] sm:text-[11px] leading-[15px] text-neutral-700 dark:text-neutral-300 mt-1 font-normal">
                {film.director && film.director !== 'Inconnu' && (
                  <p className="truncate">
                    <span className="text-neutral-500 dark:text-neutral-400">Réalisateur :</span> <span className="text-neutral-800 dark:text-neutral-200">{film.director}</span>
                  </p>
                )}
                {localizedGenres && (
                  <p className="truncate">
                    <span className="text-neutral-500 dark:text-neutral-400">Genre :</span> <span className="text-neutral-800 dark:text-neutral-200">{localizedGenres}</span>
                  </p>
                )}
                {localizedDuration && (
                  <p className="truncate">
                    <span className="text-neutral-500 dark:text-neutral-400">Durée :</span> <span className="text-neutral-800 dark:text-neutral-200">{localizedDuration}</span>
                  </p>
                )}
                {cleanRating && (
                  <p className="truncate font-normal text-neutral-800 dark:text-neutral-200">
                    <span className="text-neutral-500 dark:text-neutral-400 font-normal">Note :</span> {cleanRating}/5
                  </p>
                )}
              </div>

              {/* Synopsis Teaser sur Desktop (2 lignes nettes) */}
              {film.synopsis && film.synopsis !== 'Synopsis non disponible' && (
                <p className="hidden md:line-clamp-2 text-[11px] font-normal text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                  {film.synopsis}
                </p>
              )}
            </div>

            {/* Pied de Carte : Logos streaming & Bouton Détails */}
            <div className="flex items-center justify-between pt-1 mt-0.5 border-t border-black/[0.04] dark:border-white/[0.06]">
              {film.watch_providers && film.watch_providers.length > 0 ? (
                <div className="flex items-center gap-1">
                  {film.watch_providers.slice(0, 5).map((p, i) => (
                    <img
                      key={i}
                      src={p.logo_path || ''}
                      alt={p.name}
                      title={p.name}
                      className="w-5 h-5 rounded object-cover border border-black/5 dark:border-white/10 shadow-2xs"
                    />
                  ))}
                </div>
              ) : (
                <div />
              )}

              {/* Chevron nav */}
              <div className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-neutral-600 dark:text-neutral-400 flex items-center gap-0.5 text-xs font-normal text-primary">
                <span className="hidden sm:inline text-[11px] font-normal">Détails</span>
                <ChevronRight size={15} className="text-primary" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* ── 2. Bouton Jour & Séances dépliables sous la carte ── */}
      {visibleDayLabels.length > 0 && (
        <div className="mt-3 pl-0.5 sm:pl-1">
          {/* Mini-calendrier du film */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {visibleDayLabels.map((dayLabel) => {
              const cinemas = film.seancesByDay[dayLabel] ?? {};
              const hasAvantPremiere = Object.values(cinemas).some((seances) =>
                seances.some((s) => s.format && s.format.toLowerCase().includes('première'))
              );
              const isActive = activeDayLabel === dayLabel;

              const dObj = getDateLabelByDay(dayLabel, dates);
              const buttonLabel = dObj ? formatLocalizedDayLabel(dObj.isoDate, locale) : dayLabel;

              return (
                <button
                  key={dayLabel}
                  type="button"
                  onClick={() => setActiveDayLabel((prev) => (prev === dayLabel ? '' : dayLabel))}
                  className={`relative px-3.5 py-1.5 rounded-[18px] text-[12px] font-normal tracking-tight transition-all shrink-0 active:scale-95 touch-manipulation select-none ${
                    isActive
                      ? 'bg-primary text-primary-contrast shadow-xs'
                      : 'bg-[#f0f2f5] dark:bg-[#252528] text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200/80 dark:hover:bg-[#2e2e32]'
                  }`}
                >
                  {hasAvantPremiere && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 border border-white" />
                  )}
                  <span>{buttonLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Déploiement des séances */}
          {activeDayLabel && (
            <div className="mt-1.5 animate-in fade-in duration-150">
              {activeDayVisibleCount === 0 ? (
                <div className="py-2.5 px-3.5 rounded-[14px] bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/10 text-center text-xs font-normal text-neutral-500 dark:text-neutral-400 shadow-2xs">
                  Toutes les séances de cette journée sont passées.
                </div>
              ) : (
                <DaySeances
                  cinemas={seancesForDay}
                  isoDate={selectedIsoDate}
                  filmTitle={film.title}
                  filmDuree={film.duree}
                  filmUrl={film.url}
                  filmYear={film.release_year}
                  originalLanguage={film.original_language}
                  hidePastSessions={hidePastSessions}
                  groupByBrand={false}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
