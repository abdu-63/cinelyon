// src/components/ui/FilmShowtimesTabs.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Film, Seance, DateLabel } from '@/types';
import { formatDayLabel, formatTime, formatLocalizedDayLabel } from '@/utils/dateUtils';
import { downloadICS, generateGoogleCalendarUrl } from '@/utils/calendarUtils';
import { getDateLabelByDay, registerDateLabels } from '@/utils/showtimes';
import { useTranslation } from '@/i18n';
import { Ticket, Download } from 'lucide-react';

interface FilmShowtimesTabsProps {
  film: Film;
  dates: DateLabel[];
}

export function FilmShowtimesTabs({ film, dates = [] }: FilmShowtimesTabsProps) {
  const { locale } = useTranslation();

  useEffect(() => {
    if (dates.length > 0) {
      registerDateLabels(dates);
    }
  }, [dates]);

  const dayLabels = Object.keys(film.seancesByDay || {});
  const [selectedDayLabel, setSelectedDayLabel] = useState<string>(dayLabels[0] || '');

  const seancesForDay = (selectedDayLabel && film.seancesByDay?.[selectedDayLabel]) || {};

  const handleCalendarDownload = (seance: Seance, cinema: string) => {
    const dObj = getDateLabelByDay(selectedDayLabel, dates);
    const isoDate = dObj ? dObj.isoDate : new Date().toISOString().split('T')[0];

    downloadICS({
      movieTitle: film.title,
      cinema,
      date: isoDate,
      time: seance.time,
      duree: film.duree || '2h 00min',
      lang: seance.lang,
      ticketUrl: seance.ticketing_url || undefined,
    });
  };

  const handleGoogleCalendar = (seance: Seance, cinema: string) => {
    const dObj = getDateLabelByDay(selectedDayLabel, dates);
    const isoDate = dObj ? dObj.isoDate : new Date().toISOString().split('T')[0];

    const url = generateGoogleCalendarUrl({
      movieTitle: film.title,
      cinema,
      date: isoDate,
      time: seance.time,
      duree: film.duree || '2h 00min',
      lang: seance.lang,
      ticketUrl: seance.ticketing_url || undefined,
    });

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (dayLabels.length === 0) {
    return (
      <div className="p-8 rounded-3xl liquid-glass border border-white/10 text-center text-neutral-400 text-sm">
        Aucune séance disponible pour ce film actuellement.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Day Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {dayLabels.map((dayLabel) => {
          const isSelected = selectedDayLabel === dayLabel;
          const dObj = getDateLabelByDay(dayLabel, dates);
          const tabLabel = dObj ? formatLocalizedDayLabel(dObj.isoDate, locale) : dayLabel;

          return (
            <button
              key={dayLabel}
              type="button"
              onClick={() => setSelectedDayLabel(dayLabel)}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap border transition-all touch-manipulation select-none active:scale-95 ${
                isSelected
                  ? 'bg-[#444cf7] border-[#444cf7] text-white shadow-lg shadow-[#444cf7]/25'
                  : 'liquid-glass-subtle text-neutral-300 hover:text-white border-white/10 hover:border-white/20'
              }`}
            >
              {tabLabel}
            </button>
          );
        })}
      </div>

      {/* Showtimes by Cinema */}
      <div className="space-y-3">
        {Object.keys(seancesForDay).length === 0 ? (
          <p className="text-sm text-neutral-400 italic py-4">Pas de séance ce jour-là.</p>
        ) : (
          Object.entries(seancesForDay).map(([cinemaName, seances]) => (
            <div
              key={cinemaName}
              className="p-4 sm:p-5 rounded-3xl liquid-glass border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <h4 className="font-normal text-sm sm:text-base text-white">{cinemaName}</h4>
                <p className="text-xs text-neutral-400 mt-0.5">{seances.length} séance{seances.length > 1 ? 's' : ''}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {seances.map((seance, sIdx) => (
                  <div key={sIdx} className="flex items-center gap-1">
                    <a
                      href={seance.ticketing_url || '#'}
                      target={seance.ticketing_url ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-2xl bg-[#444cf7]/20 hover:bg-[#444cf7] text-white font-normal text-xs sm:text-sm border border-[#444cf7]/40 hover:border-[#444cf7] shadow-sm transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                    >
                      <Ticket size={13} className="text-[#444cf7] group-hover:text-white" />
                      <span>{formatTime(seance.time)}</span>
                      <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-white/10">
                        {seance.lang}
                      </span>
                      {seance.format && (
                        <span
                          className={`text-[9px] font-normal uppercase px-1.5 py-0.5 rounded ${
                            seance.format.toLowerCase().includes('35mm')
                              ? 'bg-amber-500/25 text-amber-300 border border-amber-500/30'
                              : 'bg-white/20'
                          }`}
                        >
                          {seance.format}
                        </span>
                      )}
                    </a>

                    {/* Quick Calendar Menu Button */}
                    <button
                      type="button"
                      onClick={() => handleCalendarDownload(seance, cinemaName)}
                      title="Ajouter à Apple / Google Calendar"
                      className="p-2 rounded-xl liquid-glass-subtle text-neutral-400 hover:text-white border border-white/10 hover:border-white/20 transition-all text-xs touch-manipulation active:scale-90"
                      aria-label="Exporter séance"
                    >
                      <Download size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
