// src/components/ui/FilmCollectionSection.tsx
// Section carrousel des films de la même saga / collection (TMDB)
'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { Layers, Star, ExternalLink, Film as FilmIcon } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/context/ThemeContext';
import { useFilmCollection, FilmCollectionPart } from '@/hooks/useFilmCollection';
import { CinemaBrand } from '@/components/ui/CinemaBrand';
import { getLetterboxdDeepLink } from '@/utils/letterboxdUtils';
import { slugify } from '@/utils/slugify';

export interface InTheaterFilmCandidate {
  slug: string;
  title: string;
  release_year?: string | null;
  cinema?: string;
  poster?: string | null;
  rating?: string | null;
}

interface FilmCollectionSectionProps {
  filmTitle: string;
  releaseYear: string | null;
  affiche: string | null;
  currentFilmSlug?: string;
  allFilms?: InTheaterFilmCandidate[];
  isModal?: boolean;
  onSelectFilm?: (slugOrTitle: string) => void;
}

function normalizeTitle(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/\b(and|et)\b/g, ' ')
    .replace(/[^a-z0-9]/g, '');
}

export const FilmCollectionSection = memo(function FilmCollectionSection({
  filmTitle,
  releaseYear,
  affiche,
  currentFilmSlug,
  allFilms = [],
  isModal = false,
  onSelectFilm,
}: FilmCollectionSectionProps) {
  const { t } = useTranslation();
  const { primaryColor, isDark } = useTheme();
  const isWhiteLight = primaryColor === 'white' && !isDark;
  const isBlackDark = primaryColor === 'black' && isDark;

  const accentTextClass = isWhiteLight
    ? 'text-neutral-900'
    : isBlackDark
    ? 'text-white'
    : 'text-primary';

  const { data: collection, isLoading } = useFilmCollection(filmTitle, releaseYear, affiche);

  // Map indexée des films en salle pour recherche O(1)
  const theaterLookup = useMemo(() => {
    const map = new Map<string, InTheaterFilmCandidate>();
    for (const f of allFilms) {
      if (f.slug) map.set(`slug:${f.slug}`, f);
      const norm = normalizeTitle(f.title);
      if (norm) {
        map.set(`title:${norm}`, f);
        if (f.release_year) {
          map.set(`title_year:${norm}_${f.release_year}`, f);
        }
      }
    }
    return map;
  }, [allFilms]);

  // Si en cours de chargement et aucun résultat en cache, afficher un squelette discret
  if (isLoading && !collection) {
    return (
      <>
        <div className="border-t border-black/[0.06] dark:border-white/10 pt-3" />
        <div className="space-y-3 px-1 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="w-36 h-4 rounded bg-neutral-200 dark:bg-neutral-800" />
          </div>
          <div className="flex items-start gap-3 overflow-x-auto no-scrollbar pb-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shrink-0 w-32 space-y-1.5">
                <div className="aspect-[2/3] rounded-[18px] bg-neutral-200 dark:bg-neutral-800" />
                <div className="w-24 h-3 rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="w-16 h-2 rounded bg-neutral-200 dark:bg-neutral-800" />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  // Si pas de saga ou moins de 2 films, ne rien afficher
  if (!collection || collection.parts.length < 2) {
    return null;
  }

  const currentYearNum = new Date().getFullYear();

  return (
    <>
      <div className="border-t border-black/[0.06] dark:border-white/10 pt-3" />
      <div className="space-y-3 px-1">
      {/* En-tête de section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-semibold text-sm">
          <Layers size={16} className={accentTextClass} />
          <span>{t('filmDetail.saga') || 'Dans la même saga'}</span>
        </div>
        <span
          className={`w-5 h-5 rounded-full text-[11px] font-medium flex items-center justify-center ${
            isWhiteLight
              ? 'bg-black/10 text-neutral-900'
              : isBlackDark
              ? 'bg-white/15 text-white'
              : 'bg-primary/10 text-primary'
          }`}
        >
          {collection.parts.length}
        </span>
      </div>

      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 -mt-1 font-normal">
        {collection.name}
      </p>

      {/* Carrousel horizontal */}
      <div className="flex items-start gap-3 overflow-x-auto no-scrollbar pb-2 pt-0.5">
        {collection.parts.map((part: FilmCollectionPart) => {
          // Détection du film actuel
          const isCurrent =
            part.id === collection.currentMovieId ||
            (currentFilmSlug && slugify(part.title, part.releaseYear || undefined) === currentFilmSlug) ||
            normalizeTitle(part.title) === normalizeTitle(filmTitle);

          // Détection si en salle à Lyon
          let matchedFilm: InTheaterFilmCandidate | undefined;
          if (!isCurrent) {
            const partNorm = normalizeTitle(part.title);
            if (part.releaseYear) {
              matchedFilm = theaterLookup.get(`title_year:${partNorm}_${part.releaseYear}`);
            }
            if (!matchedFilm) {
              matchedFilm = theaterLookup.get(`title:${partNorm}`);
            }
            if (!matchedFilm) {
              matchedFilm = theaterLookup.get(
                `slug:${slugify(part.title, part.releaseYear || undefined)}`
              );
            }
          }

          const isInTheaters = !isCurrent && !!matchedFilm;
          const matchedSlug = matchedFilm?.slug;
          const matchedCinema = matchedFilm?.cinema;

          // Détection film à venir
          const releaseYearNum = part.releaseYear ? parseInt(part.releaseYear, 10) : null;
          const isUpcoming =
            !isInTheaters &&
            !isCurrent &&
            (!releaseYearNum || releaseYearNum > currentYearNum || (part.releaseDate && new Date(part.releaseDate) > new Date()));

          // Deep link Letterboxd
          const letterboxdLinks = getLetterboxdDeepLink(part.title, part.releaseYear);

          const cardContent = (
            <div
              className={`relative aspect-[2/3] rounded-[18px] overflow-hidden shadow-sm border bg-neutral-200 dark:bg-[#1c1c1e] transition-all ${
                isCurrent
                  ? 'border-primary ring-2 ring-primary/40'
                  : 'border-black/10 dark:border-white/10 group-hover:border-primary/40'
              }`}
            >
              {part.posterUrl ? (
                <img
                  src={part.posterUrl}
                  alt={part.title}
                  className={`w-full h-full object-cover transition-transform duration-300 ${
                    isCurrent ? '' : 'group-hover:scale-105'
                  }`}
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 p-3 text-center text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800">
                  <FilmIcon size={24} />
                  <span className="text-[9px] line-clamp-2 leading-tight">{part.title}</span>
                </div>
              )}

              {/* Note TMDB */}
              {part.voteAverage > 0 && (
                <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-normal flex items-center gap-0.5">
                  <Star size={10} className="fill-amber-400 text-amber-400" />
                  <span>{part.voteAverage.toFixed(1)}</span>
                </div>
              )}

              {/* Badges d'état */}
              {isCurrent ? (
                <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-primary text-primary-contrast text-[8px] font-bold tracking-wider shadow-sm">
                  {t('filmDetail.currentMovie') || 'CE FILM'}
                </div>
              ) : isUpcoming ? (
                <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/65 backdrop-blur-xs text-white text-[8px] font-normal tracking-wider">
                  {t('filmDetail.upcoming') || 'À VENIR'}
                </div>
              ) : null}
            </div>
          );

          return (
            <div key={part.id} className="shrink-0 w-32 space-y-1.5">
              {isCurrent ? (
                <div className="group block select-none cursor-default">{cardContent}</div>
              ) : isInTheaters && matchedSlug ? (
                isModal && onSelectFilm ? (
                  <button
                    type="button"
                    onClick={() => onSelectFilm(matchedSlug)}
                    className="group block w-full text-left select-none active:scale-95 transition-transform"
                  >
                    {cardContent}
                  </button>
                ) : (
                  <Link
                    href={`/film/${matchedSlug}`}
                    prefetch={true}
                    className="group block select-none active:scale-95 transition-transform"
                  >
                    {cardContent}
                  </Link>
                )
              ) : (
                <a
                  href={letterboxdLinks.webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Voir ${part.title} sur Letterboxd`}
                  aria-label={`Voir ${part.title} sur Letterboxd (ouvre dans un nouvel onglet)`}
                  className="group block select-none active:scale-95 transition-transform"
                >
                  {cardContent}
                </a>
              )}

              {/* Titre */}
              <h4
                className={`text-xs font-normal line-clamp-1 leading-tight transition-colors ${
                  isCurrent
                    ? 'font-semibold text-neutral-900 dark:text-white'
                    : 'text-neutral-900 dark:text-white group-hover:text-primary'
                }`}
              >
                {part.title}
              </h4>

              {/* Sous-titre : Année et Cinéma si en salle */}
              {isCurrent ? (
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate leading-tight font-normal">
                  {part.releaseYear || ''}
                </p>
              ) : isInTheaters ? (
                matchedCinema ? (
                  <div className="flex items-center gap-1">
                    <CinemaBrand
                      cinemaName={matchedCinema}
                      hideText
                      compact
                      className="scale-75 origin-left shrink-0"
                    />
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate leading-tight font-normal">
                      {matchedCinema}
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 truncate leading-tight font-medium">
                    {part.releaseYear ? `${part.releaseYear} • ` : ''}En salle
                  </p>
                )
              ) : (
                <div className="flex items-center gap-1 text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight font-normal">
                  <span>{part.releaseYear || 'Date inconnue'}</span>
                  <ExternalLink size={9} className="opacity-40 shrink-0" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </>
  );
});
