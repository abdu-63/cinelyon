// src/hooks/useFilmLogo.ts
// Hook React Query pour charger le ClearLogo transparent d'un film depuis l'API TMDB.
// Cache persistant instantané (localStorage) & préchargement pour éliminer toute latence / flash.
// Portage exact de cinelyon-app — gestion du match affiche et des priorités linguistiques (VO / VF).

import { useQuery } from '@tanstack/react-query';
import { buildLogoUrl } from '@/utils/imageUtils';

export interface FilmLogoResult {
  logoUrl: string | null;
  aspectRatio: number | null;
}

/** Cache en mémoire vive pour accès synchrone ultra-rapide (0ms) */
const memoryLogoCache = new Map<string, FilmLogoResult>();

/**
 * Normalise une chaîne pour comparaison (lettres minuscules, sans accents, sans ponctuation)
 */
export function normalizeLogoTitle(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/** Génère une clé de cache déterministe */
export function getLogoCacheKey(
  title: string,
  releaseYear: string | null,
  useOriginalLogo: boolean
): string {
  const norm = normalizeLogoTitle(title);
  const yr = releaseYear && /^\d{4}$/.test(releaseYear) ? releaseYear : 'any';
  const mode = useOriginalLogo ? 'orig' : 'std';
  return `cinelyon_logo_v2_${norm}_${yr}_${mode}`;
}

/**
 * Récupère le logo en cache de manière synchrone (Mémoire vive puis LocalStorage).
 * Permet un affichage direct dès la première frame de rendu sans flash ni requête.
 */
export function getCachedLogo(
  title: string,
  releaseYear: string | null,
  useOriginalLogo: boolean
): FilmLogoResult | null {
  if (!title) return null;
  const key = getLogoCacheKey(title, releaseYear, useOriginalLogo);

  // 1. Vérification en mémoire vive (0ms)
  if (memoryLogoCache.has(key)) {
    return memoryLogoCache.get(key)!;
  }

  // 2. Vérification dans le LocalStorage du navigateur
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as FilmLogoResult;
        memoryLogoCache.set(key, parsed);
        return parsed;
      }
    } catch {
      // Ignorer les erreurs d'accès au localStorage (ex: navigation privée stricte)
    }
  }

  return null;
}

/**
 * Enregistre le résultat du logo en cache (mémoire + localStorage)
 */
function setCachedLogo(
  title: string,
  releaseYear: string | null,
  useOriginalLogo: boolean,
  result: FilmLogoResult
): void {
  const key = getLogoCacheKey(title, releaseYear, useOriginalLogo);
  memoryLogoCache.set(key, result);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(result));
    } catch {
      // Quota dépassé ou stockage restreint
    }
  }
}

/**
 * Sélectionne le meilleur logo dans la liste retournée par TMDB.
 */
function pickBestLogo(
  logos: any[],
  shouldPrioritizeEnglish: boolean
): { file_path: string; aspect_ratio: number } | null {
  if (!logos || logos.length === 0) return null;

  // Configuration dynamique des priorités de langue
  const LANG_PRIORITY: Record<string, number> = shouldPrioritizeEnglish
    ? {
        en: 1, // Logo anglais préféré si VO ou pas de traduction
        fr: 2, // Logo français en second recours
      }
    : {
        fr: 1, // Logo français préféré si le titre est traduit en France
        en: 2, // Logo anglais en fallback
      };

  // Les logos neutres (sans texte, iso_639_1 = null) sont parfaits en VO
  const NULL_PRIORITY = shouldPrioritizeEnglish ? 0 : 3;

  const sorted = [...logos].sort((a, b) => {
    const pa = a.iso_639_1 == null ? NULL_PRIORITY : (LANG_PRIORITY[a.iso_639_1] ?? 99);
    const pb = b.iso_639_1 == null ? NULL_PRIORITY : (LANG_PRIORITY[b.iso_639_1] ?? 99);
    if (pa !== pb) return pa - pb;
    return (b.vote_average ?? 0) - (a.vote_average ?? 0);
  });

  return sorted[0] ?? null;
}

export async function fetchFilmLogo(
  title: string,
  releaseYear: string | null,
  afficheUrl: string | null,
  useOriginalLogo: boolean
): Promise<FilmLogoResult> {
  // 1. Retour immédiat si déjà en cache
  const cached = getCachedLogo(title, releaseYear, useOriginalLogo);
  if (cached) return cached;

  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY || '';
  if (!apiKey) {
    return { logoUrl: null, aspectRatio: null };
  }

  try {
    // ── 1. Recherche du film sur TMDB ──────────────────────────────────────────
    const searchParams = new URLSearchParams({
      api_key: apiKey,
      query: title,
      language: 'fr-FR',
    });

    if (releaseYear && /^\d{4}$/.test(releaseYear)) {
      searchParams.append('primary_release_year', releaseYear);
    }

    let searchResponse = await fetch(
      `https://api.themoviedb.org/3/search/movie?${searchParams.toString()}`
    );
    if (!searchResponse.ok) {
      const empty = { logoUrl: null, aspectRatio: null };
      setCachedLogo(title, releaseYear, useOriginalLogo, empty);
      return empty;
    }
    let searchData = await searchResponse.json();

    // Fallback sans l'année si aucun résultat
    if ((!searchData.results || searchData.results.length === 0) && releaseYear) {
      const fallbackParams = new URLSearchParams({
        api_key: apiKey,
        query: title,
        language: 'fr-FR',
      });
      searchResponse = await fetch(
        `https://api.themoviedb.org/3/search/movie?${fallbackParams.toString()}`
      );
      if (searchResponse.ok) searchData = await searchResponse.json();
    }

    if (!searchData.results || searchData.results.length === 0) {
      const empty = { logoUrl: null, aspectRatio: null };
      setCachedLogo(title, releaseYear, useOriginalLogo, empty);
      return empty;
    }

    // ── 2. Match sur l'affiche pour identifier le bon film ─────────────────────
    let matchedMovie = searchData.results[0];

    if (afficheUrl) {
      const match = afficheUrl.match(/\/([^\/]+)\.(jpg|png|webp|jpeg)$/i);
      if (match?.[1]) {
        const targetFilename = match[1];
        const exactMatch = searchData.results.find(
          (m: any) => m.poster_path && m.poster_path.includes(targetFilename)
        );
        if (exactMatch) matchedMovie = exactMatch;
      }
    }

    // ── 3. Récupération des images (sans filtre de langue pour avoir tous les logos) ──
    const imagesUrl = `https://api.themoviedb.org/3/movie/${matchedMovie.id}/images?api_key=${apiKey}`;
    const imagesResponse = await fetch(imagesUrl);
    if (!imagesResponse.ok) {
      const empty = { logoUrl: null, aspectRatio: null };
      setCachedLogo(title, releaseYear, useOriginalLogo, empty);
      return empty;
    }

    const imagesData = await imagesResponse.json();
    const logos: any[] = imagesData.logos ?? [];

    // ── 4. Sélection du meilleur logo ──────────────────────────────────────────
    const franceTitle = matchedMovie.title ?? '';
    const originalTitle = matchedMovie.original_title ?? '';
    const shouldPrioritizeEnglish =
      useOriginalLogo || normalizeLogoTitle(franceTitle) === normalizeLogoTitle(originalTitle);

    const bestLogo = pickBestLogo(logos, shouldPrioritizeEnglish);
    if (!bestLogo) {
      const empty = { logoUrl: null, aspectRatio: null };
      setCachedLogo(title, releaseYear, useOriginalLogo, empty);
      return empty;
    }

    const result: FilmLogoResult = {
      logoUrl: buildLogoUrl(bestLogo.file_path, 'w500'),
      aspectRatio: bestLogo.aspect_ratio ?? null,
    };

    setCachedLogo(title, releaseYear, useOriginalLogo, result);

    // Préchargement immédiat de l'image en mémoire navigateur
    if (typeof window !== 'undefined' && result.logoUrl) {
      const img = new Image();
      img.src = result.logoUrl;
    }

    return result;
  } catch {
    const empty = { logoUrl: null, aspectRatio: null };
    setCachedLogo(title, releaseYear, useOriginalLogo, empty);
    return empty;
  }
}

/**
 * Hook pour récupérer le ClearLogo transparent d'un film depuis TMDB.
 * Utilise initialData depuis le cache local synchrone (0ms de latence si déjà vu).
 */
export function useFilmLogo(
  title: string,
  releaseYear: string | null,
  afficheUrl: string | null,
  useOriginalLogo: boolean,
  initialLogo?: FilmLogoResult | null
) {
  return useQuery<FilmLogoResult>({
    queryKey: ['filmLogo', title, releaseYear, useOriginalLogo],
    queryFn: () => fetchFilmLogo(title, releaseYear, afficheUrl, useOriginalLogo),
    initialData: () => (initialLogo || getCachedLogo(title, releaseYear, useOriginalLogo)) ?? undefined,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 jours
    enabled: !!title,
  });
}

/**
 * Précharge le logo d'un film en tâche de fond (compatible iOS 15.1 sans requestIdleCallback natif)
 */
export function preloadFilmLogo(
  title: string,
  releaseYear: string | null,
  afficheUrl: string | null,
  useOriginalLogo: boolean = false
): void {
  if (typeof window === 'undefined' || !title) return;
  if (getCachedLogo(title, releaseYear, useOriginalLogo)) return;

  const scheduleTask =
    typeof (window as any).requestIdleCallback === 'function'
      ? (window as any).requestIdleCallback
      : (fn: () => void) => setTimeout(fn, 200);

  scheduleTask(() => {
    fetchFilmLogo(title, releaseYear, afficheUrl, useOriginalLogo);
  });
}
