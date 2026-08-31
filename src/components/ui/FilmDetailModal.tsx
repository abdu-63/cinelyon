// src/components/ui/FilmDetailModal.tsx
// Modale plein écran ultra-rapide (0ms perceptible) pour afficher le détail d'un film
// avec transitions physiques Apple, synchronisation de l'URL et support du retour arrière navigateur

'use client';

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film } from '@/types';
import { FilmDetailView, SimilarMovieItem } from './FilmDetailView';

interface FilmDetailModalProps {
  film: Film | null;
  allFilms?: Film[];
  isOpen: boolean;
  onClose: () => void;
  onSelectFilm: (film: Film) => void;
}

export function FilmDetailModal({
  film,
  allFilms = [],
  isOpen,
  onClose,
  onSelectFilm,
}: FilmDetailModalProps) {
  // Calcul instantané en mémoire des films similaires
  const similarMovies: SimilarMovieItem[] = React.useMemo(() => {
    if (!film || allFilms.length === 0) return [];
    const currentGenres = typeof film.genres === 'string' ? film.genres.toLowerCase() : '';
    return allFilms
      .filter((lf) => lf.slug !== film.slug)
      .filter((lf) => {
        if (!lf.genres || !currentGenres) return false;
        const gList = lf.genres.toLowerCase().split(',');
        return gList.some((g) => currentGenres.includes(g.trim()));
      })
      .slice(0, 8)
      .map((m, idx) => {
        const cinemaNames = Object.keys(m.seancesByDay || {});
        const firstDayCinemas = cinemaNames[0] ? Object.keys(m.seancesByDay[cinemaNames[0]] || {}) : [];
        const primaryCinema = firstDayCinemas[0] || 'Cinémas de Lyon';
        return {
          id: idx + 1,
          title: m.title,
          rating: m.rating && m.rating !== 'Note inconnue' ? m.rating.replace(/\/5$/, '') : undefined,
          poster: m.affiche,
          cinema: primaryCinema,
          slug: m.slug,
          isInTheaters: true,
        };
      });
  }, [film, allFilms]);

  // Synchronisation avec l'historique du navigateur
  useEffect(() => {
    if (!isOpen || !film) return;

    // Mise à jour de l'URL sans recharger la page
    const currentPath = window.location.pathname;
    const targetPath = `/film/${film.slug}`;
    if (currentPath !== targetPath) {
      window.history.pushState({ filmSlug: film.slug }, '', targetPath);
    }

    const handlePopState = () => {
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    // Verrouillage du scroll sur le body
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, film]);

  const handleClose = useCallback(() => {
    onClose();
    if (typeof window !== 'undefined') {
      if (window.history.state && window.history.state.filmSlug) {
        window.history.back();
      } else {
        window.history.pushState(null, '', '/');
      }
    }
  }, [onClose]);

  const handleSelectSimilar = useCallback(
    (slugOrTitle: string) => {
      const found = allFilms.find((f) => f.slug === slugOrTitle || f.title.toLowerCase() === slugOrTitle.toLowerCase());
      if (found) {
        onSelectFilm(found);
      }
    },
    [allFilms, onSelectFilm]
  );

  return (
    <AnimatePresence>
      {isOpen && film && (
        <motion.div
          key="film-detail-modal"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', damping: 32, stiffness: 380 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-[#f5f6f8] dark:bg-[#121214] overscroll-contain"
        >
          <FilmDetailView
            film={film}
            similarMovies={similarMovies}
            isModal={true}
            onClose={handleClose}
            onSelectFilm={handleSelectSimilar}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
