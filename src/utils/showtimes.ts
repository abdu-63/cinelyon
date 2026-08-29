// src/utils/showtimes.ts
// Portage de la logique métier de cinelyon-app et app.py

import { FilmRaw, Film, Seance, DateLabel, FiltersState, TimeSlot, FilmFilterOptions } from '@/types';
import { slugify } from './slugify';
import { buildDateLabels, formatDayLabel, getDeltaForDate, formatTime } from './dateUtils';
import { optimizePosterUrl } from './imageUtils';
import { BRAND_ORDER, getBrand } from '@/lib/constants';

export { formatTime } from './dateUtils';

export function parseAddedAtDate(addedAtStr: string | null | undefined): Date | null {
  if (!addedAtStr || typeof addedAtStr !== 'string') return null;
  const trimmed = addedAtStr.trim();
  if (!trimmed) return null;

  const isoFormatted = trimmed.replace(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}(?::\d{2})?)/, '$1T$2');
  let parsed = new Date(isoFormatted);

  if (isNaN(parsed.getTime())) {
    parsed = new Date(isoFormatted + 'Z');
  }

  if (isNaN(parsed.getTime())) {
    const timestamp = Date.parse(trimmed);
    if (!isNaN(timestamp)) {
      parsed = new Date(timestamp);
    } else {
      return null;
    }
  }

  return parsed;
}

function isSameCalendarDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function isTimestampInAgeRange(
  addedAtStr: string | null | undefined,
  minHours: number,
  maxHours: number
): boolean {
  const addedAtDate = parseAddedAtDate(addedAtStr);
  if (!addedAtDate) return false;

  const now = new Date();
  const diffMs = now.getTime() - addedAtDate.getTime();
  const diffHours = diffMs / (60 * 60 * 1000);

  if (minHours === 0) {
    if (isSameCalendarDay(addedAtDate, now)) return true;
    if (diffHours >= -2 && diffHours < 12 && addedAtDate.getTime() > now.getTime()) return true;
    return false;
  }

  if (minHours === 24) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (isSameCalendarDay(addedAtDate, yesterday)) return true;
    return false;
  }

  if (minHours === 48) {
    const dayBefore = new Date(now);
    dayBefore.setDate(dayBefore.getDate() - 2);
    if (isSameCalendarDay(addedAtDate, dayBefore)) return true;
    return false;
  }

  return diffHours >= minHours && diffHours < maxHours;
}

export function isTimestampToday(addedAtStr: string | null | undefined): boolean {
  return isTimestampInAgeRange(addedAtStr, 0, 24);
}

export function isTimestampYesterday(addedAtStr: string | null | undefined): boolean {
  return isTimestampInAgeRange(addedAtStr, 24, 48);
}

export function isTimestampDayBefore(addedAtStr: string | null | undefined): boolean {
  return isTimestampInAgeRange(addedAtStr, 48, 72);
}

export function isPastSeance(timeStr: string, dayLabel?: string, dates?: DateLabel[]): boolean {
  if (dayLabel && dates && dates.length > 0) {
    const dObj = dates.find((d) => formatDayLabel(d) === dayLabel);
    if (!dObj) return false;

    const delta = getDeltaForDate(dObj.isoDate);
    if (delta < 0) return true;
    if (delta > 0) return false;
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0) < currentMinutes;
}

export function hasVisibleSeances(
  film: Film,
  isoDate: string,
  dates: DateLabel[],
  hidePastSessions: boolean
): boolean {
  const dObj = dates.find((d) => d.isoDate === isoDate);
  if (!dObj) return false;
  const dayLabel = formatDayLabel(dObj);
  const seancesForDay = film.seancesByDay[dayLabel];
  if (!seancesForDay) return false;

  if (!hidePastSessions) {
    return Object.values(seancesForDay).some((arr) => arr.length > 0);
  }

  return Object.values(seancesForDay).some((seances) =>
    seances.some((s) => !isPastSeance(s.time, dayLabel, dates))
  );
}

export function buildFilmList(
  rows: { date: string; movies: FilmRaw[] }[],
  delta: number | null
): { films: Film[]; dates: DateLabel[] } {
  if (!rows.length) return { films: [], dates: [] };

  const dates = buildDateLabels(rows.map((r) => r.date));
  const daysToShow = delta !== null ? [delta] : rows.map((_, i) => i);

  const allFilms = new Map<string, Film>();

  for (const dayIndex of daysToShow) {
    if (dayIndex >= rows.length) continue;
    const { movies } = rows[dayIndex];
    const dayLabel = formatDayLabel(dates[dayIndex]);

    for (const raw of movies) {
      if (!allFilms.has(raw.title)) {
        allFilms.set(raw.title, {
          ...raw,
          affiche: optimizePosterUrl(raw.affiche, 200),
          slug: slugify(raw.title, raw.release_year),
          filmId: raw.title.toLowerCase().replace(/ /g, '-'),
          formats: '',
          seancesByDay: {},
          seancesByDayGrouped: {},
          isNew: false,
          isYesterday: false,
          isDayBefore: false,
          addedAtByDay: {},
        });
      }

      const film = allFilms.get(raw.title)!;

      if (!film.seancesByDay[dayLabel]) {
        film.seancesByDay[dayLabel] = {};
      }

      if (film.addedAtByDay) {
        film.addedAtByDay[dayLabel] = raw.added_at;
      }

      if (isTimestampToday(raw.added_at)) film.isNew = true;
      if (isTimestampYesterday(raw.added_at)) film.isYesterday = true;
      if (isTimestampDayBefore(raw.added_at)) film.isDayBefore = true;

      for (const [cinema, seances] of Object.entries(raw.seances)) {
        if (!film.seancesByDay[dayLabel][cinema]) {
          film.seancesByDay[dayLabel][cinema] = [];
        }
        film.seancesByDay[dayLabel][cinema].push(...seances);
        film.seancesByDay[dayLabel][cinema].sort((a, b) => a.time.localeCompare(b.time));
      }

      film.seancesByDay[dayLabel] = Object.fromEntries(
        Object.entries(film.seancesByDay[dayLabel]).sort(([a], [b]) => a.localeCompare(b, 'fr'))
      );
    }
  }

  const filmList = Array.from(allFilms.values()).map((film) => {
    const filmFormats = new Set<string>();
    const grouped: Film['seancesByDayGrouped'] = {};

    for (const [dayLabel, cinemas] of Object.entries(film.seancesByDay)) {
      const brands: Record<string, Record<string, Seance[]>> = {};

      for (const [cinemaName, seances] of Object.entries(cinemas)) {
        const brand = getBrand(cinemaName);
        if (!brands[brand]) brands[brand] = {};
        brands[brand][cinemaName] = seances;

        for (const seance of seances) {
          if (seance.format) {
            seance.format.split(', ').forEach((f) => filmFormats.add(f.trim()));
          }
        }
      }

      grouped[dayLabel] = {};
      for (const brand of BRAND_ORDER) {
        if (brands[brand]) grouped[dayLabel][brand] = brands[brand];
      }
      for (const brand of Object.keys(brands)) {
        if (!grouped[dayLabel][brand]) grouped[dayLabel][brand] = brands[brand];
      }
    }

    return {
      ...film,
      formats: Array.from(filmFormats).join(',').toLowerCase(),
      seancesByDayGrouped: grouped,
    };
  });

  filmList.sort((a, b) => b.wantToSee - a.wantToSee);

  return { films: filmList, dates };
}

export function findFilmBySlug(
  rows: { date: string; movies: FilmRaw[] }[],
  slug: string
): Film | null {
  const result = buildFilmList(rows, null);
  return result.films.find((f) => f.slug === slug) ?? null;
}

function normalizeString(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

function matchesTimeSlot(timeStr: string, slot: TimeSlot): boolean {
  const mins = parseTimeToMinutes(timeStr);
  switch (slot) {
    case 'morning':
      return mins < 12 * 60;
    case 'afternoon':
      return mins >= 12 * 60 && mins < 18 * 60;
    case 'evening':
    case 'night':
      return mins >= 18 * 60;
    default:
      return false;
  }
}

export function filterFilms(
  films: Film[],
  filters: FiltersState,
  dates: DateLabel[],
  favoriteIds: string[] = []
): Film[] {
  const {
    titleQuery,
    genres: activeGenres,
    directors: activeDirectors,
    cinemas: activeCinemas,
    formats: activeFormats,
    timeSlots: activeTimeSlots,
    showOnlyFavorites,
    showOnlyNew,
    showOnlyYesterday,
    showOnlyDayBefore,
    dayIndex,
  } = filters;

  const normalizedTitleQuery = normalizeString(titleQuery);

  return films.filter((film) => {
    if (showOnlyFavorites && !favoriteIds.includes(film.filmId || film.slug)) {
      return false;
    }

    if (showOnlyNew && !film.isNew) return false;
    if (showOnlyYesterday && !film.isYesterday) return false;
    if (showOnlyDayBefore && !film.isDayBefore) return false;

    if (normalizedTitleQuery) {
      const matchTitle = normalizeString(film.title).includes(normalizedTitleQuery);
      const matchDirector = normalizeString(film.director || film.realisateur || '').includes(
        normalizedTitleQuery
      );
      if (!matchTitle && !matchDirector) return false;
    }

    if (activeGenres.length > 0) {
      const hasGenre = activeGenres.some((g) =>
        normalizeString(film.genres).includes(normalizeString(g))
      );
      if (!hasGenre) return false;
    }

    if (activeDirectors.length > 0) {
      const hasDirector = activeDirectors.some((d) =>
        normalizeString(film.director || film.realisateur || '').includes(normalizeString(d))
      );
      if (!hasDirector) return false;
    }

    if (dayIndex !== null && dates[dayIndex]) {
      const selectedDayLabel = formatDayLabel(dates[dayIndex]);
      const seancesThisDay = film.seancesByDay[selectedDayLabel];
      if (!seancesThisDay || Object.keys(seancesThisDay).length === 0) return false;
    }

    if (activeCinemas.length > 0) {
      const playsInCinema = Object.values(film.seancesByDay).some((cinemaMap) =>
        activeCinemas.some((c) => cinemaMap[c] && cinemaMap[c].length > 0)
      );
      if (!playsInCinema) return false;
    }

    if (activeFormats.length > 0) {
      const hasFormat = activeFormats.some((fmt) =>
        film.formats.toLowerCase().includes(fmt.toLowerCase())
      );
      if (!hasFormat) return false;
    }

    if (activeTimeSlots.length > 0) {
      const hasSlot = Object.values(film.seancesByDay).some((cinemaMap) =>
        Object.values(cinemaMap).some((seances) =>
          seances.some((s) => activeTimeSlots.some((slot) => matchesTimeSlot(s.time, slot)))
        )
      );
      if (!hasSlot) return false;
    }

    return true;
  });
}

export function extractFilterOptions(films: Film[]): FilmFilterOptions {
  const genres = new Set<string>();
  const directors = new Set<string>();
  const cinemas = new Set<string>();
  const formats = new Set<string>();

  for (const film of films) {
    if (film.genres) {
      film.genres.split(', ').forEach((g) => g.trim() && genres.add(g.trim()));
    }
    if (film.director && film.director !== 'Inconnu') {
      directors.add(film.director);
    }
    if (film.formats) {
      film.formats.split(',').forEach((f) => f.trim() && formats.add(f.trim()));
    }
    for (const cinemaMap of Object.values(film.seancesByDay)) {
      Object.keys(cinemaMap).forEach((c) => cinemas.add(c));
    }
  }

  return {
    genres: Array.from(genres).sort((a, b) => a.localeCompare(b, 'fr')),
    directors: Array.from(directors).sort((a, b) => a.localeCompare(b, 'fr')),
    cinemas: Array.from(cinemas).sort((a, b) => a.localeCompare(b, 'fr')),
    formats: Array.from(formats).sort(),
    actors: [],
  };
}
