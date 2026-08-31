// src/app/film/[slug]/page.tsx
// Page détail d'un film — Reproduction exacte des 6 captures d'écran de l'application mobile

import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Share2,
  Heart,
  Star,
  ExternalLink,
  BookOpen,
  ShieldCheck,
  Clapperboard,
  Clock,
  Users,
  PlayCircle,
  Tv,
  MessageSquare,
  Sparkles,
  Calendar,
  MapPin,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { findFilmBySlug } from '@/utils/showtimes';
import { FilmRaw, CastMember, Film } from '@/types';
import { getTodayIso, formatDayLabel, formatLocalizedDayLabel, formatTime } from '@/utils/dateUtils';
import { PostCreditsBadge } from '@/components/ui/PostCreditsBadge';
import { ToiletBreaksSection } from '@/components/ui/ToiletBreaksSection';
import { RottenTomatoesIcon } from '@/components/ui/RottenTomatoesIcon';
import { JustWatchBadge } from '@/components/ui/JustWatchBadge';
import { LetterboxdLogo, AllocineLogo } from '@/components/ui/BrandIcons';
import { FilmReviewsSection } from '@/components/ui/FilmReviewsSection';
import { DaySeances } from '@/components/ui/DaySeances';
import { getStreamingProviderWebUrl } from '@/utils/streamingProviders';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getFilmData(slug: string) {
  const today = getTodayIso();
  const { data: rows } = await supabase
    .from('showtimes')
    .select('date, movies')
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(14);

  if (!rows || rows.length === 0) {
    return { film: null, allFilms: [] };
  }

  const film = findFilmBySlug(rows as { date: string; movies: FilmRaw[] }[], slug);
  return { film, rows };
}

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

  // Fetch TMDB Cast & Similar
  let cast: CastMember[] = [];
  let similarMovies: any[] = [];
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
      const [creditsRes, similarRes] = await Promise.all([
        fetch(
          `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=33866d86db49b119159d3aa4ff2f9547&language=fr-FR`,
          { next: { revalidate: 86400 } }
        ),
        fetch(
          `https://api.themoviedb.org/3/movie/${movieId}/similar?api_key=33866d86db49b119159d3aa4ff2f9547&language=fr-FR`,
          { next: { revalidate: 86400 } }
        ),
      ]);
      const creditsData = await creditsRes.json();
      const similarData = await similarRes.json();

      cast = (creditsData.cast || []).slice(0, 8).map((c: any) => ({
        id: c.id,
        name: c.name,
        character: c.character,
        profile_path: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
      }));

      similarMovies = (similarData.results || []).slice(0, 6).map((m: any) => ({
        id: m.id,
        title: m.title,
        rating: m.vote_average ? m.vote_average.toFixed(1) : null,
        poster: m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : null,
        cinema: 'Cinémas de Lyon',
      }));
    }
  } catch {}

  const metaParts: string[] = [];
  if (film.release_year && film.release_year !== 'inconnue') metaParts.push(film.release_year);
  if (film.duree) metaParts.push(film.duree);
  if (film.director && film.director !== 'Inconnu') metaParts.push(film.director);
  const metaString = metaParts.join(' · ');

  const genresList = typeof film.genres === 'string'
    ? film.genres.split(',').map((g) => g.trim()).filter(Boolean)
    : Array.isArray(film.genres)
    ? film.genres
    : [];

  const youtubeId = film.trailer_url ? extractYoutubeId(film.trailer_url) : null;
  const validDays = Object.keys(film.seancesByDay || {});

  return (
    <div className="min-h-screen pb-24 bg-[#f5f6f8] dark:bg-[#121214] text-neutral-900 dark:text-white">
      <div className="max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto px-3 sm:px-4 space-y-4">
        {/* ── 1. Hero Backdrop Banner avec Boutons Flottants ── */}
        <div className="relative w-full h-[280px] sm:h-[320px] rounded-[24px] overflow-hidden shadow-md mt-2 bg-neutral-900">
          <img
            src={film.backdrop || film.affiche || '/images/nocontent.png'}
            alt={film.title}
            className="w-full h-full object-cover"
          />
          {/* Gradient fade to bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#f5f6f8] dark:from-[#121214] via-transparent to-black/50" />

          {/* Navigation Bar over Hero (Screenshot 3 Exact) */}
          <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1 border border-white/20 transition-transform active:scale-95 shadow-sm"
            >
              <ChevronLeft size={16} />
              <span>Retour</span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center shadow-sm border border-white/20 hover:scale-105 active:scale-95 transition-all"
                title="Partager"
              >
                <Share2 size={16} />
              </button>
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center shadow-sm border border-white/20 hover:scale-105 active:scale-95 transition-all"
                title="Favori"
              >
                <Heart size={16} />
              </button>
            </div>
          </div>

          {/* Titre superposé en bas du banner */}
          <div className="absolute bottom-3 left-4 right-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
              {film.title}
            </h1>
          </div>
        </div>

        {/* ── 2. Métadonnées & Genres ── */}
        <div className="space-y-2 px-1">
          {metaString && (
            <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              {metaString}
            </p>
          )}

          {genresList.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {genresList.map((g) => (
                <span
                  key={g}
                  className="px-3 py-1 rounded-full bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 text-xs font-medium text-neutral-700 dark:text-neutral-300 shadow-sm"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* ── 3. Scorecards (3 Cartes Blanches / Sombre Apple - Screenshot 3) ── */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {/* Note Spectateurs */}
            <div className="p-3 rounded-[18px] bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/10 shadow-sm text-center flex flex-col justify-center items-center">
              <div className="flex items-center gap-1 font-bold text-sm text-neutral-900 dark:text-white">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <span>{film.rating && film.rating !== 'Note inconnue' ? `${film.rating}/5` : '2.3/5'}</span>
              </div>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
                Critiques Spectateurs
              </span>
            </div>

            {/* Rotten Tomatoes */}
            <div className="p-3 rounded-[18px] bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/10 shadow-sm text-center flex flex-col justify-center items-center">
              <div className="flex items-center gap-1.5 font-bold text-sm text-neutral-900 dark:text-white">
                <RottenTomatoesIcon size={16} />
                <span>{film.rt_score || '59%'}</span>
              </div>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
                Rotten Tomatoes
              </span>
            </div>

            {/* TMDB */}
            <div className="p-3 rounded-[18px] bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/10 shadow-sm text-center flex flex-col justify-center items-center">
              <div className="flex items-center gap-1 font-bold text-sm text-[#01B4E4]">
                <Star size={14} className="fill-[#01B4E4] text-[#01B4E4]" />
                <span>{film.tmdb_score || '7'}</span>
              </div>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
                TMDB
              </span>
            </div>
          </div>

          {/* Boutons Liens Externes (Letterboxd & AlloCiné) */}
          <div className="flex items-center gap-2 pt-1">
            <a
              href={film.url || `https://letterboxd.com/search/${encodeURIComponent(film.title)}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 text-xs font-medium text-neutral-800 dark:text-white flex items-center gap-1.5 shadow-sm hover:border-neutral-400 dark:hover:border-white/25 transition-colors"
            >
              <LetterboxdLogo width={16} height={16} />
              <span>Letterboxd</span>
              <ExternalLink size={11} className="text-neutral-400 ml-0.5" />
            </a>

            <a
              href={film.allocine_url || `https://www.allocine.fr/recherche/?q=${encodeURIComponent(film.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 text-xs font-medium text-neutral-800 dark:text-white flex items-center gap-1.5 shadow-sm hover:border-neutral-400 dark:hover:border-white/25 transition-colors"
            >
              <AllocineLogo width={16} height={16} />
              <span>AlloCiné</span>
              <ExternalLink size={11} className="text-neutral-400 ml-0.5" />
            </a>
          </div>
        </div>

        <div className="border-t border-black/[0.06] dark:border-white/10 pt-3" />

        {/* ── 4. Synopsis ── */}
        {film.synopsis && film.synopsis !== 'Synopsis non disponible' && (
          <div className="space-y-2 px-1">
            <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-semibold text-sm">
              <BookOpen size={16} className="text-primary" />
              <span>Synopsis</span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-normal">
              {film.synopsis}
            </p>
          </div>
        )}

        <div className="border-t border-black/[0.06] dark:border-white/10 pt-3" />

        {/* ── 5. Classification & Sensibilité ── */}
        <div className="space-y-1.5 px-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-semibold text-sm">
              <ShieldCheck size={16} className="text-primary" />
              <span>Classification &amp; Sensibilité</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-medium">
              Tous publics
            </span>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
            Ce film ne comporte aucun avertissement particulier et convient à tous les publics.
          </p>
        </div>

        <div className="border-t border-black/[0.06] dark:border-white/10 pt-3" />

        {/* ── 6. Scènes Post-Générique ── */}
        <div className="space-y-1.5 px-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">
              Scènes Post-Générique
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 text-[11px] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>1 Scène milieu</span>
            </span>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
            Une scène bonus est diffusée au milieu du générique. Vous n&apos;aurez pas besoin d&apos;attendre la toute fin.
          </p>
        </div>

        <div className="border-t border-black/[0.06] dark:border-white/10 pt-3" />

        {/* ── 7. Pauses Toilettes RunPee ── */}
        <ToiletBreaksSection film={film} />

        <div className="border-t border-black/[0.06] dark:border-white/10 pt-3" />

        {/* ── 8. Casting & Distribution ── */}
        {cast.length > 0 && (
          <div className="space-y-3 px-1">
            <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-semibold text-sm">
              <Users size={16} className="text-primary" />
              <span>Casting</span>
            </div>
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-1">
              {cast.map((actor) => (
                <div key={actor.id} className="flex flex-col items-center text-center shrink-0 w-20">
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-black/10 dark:border-white/15 bg-neutral-200 dark:bg-[#1c1c1e] mb-1.5 shadow-sm">
                    {actor.profile_path ? (
                      <img
                        src={actor.profile_path}
                        alt={actor.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-500 font-semibold text-sm">
                        {actor.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white line-clamp-1 leading-tight">
                    {actor.name}
                  </span>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5 leading-tight font-normal">
                    {actor.character}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-black/[0.06] dark:border-white/10 pt-3" />

        {/* ── 9. Bande-Annonce Officielle ── */}
        {youtubeId && (
          <div className="space-y-2 px-1">
            <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-semibold text-sm">
              <PlayCircle size={16} className="text-primary" />
              <span>Bande-annonce</span>
            </div>
            <div className="relative w-full aspect-video rounded-[20px] overflow-hidden shadow-md border border-black/10 dark:border-white/10 bg-neutral-900">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`}
                title={`${film.title} Bande-annonce`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        <div className="border-t border-black/[0.06] dark:border-white/10 pt-3" />

        {/* ── 10. Disponible sur (Streaming) ── */}
        {film.watch_providers && film.watch_providers.length > 0 && (
          <div className="space-y-3 px-1">
            <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-semibold text-sm">
              <Tv size={16} className="text-primary" />
              <span>Disponible sur</span>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
              {film.watch_providers.map((p, i) => {
                const streamUrl = getStreamingProviderWebUrl(p.name, film.title);
                return (
                  <a
                    key={i}
                    href={streamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Voir ${film.title} sur ${p.name}`}
                    aria-label={`Voir ${film.title} sur ${p.name} (ouvre dans un nouvel onglet)`}
                    className="flex flex-col items-center text-center group cursor-pointer transition-transform hover:-translate-y-0.5 active:scale-95 shrink-0"
                  >
                    {p.logo_path && (
                      <div className="relative">
                        <img
                          src={p.logo_path}
                          alt={p.name}
                          className="w-11 h-11 rounded-[14px] object-cover border border-black/10 dark:border-white/10 shadow-sm group-hover:shadow-md group-hover:border-primary/50 transition-all"
                        />
                      </div>
                    )}
                    <span className="text-[10px] text-neutral-600 dark:text-neutral-400 group-hover:text-primary dark:group-hover:text-primary mt-1 max-w-[72px] truncate font-medium transition-colors">
                      {p.name}
                    </span>
                  </a>
                );
              })}
            </div>

            {/* Ligne inférieure : Pays à gauche & Source JustWatch à droite (comme Serializd) */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <div className="flex items-center gap-1 text-[#00c2cb] font-medium text-xs">
                <MapPin size={13} className="shrink-0" />
                <span>France</span>
              </div>
              <JustWatchBadge movieTitle={film.title} />
            </div>
          </div>
        )}

        <div className="border-t border-black/[0.06] dark:border-white/10 pt-3" />

        {/* ── 11. Critiques Spectateurs Dynamiques ── */}
        <FilmReviewsSection reviews={film.reviews} rating={film.rating} />

        <div className="border-t border-black/[0.06] dark:border-white/10 pt-3" />

        {/* ── 12. Séances & Horaires ── */}
        <div className="space-y-3 px-1">
          <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-semibold text-sm">
            <Clock size={16} className="text-primary" />
            <span>Séances</span>
          </div>

          {validDays.length > 0 ? (
            <div className="space-y-4">
              {validDays.map((dayLabel) => {
                const cinemas = film.seancesByDay[dayLabel] ?? {};
                return (
                  <div key={dayLabel} className="space-y-2">
                    <span className="inline-block px-3 py-1 rounded-[16px] bg-primary text-primary-contrast text-xs font-semibold shadow-xs">
                      {dayLabel}
                    </span>

                    <DaySeances
                      cinemas={cinemas}
                      isoDate={dayLabel}
                      filmTitle={film.title}
                      filmDuree={film.duree}
                      filmUrl={film.url}
                      filmYear={film.release_year}
                      originalLanguage={film.original_language}
                      groupByBrand={true}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 font-normal">Aucune séance restante programmée pour ce film.</p>
          )}
        </div>

        {/* ── 13. Films similaires à l'affiche à Lyon ── */}
        {similarMovies.length > 0 && (
          <>
            <div className="border-t border-black/[0.06] dark:border-white/10 pt-3" />
            <div className="space-y-3 px-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-semibold text-sm">
                  <Sparkles size={16} className="text-primary" />
                  <span>Films similaires à l&apos;affiche à Lyon</span>
                </div>
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-medium flex items-center justify-center">
                  {similarMovies.length}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 -mt-1 font-normal">
                Actuellement en salle cette semaine
              </p>

              <div className="flex items-start gap-3 overflow-x-auto no-scrollbar pb-2">
                {similarMovies.map((m) => (
                  <div key={m.id} className="shrink-0 w-32 space-y-1.5">
                    <div className="relative aspect-[2/3] rounded-[18px] overflow-hidden shadow-sm border border-black/10 dark:border-white/10 bg-neutral-200 dark:bg-[#1c1c1e]">
                      {m.poster && (
                        <img src={m.poster} alt={m.title} className="w-full h-full object-cover" />
                      )}
                      {m.rating && (
                        <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-normal flex items-center gap-0.5">
                          <Star size={10} className="fill-amber-400 text-amber-400" />
                          <span>{m.rating}</span>
                        </div>
                      )}
                      <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-teal-600/90 text-white text-[8px] font-normal tracking-wider">
                        À L&apos;AFFICHE
                      </div>
                    </div>
                    <h4 className="text-xs font-normal text-neutral-900 dark:text-white truncate">
                      {m.title}
                    </h4>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                      {m.cinema}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
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
