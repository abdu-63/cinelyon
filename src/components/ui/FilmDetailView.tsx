// src/components/ui/FilmDetailView.tsx
// Composant d'affichage détaillé complet d'un film (partagé entre la vue modale 0ms et la page SSR /film/[slug])
'use client';

import React, { memo, useState, useEffect, useMemo } from 'react';
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
import { FilmLogo } from '@/components/ui/FilmLogo';
import { getCachedLogo, FilmLogoResult } from '@/hooks/useFilmLogo';
import { getStreamingProviderWebUrl } from '@/utils/streamingProviders';
import { getLetterboxdDeepLink } from '@/utils/letterboxdUtils';
import { getDateLabelByDay } from '@/utils/showtimes';
import { getTodayIso } from '@/utils/dateUtils';

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
  initialLogo?: FilmLogoResult | null;
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
  initialLogo,
  onClose,
  onSelectFilm,
}: FilmDetailViewProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  // hasLogo: true (logo prêt), false (aucun logo sur TMDB -> titre brut), null (en cours)
  // Ne JAMAIS afficher le titre brut par défaut pour éliminer tout flash à l'ouverture
  const [hasLogo, setHasLogo] = useState<boolean | null>(() => {
    if (initialLogo) {
      return !!initialLogo.logoUrl;
    }
    if (typeof window !== 'undefined') {
      try {
        const useOrig = localStorage.getItem('cinelyon_useOriginalTitleLogo') === 'true';
        const cached = getCachedLogo(film.title, film.release_year, useOrig);
        if (cached) return !!cached.logoUrl;
      } catch {}
    }
    return null;
  });
  const [hidePastSessions, setHidePastSessions] = useState(false);

  const validDays = useMemo(() => Object.keys(film.seancesByDay || {}), [film.seancesByDay]);
  const [selectedDayLabel, setSelectedDayLabel] = useState<string>(() => validDays[0] || '');

  useEffect(() => {
    if (validDays.length > 0 && (!selectedDayLabel || !validDays.includes(selectedDayLabel))) {
      setSelectedDayLabel(validDays[0]);
    }
  }, [validDays, selectedDayLabel]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cinelyon_hide_past_sessions');
      if (stored !== null) {
        setHidePastSessions(stored === 'true');
      }
    } catch {}

    const handleSettingsChange = () => {
      try {
        const stored = localStorage.getItem('cinelyon_hide_past_sessions');
        if (stored !== null) {
          setHidePastSessions(stored === 'true');
        }
      } catch {}
    };

    window.addEventListener('cinelyon:settings-changed', handleSettingsChange);
    return () => window.removeEventListener('cinelyon:settings-changed', handleSettingsChange);
  }, []);

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

  return (
    <div className={`w-full pb-24 bg-[#f5f6f8] dark:bg-[#121214] text-neutral-900 dark:text-white ${isModal ? 'pt-0' : 'min-h-screen'}`}>
      <div className="max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto px-3 sm:px-4 space-y-4">
        {/* ── Floating Action Bar (Sticky top) ── */}
        <div className="sticky top-3 sm:top-4 z-40 flex items-center justify-between pointer-events-none -mb-12 sm:-mb-14 pt-1 px-1">
          {isModal && onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="pointer-events-auto px-3.5 py-1.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-xl text-white text-xs font-semibold flex items-center gap-1 border border-white/20 transition-all duration-150 active:scale-95 shadow-lg shadow-black/25 touch-manipulation cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span>Retour</span>
            </button>
          ) : (
            <Link
              href="/"
              className="pointer-events-auto px-3.5 py-1.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-xl text-white text-xs font-semibold flex items-center gap-1 border border-white/20 transition-all duration-150 active:scale-95 shadow-lg shadow-black/25 touch-manipulation cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span>Retour</span>
            </Link>
          )}

          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={handleShare}
              className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-xl text-white flex items-center justify-center shadow-lg shadow-black/25 border border-white/20 hover:scale-105 active:scale-95 transition-all duration-150 touch-manipulation cursor-pointer"
              title="Partager"
              aria-label="Partager ce film"
            >
              {copiedShare ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
            </button>
            <button
              type="button"
              onClick={toggleFavorite}
              className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-xl text-white flex items-center justify-center shadow-lg shadow-black/25 border border-white/20 hover:scale-105 active:scale-95 transition-all duration-150 touch-manipulation cursor-pointer"
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

        {/* ── 1. Hero Backdrop Banner (Letterboxd Style on Desktop / Full-Width on Mobile) ── */}
        <div className="relative -mx-3 sm:mx-0 w-[calc(100%+1.5rem)] sm:w-full h-[270px] sm:h-[340px] md:h-[390px] rounded-none sm:rounded-[24px] overflow-hidden shadow-md sm:shadow-lg mt-0 sm:mt-2 bg-neutral-950 group">
          <img
            src={
              film.backdrop
                ? film.backdrop
                : youtubeId
                ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
                : film.affiche || '/images/nocontent.png'
            }
            alt={film.title}
            className="w-full h-full object-cover sm:object-center select-none"
            loading="eager"
          />

          {/* Letterboxd-style soft lateral vignettes / gradients on desktop */}
          <div className="hidden sm:block absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#f5f6f8] dark:from-[#121214] via-[#f5f6f8]/40 dark:via-[#121214]/40 to-transparent pointer-events-none" />
          <div className="hidden sm:block absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#f5f6f8] dark:from-[#121214] via-[#f5f6f8]/40 dark:via-[#121214]/40 to-transparent pointer-events-none" />

          {/* Top dark subtle gradient for buttons readability */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none" />

          {/* Bottom gradient fade into page background */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#f5f6f8] dark:from-[#121214] via-[#f5f6f8]/60 dark:via-[#121214]/60 to-transparent pointer-events-none" />

          {/* ClearLogo / Titre superposé en bas de la bannière */}
          <div className="absolute bottom-3 left-4 right-4 z-20 flex flex-col items-start min-h-[48px] justify-end">
            <FilmLogo
              title={film.title}
              releaseYear={film.release_year}
              afficheUrl={film.affiche}
              initialLogo={initialLogo}
              onLogoLoaded={(found) => setHasLogo(found)}
              className="mb-1"
            />
            {/* Le titre brut ne s'affiche STRICTEMENT que si le film n'a AUCUN logo sur TMDB (hasLogo === false) */}
            {hasLogo === false && (
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-montserrat font-extrabold text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
                {film.title}
              </h1>
            )}
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

        {/* ── 12. Séances & Horaires (Mini-Calendrier Interactif Issue #143) ── */}
        <div className="space-y-3 px-1">
          <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-semibold text-sm">
            <Clock size={16} className="text-primary" />
            <span>Séances</span>
          </div>

          {validDays.length === 0 ? (
            <div className="py-6 px-4 rounded-[18px] bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/10 text-center text-xs text-neutral-500 dark:text-neutral-400 shadow-2xs font-normal">
              Aucune séance restante programmée pour ce film.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Mini-calendrier du film (défilement horizontal de pilules de dates) */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {validDays.map((dayLabel) => {
                  const cinemasForDay = film.seancesByDay[dayLabel] ?? {};
                  const hasAvantPremiere = Object.values(cinemasForDay).some((seances) =>
                    seances.some((s) => s.format && s.format.toLowerCase().includes('première'))
                  );
                  const isSelected = selectedDayLabel === dayLabel;

                  return (
                    <button
                      key={dayLabel}
                      type="button"
                      onClick={() => setSelectedDayLabel(dayLabel)}
                      className={`relative px-3.5 py-1.5 rounded-[18px] text-[12px] font-normal tracking-tight transition-all shrink-0 active:scale-95 touch-manipulation select-none border ${
                        isSelected
                          ? 'bg-primary border-primary text-primary-contrast shadow-xs font-semibold'
                          : 'bg-white dark:bg-[#1c1c1e] border-black/[0.08] dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-white/25'
                      }`}
                    >
                      {hasAvantPremiere && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 border border-white dark:border-[#1c1c1e]" />
                      )}
                      <span>{dayLabel}</span>
                    </button>
                  );
                })}
              </div>

              {/* Séances pour le jour actif avec logos officiels SVG */}
              {selectedDayLabel && (
                <div className="mt-1 animate-in fade-in duration-150">
                  <DaySeances
                    cinemas={film.seancesByDay[selectedDayLabel] ?? {}}
                    isoDate={getDateLabelByDay(selectedDayLabel)?.isoDate || getTodayIso()}
                    filmTitle={film.title}
                    filmDuree={film.duree}
                    filmUrl={film.url}
                    filmYear={film.release_year}
                    originalLanguage={film.original_language}
                    hidePastSessions={hidePastSessions}
                    groupByBrand={true}
                  />
                </div>
              )}
            </div>
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
