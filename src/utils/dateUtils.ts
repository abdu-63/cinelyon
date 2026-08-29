// src/utils/dateUtils.ts
// Portage de app.py::translateDay / translateMonth et des helpers JS

import { DAYS_FR, MONTHS_FR } from '@/lib/constants';
import { DateLabel } from '@/types';

export function getTodayIso(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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

export function parseDuration(dureeStr: string): { hours: number; minutes: number } {
  const hourMatch = dureeStr.match(/(\d+)\s*h/);
  const minMatch = dureeStr.match(/(\d+)\s*min/);
  return {
    hours: hourMatch ? parseInt(hourMatch[1], 10) : 0,
    minutes: minMatch ? parseInt(minMatch[1], 10) : 0,
  };
}

export function getDeltaForDate(isoDate: string): number {
  const [year, month, day] = isoDate.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function formatTime(timeStr: string): string {
  return timeStr.replace(':', 'h');
}

export function parseIsoDateLocal(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function formatLocalizedWeekday(isoDate: string, locale = 'fr'): string {
  try {
    const d = parseIsoDateLocal(isoDate);
    const formatted = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d);
    const cleaned = formatted.replace(/\.$/, '');
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  } catch {
    const d = parseIsoDateLocal(isoDate);
    return translateDay(d.getDay());
  }
}

export function formatLocalizedDayMonth(isoDate: string, locale = 'fr'): string {
  try {
    const d = parseIsoDateLocal(isoDate);
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(d);
  } catch {
    const d = parseIsoDateLocal(isoDate);
    return `${d.getDate()} ${translateMonth(d.getMonth() + 1)}`;
  }
}

export function formatLocalizedDayLabel(isoDate: string, locale = 'fr'): string {
  try {
    const d = parseIsoDateLocal(isoDate);
    return new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(d);
  } catch {
    const d = parseIsoDateLocal(isoDate);
    return `${translateDay(d.getDay())} ${d.getDate()} ${translateMonth(d.getMonth() + 1)}`;
  }
}
