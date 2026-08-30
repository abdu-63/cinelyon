// src/components/ui/DaySelector.tsx
'use client';

import React, { useRef } from 'react';
import { DateLabel } from '@/types';
import { useTranslation } from '@/i18n';
import { formatLocalizedWeekday, formatLocalizedDayMonth } from '@/utils/dateUtils';

interface DaySelectorProps {
  dates: DateLabel[];
  selectedDelta: number | null; // null = "Tous"
  onSelect: (delta: number | null) => void;
}

export function DaySelector({ dates = [], selectedDelta, onSelect }: DaySelectorProps) {
  const { locale } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full pt-1 pb-2">
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar px-1 py-1"
      >
        {/* Bouton "Tous" (exactement comme le screenshot 2) */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`h-12 min-w-[70px] px-4 rounded-[24px] flex items-center justify-center font-normal text-xs transition-all shrink-0 border active:scale-95 touch-manipulation select-none ${
            selectedDelta === null
              ? 'bg-[#444cf7] border-[#444cf7] text-white shadow-md shadow-[#444cf7]/25'
              : 'bg-white dark:bg-[#1c1c1e] border-black/[0.08] dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:border-neutral-300 dark:hover:border-white/25'
          }`}
        >
          Tous
        </button>

        {/* Boutons par Jour */}
        {dates.map((date) => {
          const isSelected = selectedDelta === date.index;
          const isToday = date.index === 0;

          const label = isToday ? 'Auj.' : formatLocalizedWeekday(date.isoDate, locale);
          const sublabel = formatLocalizedDayMonth(date.isoDate, locale);

          return (
            <button
              key={date.isoDate}
              type="button"
              onClick={() => onSelect(date.index)}
              className={`h-12 min-w-[70px] px-3.5 rounded-[24px] flex flex-col items-center justify-center transition-all shrink-0 border active:scale-95 touch-manipulation select-none ${
                isSelected
                  ? 'bg-[#444cf7] border-[#444cf7] text-white shadow-md shadow-[#444cf7]/25'
                  : isToday
                  ? 'bg-white dark:bg-[#1c1c1e] border-2 border-[#444cf7] text-neutral-900 dark:text-white shadow-sm'
                  : 'bg-white dark:bg-[#1c1c1e] border-black/[0.08] dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:border-neutral-300 dark:hover:border-white/25'
              }`}
            >
              <span
                className={`text-[12px] font-normal leading-tight ${
                  isSelected ? 'text-white' : isToday ? 'text-[#444cf7]' : 'text-neutral-900 dark:text-white'
                }`}
              >
                {label}
              </span>
              {sublabel && (
                <span
                  className={`text-[10px] font-medium leading-tight mt-0.5 ${
                    isSelected ? 'text-white/90' : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {sublabel}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
