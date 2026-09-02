// src/hooks/useFilmCast.ts
// Hook React Query pour charger le casting d'un film depuis l'API TMDB

import { useQuery } from '@tanstack/react-query';
import { CastMember } from '@/types';

export async function fetchFilmCast(
  title: string,
  releaseYear: string | null,
  afficheUrl: string | null
): Promise<CastMember[]> {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY || '';
  if (!apiKey) return [];

  // 1. Recherche du film sur TMDB
  const searchParams = new URLSearchParams({
    api_key: apiKey,
    query: title,
    language: 'fr-FR',
  });

  if (releaseYear && /^\d{4}$/.test(releaseYear)) {
    searchParams.append('primary_release_year', releaseYear);
  }

  try {
    let searchResponse = await fetch(
      `https://api.themoviedb.org/3/search/movie?${searchParams.toString()}`
    );
    if (!searchResponse.ok) return [];
    let searchData = await searchResponse.json();

    // Si aucun résultat et qu'on avait restreint par l'année, on réessaie sans l'année
    if ((!searchData.results || searchData.results.length === 0) && releaseYear) {
      const fallbackParams = new URLSearchParams({
        api_key: apiKey,
        query: title,
        language: 'fr-FR',
      });
      searchResponse = await fetch(
        `https://api.themoviedb.org/3/search/movie?${fallbackParams.toString()}`
      );
      if (searchResponse.ok) {
        searchData = await searchResponse.json();
      }
    }

    if (!searchData.results || searchData.results.length === 0) {
      return [];
    }

    // 2. Recherche du meilleur match à l'aide de l'affiche
    let matchedMovie = searchData.results[0];

    if (afficheUrl) {
      const match = afficheUrl.match(/\/([^\/]+)\.(jpg|png|webp|jpeg)$/i);
      if (match && match[1]) {
        const targetFilename = match[1];
        const exactMatch = searchData.results.find(
          (m: any) => m.poster_path && m.poster_path.includes(targetFilename)
        );
        if (exactMatch) {
          matchedMovie = exactMatch;
        }
      }
    }

    // 3. Récupération des crédits du film
    const creditsUrl = `https://api.themoviedb.org/3/movie/${matchedMovie.id}/credits?api_key=${apiKey}&language=fr-FR`;
    const creditsResponse = await fetch(creditsUrl);
    if (!creditsResponse.ok) return [];

    const creditsData = await creditsResponse.json();
    const rawCast = creditsData.cast || [];

    // 4. Formatage des membres du casting (limité aux 15 premiers)
    return rawCast.slice(0, 15).map((member: any) => ({
      id: member.id,
      name: member.name,
      character: member.character || '',
      profile_path: member.profile_path
        ? `https://image.tmdb.org/t/p/w185${member.profile_path}`
        : null,
    }));
  } catch {
    return [];
  }
}

/**
 * Hook pour récupérer le casting d'un film.
 * Met en cache indéfiniment les résultats car le casting est statique.
 */
export function useFilmCast(
  title: string,
  releaseYear: string | null,
  afficheUrl: string | null,
  initialCast?: CastMember[]
) {
  return useQuery<CastMember[]>({
    queryKey: ['filmCast', title, releaseYear, afficheUrl],
    queryFn: () => fetchFilmCast(title, releaseYear, afficheUrl),
    staleTime: Infinity,
    enabled: !!title,
    initialData: initialCast && initialCast.length > 0 ? initialCast : undefined,
  });
}
