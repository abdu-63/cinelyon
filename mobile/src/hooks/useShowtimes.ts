// src/hooks/useShowtimes.ts
// Hook React Query pour charger et transformer les séances depuis Supabase

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { buildFilmList } from '../utils/showtimes';
import { FilmRaw } from '../types';
import { STALE_TIME_MS } from '../lib/constants';

type ShowtimeRawRow = { date: string; movies: FilmRaw[] };

/**
 * Hook principal pour charger les séances.
 *
 * @param delta  Index du jour (0 = aujourd'hui, null = tous les jours)
 *
 * Remplace :
 * - Flask: load_movies_data() avec cache TTL 5 min
 * - PWA: Service Worker Network-First + cache fallback
 *
 * La queryKey inclut la date du jour pour invalider automatiquement
 * le cache quand on change de jour.
 */
export function useShowtimes(delta: number | null = null) {
  const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

  const query = useQuery<ShowtimeRawRow[]>({
    queryKey: ['showtimes', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('showtimes')
        .select('date, movies')
        .gte('date', today)
        .order('date');

      if (error) throw new Error(error.message);
      return (data ?? []) as ShowtimeRawRow[];
    },
    staleTime: STALE_TIME_MS,
    // networkMode: 'offlineFirst' hérité du queryClient par défaut
  });

  // Transformation côté client — équivalent de app.py::home()
  const { films, dates } = query.data
    ? buildFilmList(query.data, delta)
    : { films: [], dates: [] };

  return {
    // Données
    films,
    dates,
    numDays: query.data?.length ?? 0,
    // États React Query
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    // Données brutes pour d'autres usages (ex: findFilmBySlug)
    rawRows: query.data ?? [],
    // Invalider le cache (pull-to-refresh)
    refetch: query.refetch,
  };
}
