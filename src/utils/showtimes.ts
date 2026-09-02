// src/utils/showtimes.ts
// Portage de la logique métier de cinelyon-app et app.py — Version optimisée haute performance

import { FilmRaw, Film, Seance, DateLabel, FiltersState, TimeSlot, FilmFilterOptions } from '@/types';
import { slugify } from './slugify';
import { buildDateLabels, formatDayLabel, getDeltaForDate, formatTime } from './dateUtils';
import { optimizePosterUrl } from './imageUtils';
import { BRAND_ORDER, getBrand } from '@/lib/constants';

export { formatTime } from './dateUtils';

// ── Cache d'indexation des DateLabels pour accès O(1) ──────────────────────
const dateByDayLabelMap = new Map<string, DateLabel>();
const dateByIsoMap = new Map<string, DateLabel>();

export function registerDateLabels(dates: DateLabel[]): void {
  for (const d of dates) {
    const label = formatDayLabel(d);
    dateByDayLabelMap.set(label, d);
    dateByIsoMap.set(d.isoDate, d);
  }
}

export function getDateLabelByDay(dayLabel: string, dates?: DateLabel[]): DateLabel | undefined {
  let found = dateByDayLabelMap.get(dayLabel);
  if (!found && dates && dates.length > 0) {
    registerDateLabels(dates);
    found = dateByDayLabelMap.get(dayLabel);
  }
  return found;
}

export function getDateLabelByIso(isoDate: string, dates?: DateLabel[]): DateLabel | undefined {
  let found = dateByIsoMap.get(isoDate);
  if (!found && dates && dates.length > 0) {
    registerDateLabels(dates);
    found = dateByIsoMap.get(isoDate);
  }
  return found;
}

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

export function isTimestampThisWeek(addedAtStr: string | null | undefined): boolean {
  return isTimestampInAgeRange(addedAtStr, 0, 168);
}

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function isPastSeance(timeStr: string, dayLabel?: string, dates?: DateLabel[]): boolean {
  if (dayLabel) {
    const dObj = getDateLabelByDay(dayLabel, dates);
    if (dObj) {
      const delta = getDeltaForDate(dObj.isoDate);
      if (delta < 0) return true;
      if (delta > 0) return false;
    }
  }

  const currentMinutes = getCurrentMinutes();
  const seanceMinutes = parseTimeToMinutes(timeStr);
  return seanceMinutes < currentMinutes;
}

export function hasVisibleSeances(
  film: Film,
  isoDate: string,
  dates: DateLabel[],
  hidePastSessions: boolean = false
): boolean {
  const dObj = getDateLabelByIso(isoDate, dates);
  if (!dObj) return false;
  const dayLabel = formatDayLabel(dObj);
  const seancesForDay = film.seancesByDay[dayLabel];
  if (!seancesForDay) return false;

  const cinemaArrays = Object.values(seancesForDay);
  if (cinemaArrays.length === 0) return false;

  if (!hidePastSessions) {
    return cinemaArrays.some((arr) => arr.length > 0);
  }

  const delta = getDeltaForDate(isoDate);
  if (delta < 0) return false;
  if (delta > 0) return cinemaArrays.some((arr) => arr.length > 0);

  // Aujourd'hui : vérifier si au moins une séance est à venir
  const currentMinutes = getCurrentMinutes();
  for (const seances of cinemaArrays) {
    for (const s of seances) {
      if (parseTimeToMinutes(s.time) >= currentMinutes) {
        return true;
      }
    }
  }

  return false;
}

export function buildFilmList(
  rows: { date: string; movies: FilmRaw[] }[],
  delta: number | null
): { films: Film[]; dates: DateLabel[] } {
  if (!rows.length) return { films: [], dates: [] };

  const dates = buildDateLabels(rows.map((r) => r.date));
  registerDateLabels(dates);

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
          affiche: optimizePosterUrl(raw.affiche, 500),
          slug: slugify(raw.title, raw.release_year),
          filmId: raw.title.toLowerCase().replace(/ /g, '-'),
          formats: '',
          seancesByDay: {},
          seancesByDayGrouped: {},
          isNew: false,
          isYesterday: false,
          isDayBefore: false,
          isThisWeek: false,
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
      if (isTimestampThisWeek(raw.added_at)) film.isThisWeek = true;

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

  filmList.sort((a, b) => {
    const wantA = typeof a.wantToSee === 'number' && !isNaN(a.wantToSee) ? a.wantToSee : 0;
    const wantB = typeof b.wantToSee === 'number' && !isNaN(b.wantToSee) ? b.wantToSee : 0;
    if (wantB !== wantA) return wantB - wantA;
    return a.title.localeCompare(b.title, 'fr');
  });

  return { films: filmList, dates };
}

export function findFilmBySlug(
  rows: { date: string; movies: FilmRaw[] }[],
  slug: string
): Film | null {
  const result = buildFilmList(rows, null);
  return (
    result.films.find((f) => f.slug === slug) ??
    result.films.find((f) => slugify(f.title) === slug) ??
    result.films.find((f) => f.slug.startsWith(`${slug}-`)) ??
    null
  );
}

function normalizeString(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function checkTimeSlot(timeStr: string, slot: TimeSlot): boolean {
  const total = parseTimeToMinutes(timeStr);
  switch (slot) {
    case 'morning':
      return total < 12 * 60; // avant 12h
    case 'afternoon':
      return total >= 12 * 60 && total < 18 * 60; // 12h-18h
    case 'evening':
      return total >= 18 * 60 && total < 22 * 60; // 18h-22h
    case 'night':
      return total >= 22 * 60; // après 22h
    default:
      return false;
  }
}

function matchesFormatOrLang(s: Seance, formatFilter: string): boolean {
  const lowerF = formatFilter.toLowerCase().trim();
  if (lowerF === 'vost' || lowerF === 'vo') {
    return s.lang === 'VO' || (!!s.format && s.format.toLowerCase().includes('vost'));
  }
  if (lowerF === 'vf') {
    return s.lang === 'VF' || (!!s.format && s.format.toLowerCase().includes('vf'));
  }
  if (lowerF.includes('dolby')) {
    return !!s.format && s.format.toLowerCase().includes('dolby');
  }
  if (lowerF === '35mm' || lowerF === '35 mm') {
    return (
      !!s.format &&
      (s.format.toLowerCase().includes('35mm') ||
        s.format.toLowerCase().includes('35 mm') ||
        s.format.toLowerCase().includes('pellicule') ||
        s.format.toLowerCase().includes('argentique'))
    );
  }
  return !!s.format && s.format.toLowerCase().includes(lowerF);
}

function matchesCinema(cinemaName: string, cinemaFilter: string): boolean {
  const lowerQuery = cinemaFilter.toLowerCase().trim();
  if (lowerQuery.startsWith('group:')) {
    const group = lowerQuery.split(':')[1];
    const lc = cinemaName.toLowerCase();
    if (group === 'pathe') return lc.includes('pathé') || lc.includes('pathe');
    if (group === 'ugc') return lc.includes('ugc');
    if (group === 'lumiere') return lc.includes('lumière') || lc.includes('lumiere') || lc.includes('institut lumière');
  }
  return cinemaName.toLowerCase().includes(lowerQuery);
}

export function filterFilms(
  films: Film[],
  filters: FiltersState,
  dates: DateLabel[],
  favoriteIds: string[] = []
): Film[] {
  registerDateLabels(dates);

  const {
    titleQuery = '',
    genres: activeGenres = [],
    directors: activeDirectors = [],
    actors: activeActors = [],
    cinemas: activeCinemas = [],
    formats: activeFormats = [],
    timeSlots: activeTimeSlots = [],
    showOnlyFavorites = false,
    showOnlyNew = false,
    showOnlyYesterday = false,
    showOnlyDayBefore = false,
    showOnlyWeek = false,
    dayIndex = null,
  } = filters;

  const normalizedTitleQuery = normalizeString(titleQuery);

  let filtered = films;

  // 1. Filtrage nouveautés (portage exact de cinelyon-app)
  if (showOnlyNew) {
    filtered = filtered
      .filter((film) => film.isNew)
      .map((film) => {
        const newSeancesByDay: Record<string, Record<string, Seance[]>> = {};
        const newSeancesByDayGrouped: Record<string, Record<string, Record<string, Seance[]>>> = {};

        for (const [dayLabel, cinemas] of Object.entries(film.seancesByDay)) {
          const addedAt = film.addedAtByDay?.[dayLabel] || film.added_at;
          if (isTimestampToday(addedAt)) {
            newSeancesByDay[dayLabel] = cinemas;
            if (film.seancesByDayGrouped[dayLabel]) {
              newSeancesByDayGrouped[dayLabel] = film.seancesByDayGrouped[dayLabel];
            }
          }
        }

        return {
          ...film,
          seancesByDay: newSeancesByDay,
          seancesByDayGrouped: newSeancesByDayGrouped,
        };
      });
  } else if (showOnlyYesterday) {
    filtered = filtered
      .filter((film) => film.isYesterday)
      .map((film) => {
        const newSeancesByDay: Record<string, Record<string, Seance[]>> = {};
        const newSeancesByDayGrouped: Record<string, Record<string, Record<string, Seance[]>>> = {};

        for (const [dayLabel, cinemas] of Object.entries(film.seancesByDay)) {
          const addedAt = film.addedAtByDay?.[dayLabel] || film.added_at;
          if (isTimestampYesterday(addedAt)) {
            newSeancesByDay[dayLabel] = cinemas;
            if (film.seancesByDayGrouped[dayLabel]) {
              newSeancesByDayGrouped[dayLabel] = film.seancesByDayGrouped[dayLabel];
            }
          }
        }

        return {
          ...film,
          seancesByDay: newSeancesByDay,
          seancesByDayGrouped: newSeancesByDayGrouped,
        };
      });
  } else if (showOnlyDayBefore) {
    filtered = filtered
      .filter((film) => film.isDayBefore)
      .map((film) => {
        const newSeancesByDay: Record<string, Record<string, Seance[]>> = {};
        const newSeancesByDayGrouped: Record<string, Record<string, Record<string, Seance[]>>> = {};

        for (const [dayLabel, cinemas] of Object.entries(film.seancesByDay)) {
          const addedAt = film.addedAtByDay?.[dayLabel] || film.added_at;
          if (isTimestampDayBefore(addedAt)) {
            newSeancesByDay[dayLabel] = cinemas;
            if (film.seancesByDayGrouped[dayLabel]) {
              newSeancesByDayGrouped[dayLabel] = film.seancesByDayGrouped[dayLabel];
            }
          }
        }

        return {
          ...film,
          seancesByDay: newSeancesByDay,
          seancesByDayGrouped: newSeancesByDayGrouped,
        };
      });
  } else if (showOnlyWeek) {
    filtered = filtered
      .filter((film) => film.isThisWeek || film.isNew || film.isYesterday || film.isDayBefore)
      .map((film) => {
        const newSeancesByDay: Record<string, Record<string, Seance[]>> = {};
        const newSeancesByDayGrouped: Record<string, Record<string, Record<string, Seance[]>>> = {};

        for (const [dayLabel, cinemas] of Object.entries(film.seancesByDay)) {
          const addedAt = film.addedAtByDay?.[dayLabel] || film.added_at;
          if (
            isTimestampThisWeek(addedAt) ||
            isTimestampToday(addedAt) ||
            isTimestampYesterday(addedAt) ||
            isTimestampDayBefore(addedAt)
          ) {
            newSeancesByDay[dayLabel] = cinemas;
            if (film.seancesByDayGrouped[dayLabel]) {
              newSeancesByDayGrouped[dayLabel] = film.seancesByDayGrouped[dayLabel];
            }
          }
        }

        return {
          ...film,
          seancesByDay: newSeancesByDay,
          seancesByDayGrouped: newSeancesByDayGrouped,
        };
      });
  }

  // 2. Filtres attributs généraux du film
  filtered = filtered.filter((film) => {
    // Favoris
    if (showOnlyFavorites) {
      const isFav = favoriteIds.includes(film.filmId) || favoriteIds.includes(film.slug);
      if (!isFav) return false;
    }

    // Recherche titre / réalisateur / casting
    if (normalizedTitleQuery) {
      const matchTitle = normalizeString(film.title).includes(normalizedTitleQuery);
      const matchDirector = normalizeString(film.director || film.realisateur || '').includes(
        normalizedTitleQuery
      );
      const matchCast =
        (film.cast &&
          Array.isArray(film.cast) &&
          film.cast.some((m) => {
            const name = typeof m === 'string' ? m : m?.name;
            return name && normalizeString(name).includes(normalizedTitleQuery);
          })) ||
        (film.actors &&
          Array.isArray(film.actors) &&
          film.actors.some((a) => a && normalizeString(a).includes(normalizedTitleQuery)));

      if (!matchTitle && !matchDirector && !matchCast) return false;
    }

    // Genres (OU logique entre les genres sélectionnés)
    if (activeGenres.length > 0) {
      const hasGenre = activeGenres.some((g) =>
        normalizeString(film.genres).includes(normalizeString(g))
      );
      if (!hasGenre) return false;
    }

    // Réalisateurs (OU logique)
    if (activeDirectors.length > 0) {
      const hasDirector = activeDirectors.some((d) =>
        normalizeString(film.director || film.realisateur || '').includes(normalizeString(d))
      );
      if (!hasDirector) return false;
    }

    // Acteurs (OU logique)
    if (activeActors.length > 0) {
      const hasActor = activeActors.some((targetActor) => {
        const normTarget = normalizeString(targetActor);
        const inCast =
          film.cast &&
          Array.isArray(film.cast) &&
          film.cast.some((m) => {
            const name = typeof m === 'string' ? m : m?.name;
            return name && normalizeString(name).includes(normTarget);
          });
        const inActors =
          film.actors &&
          Array.isArray(film.actors) &&
          film.actors.some((a) => a && normalizeString(a).includes(normTarget));
        return inCast || inActors;
      });
      if (!hasActor) return false;
    }

    return true;
  });

  // 3. Filtres séances & cinémas (Cinémas, Formats, Créneaux horaires, Jour spécifique)
  const hasScreeningFilters =
    activeCinemas.length > 0 ||
    activeFormats.length > 0 ||
    activeTimeSlots.length > 0 ||
    dayIndex !== null;

  if (hasScreeningFilters) {
    const selectedDayLabel =
      dayIndex !== null && dates[dayIndex] ? formatDayLabel(dates[dayIndex]) : null;

    filtered = filtered
      .map((film) => {
        const newSeancesByDay: Record<string, Record<string, Seance[]>> = {};

        for (const [dayLabel, cinemas] of Object.entries(film.seancesByDay)) {
          if (selectedDayLabel && dayLabel !== selectedDayLabel) {
            continue;
          }

          const filteredCinemas: Record<string, Seance[]> = {};

          for (const [cinemaName, seances] of Object.entries(cinemas)) {
            // Filtrage cinéma
            if (activeCinemas.length > 0) {
              const cinemaMatches = activeCinemas.some((c) => matchesCinema(cinemaName, c));
              if (!cinemaMatches) continue;
            }

            // Filtrage séance par format et créneau horaire
            const filteredSeances = seances.filter((s) => {
              if (activeFormats.length > 0) {
                const formatMatches = activeFormats.some((f) => matchesFormatOrLang(s, f));
                if (!formatMatches) return false;
              }

              if (activeTimeSlots.length > 0) {
                const timeMatches = activeTimeSlots.some((slot) => checkTimeSlot(s.time, slot));
                if (!timeMatches) return false;
              }

              return true;
            });

            if (filteredSeances.length > 0) {
              filteredCinemas[cinemaName] = filteredSeances;
            }
          }

          if (Object.keys(filteredCinemas).length > 0) {
            newSeancesByDay[dayLabel] = filteredCinemas;
          }
        }

        // Reconstituer seancesByDayGrouped et formats
        const newSeancesByDayGrouped: Film['seancesByDayGrouped'] = {};
        const filmFormats = new Set<string>();

        for (const [dayLabel, cinemas] of Object.entries(newSeancesByDay)) {
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

          newSeancesByDayGrouped[dayLabel] = {};
          for (const brand of BRAND_ORDER) {
            if (brands[brand]) newSeancesByDayGrouped[dayLabel][brand] = brands[brand];
          }
          for (const brand of Object.keys(brands)) {
            if (!newSeancesByDayGrouped[dayLabel][brand]) {
              newSeancesByDayGrouped[dayLabel][brand] = brands[brand];
            }
          }
        }

        return {
          ...film,
          seancesByDay: newSeancesByDay,
          seancesByDayGrouped: newSeancesByDayGrouped,
          formats: Array.from(filmFormats).join(',').toLowerCase(),
        };
      })
      .filter((film) => Object.keys(film.seancesByDay).length > 0);
  }

  return filtered;
}

export function extractFilterOptions(films: Film[]): FilmFilterOptions {
  const genres = new Set<string>();
  const directors = new Set<string>();
  const actors = new Set<string>();
  const cinemas = new Set<string>();

  for (const film of films) {
    if (film.genres) {
      film.genres.split(', ').forEach((g) => g.trim() && genres.add(g.trim()));
    }
    if (film.director && film.director !== 'Inconnu') {
      directors.add(film.director);
    }
    if (film.realisateur && film.realisateur !== 'Inconnu' && film.realisateur !== film.director) {
      directors.add(film.realisateur);
    }
    if (film.cast && Array.isArray(film.cast)) {
      film.cast.forEach((m) => {
        const name = typeof m === 'string' ? m : m?.name;
        if (name && name.trim()) actors.add(name.trim());
      });
    }
    if (film.actors && Array.isArray(film.actors)) {
      film.actors.forEach((a) => {
        if (a && a.trim()) actors.add(a.trim());
      });
    }
    for (const cinemaMap of Object.values(film.seancesByDay)) {
      Object.keys(cinemaMap).forEach((c) => cinemas.add(c));
    }
  }

  return {
    genres: Array.from(genres).sort((a, b) => a.localeCompare(b, 'fr')),
    directors: Array.from(directors).sort((a, b) => a.localeCompare(b, 'fr')),
    actors: Array.from(actors).sort((a, b) => a.localeCompare(b, 'fr')),
    cinemas: Array.from(cinemas).sort((a, b) => a.localeCompare(b, 'fr')),
    formats: ['IMAX', '3D', 'Dolby Cinema', '4DX', 'ScreenX', 'ICE', '35mm', 'VOST', 'VF'],
  };
}
