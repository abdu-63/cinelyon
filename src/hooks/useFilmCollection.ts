// src/hooks/useFilmCollection.ts
// Hook React Query pour charger les films d'une même saga/collection depuis l'API TMDB

import { useQuery } from '@tanstack/react-query';

export interface FilmCollectionPart {
  id: number;
  title: string;
  originalTitle?: string;
  releaseYear: string | null;
  releaseDate: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  voteAverage: number;
  overview?: string;
}

export interface FilmCollectionData {
  id: number;
  name: string;
  overview?: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  currentMovieId: number;
  parts: FilmCollectionPart[];
}

export async function fetchFilmCollection(
  title: string,
  releaseYear: string | null,
  afficheUrl: string | null
): Promise<FilmCollectionData | null> {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY || '';
  if (!apiKey || !title) return null;

  try {
    // 1. Recherche du film sur TMDB
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
    if (!searchResponse.ok) return null;
    let searchData = await searchResponse.json();

    // Repli sans l'année si aucun résultat
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
      return null;
    }

    // 2. Meilleur match avec l'affiche
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

    // 3. Récupération des détails du film pour inspecter belongs_to_collection
    const movieDetailsUrl = `https://api.themoviedb.org/3/movie/${matchedMovie.id}?api_key=${apiKey}&language=fr-FR`;
    const detailsResponse = await fetch(movieDetailsUrl);
    if (!detailsResponse.ok) return null;

    const detailsData = await detailsResponse.json();
    if (!detailsData.belongs_to_collection || !detailsData.belongs_to_collection.id) {
      return null;
    }

    const collectionId = detailsData.belongs_to_collection.id;

    // 4. Récupération des films de la collection
    const collectionUrl = `https://api.themoviedb.org/3/collection/${collectionId}?api_key=${apiKey}&language=fr-FR`;
    const collectionResponse = await fetch(collectionUrl);
    if (!collectionResponse.ok) return null;

    const collectionData = await collectionResponse.json();
    const rawParts: any[] = collectionData.parts || [];

    // Si moins de 2 films dans la saga, pas d'intérêt d'afficher une section saga
    if (rawParts.length < 2) {
      return null;
    }

    // 5. Formatage des films de la saga
    const parts: FilmCollectionPart[] = rawParts.map((p: any) => {
      const year = p.release_date && p.release_date.length >= 4 ? p.release_date.substring(0, 4) : null;
      return {
        id: p.id,
        title: p.title || p.original_title || '',
        originalTitle: p.original_title,
        releaseYear: year,
        releaseDate: p.release_date || null,
        posterUrl: p.poster_path ? `https://image.tmdb.org/t/p/w342${p.poster_path}` : null,
        backdropUrl: p.backdrop_path ? `https://image.tmdb.org/t/p/w780${p.backdrop_path}` : null,
        voteAverage: typeof p.vote_average === 'number' ? p.vote_average : 0,
        overview: p.overview || '',
      };
    });

    // 6. Tri chronologique par date de sortie (les films sans date à la fin)
    parts.sort((a, b) => {
      if (!a.releaseDate) return 1;
      if (!b.releaseDate) return -1;
      return a.releaseDate.localeCompare(b.releaseDate);
    });

    return {
      id: collectionId,
      name: collectionData.name || detailsData.belongs_to_collection.name || 'Saga',
      overview: collectionData.overview || '',
      posterUrl: collectionData.poster_path
        ? `https://image.tmdb.org/t/p/w342${collectionData.poster_path}`
        : null,
      backdropUrl: collectionData.backdrop_path
        ? `https://image.tmdb.org/t/p/w780${collectionData.backdrop_path}`
        : null,
      currentMovieId: matchedMovie.id,
      parts,
    };
  } catch {
    return null;
  }
}

/**
 * Hook pour récupérer la saga / collection d'un film.
 * Met en cache indéfiniment car les films d'une franchise sont stables.
 */
export function useFilmCollection(
  title: string,
  releaseYear: string | null,
  afficheUrl: string | null
) {
  return useQuery<FilmCollectionData | null>({
    queryKey: ['film-collection', title, releaseYear],
    queryFn: () => fetchFilmCollection(title, releaseYear, afficheUrl),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24, // 24 heures
    enabled: !!title,
  });
}
