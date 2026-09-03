// src/components/ui/DaySelector.tsx
'use client';

import React, { useRef } from 'react';
import { DateLabel } from '@/types';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/context/ThemeContext';
import { formatLocalizedWeekday, formatLocalizedDayMonth } from '@/utils/dateUtils';

interface DaySelectorProps {
  dates: DateLabel[];
  selectedDelta: number | null; // null = "Tous"
  onSelect: (delta: number | null) => void;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

export function DaySelector({ dates = [], selectedDelta, onSelect }: DaySelectorProps) {
  const { locale } = useTranslation();
  const { primaryColor, isDark, colors } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);

  const isWhite = primaryColor === 'white';
  const isWhiteLight = primaryColor === 'white' && !isDark;
  const isBlackDark = primaryColor === 'black' && isDark;

  const todayBorderColor = isWhiteLight
    ? '#121212'
    : isBlackDark
    ? '#ffffff'
    : colors.primary || 'var(--primary)';

  // Effet teinté identique à l'application mobile (backgroundColor: colors.primary + '10')
  const todayTint = isWhiteLight
    ? 'rgba(0, 0, 0, 0.04)'
    : isBlackDark
    ? 'rgba(255, 255, 255, 0.08)'
    : hexToRgba(colors.primary || '#444cf7', isDark ? 0.12 : 0.08);

  const todayBackground = isDark
    ? `linear-gradient(${todayTint}, ${todayTint}), rgba(28, 28, 30, 0.75)`
    : `linear-gradient(${todayTint}, ${todayTint}), rgba(255, 255, 255, 0.85)`;

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
              ? 'bg-primary border-primary text-primary-contrast shadow-md shadow-primary/25 border-black/10 dark:border-white/10'
              : 'liquid-glass text-neutral-700 dark:text-neutral-200 hover:border-neutral-300 dark:hover:border-white/25'
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
              style={
                isToday && !isSelected
                  ? {
                      borderColor: todayBorderColor,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      background: todayBackground,
                    }
                  : undefined
              }
              className={`h-12 min-w-[70px] px-3.5 rounded-[24px] flex flex-col items-center justify-center transition-all shrink-0 active:scale-95 touch-manipulation select-none ${
                isSelected
                  ? 'bg-primary border-primary text-primary-contrast shadow-md shadow-primary/25 border border-black/10 dark:border-white/10'
                  : isToday
                  ? 'liquid-glass mini-cal-today text-neutral-900 dark:text-white shadow-sm'
                  : 'liquid-glass border text-neutral-700 dark:text-neutral-200 hover:border-neutral-300 dark:hover:border-white/25'
              }`}
            >
              <span
                className={`text-[12px] font-normal leading-tight ${
                  isSelected
                    ? 'text-primary-contrast'
                    : 'text-neutral-900 dark:text-white'
                }`}
              >
                {label}
              </span>
              {sublabel && (
                <span
                  className={`text-[10px] font-normal leading-tight mt-0.5 ${
                    isSelected
                      ? isWhite
                        ? 'text-[#333333] font-semibold'
                        : 'text-primary-contrast/90'
                      : 'text-neutral-500 dark:text-neutral-400'
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
