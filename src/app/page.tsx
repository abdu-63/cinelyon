// src/app/page.tsx
// Page d'accueil — Séances de cinéma à Lyon

import { supabase } from '@/lib/supabase';
import { buildFilmList } from '@/utils/showtimes';
import { FilmsList } from '@/components/ui/FilmsList';
import { FilmRaw } from '@/types';
import { getTodayIso } from '@/utils/dateUtils';

export const revalidate = 300; // Revalidation toutes les 5 minutes (ISR)

async function getShowtimesData() {
  const today = getTodayIso();
  const { data: rows, error } = await supabase
    .from('showtimes')
    .select('date, movies')
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(14);

  if (error || !rows || rows.length === 0) {
    return { films: [], dates: [] };
  }

  return buildFilmList(rows as { date: string; movies: FilmRaw[] }[], null);
}

export default async function HomePage() {
  const { films, dates } = await getShowtimesData();

  return (
    <main className="pb-8 sm:pb-12">
      <FilmsList initialFilms={films} initialDates={dates} />
    </main>
  );
}
