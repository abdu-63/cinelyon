// src/components/ui/FilmsList.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Film, DateLabel, FiltersState } from '@/types';
import { FilmCard } from '@/components/ui/FilmCard';
import { DaySelector } from '@/components/ui/DaySelector';
import { FilterBar } from '@/components/ui/FilterBar';
import { filterFilms, extractFilterOptions, hasVisibleSeances } from '@/utils/showtimes';
import { PAGE_SIZE } from '@/lib/constants';

interface FilmsListProps {
  initialFilms: Film[];
  initialDates: DateLabel[];
}

const DEFAULT_FILTERS: FiltersState = {
  titleQuery: '',
  genres: [],
  directors: [],
  cinemas: [],
  dayIndex: null,
  formats: [],
  timeSlots: [],
  showOnlyFavorites: false,
  showOnlyNew: false,
  showOnlyYesterday: false,
  showOnlyDayBefore: false,
  showFriendFavorites: false,
  favTab: 'perso',
};

export function FilmsList({ initialFilms = [], initialDates = [] }: FilmsListProps) {
  const [selectedDelta, setSelectedDelta] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('cinelyon_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = useCallback((filmId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(filmId) ? prev.filter((id) => id !== filmId) : [...prev, filmId];
      try {
        localStorage.setItem('cinelyon_favorites', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Filter out films that have no visible seances
  const baseFilms = useMemo(() => {
    return initialFilms.filter((f) =>
      initialDates.some((d) => hasVisibleSeances(f, d.isoDate, initialDates, true))
    );
  }, [initialFilms, initialDates]);

  const filterOptions = useMemo(() => extractFilterOptions(baseFilms), [baseFilms]);

  // Films correspondants aux filtres hors jour
  const filmsMatchingFilters = useMemo(() => {
    return filterFilms(baseFilms, filters, initialDates, favorites);
  }, [baseFilms, filters, initialDates, favorites]);

  // Jours ayant au moins une séance visible parmi les films filtrés
  const availableDates = useMemo(() => {
    return initialDates.filter((d) =>
      filmsMatchingFilters.some((f) => hasVisibleSeances(f, d.isoDate, initialDates, true))
    );
  }, [initialDates, filmsMatchingFilters]);

  // Si le jour sélectionné n'est plus disponible, retomber sur null ("Tous")
  const activeDelta = useMemo(() => {
    if (selectedDelta === null) return null;
    return availableDates.some((d) => d.index === selectedDelta) ? selectedDelta : null;
  }, [availableDates, selectedDelta]);

  // Films filtrés selon le jour sélectionné
  const filteredFilms = useMemo(() => {
    if (activeDelta === null) return filmsMatchingFilters;

    const selectedDateObj = initialDates.find((d) => d.index === activeDelta);
    if (!selectedDateObj) return filmsMatchingFilters;

    return filmsMatchingFilters.filter((f) =>
      hasVisibleSeances(f, selectedDateObj.isoDate, initialDates, true)
    );
  }, [filmsMatchingFilters, activeDelta, initialDates]);

  const paginatedFilms = useMemo(
    () => filteredFilms.slice(0, visibleCount),
    [filteredFilms, visibleCount]
  );

  const handleDayChange = useCallback((delta: number | null) => {
    setSelectedDelta(delta);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleFiltersChange = useCallback((partial: Partial<FiltersState>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredFilms.length));
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-2">
      {/* Barre de Recherche et Filtres */}
      <FilterBar
        filters={filters}
        options={filterOptions}
        onFiltersChange={handleFiltersChange}
        totalCount={baseFilms.length}
        filteredCount={filteredFilms.length}
      />

      {/* Mini-Calendrier Horizontal */}
      <DaySelector
        dates={availableDates}
        selectedDelta={activeDelta}
        onSelect={handleDayChange}
      />

      {/* Liste des Films (Feed Centré fidèle à l'application mobile) */}
      <div className="space-y-3 mt-2">
        {paginatedFilms.length === 0 ? (
          <div className="text-center py-16 liquid-glass rounded-3xl border border-white/10 p-8 my-4">
            <p className="text-sm font-semibold text-neutral-300">Aucun film ne correspond à vos filtres.</p>
            <p className="text-xs text-neutral-400 mt-1">
              Essaie de réinitialiser la recherche ou de changer de jour.
            </p>
          </div>
        ) : (
          paginatedFilms.map((film) => (
            <FilmCard
              key={film.filmId}
              film={film}
              isFavorite={favorites.includes(film.filmId)}
              onToggleFavorite={toggleFavorite}
              dates={initialDates}
              selectedDelta={activeDelta}
              hidePastSessions={true}
            />
          ))
        )}
      </div>

      {/* Pagination "Afficher plus" */}
      {visibleCount < filteredFilms.length && (
        <div className="pt-6 pb-12 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold transition-all shadow-lg active:scale-95"
          >
            Afficher plus de films ({filteredFilms.length - visibleCount} restants)
          </button>
        </div>
      )}
    </div>
  );
}
