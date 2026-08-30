// src/components/ui/FilmCard.tsx
'use client';

import React, { memo, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ChevronRight, Calendar } from 'lucide-react';
import { Film, DateLabel } from '@/types';
import { useTranslation } from '@/i18n';
import { formatDayLabel, formatLocalizedDayLabel, formatTime, getDeltaForDate } from '@/utils/dateUtils';
import { isPastSeance, hasVisibleSeances, getDateLabelByDay } from '@/utils/showtimes';
import { formatLocalizedGenres, formatLocalizedDuration } from '@/utils/filmLocalizationUtils';
import { formatSeanceLang } from '@/utils/languageUtils';
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

  // Jours ayant au moins une séance visible pour ce film
  const validDayLabels = useMemo(() => {
    const seancesDays = Object.keys(film.seancesByDay || {});
    return seancesDays.filter((dayLabel) => {
      const dObj = getDateLabelByDay(dayLabel, dates);
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

  // État local du jour déplié par l'utilisateur
  const [expandedDayLabel, setExpandedDayLabel] = useState<string | null>(null);

  // Jour actif effectif pour l'affichage des séances
  const activeDayLabel = useMemo(() => {
    if (selectedDayLabelFromDelta !== null) {
      // Si un jour spécifique est sélectionné au niveau supérieur
      return expandedDayLabel === selectedDayLabelFromDelta ? selectedDayLabelFromDelta : null;
    }
    // Si "Tous" est sélectionné, le jour cliqué par l'utilisateur est affiché
    return expandedDayLabel && validDayLabels.includes(expandedDayLabel) ? expandedDayLabel : null;
  }, [selectedDayLabelFromDelta, expandedDayLabel, validDayLabels]);

  const handleDayClick = useCallback((dayLabel: string) => {
    setExpandedDayLabel((prev) => (prev === dayLabel ? null : dayLabel));
  }, []);

  const seancesForDay = useMemo(() => {
    if (!activeDayLabel) return {};
    return film.seancesByDay[activeDayLabel] ?? {};
  }, [film.seancesByDay, activeDayLabel]);

  const selectedIsoDate = useMemo(() => {
    if (!activeDayLabel) return '';
    const dObj = getDateLabelByDay(activeDayLabel, dates);
    return dObj?.isoDate || '';
  }, [activeDayLabel, dates]);

  const cleanRating = useMemo(() => {
    if (!film.rating || film.rating === 'Note inconnue') return null;
    return film.rating.replace(/\/5$/, '');
  }, [film.rating]);

  // Calcul du nombre total de séances visibles
  const totalVisibleSeances = useMemo(() => {
    if (!activeDayLabel) return 0;
    const isToday = getDeltaForDate(selectedIsoDate) === 0;
    let count = 0;
    for (const seances of Object.values(seancesForDay)) {
      for (const s of seances) {
        if (!isToday || !hidePastSessions || !isPastSeance(s.time)) {
          count++;
        }
      }
    }
    return count;
  }, [activeDayLabel, seancesForDay, selectedIsoDate, hidePastSessions]);

  return (
    <div className="w-full mb-3">
      {/* ── 1. Carte Blanche Apple / Sombre Apple (Portage exact de cinelyon-app) ── */}
      <div className="group relative rounded-[18px] sm:rounded-[20px] overflow-hidden bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200 ease-out">
        <div
          onClick={() => router.push(`/film/${film.slug}`)}
          className="flex items-start cursor-pointer select-none"
        >
          {/* Affiche (100px x 144px identique au mobile) */}
          <div className="relative shrink-0 w-[100px] h-[144px] overflow-hidden bg-neutral-900">
            <img
              src={film.affiche || '/images/nocontent.png'}
              alt={film.title}
              className="w-full h-full object-cover rounded-l-[18px] sm:rounded-l-[20px]"
              loading="lazy"
            />
            {film.isNew && (
              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-[#444cf7] text-[8.5px] font-normal tracking-wider text-white shadow-sm">
                NOUVEAU
              </div>
            )}
          </div>

          {/* Info Film */}
          <div className="flex-1 min-w-0 p-2.5 sm:p-3 flex flex-col justify-between self-stretch">
            <div>
              {/* Ligne Titre + Favori */}
              <div className="flex items-start justify-between gap-1">
                <h3 className="font-normal text-[14px] sm:text-[15px] leading-[18px] text-neutral-900 dark:text-white group-hover:text-[#444cf7] transition-colors line-clamp-2 pr-0.5">
                  {film.title}
                  {film.release_year && film.release_year !== 'inconnue' && (
                    <span className="font-normal text-neutral-500 dark:text-neutral-400 text-[12px] sm:text-[13px]"> ({film.release_year})</span>
                  )}
                </h3>

                {/* Bouton Favori */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(film.filmId);
                  }}
                  className="p-1 -mr-1 -mt-0.5 text-neutral-400 hover:text-rose-500 transition-transform active:scale-90 touch-manipulation"
                  aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                  <Heart
                    size={20}
                    className={`transition-colors ${isFavorite ? 'fill-[#ff6b6b] text-[#ff6b6b]' : 'text-neutral-400 dark:text-neutral-400'}`}
                  />
                </button>
              </div>

              {/* Métadonnées */}
              <div className="space-y-0.5 text-[10.5px] sm:text-[11px] leading-[15px] text-neutral-700 dark:text-neutral-300 mt-1">
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
                <p className="hidden md:line-clamp-2 text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
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
              <div className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-neutral-600 dark:text-neutral-400 flex items-center gap-0.5 text-xs font-normal text-[#444cf7]">
                <span className="hidden sm:inline text-[11px] font-normal">Détails</span>
                <ChevronRight size={15} className="text-[#444cf7]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Bouton Jour & Séances dépliables sous la carte ── */}
      {visibleDayLabels.length > 0 && (
        <div className="mt-2 pl-0.5 sm:pl-1">
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
                  onClick={() => handleDayClick(dayLabel)}
                  className={`relative px-3.5 py-1.5 rounded-[18px] text-[12px] font-normal tracking-tight transition-all shrink-0 active:scale-95 touch-manipulation select-none ${
                    isActive
                      ? 'bg-[#444cf7] text-white shadow-xs'
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
            <div className="mt-2 space-y-2 animate-in fade-in duration-150">
              {totalVisibleSeances === 0 ? (
                <div className="py-2.5 px-3.5 rounded-[14px] bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/10 text-center text-xs text-neutral-500 dark:text-neutral-400 shadow-2xs">
                  Toutes les séances de cette journée sont passées.
                </div>
              ) : (
                Object.entries(seancesForDay).map(([cinemaName, seances]) => {
                  const isToday = getDeltaForDate(selectedIsoDate) === 0;
                  const visibleSeances =
                    isToday && hidePastSessions
                      ? seances.filter((s) => !isPastSeance(s.time))
                      : seances;

                  if (visibleSeances.length === 0) return null;

                  return (
                    <div key={cinemaName} className="flex items-center gap-2">
                      {/* Badge Cinéma compact (identique à l'application mobile : 82px, h-[44px], rounded-[14px]) */}
                      <div className="w-[82px] min-w-[82px] max-w-[82px] h-[44px] shrink-0 rounded-[14px] bg-[#444cf7] text-white flex items-center justify-center px-1.5 py-1 text-center shadow-xs">
                        <span className="text-[11px] font-normal leading-[13px] line-clamp-2 text-center">
                          {cinemaName}
                        </span>
                      </div>

                      {/* Horaires horizontaux */}
                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 pr-2">
                        {visibleSeances.map((seance, idx) => {
                          const langBadge = formatSeanceLang(seance.lang, film.original_language);
                          return (
                            <div
                              key={`${seance.time}-${idx}`}
                              className="shrink-0 h-[44px] min-w-[66px] sm:min-w-[70px] px-2.5 py-1.5 rounded-[14px] bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 hover:border-[#444cf7]/60 dark:hover:border-[#444cf7]/60 flex flex-col justify-between transition-colors group/pill"
                            >
                              <div className="flex items-center justify-between gap-1 text-[9px] font-normal text-neutral-400 leading-none">
                                <span>{langBadge}</span>
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
                                  className={`text-[13.5px] font-normal text-[#444cf7] group-hover/pill:underline leading-none ${
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
                                  className="text-neutral-400 hover:text-neutral-800 dark:hover:text-white p-0.5 transition-colors touch-manipulation"
                                  title="Ajouter au calendrier"
                                  aria-label="Ajouter au calendrier"
                                >
                                  <Calendar size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
