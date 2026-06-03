// src/utils/showtimes.ts
// Portage de la logique métier de app.py::home() et app.py::film_detail()

import { FilmRaw, Film, Seance, DateLabel } from '../types';
import { slugify } from './slugify';
import { buildDateLabels, formatDayLabel, getDeltaForDate } from './dateUtils';
import { optimizePosterUrl } from './imageUtils';
import { BRAND_ORDER, getBrand } from '../lib/constants';
import type { TimeSlot } from '../types';

export { formatTime } from './dateUtils';

// ── buildFilmList — portage de app.py::home() ────────────────────────────────

/**
 * Transforme les lignes brutes Supabase en liste de films enrichis.
 * Portage exact de app.py::home() (lines 344–458).
 *
 * @param rows   Lignes Supabase { date, movies[] }
 * @param delta  Index du jour à afficher (null = tous les jours)
 */
export function buildFilmList(
  rows: { date: string; movies: FilmRaw[] }[],
  delta: number | null
): { films: Film[]; dates: DateLabel[] } {
  if (!rows.length) return { films: [], dates: [] };

  const dates = buildDateLabels(rows.map((r) => r.date));

  // Jours à afficher (équivalent de `days_to_show` — app.py line 372)
  const daysToShow = delta !== null ? [delta] : rows.map((_, i) => i);

  const allFilms = new Map<string, Film>();

  for (const dayIndex of daysToShow) {
    if (dayIndex >= rows.length) continue;
    const { movies } = rows[dayIndex];
    const dayLabel = formatDayLabel(dates[dayIndex]);

    for (const raw of movies) {
      if (!allFilms.has(raw.title)) {
        // Initialiser le film — portage de app.py lines 381–400
        allFilms.set(raw.title, {
          ...raw,
          affiche: optimizePosterUrl(raw.affiche, 200),
          slug: slugify(raw.title, raw.release_year),
          formats: '',
          seancesByDay: {},
          seancesByDayGrouped: {},
        });
      }

      const film = allFilms.get(raw.title)!;

      if (!film.seancesByDay[dayLabel]) {
        film.seancesByDay[dayLabel] = {};
      }

      // Fusionner séances par cinéma avec tri par heure (app.py lines 405–414)
      for (const [cinema, seances] of Object.entries(raw.seances)) {
        if (!film.seancesByDay[dayLabel][cinema]) {
          film.seancesByDay[dayLabel][cinema] = [];
        }
        film.seancesByDay[dayLabel][cinema].push(...seances);
        film.seancesByDay[dayLabel][cinema].sort((a, b) =>
          a.time.localeCompare(b.time)
        );
      }

      // Réordonner par ordre alphabétique des cinémas (app.py line 412)
      film.seancesByDay[dayLabel] = Object.fromEntries(
        Object.entries(film.seancesByDay[dayLabel]).sort(([a], [b]) =>
          a.localeCompare(b, 'fr')
        )
      );
    }
  }

  // Post-traitement : formats + seancesByDayGrouped
  const filmList = Array.from(allFilms.values()).map((film) => {
    const filmFormats = new Set<string>();

    // seancesByDayGrouped — portage de app.py::film_detail() lines 604–618
    const grouped: Film['seancesByDayGrouped'] = {};

    for (const [dayLabel, cinemas] of Object.entries(film.seancesByDay)) {
      const brands: Record<string, Record<string, Seance[]>> = {};

      for (const [cinemaName, seances] of Object.entries(cinemas)) {
        const brand = getBrand(cinemaName);
        if (!brands[brand]) brands[brand] = {};
        brands[brand][cinemaName] = seances;

        // Collecter les formats
        for (const seance of seances) {
          if (seance.format) {
            seance.format.split(', ').forEach((f) => filmFormats.add(f.trim()));
          }
        }
      }

      // Trier les marques selon BRAND_ORDER, puis ajouter les inconnues (app.py lines 612–617)
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

  // Tri par wantToSee DESC — app.py line 416
  filmList.sort((a, b) => b.wantToSee - a.wantToSee);

  return { films: filmList, dates };
}

// ── findFilmBySlug — portage de app.py::film_detail() ───────────────────────

/**
 * Retrouve un film par son slug dans les données brutes.
 * Portage de app.py::film_detail() (lines 483–527).
 */
export function findFilmBySlug(
  rows: { date: string; movies: FilmRaw[] }[],
  slug: string
): Film | null {
  const dates = buildDateLabels(rows.map((r) => r.date));
  const result = buildFilmList(rows, null);
  return result.films.find((f) => f.slug === slug) ?? null;
}

// ── Filtres (portage de filterFilms() — index.js lines 345–620) ─────────────

export interface FilmFilters {
  titleQuery?: string;
  genre?: string;
  director?: string;
  cinema?: string;
  dayIndex?: number | null;
  format?: string;
  timeSlot?: TimeSlot | null;
  showOnlyFavorites?: boolean;
  favorites?: string[];
  friendFavorites?: string[];
  showFriendFavorites?: boolean;
}

/**
 * Filtre une liste de films selon les critères actifs.
 * Portage de filterFilms() dans index.js.
 */
export function filterFilms(films: Film[], filters: FilmFilters): Film[] {
  const {
    titleQuery = '',
    genre = '',
    director = '',
    cinema = '',
    dayIndex = null,
    format = '',
    timeSlot = null,
    showOnlyFavorites = false,
    favorites = [],
    friendFavorites = [],
    showFriendFavorites = false,
  } = filters;

  return films.filter((film) => {
    // Filtre titre
    if (titleQuery && !film.title.toLowerCase().includes(titleQuery.toLowerCase())) return false;

    // Filtre genre
    if (genre && !film.genres.toLowerCase().includes(genre.toLowerCase())) return false;

    // Filtre réalisateur
    if (director && !film.director.toLowerCase().includes(director.toLowerCase())) return false;

    // Filtre cinéma (avec groupes)
    if (cinema) {
      const lowerCinema = cinema.toLowerCase();
      const hasCinema = Object.keys(film.seancesByDay).some((day) =>
        Object.keys(film.seancesByDay[day]).some((c) => {
          if (lowerCinema.startsWith('group:')) {
            const group = lowerCinema.split(':')[1];
            const lc = c.toLowerCase();
            if (group === 'pathe') return lc.includes('pathé');
            if (group === 'ugc') return lc.includes('ugc');
            if (group === 'lumiere') return lc.includes('lumière') || lc.includes('institut lumière');
          }
          return c.toLowerCase().includes(lowerCinema);
        })
      );
      if (!hasCinema) return false;
    }

    // Filtre format
    if (format && !film.formats.toLowerCase().includes(format.toLowerCase())) return false;

    // Filtre favoris
    if (showOnlyFavorites) {
      if (showFriendFavorites) {
        if (!friendFavorites.includes(film.slug)) return false;
      } else {
        if (!favorites.includes(film.slug)) return false;
      }
    }

    // Filtre créneau horaire + jour
    if (timeSlot) {
      const dayEntries =
        dayIndex !== null
          ? Object.entries(film.seancesByDay).slice(dayIndex, dayIndex + 1)
          : Object.entries(film.seancesByDay);

      const hasMatchingTime = dayEntries.some(([, cinemas]) =>
        Object.values(cinemas).some((seances) =>
          seances.some((s) => checkTimeSlot(s.time, timeSlot))
        )
      );
      if (!hasMatchingTime) return false;
    }

    return true;
  });
}

// ── Masquage séances passées (index.js lines 39–80) ──────────────────────────

/**
 * Vérifie si une séance est passée (pour le jour courant seulement).
 * Portage de hidePastSeances() dans index.js.
 */
export function isPastSeance(timeStr: string): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0) < currentMinutes;
}

/**
 * Portage de checkTimeSlot() — index.js lines 360–373
 */
export function checkTimeSlot(timeStr: string, slot: TimeSlot): boolean {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + (m || 0);
  switch (slot) {
    case 'morning':   return total < 780;                // avant 13h
    case 'afternoon': return total >= 780 && total < 1080; // 13h–18h
    case 'evening':   return total >= 1080 && total < 1320; // 18h–22h
    case 'night':     return total >= 1320;              // après 22h
  }
}

// ── Extraction des filtres disponibles ───────────────────────────────────────

export interface FilmFilterOptions {
  genres: string[];
  directors: string[];
  cinemas: string[];
  formats: string[];
}

/** Extrait toutes les valeurs disponibles pour peupler les filtres */
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
  };
}
