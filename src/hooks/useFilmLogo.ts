// src/hooks/useFilmLogo.ts
// Hook React Query pour charger le ClearLogo transparent d'un film depuis l'API TMDB.
// Portage exact de cinelyon-app — gestion du match affiche et des priorités linguistiques (VO / VF).

import { useQuery } from '@tanstack/react-query';
import { buildLogoUrl } from '@/utils/imageUtils';

export interface FilmLogoResult {
  logoUrl: string | null;
  aspectRatio: number | null;
}

/**
 * Normalise une chaîne pour comparaison (lettres minuscules, sans accents, sans ponctuation)
 */
function normalizeTitle(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
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
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || '3e65b4de9b4b9b054166b0f906d6fb37';

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
    if (!searchResponse.ok) return { logoUrl: null, aspectRatio: null };
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
      return { logoUrl: null, aspectRatio: null };
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
    if (!imagesResponse.ok) return { logoUrl: null, aspectRatio: null };

    const imagesData = await imagesResponse.json();
    const logos: any[] = imagesData.logos ?? [];

    // ── 4. Sélection du meilleur logo ──────────────────────────────────────────
    const franceTitle = matchedMovie.title ?? '';
    const originalTitle = matchedMovie.original_title ?? '';
    const shouldPrioritizeEnglish =
      useOriginalLogo || normalizeTitle(franceTitle) === normalizeTitle(originalTitle);

    const bestLogo = pickBestLogo(logos, shouldPrioritizeEnglish);
    if (!bestLogo) return { logoUrl: null, aspectRatio: null };

    return {
      logoUrl: buildLogoUrl(bestLogo.file_path, 'w500'),
      aspectRatio: bestLogo.aspect_ratio ?? null,
    };
  } catch {
    return { logoUrl: null, aspectRatio: null };
  }
}

/**
 * Hook pour récupérer le ClearLogo transparent d'un film depuis TMDB.
 * Cache infini car les logos sont statiques.
 */
export function useFilmLogo(
  title: string,
  releaseYear: string | null,
  afficheUrl: string | null,
  useOriginalLogo: boolean
) {
  return useQuery<FilmLogoResult>({
    queryKey: ['filmLogo', title, releaseYear, useOriginalLogo],
    queryFn: () => fetchFilmLogo(title, releaseYear, afficheUrl, useOriginalLogo),
    staleTime: Infinity,
    enabled: !!title,
  });
}
