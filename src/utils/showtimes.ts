// src/utils/showtimes.ts
// Portage de la logique métier de app.py::home() et app.py::film_detail()
// Source: cinelyon-app/src/utils/showtimes.ts (portage web)

import { FilmRaw, Film, Seance, DateLabel } from '@/types';
import { slugify } from './slugify';
import { buildDateLabels, formatDayLabel } from './dateUtils';
import { optimizePosterUrl } from './imageUtils';
import { BRAND_ORDER, getBrand } from '@/lib/constants';

export { formatTime } from './dateUtils';

export function isPastSeance(timeStr: string): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0) < currentMinutes;
}

export function isTimestampInAgeRange(
  addedAtStr: string | null | undefined,
  minHours: number,
  maxHours: number
): boolean {
  if (!addedAtStr) return false;
  const addedAtDate = new Date(addedAtStr);
  const now = new Date();
  const diffMs = now.getTime() - addedAtDate.getTime();
  const diffHours = diffMs / (60 * 60 * 1000);
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

/**
 * Transforme les lignes brutes Supabase en liste de films enrichis.
 * Portage exact de app.py::home()
 */
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

export function extractFilterOptions(films: Film[]) {
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
  };
}
