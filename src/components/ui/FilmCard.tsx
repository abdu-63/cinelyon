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

  const cleanRating = useMemo(() => {
    if (!film.rating || film.rating === 'Note inconnue') return null;
    return film.rating.replace(/\/5$/, '');
  }, [film.rating]);

  return (
    <div className="w-full mb-3 sm:mb-3.5">
      {/* ── 1. Carte Blanche Apple / Sombre Apple (Portage exact de cinelyon-app) ── */}
      <div className="group relative rounded-[18px] sm:rounded-[22px] overflow-hidden bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-lg hover:-translate-y-1 dark:hover:border-white/20 transition-all duration-200 ease-out motion-reduce:hover:translate-y-0">
        <div
          onClick={() => router.push(`/film/${film.slug}`)}
          className="flex items-start cursor-pointer select-none"
        >
          {/* Affiche (100px x 144px sur mobile, 135px x 195px sur sm, 165px x 238px sur md+) */}
          <div className="relative shrink-0 w-[100px] h-[144px] sm:w-[135px] sm:h-[195px] md:w-[165px] md:h-[238px] overflow-hidden bg-neutral-900">
            <img
              src={film.affiche || '/images/nocontent.png'}
              alt={film.title}
              className="w-full h-full object-cover rounded-l-[18px] sm:rounded-l-[22px]"
              loading="lazy"
            />
            {film.isNew && (
              <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 px-1.5 sm:px-2 py-0.5 rounded-md bg-[#444cf7] text-[9px] sm:text-[10px] font-normal tracking-wider text-white shadow-sm">
                NOUVEAU
              </div>
            )}
          </div>

          {/* Info Film */}
          <div className="flex-1 min-w-0 pt-2 pl-3 pr-3 pb-2 sm:pt-3 sm:pl-4 sm:pr-4 sm:pb-3 md:pt-3.5 md:pl-5 md:pr-5 md:pb-3.5 flex flex-col justify-between self-stretch">
            <div>
              {/* Ligne Titre + Favori */}
              <div className="flex items-start justify-between gap-1 sm:gap-2">
                <h3 className="font-normal text-[14px] sm:text-[16px] md:text-[18px] leading-[18px] sm:leading-[22px] md:leading-[24px] text-neutral-900 dark:text-white group-hover:text-[#444cf7] transition-colors line-clamp-2 pr-1">
                  {film.title}
                  {film.release_year && film.release_year !== 'inconnue' && (
                    <span className="font-normal text-neutral-500 dark:text-neutral-400 text-[13px] sm:text-[14px] md:text-[15px]"> ({film.release_year})</span>
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
                    size={21}
                    className={`transition-colors ${isFavorite ? 'fill-[#ff6b6b] text-[#ff6b6b]' : 'text-neutral-400 dark:text-neutral-400'}`}
                  />
                </button>
              </div>

              {/* Métadonnées */}
              <div className="space-y-0.5 sm:space-y-1 text-[11px] sm:text-[12px] md:text-[13px] leading-[15px] sm:leading-[18px] md:leading-[19px] text-neutral-700 dark:text-neutral-300 mt-1">
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
                <p className="hidden md:line-clamp-2 text-[12px] text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
                  {film.synopsis}
                </p>
              )}
            </div>

            {/* Pied de Carte : Logos streaming & Bouton Détails */}
            <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-black/[0.04] dark:border-white/[0.06]">
              {film.watch_providers && film.watch_providers.length > 0 ? (
                <div className="flex items-center gap-1.5">
                  {film.watch_providers.slice(0, 5).map((p, i) => (
                    <img
                      key={i}
                      src={p.logo_path || ''}
                      alt={p.name}
                      title={p.name}
                      className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 rounded object-cover border border-black/5 dark:border-white/10 shadow-2xs"
                    />
                  ))}
                </div>
              ) : (
                <div />
              )}

              {/* Chevron nav */}
              <div className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-neutral-600 dark:text-neutral-400 flex items-center gap-1 text-xs font-normal text-[#444cf7]">
                <span className="hidden sm:inline text-[11px] font-normal">Détails</span>
                <ChevronRight size={16} className="sm:w-4 sm:h-4 text-[#444cf7]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Bouton Jour & Séances dépliables sous la carte ── */}
      {visibleDayLabels.length > 0 && (
        <div className="mt-2 pl-1 sm:pl-2">
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
                  className={`relative px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-[16px] text-[11px] sm:text-[12px] font-normal tracking-tight transition-all shrink-0 border active:scale-95 ${
                    isActive
                      ? 'bg-[#444cf7] border-[#444cf7] text-white shadow-sm'
                      : 'bg-white dark:bg-[#1c1c1e] border-black/[0.08] dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:border-neutral-300 dark:hover:border-white/25'
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
                  <div key={cinemaName} className="flex items-center gap-1.5 sm:gap-2">
                    {/* Badge Cinéma (aligné avec la largeur exacte de l'affiche: 100px mobile, 135px sm, 165px md+) */}
                    <div className="w-[100px] sm:w-[135px] md:w-[165px] min-w-[100px] sm:min-w-[135px] md:min-w-[165px] h-[42px] sm:h-[46px] shrink-0 rounded-[6px] sm:rounded-[8px] bg-[#444cf7] text-white flex items-center justify-center p-1 sm:p-2 text-center shadow-sm">
                      <span className="text-[11px] sm:text-[12px] md:text-[13px] font-normal leading-[13px] sm:leading-[15px] line-clamp-2">
                        {cinemaName}
                      </span>
                    </div>

                    {/* Horaires horizontaux */}
                    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 pr-2">
                      {visibleSeances.map((seance, idx) => (
                        <div
                          key={`${seance.time}-${idx}`}
                          className="shrink-0 h-[42px] sm:h-[48px] min-w-[72px] sm:min-w-[84px] px-2 sm:px-2.5 py-1 rounded-[10px] sm:rounded-[12px] bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 hover:border-[#444cf7]/60 dark:hover:border-[#444cf7]/60 flex flex-col justify-between transition-colors group/pill"
                        >
                          <div className="flex items-center justify-between gap-1 text-[9px] sm:text-[10px] font-normal text-neutral-500 dark:text-neutral-400 leading-tight">
                            <span>{seance.lang || 'VF'}</span>
                            {seance.format && (
                              <span className="text-[8px] sm:text-[9px] uppercase text-neutral-400 truncate max-w-[48px]">
                                {seance.format.split(', ')[0]}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-1">
                            <a
                              href={seance.ticketing_url || undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`text-[13px] sm:text-[14px] font-normal text-[#444cf7] group-hover/pill:underline leading-none ${
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
                              <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
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
