// src/components/ui/FilmCard.tsx
'use client';

import React, { memo, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ChevronRight, Calendar } from 'lucide-react';
import { Film, DateLabel } from '@/types';
import { useTranslation } from '@/i18n';
import { formatDayLabel, formatLocalizedDayLabel, formatTime, getDeltaForDate } from '@/utils/dateUtils';
import { isPastSeance, hasVisibleSeances } from '@/utils/showtimes';
import { formatLocalizedGenres, formatLocalizedDuration } from '@/utils/filmLocalizationUtils';
import { downloadICS } from '@/utils/calendarUtils';

interface FilmCardProps {
  film: Film;
  isFavorite: boolean;
  onToggleFavorite: (filmId: string) => void;
  dates: DateLabel[];
  selectedDelta?: number | null;
  hidePastSessions?: boolean;
}

export const FilmCard = memo(function FilmCard({
  film,
  isFavorite,
  onToggleFavorite,
  dates = [],
  selectedDelta = null,
  hidePastSessions = true,
}: FilmCardProps) {
  const { locale } = useTranslation();
  const router = useRouter();

  const localizedGenres = useMemo(
    () => formatLocalizedGenres(film.genres, locale),
    [film.genres, locale]
  );
  const localizedDuration = useMemo(
    () => formatLocalizedDuration(film.duree, locale),
    [film.duree, locale]
  );

  // Jours ayant au moins une séance visible
  const validDayLabels = useMemo(() => {
    return Object.keys(film.seancesByDay || {}).filter((dayLabel) => {
      const dObj = dates.find((d) => formatDayLabel(d) === dayLabel);
      if (!dObj) return false;
      return hasVisibleSeances(film, dObj.isoDate, dates, hidePastSessions);
    });
  }, [film, dates, hidePastSessions]);

  const selectedDayLabelFromDelta = useMemo(() => {
    if (selectedDelta === null || selectedDelta === undefined) return null;
    const dObj = dates.find((d) => d.index === selectedDelta);
    return dObj ? formatDayLabel(dObj) : null;
  }, [selectedDelta, dates]);

  const visibleDayLabels = useMemo(() => {
    if (!selectedDayLabelFromDelta) return validDayLabels;
    return validDayLabels.filter((label) => label === selectedDayLabelFromDelta);
  }, [validDayLabels, selectedDayLabelFromDelta]);

  const [userSelectedDayIdx, setUserSelectedDayIdx] = useState<number | null>(null);
  const [isDeltaDayExpanded, setIsDeltaDayExpanded] = useState(false);

  const [prevDelta, setPrevDelta] = useState(selectedDelta);
  if (selectedDelta !== prevDelta) {
    setPrevDelta(selectedDelta);
    setUserSelectedDayIdx(null);
    setIsDeltaDayExpanded(false);
  }

  const selectedDayLabel =
    selectedDayLabelFromDelta !== null
      ? isDeltaDayExpanded
        ? selectedDayLabelFromDelta
        : null
      : userSelectedDayIdx !== null
        ? validDayLabels[userSelectedDayIdx]
        : null;

  const seancesForDay = selectedDayLabel ? film.seancesByDay[selectedDayLabel] ?? {} : {};

  const selectedIsoDate = useMemo(() => {
    if (!selectedDayLabel) return '';
    const dObj = dates.find((d) => formatDayLabel(d) === selectedDayLabel);
    return dObj?.isoDate || '';
  }, [selectedDayLabel, dates]);

  const ratingDisplay = film.rating && film.rating !== 'Note inconnue' ? film.rating : null;

  return (
    <div className="w-full mb-3">
      {/* ── 1. Carte Blanche Apple (Portage exact de cinelyon-app) ── */}
      <div className="relative rounded-[20px] overflow-hidden bg-white dark:bg-[#1e1e1e] border border-black/[0.06] dark:border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
        <div
          onClick={() => router.push(`/film/${film.slug}`)}
          className="flex items-start cursor-pointer group select-none"
        >
          {/* Affiche (100px x 144px) */}
          <div className="relative shrink-0 w-[100px] h-[144px]">
            <img
              src={film.affiche || '/images/nocontent.png'}
              alt={film.title}
              className="w-full h-full object-cover rounded-l-[20px]"
              loading="lazy"
            />
            {film.isNew && (
              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#444cf7] text-[9px] font-bold tracking-wider text-white shadow-sm">
                NOUVEAU
              </div>
            )}
          </div>

          {/* Info Film */}
          <div className="flex-1 min-w-0 pt-2 pl-3 pr-3 pb-2 flex flex-col justify-between self-stretch">
            {/* Ligne Titre + Favori */}
            <div className="flex items-start justify-between gap-1">
              <h3 className="font-bold text-[14px] leading-[18px] text-neutral-900 dark:text-white group-hover:text-[#444cf7] transition-colors line-clamp-2 pr-1">
                {film.title}
                {film.release_year && film.release_year !== 'inconnue' && (
                  <span className="font-normal text-neutral-500 text-[13px]"> ({film.release_year})</span>
                )}
              </h3>

              {/* Bouton Favori */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(film.filmId);
                }}
                className="p-1 -mr-1 -mt-0.5 text-neutral-400 hover:text-rose-500 transition-transform active:scale-90"
                aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                <Heart
                  size={20}
                  className={`transition-colors ${isFavorite ? 'fill-[#ff6b6b] text-[#ff6b6b]' : 'text-neutral-400'}`}
                />
              </button>
            </div>

            {/* Métadonnées (exactement comme le screenshot) */}
            <div className="space-y-0.5 text-[11px] leading-[15px] text-neutral-700 dark:text-neutral-300 mt-1">
              {film.director && film.director !== 'Inconnu' && (
                <p className="truncate">
                  <span className="text-neutral-500">Réalisateur :</span> {film.director}
                </p>
              )}
              {localizedGenres && (
                <p className="truncate">
                  <span className="text-neutral-500">Genre :</span> {localizedGenres}
                </p>
              )}
              {localizedDuration && (
                <p className="truncate">
                  <span className="text-neutral-500">Durée :</span> {localizedDuration}
                </p>
              )}
              {ratingDisplay && (
                <p className="truncate font-medium text-neutral-800 dark:text-neutral-200">
                  <span className="text-neutral-500">Note :</span> {ratingDisplay}/5
                </p>
              )}

              {/* Logos streaming */}
              {film.watch_providers && film.watch_providers.length > 0 && (
                <div className="flex items-center gap-1 pt-1">
                  {film.watch_providers.slice(0, 4).map((p, i) => (
                    <img
                      key={i}
                      src={p.logo_path || ''}
                      alt={p.name}
                      title={p.name}
                      className="w-5 h-5 rounded object-cover border border-black/5 dark:border-white/10"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Chevron nav */}
            <div className="self-end opacity-40 group-hover:opacity-80 group-hover:translate-x-0.5 transition-all text-neutral-600 dark:text-neutral-400">
              <ChevronRight size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Bouton Jour & Séances dépliables sous la carte ── */}
      {visibleDayLabels.length > 0 && (
        <div className="mt-2 pl-2">
          {/* Mini-calendrier du film */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {visibleDayLabels.map((dayLabel) => {
              const idxInAll = validDayLabels.indexOf(dayLabel);
              const cinemas = film.seancesByDay[dayLabel] ?? {};
              const hasAvantPremiere = Object.values(cinemas).some((seances) =>
                seances.some((s) => s.format && s.format.toLowerCase().includes('première'))
              );
              const isActive = selectedDayLabel === dayLabel;

              const dObj = dates.find((d) => formatDayLabel(d) === dayLabel);
              const buttonLabel = dObj ? formatLocalizedDayLabel(dObj.isoDate, locale) : dayLabel;

              return (
                <button
                  key={dayLabel}
                  type="button"
                  onClick={() => {
                    if (selectedDayLabelFromDelta !== null) {
                      setIsDeltaDayExpanded(!isDeltaDayExpanded);
                    } else {
                      setUserSelectedDayIdx(isActive ? null : idxInAll);
                    }
                  }}
                  className={`relative px-3 py-1 rounded-[16px] text-[11px] font-semibold tracking-tight transition-all shrink-0 border ${
                    isActive
                      ? 'bg-[#444cf7] border-[#444cf7] text-white shadow-sm'
                      : 'bg-white dark:bg-[#1e1e1e] border-black/[0.08] dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
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
          {selectedDayLabel && (
            <div className="mt-2 space-y-1.5 animate-in fade-in duration-150">
              {Object.entries(seancesForDay).map(([cinemaName, seances]) => {
                const isToday = getDeltaForDate(selectedIsoDate) === 0;
                const visibleSeances =
                  isToday && hidePastSessions
                    ? seances.filter((s) => !isPastSeance(s.time))
                    : seances;

                if (visibleSeances.length === 0) return null;

                return (
                  <div key={cinemaName} className="flex items-center gap-1.5">
                    {/* Badge Cinéma (100px de large, 42px de haut, violet #444cf7) */}
                    <div className="w-[100px] min-w-[100px] h-[42px] shrink-0 rounded-[6px] bg-[#444cf7] text-white flex items-center justify-center p-1 text-center shadow-sm">
                      <span className="text-[11px] font-bold leading-[13px] line-clamp-2">
                        {cinemaName}
                      </span>
                    </div>

                    {/* Horaires horizontaux */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 pr-2">
                      {visibleSeances.map((seance, idx) => (
                        <div
                          key={`${seance.time}-${idx}`}
                          className="shrink-0 h-[42px] min-w-[72px] px-2 py-1 rounded-[10px] bg-white dark:bg-[#1e1e1e] border border-black/[0.08] dark:border-white/10 hover:border-[#444cf7]/60 flex flex-col justify-between transition-colors group/pill"
                        >
                          <div className="flex items-center justify-between gap-1 text-[9px] font-bold text-neutral-500 leading-tight">
                            <span>{seance.lang || 'VF'}</span>
                            {seance.format && (
                              <span className="text-[8px] uppercase text-neutral-400 truncate max-w-[40px]">
                                {seance.format.split(', ')[0]}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-1">
                            <a
                              href={seance.ticketing_url || undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`text-[13px] font-bold text-[#444cf7] group-hover/pill:underline leading-none ${
                                !seance.ticketing_url ? 'cursor-default' : ''
                              }`}
                            >
                              {formatTime(seance.time)}
                            </a>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadICS({
                                  movieTitle: film.title,
                                  cinema: cinemaName,
                                  date: selectedIsoDate,
                                  time: seance.time,
                                  duree: film.duree || '2h 00min',
                                  lang: seance.lang,
                                  ticketUrl: seance.ticketing_url || undefined,
                                });
                              }}
                              className="text-neutral-400 hover:text-neutral-800 dark:hover:text-white p-0.5 transition-colors"
                              title="Ajouter au calendrier"
                            >
                              <Calendar size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
