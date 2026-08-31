// src/components/ui/DaySeances.tsx
// Composant partagé pour afficher les séances d'un jour par cinéma
// Portage exact de cinelyon-app avec regroupement par enseigne et logos vectoriels officiels
'use client';

import React, { useMemo } from 'react';
import { Seance } from '@/types';
import { formatTime, getDeltaForDate } from '@/utils/dateUtils';
import { formatSeanceLang } from '@/utils/languageUtils';
import { isPastSeance } from '@/utils/showtimes';
import { BRAND_ORDER, getBrand } from '@/lib/constants';
import { CinemaBrand } from './CinemaBrand';
import { CalendarDownloadButton } from './CalendarDownloadButton';

export interface DaySeancesProps {
  cinemas: Record<string, Seance[]>;
  isoDate: string;
  filmTitle: string;
  filmDuree?: string;
  filmUrl?: string;
  filmYear?: string;
  originalLanguage?: string | null;
  hidePastSessions?: boolean;
  groupByBrand?: boolean;
}

export const DaySeances = React.memo(function DaySeances({
  cinemas,
  isoDate,
  filmTitle,
  filmDuree,
  originalLanguage,
  hidePastSessions = true,
  groupByBrand = true,
}: DaySeancesProps) {
  const isToday = getDeltaForDate(isoDate) === 0;

  const groupedCinemas = useMemo(() => {
    if (!groupByBrand) return null;
    const brands: Record<string, Record<string, Seance[]>> = {};

    for (const [cinemaName, seances] of Object.entries(cinemas)) {
      const brand = getBrand(cinemaName);
      if (!brands[brand]) brands[brand] = {};
      brands[brand][cinemaName] = seances;
    }

    const sortedBrands: { brand: string; cinemas: Record<string, Seance[]> }[] = [];
    for (const brand of BRAND_ORDER) {
      if (brands[brand]) {
        sortedBrands.push({ brand, cinemas: brands[brand] });
      }
    }
    for (const brand of Object.keys(brands)) {
      if (!BRAND_ORDER.includes(brand as any)) {
        sortedBrands.push({ brand, cinemas: brands[brand] });
      }
    }
    return sortedBrands;
  }, [cinemas, groupByBrand]);

  if (groupByBrand && groupedCinemas) {
    return (
      <div className="space-y-4">
        {groupedCinemas.map(({ brand, cinemas: brandCinemas }) => {
          const visibleEntries = Object.entries(brandCinemas).filter(([_, seances]) => {
            const visibleSeances =
              isToday && hidePastSessions ? seances.filter((s) => !isPastSeance(s.time)) : seances;
            return visibleSeances.length > 0;
          });

          if (visibleEntries.length === 0) return null;

          return (
            <div key={brand} className="space-y-1.5">
              <CinemaBrand brandName={brand} />
              <div className="space-y-[1px]">
                {visibleEntries.map(([cinemaName, seances]) => {
                  const visibleSeances =
                    isToday && hidePastSessions
                      ? seances.filter((s) => !isPastSeance(s.time))
                      : seances;

                  return (
                    <CinemaSeanceRow
                      key={cinemaName}
                      cinemaName={cinemaName}
                      visibleSeances={visibleSeances}
                      isoDate={isoDate}
                      filmTitle={filmTitle}
                      filmDuree={filmDuree}
                      originalLanguage={originalLanguage}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-[1px]">
      {Object.entries(cinemas).map(([cinemaName, seances]) => {
        const visibleSeances =
          isToday && hidePastSessions ? seances.filter((s) => !isPastSeance(s.time)) : seances;

        if (!visibleSeances.length) return null;

        return (
          <CinemaSeanceRow
            key={cinemaName}
            cinemaName={cinemaName}
            visibleSeances={visibleSeances}
            isoDate={isoDate}
            filmTitle={filmTitle}
            filmDuree={filmDuree}
            originalLanguage={originalLanguage}
          />
        );
      })}
    </div>
  );
});

interface CinemaSeanceRowProps {
  cinemaName: string;
  visibleSeances: Seance[];
  isoDate: string;
  filmTitle: string;
  filmDuree?: string;
  originalLanguage?: string | null;
}

const CinemaSeanceRow = React.memo(function CinemaSeanceRow({
  cinemaName,
  visibleSeances,
  isoDate,
  filmTitle,
  filmDuree,
  originalLanguage,
}: CinemaSeanceRowProps) {
  return (
    <div className="flex items-center gap-1.5">
      {/* Badge Cinéma (100px x 42px bg-primary text-primary-contrast) */}
      <div className="w-[100px] min-w-[100px] max-w-[100px] h-[42px] shrink-0 rounded-[5px] bg-primary text-primary-contrast flex items-center justify-center px-1.5 py-1 text-center shadow-xs">
        <span className="text-[12px] font-normal leading-[14px] line-clamp-3 text-center">
          {cinemaName}
        </span>
      </div>

      {/* Horaires défilables horizontalement */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 pr-2">
        {visibleSeances.map((seance, idx) => (
          <SeancePill
            key={`${seance.time}-${idx}`}
            cinemaName={cinemaName}
            seance={seance}
            isoDate={isoDate}
            filmTitle={filmTitle}
            filmDuree={filmDuree}
            originalLanguage={originalLanguage}
          />
        ))}
      </div>
    </div>
  );
});

export interface SeancePillProps {
  cinemaName: string;
  seance: Seance;
  isoDate: string;
  filmTitle: string;
  filmDuree?: string;
  originalLanguage?: string | null;
}

export const SeancePill = React.memo(function SeancePill({
  cinemaName,
  seance,
  isoDate,
  filmTitle,
  filmDuree,
  originalLanguage,
}: SeancePillProps) {
  const langLabel = formatSeanceLang(seance.lang, originalLanguage);
  const formatLabel = seance.format ? seance.format.split(', ')[0] : null;

  const content = (
    <div
      className={`shrink-0 h-[42px] min-w-[72px] px-2 py-1 rounded-[10px] bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 hover:border-primary/60 dark:hover:border-primary/60 flex flex-col justify-between shadow-xs transition-colors group/pill ${
        seance.ticketing_url ? 'cursor-pointer' : ''
      }`}
    >
      {/* Top : Lang + Format (avec pt-0.5 pour descendre le badge VF/VO) */}
      <div className="flex items-center justify-between gap-1 text-[9px] font-normal text-[#999] leading-none pt-0.5">
        <span>{langLabel}</span>
        {formatLabel && (
          <span className="text-[8px] font-normal uppercase text-[#999] truncate max-w-[42px]">
            {formatLabel}
          </span>
        )}
      </div>

      {/* Bottom : Time + Calendar */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-[13px] font-normal text-primary leading-none group-hover/pill:underline">
          {formatTime(seance.time)}
        </span>
        <div onClick={(e) => e.stopPropagation()}>
          <CalendarDownloadButton
            movieTitle={filmTitle}
            cinema={cinemaName}
            date={isoDate}
            time={seance.time}
            duree={filmDuree}
            lang={seance.lang}
            ticketUrl={seance.ticketing_url ?? undefined}
          />
        </div>
      </div>
    </div>
  );

  if (seance.ticketing_url) {
    return (
      <a
        href={seance.ticketing_url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 group block touch-manipulation"
        title={`Réserver ${filmTitle} à ${seance.time} au ${cinemaName}`}
      >
        {content}
      </a>
    );
  }

  return <div className="shrink-0">{content}</div>;
});
