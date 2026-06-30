'use client';
// src/components/ui/SearchFilters.tsx
// Barre de recherche et filtres — portage web de FilterBar.tsx

import React, { useCallback, useState } from 'react';

export interface FiltersState {
  titleQuery: string;
  genre: string;
  director: string;
  cinema: string;
  format: string;
  dayIndex: string;
  showOnlyFavorites: boolean;
}

interface SearchFiltersProps {
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
  allGenres: string[];
  allDirectors: string[];
  allCinemas: string[];
  allFormats: string[];
  dates: { label: string; index: number }[];
  favoritesCount: number;
  onSyncClick: () => void;
}

export default function SearchFilters({
  filters,
  onFiltersChange,
  allGenres,
  allDirectors,
  allCinemas,
  allFormats,
  dates,
  favoritesCount,
  onSyncClick,
}: SearchFiltersProps) {
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  const update = useCallback(
    (partial: Partial<FiltersState>) => {
      onFiltersChange({ ...filters, ...partial });
    },
    [filters, onFiltersChange]
  );

  const reset = useCallback(() => {
    onFiltersChange({
      titleQuery: '',
      genre: '',
      director: '',
      cinema: '',
      format: '',
      dayIndex: '',
      showOnlyFavorites: false,
    });
  }, [onFiltersChange]);

  const hasActiveFilters =
    filters.genre ||
    filters.director ||
    filters.cinema ||
    filters.format ||
    filters.dayIndex;

  return (
    <div className="search-container" role="search" aria-label="Filtrer les films">
      {/* Recherche principale + Actions rapides */}
      <div className="search-row" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          type="text"
          id="search-title"
          placeholder="Rechercher par titre..."
          className="search-input search-main"
          value={filters.titleQuery}
          onChange={(e) => update({ titleQuery: e.target.value })}
          aria-label="Rechercher par titre"
          style={{ flex: 1, minWidth: 200 }}
        />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Bouton Favoris */}
          <label className="favorites-toggle" htmlFor="filter-favorites" style={{ height: 46, display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="filter-favorites"
              checked={filters.showOnlyFavorites}
              onChange={(e) => update({ showOnlyFavorites: e.target.checked })}
              aria-label="Afficher uniquement les favoris"
            />
            <svg
              className="favorites-heart"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className="favorites-label">
              Favoris{favoritesCount > 0 ? ` (${favoritesCount})` : ''}
            </span>
          </label>

          {/* Bouton Filtres secondaires */}
          <button
            type="button"
            className={`filter-toggle-btn${showFiltersPanel ? ' active' : ''}`}
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              height: 46,
              padding: '0 16px',
              borderRadius: 8,
              border: '2px solid var(--border-color)',
              background: 'var(--card-solid)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
            Filtres
            {hasActiveFilters && (
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                marginLeft: 2
              }} />
            )}
          </button>

          {/* Bouton Réglages */}
          <button
            type="button"
            className="sync-btn"
            onClick={onSyncClick}
            title="Réglages et synchronisation"
            aria-label="Ouvrir les réglages"
            style={{ height: 46, display: 'flex', alignItems: 'center' }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              width="16"
              height="16"
              style={{ marginRight: 6 }}
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span className="sync-label">Réglages</span>
          </button>
        </div>
      </div>

      {/* Filtres secondaires */}
      {showFiltersPanel && (
        <div className="search-row search-filters" style={{ marginTop: 12 }}>
          <select
            id="filter-genre"
            className="search-input"
            value={filters.genre}
            onChange={(e) => update({ genre: e.target.value })}
            aria-label="Filtrer par genre"
          >
            <option value="">Tous les genres</option>
            {allGenres.map((g) => (
              <option key={g} value={g.toLowerCase()}>
                {g}
              </option>
            ))}
          </select>

          <select
            id="filter-director"
            className="search-input"
            value={filters.director}
            onChange={(e) => update({ director: e.target.value })}
            aria-label="Filtrer par réalisateur"
          >
            <option value="">Tous les réalisateurs</option>
            {allDirectors.map((d) => (
              <option key={d} value={d.toLowerCase()}>
                {d}
              </option>
            ))}
          </select>

          <select
            id="filter-cinema"
            className="search-input"
            value={filters.cinema}
            onChange={(e) => update({ cinema: e.target.value })}
            aria-label="Filtrer par cinéma"
          >
            <option value="">Tous les cinémas</option>
            <option value="group:pathe">Pathé</option>
            <option value="group:ugc">UGC</option>
            <option value="group:lumiere">Lumière</option>
            <option disabled>──────────</option>
            {allCinemas.map((c) => (
              <option key={c} value={c.toLowerCase()}>
                {c}
              </option>
            ))}
          </select>

          <select
            id="filter-day"
            className="search-input"
            value={filters.dayIndex}
            onChange={(e) => update({ dayIndex: e.target.value })}
            aria-label="Filtrer par jour"
          >
            <option value="">Tous les jours</option>
            {dates.map((d) => (
              <option key={d.index} value={String(d.index)}>
                {d.label}
              </option>
            ))}
          </select>

          <select
            id="filter-format"
            className="search-input"
            value={filters.format}
            onChange={(e) => update({ format: e.target.value })}
            aria-label="Filtrer par format"
          >
            <option value="">Toutes les séances</option>
            {allFormats.map((f) => (
              <option key={f} value={f.toLowerCase()}>
                {f}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              id="reset-filters"
              className="reset-btn"
              onClick={reset}
              type="button"
              style={{ height: 46 }}
            >
              Réinitialiser
            </button>
          )}
        </div>
      )}
    </div>
  );
}
