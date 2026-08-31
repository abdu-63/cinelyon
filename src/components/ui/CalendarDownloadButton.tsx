// src/components/ui/CalendarDownloadButton.tsx
'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { downloadICS } from '@/utils/calendarUtils';

interface CalendarDownloadButtonProps {
  movieTitle: string;
  cinema: string;
  date: string;
  time: string;
  duree?: string;
  lang?: string;
  ticketUrl?: string;
  className?: string;
}

export function CalendarDownloadButton({
  movieTitle,
  cinema,
  date,
  time,
  duree = '2h 00min',
  lang,
  ticketUrl,
  className = 'text-[#999] hover:text-neutral-800 dark:hover:text-white p-0.5 transition-colors touch-manipulation',
}: CalendarDownloadButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        downloadICS({
          movieTitle,
          cinema,
          date,
          time,
          duree,
          lang,
          ticketUrl,
        });
      }}
      className={className}
      title="Ajouter au calendrier"
      aria-label="Ajouter au calendrier"
    >
      <Calendar size={13} />
    </button>
  );
}
