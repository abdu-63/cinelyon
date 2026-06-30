// src/utils/dateUtils.ts
// Portage de app.py::translateDay / translateMonth et helpers dateUtils.ts

import { DAYS_FR, MONTHS_FR } from '@/lib/constants';
import { DateLabel } from '@/types';

export function translateDay(dayOfWeek: number): string {
  return DAYS_FR[dayOfWeek] ?? '???';
}

export function translateMonth(monthNum: number): string {
  return MONTHS_FR[monthNum] ?? '???';
}

export function buildDateLabels(isoDates: string[]): DateLabel[] {
  return isoDates.map((isoDate, index) => {
    const [year, month, day] = isoDate.split('-').map(Number);
    const d = new Date(year, month - 1, day);

    return {
      jour: translateDay(d.getDay()),
      chiffre: d.getDate(),
      mois: translateMonth(d.getMonth() + 1),
      index,
      isoDate,
      fullDate: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`,
    };
  });
}

export function formatDayLabel(label: DateLabel): string {
  return `${label.jour} ${label.chiffre} ${label.mois}`;
}

export function formatTime(timeStr: string): string {
  return timeStr.replace(':', 'h');
}

export function getDeltaForDate(isoDate: string): number {
  const [year, month, day] = isoDate.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
