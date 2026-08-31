// src/components/ui/FilmDetailView.tsx
// Composant d'affichage détaillé complet d'un film (partagé entre la vue modale 0ms et la page SSR /film/[slug])
'use client';

import React, { memo, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  X,
  Share2,
  Heart,
  Star,
  ExternalLink,
  BookOpen,
  ShieldCheck,
  Clock,
  PlayCircle,
  Tv,
  Sparkles,
  MapPin,
  Check,
} from 'lucide-react';
import { Film } from '@/types';
import { PostCreditsBadge } from '@/components/ui/PostCreditsBadge';
import { ToiletBreaksSection } from '@/components/ui/ToiletBreaksSection';
import { RottenTomatoesIcon } from '@/components/ui/RottenTomatoesIcon';
import { JustWatchBadge } from '@/components/ui/JustWatchBadge';
import { LetterboxdLogo, AllocineLogo } from '@/components/ui/BrandIcons';
import { FilmReviewsSection } from '@/components/ui/FilmReviewsSection';
import { DaySeances } from '@/components/ui/DaySeances';
import { CinemaBrand } from '@/components/ui/CinemaBrand';
import { FilmCastSection } from '@/components/ui/FilmCastSection';
import { getStreamingProviderWebUrl } from '@/utils/streamingProviders';
import { getLetterboxdDeepLink } from '@/utils/letterboxdUtils';

export interface SimilarMovieItem {
  id: number | string;
  title: string;
  rating?: string | null;
  poster?: string | null;
  cinema?: string;
  slug?: string;
  isInTheaters: boolean;
}

interface FilmDetailViewProps {
  film: Film;
  similarMovies?: SimilarMovieItem[];
  isModal?: boolean;
  onClose?: () => void;
  onSelectFilm?: (slugOrTitle: string) => void;
}

function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export const FilmDetailView = memo(function FilmDetailView({
  film,
  similarMovies = [],
  isModal = false,
  onClose,
  onSelectFilm,
}: FilmDetailViewProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Synchronisation des favoris
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cinelyon_favorites');
      if (stored) {
        const favs: string[] = JSON.parse(stored);
        setIsFavorite(favs.includes(film.filmId || film.slug));
      }
    } catch {}
  }, [film.filmId, film.slug]);

  const toggleFavorite = () => {
    try {
      const stored = localStorage.getItem('cinelyon_favorites');
      let favs: string[] = stored ? JSON.parse(stored) : [];
      const id = film.filmId || film.slug;
      if (favs.includes(id)) {
        favs = favs.filter((f) => f !== id);
        setIsFavorite(false);
      } else {
        favs.push(id);
        setIsFavorite(true);
      }
      localStorage.setItem('cinelyon_favorites', JSON.stringify(favs));
      window.dispatchEvent(new Event('cinelyon:favorites-changed'));
    } catch {}
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/film/${film.slug}` : `https://cinelyon.fr/film/${film.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${film.title} — CinéLyon`,
          text: `Découvre les séances et horaires de ${film.title} à Lyon !`,
          url,
        });
        return;
      } catch {}
    }

    // Fallback presse-papier
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const letterboxdLinks = getLetterboxdDeepLink(
    film.url,
    film.title,
    film.original_language ? film.title : null
  );

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
    <div className={`w-full pb-24 bg-[#f5f6f8] dark:bg-[#121214] text-neutral-900 dark:text-white ${isModal ? 'pt-0' : 'min-h-screen'}`}>
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

          {/* Navigation Bar over Hero */}
          <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
            {isModal && onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1 border border-white/20 transition-transform active:scale-95 shadow-sm"
              >
                <ChevronLeft size={16} />
                <span>Retour</span>
              </button>
            ) : (
              <Link
                href="/"
                className="px-3.5 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1 border border-white/20 transition-transform active:scale-95 shadow-sm"
              >
                <ChevronLeft size={16} />
                <span>Retour</span>
              </Link>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center shadow-sm border border-white/20 hover:scale-105 active:scale-95 transition-all"
                title="Partager"
                aria-label="Partager ce film"
              >
                {copiedShare ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
              </button>
              <button
                type="button"
                onClick={toggleFavorite}
                className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center shadow-sm border border-white/20 hover:scale-105 active:scale-95 transition-all"
                title="Favori"
                aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                <Heart
                  size={16}
                  className={`transition-colors ${isFavorite ? 'fill-[#ff6b6b] text-[#ff6b6b]' : 'text-white'}`}
                />
              </button>
            </div>
          </div>

          {/* Titre superposé en bas du banner */}
          <div className="absolute bottom-3 left-4 right-4">
            <h1 className="text-2xl sm:text-3xl font-montserrat font-extrabold text-white tracking-tight drop-shadow-md">
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

          {/* ── 3. Scorecards ── */}
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
              href={letterboxdLinks.webUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 text-xs font-medium text-neutral-800 dark:text-white flex items-center gap-1.5 shadow-sm hover:border-neutral-400 dark:hover:border-white/25 transition-colors active:scale-95 touch-manipulation"
            >
              <LetterboxdLogo width={16} height={16} />
              <span>Letterboxd</span>
              <ExternalLink size={11} className="text-neutral-400 ml-0.5" />
            </a>

            <a
              href={film.allocine_url || `https://www.allocine.fr/recherche/?q=${encodeURIComponent(film.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 text-xs font-medium text-neutral-800 dark:text-white flex items-center gap-1.5 shadow-sm hover:border-neutral-400 dark:hover:border-white/25 transition-colors active:scale-95 touch-manipulation"
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
        <FilmCastSection
          filmTitle={film.title}
          releaseYear={film.release_year}
          affiche={film.affiche}
        />

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

            {/* Ligne inférieure : Pays à gauche & Source JustWatch à droite */}
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
                {similarMovies.some((f) => f.isInTheaters)
                  ? 'Actuellement en salle cette semaine'
                  : 'Recommandations cinématographiques'}
              </p>

              <div className="flex items-start gap-3 overflow-x-auto no-scrollbar pb-2">
                {similarMovies.map((m, idx) => {
                  const cardContent = (
                    <div className="relative aspect-[2/3] rounded-[18px] overflow-hidden shadow-sm border border-black/10 dark:border-white/10 bg-neutral-200 dark:bg-[#1c1c1e] transition-all">
                      {m.poster && (
                        <img
                          src={m.poster}
                          alt={m.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      )}
                      {m.rating && (
                        <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-normal flex items-center gap-0.5">
                          <Star size={10} className="fill-amber-400 text-amber-400" />
                          <span>{m.rating}</span>
                        </div>
                      )}
                      {m.isInTheaters && (
                        <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-primary text-primary-contrast text-[8px] font-normal tracking-wider shadow-sm">
                          À L&apos;AFFICHE
                        </div>
                      )}
                    </div>
                  );

                  return (
                    <div key={m.slug || m.id || idx} className="shrink-0 w-32 space-y-1.5">
                      {isModal && onSelectFilm && m.slug ? (
                        <button
                          type="button"
                          onClick={() => onSelectFilm(m.slug!)}
                          className="group block w-full text-left select-none active:scale-95 transition-transform"
                        >
                          {cardContent}
                        </button>
                      ) : m.slug ? (
                        <Link
                          href={`/film/${m.slug}`}
                          prefetch={true}
                          className="group block select-none active:scale-95 transition-transform"
                        >
                          {cardContent}
                        </Link>
                      ) : (
                        <div className="group block select-none">{cardContent}</div>
                      )}
                      <h4 className="text-xs font-normal text-neutral-900 dark:text-white line-clamp-1 leading-tight">
                        {m.title}
                      </h4>
                      {m.cinema && (
                        <div className="flex items-center gap-1">
                          <CinemaBrand cinemaName={m.cinema} hideText compact className="scale-75 origin-left shrink-0" />
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate leading-tight font-normal">
                            {m.cinema}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});
