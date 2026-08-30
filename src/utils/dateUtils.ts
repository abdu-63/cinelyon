// src/utils/dateUtils.ts
// Portage de app.py::translateDay / translateMonth et des helpers JS optimisés avec cache Intl

import { DAYS_FR, MONTHS_FR } from '@/lib/constants';
import { DateLabel } from '@/types';

// Caches singleton pour les formateurs Intl et les libellés formatés
const formatterCache = new Map<string, Intl.DateTimeFormat>();
const weekdayCache = new Map<string, string>();
const dayMonthCache = new Map<string, string>();
const localizedDayLabelCache = new Map<string, string>();
const deltaCache = new Map<string, number>();

function getFormatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}-${JSON.stringify(options)}`;
  let fmt = formatterCache.get(key);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(locale, options);
    formatterCache.set(key, fmt);
  }
  return fmt;
}

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
    const d = new Date(year, (month || 1) - 1, day || 1);

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
  if (!isoDate) return 0;
  const cached = deltaCache.get(isoDate);
  if (cached !== undefined) return cached;

  const [year, month, day] = isoDate.split('-').map(Number);
  const target = new Date(year, (month || 1) - 1, day || 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  const delta = Math.round(diffMs / (1000 * 60 * 60 * 24));
  deltaCache.set(isoDate, delta);
  return delta;
}

export function formatTime(timeStr: string): string {
  return timeStr ? timeStr.replace(':', 'h') : '';
}

export function parseIsoDateLocal(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function formatLocalizedWeekday(isoDate: string, locale = 'fr'): string {
  const cacheKey = `${isoDate}_${locale}`;
  const cached = weekdayCache.get(cacheKey);
  if (cached) return cached;

  let result: string;
  try {
    const d = parseIsoDateLocal(isoDate);
    const fmt = getFormatter(locale, { weekday: 'short' });
    const formatted = fmt.format(d);
    const cleaned = formatted.replace(/\.$/, '');
    result = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  } catch {
    const d = parseIsoDateLocal(isoDate);
    result = translateDay(d.getDay());
  }

  weekdayCache.set(cacheKey, result);
  return result;
}

export function formatLocalizedDayMonth(isoDate: string, locale = 'fr'): string {
  const cacheKey = `${isoDate}_${locale}`;
  const cached = dayMonthCache.get(cacheKey);
  if (cached) return cached;

  let result: string;
  try {
    const d = parseIsoDateLocal(isoDate);
    const fmt = getFormatter(locale, { day: 'numeric', month: 'short' });
    const formatted = fmt.format(d);
    result = formatted
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  } catch {
    const d = parseIsoDateLocal(isoDate);
    result = `${d.getDate()} ${translateMonth(d.getMonth() + 1)}`;
  }

  dayMonthCache.set(cacheKey, result);
  return result;
}

export function formatLocalizedDayLabel(isoDate: string, locale = 'fr'): string {
  const cacheKey = `${isoDate}_${locale}`;
  const cached = localizedDayLabelCache.get(cacheKey);
  if (cached) return cached;

  let result: string;
  try {
    const d = parseIsoDateLocal(isoDate);
    const fmt = getFormatter(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    const formatted = fmt.format(d);
    // Capitaliser chaque mot (ex: "dim. 30 août" -> "Dim. 30 Août")
    result = formatted
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  } catch {
    const d = parseIsoDateLocal(isoDate);
    result = `${translateDay(d.getDay())} ${d.getDate()} ${translateMonth(d.getMonth() + 1)}`;
  }

  localizedDayLabelCache.set(cacheKey, result);
  return result;
}
