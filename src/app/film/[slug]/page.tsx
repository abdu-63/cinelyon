// src/app/film/[slug]/page.tsx
// Page détail d'un film — SSR pour accès direct, SEO et partage de lien

import React, { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { findFilmBySlug } from '@/utils/showtimes';
import { slugify } from '@/utils/slugify';
import { FilmRaw } from '@/types';
import { getTodayIso } from '@/utils/dateUtils';
import { FilmDetailView, SimilarMovieItem } from '@/components/ui/FilmDetailView';
import { fetchFilmLogo } from '@/hooks/useFilmLogo';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

const getFilmData = cache(async (slug: string) => {
  const today = getTodayIso();
  const { data: rows } = await supabase
    .from('showtimes')
    .select('date, movies')
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(14);

  if (!rows || rows.length === 0) {
    return { film: null, rows: [] };
  }

  const film = findFilmBySlug(rows as { date: string; movies: FilmRaw[] }[], slug);
  return { film, rows };
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { film } = await getFilmData(slug);

  if (!film) {
    return { title: 'Film non trouvé' };
  }

  return {
    title: `${film.title} (${film.release_year || 'Séances'})`,
    description: film.synopsis?.slice(0, 160) || `Séances et horaires pour ${film.title} à Lyon.`,
    openGraph: {
      title: `${film.title} — Séances et Horaires à Lyon`,
      description: film.synopsis?.slice(0, 160),
      images: film.backdrop || film.affiche ? [{ url: film.backdrop || film.affiche || '' }] : [],
    },
  };
}

export default async function FilmPage({ params }: PageProps) {
  const { slug } = await params;
  const { film, rows } = await getFilmData(slug);

  if (!film) {
    notFound();
  }

  // Extraire tous les films actuellement à l'affiche à Lyon depuis rows pour calcul des films similaires
  const allFilmsInLyon: { slug: string; title: string; cinema: string; poster?: string; rating?: string; genres?: string }[] = [];
  const seenSlugs = new Set<string>();
  if (rows && rows.length > 0) {
    for (const row of rows) {
      for (const m of (row.movies || [])) {
        const mSlug = slugify(m.title, m.release_year);
        if (mSlug && mSlug !== film.slug && !seenSlugs.has(mSlug)) {
          seenSlugs.add(mSlug);
          const cinemaNames = Object.keys(m.seances || {});
          const primaryCinema = cinemaNames[0] || 'Cinémas de Lyon';
          allFilmsInLyon.push({
            slug: mSlug,
            title: m.title,
            cinema: primaryCinema,
            poster: m.affiche,
            rating: m.rating && m.rating !== 'Note inconnue' ? m.rating.replace(/\/5$/, '') : undefined,
            genres: typeof m.genres === 'string' ? m.genres : Array.isArray(m.genres) ? m.genres.join(', ') : undefined,
          });
        }
      }
    }
  }

  // Sélection des films similaires à l'affiche à Lyon (par genre ou réalisateur)
  const currentGenres = typeof film.genres === 'string' ? film.genres.toLowerCase() : '';
  const similarMovies: SimilarMovieItem[] = allFilmsInLyon
    .filter((lf) => {
      if (!lf.genres || !currentGenres) return false;
      const gList = lf.genres.toLowerCase().split(',');
      return gList.some((g) => currentGenres.includes(g.trim()));
    })
    .slice(0, 8)
    .map((m, idx) => ({
      id: idx + 1,
      title: m.title,
      rating: m.rating,
      poster: m.poster,
      cinema: m.cinema,
      slug: m.slug,
      isInTheaters: true,
    }));

  // Préchargement immédiat du ClearLogo côté serveur pour affichage direct dans le HTML (0ms, 0 flash)
  const initialLogo = await fetchFilmLogo(film.title, film.release_year, film.affiche, false);

  return (
    <main>
      {initialLogo?.logoUrl && (
        <link
          rel="preload"
          as="image"
          href={initialLogo.logoUrl}
          // @ts-ignore
          fetchPriority="high"
        />
      )}
      <FilmDetailView
        film={film}
        similarMovies={similarMovies}
        isModal={false}
        initialLogo={initialLogo}
      />
    </main>
  );
}
