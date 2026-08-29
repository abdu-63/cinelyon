// src/app/film/[slug]/page.tsx
// Page détail d'un film — Design Apple & parité totale avec cinelyon-app/app/film/[slug].tsx

import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Share2,
  Heart,
  Star,
  ExternalLink,
  BookOpen,
  Film as FilmIcon,
  PlayCircle,
  Tv,
  MessageSquare,
  Clock,
  Calendar,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { findFilmBySlug } from '@/utils/showtimes';
import { FilmRaw, CastMember } from '@/types';
import { getTodayIso, formatDayLabel, formatLocalizedDayLabel, formatTime } from '@/utils/dateUtils';
import { PostCreditsBadge } from '@/components/ui/PostCreditsBadge';
import { ToiletBreaksSection } from '@/components/ui/ToiletBreaksSection';
import { FilmShowtimesTabs } from '@/components/ui/FilmShowtimesTabs';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getFilmData(slug: string) {
  const today = getTodayIso();
  const { data: rows, error } = await supabase
    .from('showtimes')
    .select('date, movies')
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(14);

  if (error || !rows || rows.length === 0) {
    return { film: null, dates: [] };
  }

  const result = findFilmBySlug(rows as { date: string; movies: FilmRaw[] }[], slug);
  return { film: result, dates: [] };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { film } = await getFilmData(slug);

  if (!film) {
    return { title: 'Film non trouvé — CinéLyon' };
  }

  return {
    title: `${film.title} (${film.release_year || 'Séances'}) — CinéLyon`,
    description:
      film.synopsis && film.synopsis !== 'Synopsis non disponible'
        ? film.synopsis.slice(0, 160)
        : `Consultez les horaires et cinémas pour ${film.title} à Lyon et sa métropole.`,
    openGraph: {
      title: `${film.title} — Séances et Horaires à Lyon`,
      description: film.synopsis?.slice(0, 160),
      images: film.backdrop || film.affiche ? [{ url: film.backdrop || film.affiche || '' }] : [],
    },
  };
}

export default async function FilmPage({ params }: PageProps) {
  const { slug } = await params;
  const today = getTodayIso();

  const { data: rows } = await supabase
    .from('showtimes')
    .select('date, movies')
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(14);

  if (!rows || rows.length === 0) {
    notFound();
  }

  const film = findFilmBySlug(rows as { date: string; movies: FilmRaw[] }[], slug);
  if (!film) {
    notFound();
  }

  // Fetch TMDB Cast
  let cast: CastMember[] = [];
  try {
    const tmdbRes = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=33866d86db49b119159d3aa4ff2f9547&query=${encodeURIComponent(
        film.title
      )}&language=fr-FR`,
      { next: { revalidate: 86400 } }
    );
    const tmdbData = await tmdbRes.json();
    if (tmdbData.results && tmdbData.results[0]) {
      const movieId = tmdbData.results[0].id;
      const creditsRes = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=33866d86db49b119159d3aa4ff2f9547&language=fr-FR`,
        { next: { revalidate: 86400 } }
      );
      const creditsData = await creditsRes.json();
      cast = (creditsData.cast || []).slice(0, 10).map((c: any) => ({
        id: c.id,
        name: c.name,
        character: c.character,
        profile_path: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
      }));
    }
  } catch {}

  const metaParts: string[] = [];
  if (film.release_year && film.release_year !== 'inconnue') metaParts.push(film.release_year);
  if (film.duree) metaParts.push(film.duree);
  if (film.director && film.director !== 'Inconnu') metaParts.push(film.director);
  const metaString = metaParts.join(' · ');

  const youtubeId = film.trailer_url ? extractYoutubeId(film.trailer_url) : null;

  return (
    <div className="min-h-screen pb-28">
      {/* ── 1. Navigation Flottante Apple Liquid Glass ── */}
      <div className="sticky top-0 z-30 w-full bg-[#121212]/80 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all border border-white/10 shadow-sm"
        >
          <ArrowLeft size={14} />
          <span>Retour</span>
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-3 sm:px-4 space-y-4">
        {/* ── 2. Hero Backdrop (270px de haut avec dégradé sombre) ── */}
        <div className="relative w-full h-[270px] rounded-[24px] overflow-hidden border border-white/10 mt-2 shadow-2xl">
          <img
            src={film.backdrop || film.affiche || '/images/nocontent.png'}
            alt={film.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent" />
        </div>

        {/* ── 3. Titre & Métadonnées Apple ── */}
        <div className="px-1 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight">
            {film.title}
          </h1>

          {metaString && (
            <p className="text-xs font-semibold text-neutral-400">
              {metaString}
            </p>
          )}

          {/* Capsules de genres */}
          {(() => {
            const genresList = typeof film.genres === 'string'
              ? film.genres.split(',').map((g) => g.trim()).filter(Boolean)
              : Array.isArray(film.genres)
              ? film.genres
              : [];
            if (genresList.length === 0) return null;
            return (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {genresList.map((g) => (
                  <span
                    key={g}
                    className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] font-semibold text-neutral-300"
                  >
                    {g}
                  </span>
                ))}
              </div>
            );
          })()}

          {/* ── 4. Scorecard & Quick Facts (Spectateurs, Rotten Tomatoes, TMDB) ── */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 pb-1">
            {film.rating && film.rating !== 'Note inconnue' && (
              <div className="px-3.5 py-2 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center min-w-[84px] shadow-sm">
                <div className="flex items-center gap-1 text-amber-400 font-extrabold text-xs">
                  <Star size={13} className="fill-amber-400" />
                  <span>{film.rating}</span>
                </div>
                <span className="text-[10px] text-neutral-400 mt-0.5">Spectateurs</span>
              </div>
            )}

            {film.rt_score && (
              <div className="px-3.5 py-2 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center min-w-[84px] shadow-sm">
                <div className="flex items-center gap-1 text-rose-400 font-extrabold text-xs">
                  <span>🍅</span>
                  <span>{film.rt_score}</span>
                </div>
                <span className="text-[10px] text-neutral-400 mt-0.5">Rotten Tomatoes</span>
              </div>
            )}

            {film.tmdb_score && (
              <div className="px-3.5 py-2 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center min-w-[84px] shadow-sm">
                <div className="flex items-center gap-1 text-[#01B4E4] font-extrabold text-xs">
                  <Star size={13} className="fill-[#01B4E4]" />
                  <span>{film.tmdb_score}</span>
                </div>
                <span className="text-[10px] text-neutral-400 mt-0.5">TMDB</span>
              </div>
            )}
          </div>

          {/* Boutons Letterboxd & AlloCiné */}
          {(film.url || film.allocine_url) && (
            <div className="flex items-center gap-2 pt-1">
              {film.url && (
                <a
                  href={film.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                >
                  <span>Letterboxd</span>
                  <ExternalLink size={11} className="text-neutral-400" />
                </a>
              )}

              {film.allocine_url && (
                <a
                  href={film.allocine_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                >
                  <span className="text-amber-400 font-bold">A</span>
                  <span>AlloCiné</span>
                  <ExternalLink size={11} className="text-neutral-400" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* ── 5. Synopsis ── */}
        {film.synopsis && film.synopsis !== 'Synopsis non disponible' && (
          <div className="p-4 rounded-[20px] bg-black/40 border border-white/10 backdrop-blur-md space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#444cf7]">
              <BookOpen size={14} />
              <span>Synopsis</span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              {film.synopsis}
            </p>
          </div>
        )}

        {/* ── 6. Scènes Post-Génériques ── */}
        {film.post_credits && (
          <PostCreditsBadge info={film.post_credits} />
        )}

        {/* ── 7. Pauses Toilettes RunPee ── */}
        <ToiletBreaksSection film={film} />

        {/* ── 8. Distribution / Casting ── */}
        {cast.length > 0 && (
          <div className="p-4 rounded-[20px] bg-black/40 border border-white/10 backdrop-blur-md space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Distribution & Casting
            </h3>
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
              {cast.map((actor) => (
                <div key={actor.id} className="flex flex-col items-center text-center shrink-0 w-20">
                  <div className="w-14 h-14 rounded-full overflow-hidden border border-white/15 bg-neutral-800 mb-1.5 shadow-sm">
                    {actor.profile_path ? (
                      <img
                        src={actor.profile_path}
                        alt={actor.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs">
                        {actor.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-white line-clamp-1 leading-tight">
                    {actor.name}
                  </span>
                  <span className="text-[9px] text-neutral-400 line-clamp-1 mt-0.5 leading-tight">
                    {actor.character}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 9. Bande-Annonce YouTube ── */}
        {youtubeId && (
          <div className="p-4 rounded-[20px] bg-black/40 border border-white/10 backdrop-blur-md space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-300">
              <PlayCircle size={15} className="text-rose-500" />
              <span>Bande-Annonce Officielle</span>
            </div>
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-lg">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`}
                title={`${film.title} Trailer`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* ── 10. Disponible en Streaming ── */}
        {film.watch_providers && film.watch_providers.length > 0 && (
          <div className="p-4 rounded-[20px] bg-black/40 border border-white/10 backdrop-blur-md space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-300">
              <Tv size={15} className="text-[#444cf7]" />
              <span>Disponible en Streaming</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {film.watch_providers.map((p, i) => (
                <a
                  key={i}
                  href={`https://www.justwatch.com/fr/recherche?q=${encodeURIComponent(film.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2 text-xs font-medium text-white transition-colors"
                >
                  {p.logo_path && (
                    <img src={p.logo_path} alt={p.name} className="w-4 h-4 rounded object-cover" />
                  )}
                  <span>{p.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── 11. Séances & Horaires par Cinéma ── */}
        <div className="p-4 rounded-[20px] bg-black/40 border border-white/10 backdrop-blur-md space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#444cf7]">
            <Clock size={15} />
            <span>Séances & Horaires à Lyon</span>
          </div>

          <FilmShowtimesTabs film={film} dates={[]} />
        </div>
      </div>
    </div>
  );
}

function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}
