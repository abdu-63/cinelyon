// src/utils/doubleFeature.ts
// Algorithme ultra-rapide (O(N log K)) de planification de "Double Programme"
// Support du Mode "Film Ancre", déduplication canonique {A, B},
// séparation directionnelle (A➔B / B➔A) et limitation intelligente des créneaux par cinéma.

import { Film, Seance, DateLabel } from '@/types';
import { CINEMAS } from '@/lib/constants';
import { parseDuration, formatDayLabel } from '@/utils/dateUtils';
import { isPastSeance } from '@/utils/showtimes';

export type DoubleFeatureTimeSlot = 'all' | 'afternoon' | 'evening';

export interface DoubleFeatureItem {
  film: Film;
  seance: Seance;
  startTimeMinutes: number;
  endTimeMinutes: number;
  startTimeFormatted: string; // "14:00"
  endTimeFormatted: string; // "16:15"
  cinema: string;
}

export interface DoubleFeatureSlot {
  id: string;
  cinema: string; // Nom du cinéma (cinema1 si même cinéma, ou "cinema1 ➔ cinema2")
  isSameCinema: boolean;
  cinema1: string;
  cinema2: string;
  dayLabel: string;
  isoDate?: string;
  first: DoubleFeatureItem;
  second: DoubleFeatureItem;
  gapMinutes: number; // Temps de battement total (trajet + pause)
  travelTimeMinutes: number; // Temps de trajet estimé en voiture/TCL (0 si même cinéma)
  breakTimeMinutes: number; // Temps de pause réel (hors trajet) : entre 10 et 30 min
  totalDurationMinutes: number; // Du début du film 1 à la fin du film 2
  hasFavorite?: boolean;
  score?: number;
}

export interface DoubleFeaturePair {
  id: string; // Canonical key: `[filmIdA, filmIdB].sort().join('__')`
  filmA: Film;
  filmB: Film;
  cinemas: string[];
  slots: DoubleFeatureSlot[]; // Tous les créneaux dédupliqués
  forwardSlots: DoubleFeatureSlot[]; // Film A en 1er ➔ Film B en 2e
  reverseSlots: DoubleFeatureSlot[]; // Film B en 1er ➔ Film A en 2e
  isInterchangeable: boolean; // Vrai si possible dans les 2 ordres
  totalSlotsCount: number;
  hasFavorite: boolean;
  hasBothFavorites: boolean;
  hasSameCinemaSlot: boolean;
  score: number;
  sampleSlot: DoubleFeatureSlot;
  anchorRole?: 'anchor_first' | 'anchor_second' | 'both' | null;
}

/** Convertit "HH:MM" en minutes depuis minuit */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return 0;
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

/** Convertit des minutes depuis minuit en "HH:MM" */
export function minutesToTimeString(minutes: number): string {
  const norm = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Extrait la durée en minutes d'un film (fallback 110 min si non disponible) */
export function getFilmDurationMinutes(film: Film): number {
  if (!film.duree || film.duree === 'inconnue') return 110;
  const parsed = parseDuration(film.duree);
  const total = (parsed.hours || 0) * 60 + (parsed.minutes || 0);
  return total > 0 ? total : 110;
}

/** Calcule la distance à vol d'oiseau en km entre deux cinémas */
export function getDistanceBetweenCinemas(cinema1: string, cinema2: string): number {
  if (cinema1.toLowerCase() === cinema2.toLowerCase()) return 0;

  const c1 = CINEMAS.find(
    (c) =>
      c.name.toLowerCase().includes(cinema1.toLowerCase()) ||
      cinema1.toLowerCase().includes(c.name.toLowerCase())
  );
  const c2 = CINEMAS.find(
    (c) =>
      c.name.toLowerCase().includes(cinema2.toLowerCase()) ||
      cinema2.toLowerCase().includes(c.name.toLowerCase())
  );

  if (!c1 || !c2) return 4; // fallback 4 km si non trouvé

  const R = 6371; // Rayon Terre en km
  const dLat = ((c2.latitude - c1.latitude) * Math.PI) / 180;
  const dLon = ((c2.longitude - c1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1.latitude * Math.PI) / 180) *
      Math.cos((c2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Estimation du temps de trajet en voiture / TCL en minutes (inclut parking et marche) */
export function getTravelTimeMinutes(cinema1: string, cinema2: string): number {
  if (cinema1.toLowerCase() === cinema2.toLowerCase()) return 0;
  const distKm = getDistanceBetweenCinemas(cinema1, cinema2);
  // ~2.2 min par km + 7 min fixes de stationnement / marche urbaine à Lyon
  return Math.round(distKm * 2.2) + 7;
}

/**
 * Récupère le dictionnaire des séances { [cinema]: Seance[] } pour une date donnée
 */
export function getSeancesForDate(film: Film, date: DateLabel | string): Record<string, Seance[]> {
  if (!film || !film.seancesByDay) return {};

  if (typeof date !== 'string' && date) {
    const formatted = formatDayLabel(date);
    if (film.seancesByDay[formatted]) return film.seancesByDay[formatted];
    if (date.isoDate && film.seancesByDay[date.isoDate]) return film.seancesByDay[date.isoDate];

    for (const [key, map] of Object.entries(film.seancesByDay)) {
      if (
        key.includes(String(date.chiffre)) &&
        key.toLowerCase().includes(date.mois.toLowerCase())
      ) {
        return map;
      }
    }
  }

  if (typeof date === 'string') {
    if (film.seancesByDay[date]) return film.seancesByDay[date];
    for (const [key, map] of Object.entries(film.seancesByDay)) {
      if (key.toLowerCase().includes(date.toLowerCase())) return map;
    }
  }

  return {};
}

export interface AutoDoubleFeatureOptions {
  anchorFilmId?: string | null; // Mode Film Ancre (ex: Spider-Man en priorité)
  timeSlot?: DoubleFeatureTimeSlot;
  minBreakMinutes?: number; // Défaut 10 min d'attente min
  maxBreakMinutes?: number; // Défaut 30 min d'attente max
  maxTravelMinutes?: number; // Défaut 10 min de voiture max
  targetCinema?: string | null;
  targetCinemas?: string[]; // Filtrage multi-cinémas
  favoriteIds?: string[];
  favoritesOnly?: boolean;
  hidePast?: boolean;
  allowCrossCinema?: boolean;
  maxResults?: number;
}

interface ScreeningIndexItem {
  film: Film;
  seance: Seance;
  cinema: string;
  startMin: number;
  endMin: number;
}

/**
 * Découverte haute performance des créneaux d'enchaînement valides.
 */
export function findAutoDoubleFeatureSlots(
  films: Film[],
  date: DateLabel | string,
  options: AutoDoubleFeatureOptions = {}
): DoubleFeatureSlot[] {
  const {
    anchorFilmId,
    timeSlot = 'evening',
    minBreakMinutes = 10,
    maxBreakMinutes = 30,
    maxTravelMinutes = 10,
    targetCinema,
    targetCinemas,
    favoriteIds = [],
    favoritesOnly = false,
    hidePast = true,
    allowCrossCinema = true,
  } = options;

  const results: DoubleFeatureSlot[] = [];
  if (!films || films.length < 2) return results;

  const isToday = typeof date !== 'string' ? date.index === 0 : false;
  const dayLabel = typeof date !== 'string' ? formatDayLabel(date) : date;

  // 1. Indexer les séances par Cinéma : { [cinema]: ScreeningIndexItem[] }
  const cinemaIndex: Record<string, ScreeningIndexItem[]> = {};

  for (const film of films) {
    // Si mode favoris actif (sans ancre) et film non favori, ignorer
    if (favoritesOnly && !anchorFilmId && !favoriteIds.includes(film.filmId)) {
      continue;
    }

    const dayMap = getSeancesForDate(film, date);
    for (const [cinema, seances] of Object.entries(dayMap)) {
      if (targetCinema && !cinema.toLowerCase().includes(targetCinema.toLowerCase())) {
        continue;
      }
      if (targetCinemas && targetCinemas.length > 0) {
        const matches = targetCinemas.some(
          (tc) =>
            cinema.toLowerCase().includes(tc.toLowerCase()) ||
            tc.toLowerCase().includes(cinema.toLowerCase())
        );
        if (!matches) continue;
      }
      if (!cinemaIndex[cinema]) {
        cinemaIndex[cinema] = [];
      }
      for (const seance of seances) {
        if (isToday && hidePast && isPastSeance(seance.time)) {
          continue;
        }
        const startMin = timeStringToMinutes(seance.time);
        const dur = getFilmDurationMinutes(film);
        cinemaIndex[cinema].push({
          film,
          seance,
          cinema,
          startMin,
          endMin: startMin + dur,
        });
      }
    }
  }

  // Trier les séances par heure de début
  const cinemaList = Object.keys(cinemaIndex);
  for (const cinema of cinemaList) {
    cinemaIndex[cinema].sort((a, b) => a.startMin - b.startMin);
  }

  // 2. Pre-calculer les paires de cinémas valides
  const validCinemaPairs: { c1: string; c2: string; travelTime: number; isSame: boolean }[] = [];

  for (let i = 0; i < cinemaList.length; i++) {
    const c1 = cinemaList[i];
    validCinemaPairs.push({ c1, c2: c1, travelTime: 0, isSame: true });

    if (allowCrossCinema) {
      for (let j = 0; j < cinemaList.length; j++) {
        if (i === j) continue;
        const c2 = cinemaList[j];
        const travel = getTravelTimeMinutes(c1, c2);
        if (travel <= maxTravelMinutes) {
          validCinemaPairs.push({ c1, c2, travelTime: travel, isSame: false });
        }
      }
    }
  }

  // 3. Trouver les enchaînements compatibles
  for (const pair of validCinemaPairs) {
    const list1 = cinemaIndex[pair.c1];
    const list2 = cinemaIndex[pair.c2];
    if (!list1 || !list2) continue;

    for (const s1 of list1) {
      // Filtrage du créneau horaire du premier film
      if (timeSlot === 'afternoon') {
        if (s1.startMin < 11 * 60 + 30 || s1.startMin > 17 * 60 + 30) continue;
      } else if (timeSlot === 'evening') {
        if (s1.startMin < 16 * 60 + 30 || s1.startMin > 22 * 60 + 0) continue;
      }

      // Si un film ancre est choisi, au moins un des deux films doit être l'ancre
      const isAnchor1 = anchorFilmId ? s1.film.filmId === anchorFilmId : false;

      const minStart2 = s1.endMin + pair.travelTime + minBreakMinutes;
      const maxStart2 = s1.endMin + pair.travelTime + maxBreakMinutes;

      for (const s2 of list2) {
        if (s2.startMin < minStart2) continue;
        if (s2.startMin > maxStart2) break;

        if (s1.film.filmId === s2.film.filmId) continue;

        const isAnchor2 = anchorFilmId ? s2.film.filmId === anchorFilmId : false;
        if (anchorFilmId && !isAnchor1 && !isAnchor2) {
          continue;
        }

        const isFav1 = favoriteIds.includes(s1.film.filmId);
        const isFav2 = favoriteIds.includes(s2.film.filmId);
        const hasFavorite = isFav1 || isFav2;

        if (favoritesOnly && !anchorFilmId && !hasFavorite) {
          continue;
        }

        const gap = s2.startMin - s1.endMin;
        const breakTime = gap - pair.travelTime;

        // Score
        const anchorBonus = isAnchor1 || isAnchor2 ? 120 : 0;
        const favScore = (isFav1 ? 80 : 0) + (isFav2 ? 80 : 0);
        const sameCinemaBonus = pair.isSame ? 50 : 0;
        const gapScore = Math.max(0, 30 - Math.abs(breakTime - 15));
        const popScore = ((s1.film.wantToSee || 0) + (s2.film.wantToSee || 0)) / 150;
        const score = anchorBonus + favScore + sameCinemaBonus + gapScore + popScore;

        results.push({
          id: `${s1.cinema}-${s1.film.filmId}-${s1.seance.time}-${s2.cinema}-${s2.film.filmId}-${s2.seance.time}`,
          cinema: pair.isSame ? s1.cinema : `${s1.cinema} ➔ ${s2.cinema}`,
          isSameCinema: pair.isSame,
          cinema1: s1.cinema,
          cinema2: s2.cinema,
          dayLabel,
          first: {
            film: s1.film,
            seance: s1.seance,
            startTimeMinutes: s1.startMin,
            endTimeMinutes: s1.endMin,
            startTimeFormatted: s1.seance.time,
            endTimeFormatted: minutesToTimeString(s1.endMin),
            cinema: s1.cinema,
          },
          second: {
            film: s2.film,
            seance: s2.seance,
            startTimeMinutes: s2.startMin,
            endTimeMinutes: s2.endMin,
            startTimeFormatted: s2.seance.time,
            endTimeFormatted: minutesToTimeString(s2.endMin),
            cinema: s2.cinema,
          },
          gapMinutes: gap,
          travelTimeMinutes: pair.travelTime,
          breakTimeMinutes: breakTime,
          totalDurationMinutes: s2.endMin - s1.startMin,
          hasFavorite,
          score,
        });
      }
    }
  }

  return results.sort((a, b) => (b.score || 0) - (a.score || 0));
}

/**
 * Regroupe les enchaînements par PAIRES DE FILMS CANONIQUES {Film A, Film B}.
 * Sépare forwardSlots (A➔B) et reverseSlots (B➔A), indique l'interchangeabilité,
 * et ne garde que les créneaux distincts les plus pertinents par cinéma.
 */
export function findDoubleFeaturePairs(
  films: Film[],
  date: DateLabel | string,
  options: AutoDoubleFeatureOptions = {}
): DoubleFeaturePair[] {
  const { anchorFilmId, maxResults } = options;
  const slots = findAutoDoubleFeatureSlots(films, date, options);
  if (slots.length === 0) return [];

  // Dédoublonnage canonique
  const pairsMap = new Map<string, { filmA: Film; filmB: Film; slots: DoubleFeatureSlot[] }>();

  for (const slot of slots) {
    const fA = slot.first.film;
    const fB = slot.second.film;

    // Si on a un film ancre, l'ancre devient toujours filmA pour la clarté
    let filmA = fA;
    let filmB = fB;

    if (anchorFilmId) {
      if (fB.filmId === anchorFilmId && fA.filmId !== anchorFilmId) {
        filmA = fB;
        filmB = fA;
      }
    } else {
      const isALessThanB = fA.filmId.localeCompare(fB.filmId) < 0;
      filmA = isALessThanB ? fA : fB;
      filmB = isALessThanB ? fB : fA;
    }

    const canonicalKey = `${filmA.filmId}__${filmB.filmId}`;

    if (!pairsMap.has(canonicalKey)) {
      pairsMap.set(canonicalKey, {
        filmA,
        filmB,
        slots: [],
      });
    }

    pairsMap.get(canonicalKey)!.slots.push(slot);
  }

  const result: DoubleFeaturePair[] = [];
  const favoriteIds = options.favoriteIds || [];

  for (const [canonicalKey, data] of pairsMap.entries()) {
    // Trier les créneaux par score puis heure de début
    data.slots.sort((a, b) => {
      if ((b.score || 0) !== (a.score || 0)) {
        return (b.score || 0) - (a.score || 0);
      }
      return a.first.startTimeMinutes - b.first.startTimeMinutes;
    });

    // Séparer les créneaux par direction
    const forwardSlots: DoubleFeatureSlot[] = [];
    const reverseSlots: DoubleFeatureSlot[] = [];
    const seenForward = new Set<string>();
    const seenReverse = new Set<string>();

    for (const slot of data.slots) {
      const isForward = slot.first.film.filmId === data.filmA.filmId;
      const key = `${slot.cinema1}_${slot.cinema2}_${slot.first.startTimeFormatted}`;

      if (isForward) {
        if (!seenForward.has(key)) {
          seenForward.add(key);
          forwardSlots.push(slot);
        }
      } else {
        if (!seenReverse.has(key)) {
          seenReverse.add(key);
          reverseSlots.push(slot);
        }
      }
    }

    const isInterchangeable = forwardSlots.length > 0 && reverseSlots.length > 0;
    const allDistinctSlots = [...forwardSlots, ...reverseSlots];

    const isFavA = favoriteIds.includes(data.filmA.filmId);
    const isFavB = favoriteIds.includes(data.filmB.filmId);
    const hasFavorite = isFavA || isFavB;
    const hasBothFavorites = isFavA && isFavB;

    const allCinemas = new Set<string>();
    let hasSameCinemaSlot = false;

    allDistinctSlots.forEach((s) => {
      allCinemas.add(s.cinema1);
      allCinemas.add(s.cinema2);
      if (s.isSameCinema) hasSameCinemaSlot = true;
    });

    // Déterminer le rôle du film ancre si actif
    let anchorRole: DoubleFeaturePair['anchorRole'] = null;
    if (anchorFilmId) {
      if (forwardSlots.length > 0 && reverseSlots.length > 0) anchorRole = 'both';
      else if (forwardSlots.length > 0) anchorRole = 'anchor_first';
      else anchorRole = 'anchor_second';
    }

    const anchorScore = anchorFilmId ? 300 : 0;
    const favScore = hasBothFavorites ? 200 : hasFavorite ? 90 : 0;
    const sameCinemaBonus = hasSameCinemaSlot ? 60 : 0;
    const interchangeableBonus = isInterchangeable ? 40 : 0;
    const slotsBonus = Math.min(25, allDistinctSlots.length * 3);
    const popScore = ((data.filmA.wantToSee || 0) + (data.filmB.wantToSee || 0)) / 100;
    const score =
      anchorScore + favScore + sameCinemaBonus + interchangeableBonus + slotsBonus + popScore;

    result.push({
      id: canonicalKey,
      filmA: data.filmA,
      filmB: data.filmB,
      cinemas: Array.from(allCinemas),
      slots: allDistinctSlots,
      forwardSlots,
      reverseSlots,
      isInterchangeable,
      totalSlotsCount: allDistinctSlots.length,
      hasFavorite,
      hasBothFavorites,
      hasSameCinemaSlot,
      score,
      sampleSlot: allDistinctSlots[0] || data.slots[0],
      anchorRole,
    });
  }

  // Trier les paires par score décroissant
  const sorted = result.sort((a, b) => b.score - a.score);

  if (maxResults && maxResults > 0) {
    return sorted.slice(0, maxResults);
  }
  return sorted;
}

/**
 * Version manuelle pour 2 films précis (rétro-compatibilité)
 */
export function findDoubleFeatureSlots(
  film1: Film,
  film2: Film,
  date: DateLabel | string,
  options: { minGapMinutes?: number; maxGapMinutes?: number; targetCinema?: string } = {}
): DoubleFeatureSlot[] {
  const { minGapMinutes = 10, maxGapMinutes = 30, targetCinema } = options;
  const results: DoubleFeatureSlot[] = [];

  if (!film1 || !film2 || film1.filmId === film2.filmId) {
    return results;
  }

  const dur1 = getFilmDurationMinutes(film1);
  const dur2 = getFilmDurationMinutes(film2);
  const dayLabel = typeof date !== 'string' ? formatDayLabel(date) : date;

  const seancesMap1 = getSeancesForDate(film1, date);
  const seancesMap2 = getSeancesForDate(film2, date);

  const commonCinemas = Object.keys(seancesMap1).filter((c) => !!seancesMap2[c]);
  const targetCinemas = targetCinema
    ? commonCinemas.filter((c) => c.toLowerCase().includes(targetCinema.toLowerCase()))
    : commonCinemas;

  for (const cinema of targetCinemas) {
    const list1 = seancesMap1[cinema] || [];
    const list2 = seancesMap2[cinema] || [];

    for (const s1 of list1) {
      const start1 = timeStringToMinutes(s1.time);
      const end1 = start1 + dur1;

      for (const s2 of list2) {
        const start2 = timeStringToMinutes(s2.time);
        const end2 = start2 + dur2;
        const gap = start2 - end1;

        if (gap >= minGapMinutes && gap <= maxGapMinutes) {
          results.push({
            id: `${cinema}-${film1.filmId}-${s1.time}-${film2.filmId}-${s2.time}`,
            cinema,
            isSameCinema: true,
            cinema1: cinema,
            cinema2: cinema,
            dayLabel,
            first: {
              film: film1,
              seance: s1,
              startTimeMinutes: start1,
              endTimeMinutes: end1,
              startTimeFormatted: s1.time,
              endTimeFormatted: minutesToTimeString(end1),
              cinema,
            },
            second: {
              film: film2,
              seance: s2,
              startTimeMinutes: start2,
              endTimeMinutes: end2,
              startTimeFormatted: s2.time,
              endTimeFormatted: minutesToTimeString(end2),
              cinema,
            },
            gapMinutes: gap,
            travelTimeMinutes: 0,
            breakTimeMinutes: gap,
            totalDurationMinutes: end2 - start1,
          });
        }
      }
    }
  }

  return results.sort((a, b) => a.first.startTimeMinutes - b.first.startTimeMinutes);
}
