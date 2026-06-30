// src/app/page.tsx
// Page d'accueil — Server Component qui charge les données depuis Supabase
// puis passe au client FilmsList pour les interactions

import { supabase } from '@/lib/supabase';
import { buildFilmList, extractFilterOptions } from '@/utils/showtimes';
import { FilmRaw } from '@/types';
import { getTodayIso } from '@/utils/dateUtils';
import FilmsList from '@/components/ui/FilmsList';

// Revalidation toutes les 5 minutes
export const revalidate = 300;

export default async function HomePage() {
  const today = getTodayIso();

  const { data, error } = await supabase
    .from('showtimes')
    .select('date, movies')
    .gte('date', today)
    .order('date');

  if (error) {
    console.error('Supabase error:', error);
  }

  const rows = (data ?? []) as { date: string; movies: FilmRaw[] }[];
  const { films, dates } = buildFilmList(rows, null);
  const { genres, directors, cinemas, formats } = extractFilterOptions(films);

  return (
    <>
      {/* Hero section */}
      <section
        style={{
          margin: '0 10%',
          padding: '32px 0 16px',
        }}
        aria-label="Présentation"
      >
        <h1
          style={{
            fontSize: 'clamp(22px, 4vw, 36px)',
            fontWeight: 700,
            marginBottom: 6,
            color: 'var(--text-main)',
          }}
        >
          Séances à Lyon
          <span
            style={{
              fontSize: 'clamp(14px, 2vw, 18px)',
              fontWeight: 400,
              color: 'var(--text-muted)',
              marginLeft: 12,
            }}
          >
            {films.length} film{films.length !== 1 ? 's' : ''} à l&apos;affiche
          </span>
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          Tous les horaires des cinémas de la métropole lyonnaise
        </p>
      </section>

      <FilmsList
        films={films}
        dates={dates}
        allGenres={genres}
        allDirectors={directors}
        allCinemas={cinemas}
        allFormats={formats}
      />
    </>
  );
}
