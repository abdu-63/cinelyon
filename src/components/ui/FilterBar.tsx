// src/components/ui/FilterBar.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, Dices, Shuffle, RotateCcw } from 'lucide-react';
import { FiltersState, TimeSlot, FilmFilterOptions } from '@/types';
import { useTranslation } from '@/i18n';
import { formatLocalizedGenres } from '@/utils/filmLocalizationUtils';

interface FilterBarProps {
  filters: FiltersState;
  options: FilmFilterOptions;
  onFiltersChange: (filters: Partial<FiltersState>) => void;
  totalCount: number;
  filteredCount: number;
  onOpenDoubleFeature?: () => void;
  onOpenRoulette?: () => void;
}

export function FilterBar({
  filters,
  options,
  onFiltersChange,
  totalCount,
  filteredCount,
  onOpenDoubleFeature,
  onOpenRoulette,
}: FilterBarProps) {
  const { locale } = useTranslation();
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [localQuery, setLocalQuery] = useState(filters.titleQuery || '');

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localQuery !== filters.titleQuery) {
        onFiltersChange({ titleQuery: localQuery });
      }
    }, 250);
    return () => clearTimeout(handler);
  }, [localQuery, filters.titleQuery, onFiltersChange]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    count += filters.genres.length;
    count += filters.directors.length;
    if (filters.actors) count += filters.actors.length;
    count += filters.cinemas.length;
    count += filters.formats.length;
    count += filters.timeSlots.length;
    if (filters.showOnlyNew) count += 1;
    if (filters.showOnlyYesterday) count += 1;
    if (filters.showOnlyFavorites) count += 1;
    return count;
  }, [filters]);

  const clearAll = () => {
    setLocalQuery('');
    onFiltersChange({
      titleQuery: '',
      genres: [],
      directors: [],
      actors: [],
      cinemas: [],
      formats: [],
      timeSlots: [],
      showOnlyNew: false,
      showOnlyYesterday: false,
      showOnlyFavorites: false,
    });
  };

  const toggleGenre = (genre: string) => {
    const next = filters.genres.includes(genre)
      ? filters.genres.filter((g) => g !== genre)
      : [...filters.genres, genre];
    onFiltersChange({ genres: next });
  };

  const toggleFormat = (fmt: string) => {
    const next = filters.formats.includes(fmt)
      ? filters.formats.filter((f) => f !== fmt)
      : [...filters.formats, fmt];
    onFiltersChange({ formats: next });
  };

  const toggleCinema = (cinema: string) => {
    const next = filters.cinemas.includes(cinema)
      ? filters.cinemas.filter((c) => c !== cinema)
      : [...filters.cinemas, cinema];
    onFiltersChange({ cinemas: next });
  };

  const toggleTimeSlot = (slot: TimeSlot) => {
    const next = filters.timeSlots.includes(slot)
      ? filters.timeSlots.filter((s) => s !== slot)
      : [...filters.timeSlots, slot];
    onFiltersChange({ timeSlots: next });
  };

  return (
    <div className="w-full space-y-1.5 pb-1">
      {/* ── 1. Titre & Sous-Titre CinéLyon (identique au screenshot 3) ── */}
      <div className="pt-2 pb-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          CinéLyon
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Toutes les séances à Lyon, en un seul endroit !
        </p>
      </div>

      {/* ── 2. Barre de recherche Apple + 3 Boutons carrés arrondis ── */}
      <div className="flex items-center gap-2">
        {/* Champ de recherche blanc */}
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-3.5 text-neutral-400 pointer-events-none" size={17} />
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Recherche"
            className="w-full pl-10 pr-9 py-2.5 rounded-[18px] bg-white dark:bg-[#1e1e1e] border border-black/[0.08] dark:border-white/10 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#444cf7] shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all"
          />
          {localQuery && (
            <button
              type="button"
              onClick={() => {
                setLocalQuery('');
                onFiltersChange({ titleQuery: '' });
              }}
              className="absolute right-3 p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Bouton Ciné-Roulette */}
        <button
          type="button"
          onClick={() => {
            if (onOpenRoulette) onOpenRoulette();
            else window.dispatchEvent(new CustomEvent('cinelyon:open-roulette'));
          }}
          className="w-11 h-11 rounded-[16px] bg-white dark:bg-[#1e1e1e] border border-black/[0.08] dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 transition-all flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.02)] active:scale-95"
          title="Ciné-Roulette"
        >
          <Dices size={19} />
        </button>

        {/* Bouton Double Programme */}
        <button
          type="button"
          onClick={() => {
            if (onOpenDoubleFeature) onOpenDoubleFeature();
            else window.dispatchEvent(new CustomEvent('cinelyon:open-double-feature'));
          }}
          className="w-11 h-11 rounded-[16px] bg-white dark:bg-[#1e1e1e] border border-black/[0.08] dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 transition-all flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.02)] active:scale-95"
          title="Double Programme"
        >
          <Shuffle size={19} />
        </button>

        {/* Bouton Modale de Filtres */}
        <button
          type="button"
          onClick={() => setShowFiltersModal(true)}
          className={`relative w-11 h-11 rounded-[16px] border transition-all flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.02)] active:scale-95 ${
            activeFilterCount > 0
              ? 'bg-[#444cf7] border-[#444cf7] text-white shadow-md'
              : 'bg-white dark:bg-[#1e1e1e] border-black/[0.08] dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
          }`}
          title="Tous les filtres"
        >
          <SlidersHorizontal size={19} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center border border-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Compteur "167 films" sous la barre */}
      <div className="px-1 text-[11px] font-medium text-neutral-400">
        {filteredCount} film{filteredCount > 1 ? 's' : ''}
      </div>

      {/* ── 3. Modale Complète de Filtres ── */}
      <AnimatePresence>
        {showFiltersModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFiltersModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="relative w-full max-w-lg max-h-[85vh] bg-white dark:bg-[#1e1e1e] rounded-[24px] p-6 shadow-2xl border border-black/10 dark:border-white/10 z-10 flex flex-col my-auto"
            >
              {/* Header Modale */}
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/10">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-[#444cf7]" />
                  <h3 className="font-bold text-base text-neutral-900 dark:text-white">Filtres de Séances</h3>
                </div>
                <div className="flex items-center gap-2">
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="text-xs text-rose-500 hover:underline"
                    >
                      Effacer
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowFiltersModal(false)}
                    className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-800 dark:hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Contenu */}
              <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
                {/* Formats */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    Formats
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['IMAX', '3D', 'Dolby Cinema', '4DX', 'ScreenX', 'ICE', 'VOST', 'VF'].map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => toggleFormat(fmt)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          filters.formats.includes(fmt)
                            ? 'bg-[#444cf7] border-[#444cf7] text-white shadow-sm'
                            : 'bg-neutral-100 dark:bg-white/5 border-transparent text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Créneaux Horaires */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    Créneau Horaire
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'morning', label: 'Matin (avant 12h)' },
                      { id: 'afternoon', label: 'Après-midi (12h-18h)' },
                      { id: 'evening', label: 'Soirée (18h-22h)' },
                      { id: 'night', label: 'Nuit (après 22h)' },
                    ].map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => toggleTimeSlot(slot.id as TimeSlot)}
                        className={`p-2.5 rounded-xl text-xs font-semibold text-left border transition-all ${
                          filters.timeSlots.includes(slot.id as TimeSlot)
                            ? 'bg-[#444cf7] border-[#444cf7] text-white shadow-sm'
                            : 'bg-neutral-100 dark:bg-white/5 border-transparent text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Genres */}
                {options.genres && options.genres.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                      Genres
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {options.genres.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => toggleGenre(g)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all ${
                            filters.genres.includes(g)
                              ? 'bg-[#444cf7] border-[#444cf7] text-white shadow-sm'
                              : 'bg-neutral-100 dark:bg-white/5 border-transparent text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          {formatLocalizedGenres(g, locale)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cinémas */}
                {options.cinemas && options.cinemas.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                      Cinémas Lyonnais
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
                      {options.cinemas.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleCinema(c)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all truncate max-w-[200px] ${
                            filters.cinemas.includes(c)
                              ? 'bg-[#444cf7] border-[#444cf7] text-white shadow-sm'
                              : 'bg-neutral-100 dark:bg-white/5 border-transparent text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-black/[0.06] dark:border-white/10 flex items-center justify-between">
                <span className="text-xs text-neutral-400">
                  {filteredCount} film{filteredCount > 1 ? 's' : ''} disponible{filteredCount > 1 ? 's' : ''}
                </span>
                <button
                  type="button"
                  onClick={() => setShowFiltersModal(false)}
                  className="px-5 py-2 rounded-xl bg-[#444cf7] hover:bg-[#3339c4] text-white font-bold text-xs shadow-md shadow-[#444cf7]/25 transition-all"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
