// src/components/ui/FilterBar.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, Dices, Shuffle, Settings, Heart, Sparkles } from 'lucide-react';
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

const TIME_SLOTS: { id: TimeSlot; label: string }[] = [
  { id: 'morning', label: 'Matin (< 12h)' },
  { id: 'afternoon', label: 'Après-midi (12h-18h)' },
  { id: 'evening', label: 'Soirée (18h-22h)' },
  { id: 'night', label: 'Nuit (> 22h)' },
];

const FORMAT_OPTIONS = ['IMAX', '3D', 'Dolby Cinema', '4DX', 'ScreenX', 'ICE', 'VOST', 'VF'];

export function FilterBar({
  filters,
  options,
  onFiltersChange,
  totalCount,
  filteredCount,
  onOpenDoubleFeature,
  onOpenRoulette,
}: FilterBarProps) {
  const { locale, t } = useTranslation();
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [localQuery, setLocalQuery] = useState(filters.titleQuery || '');
  const [prevQuery, setPrevQuery] = useState(filters.titleQuery || '');
  const [directorSearch, setDirectorSearch] = useState('');
  const [actorSearch, setActorSearch] = useState('');

  if (filters.titleQuery !== prevQuery) {
    setPrevQuery(filters.titleQuery || '');
    setLocalQuery(filters.titleQuery || '');
  }

  const openSettings = () => {
    window.dispatchEvent(new CustomEvent('cinelyon:open-settings'));
  };

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
      showOnlyDayBefore: false,
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

  const toggleDirector = (director: string) => {
    const next = filters.directors.includes(director)
      ? filters.directors.filter((d) => d !== director)
      : [...filters.directors, director];
    onFiltersChange({ directors: next });
  };

  const toggleActor = (actor: string) => {
    const current = filters.actors || [];
    const next = current.includes(actor)
      ? current.filter((a) => a !== actor)
      : [...current, actor];
    onFiltersChange({ actors: next });
  };

  const filteredDirectors = useMemo(() => {
    if (!options.directors) return [];
    if (!directorSearch.trim()) return options.directors;
    const q = directorSearch.toLowerCase().trim();
    return options.directors.filter((d) => d.toLowerCase().includes(q));
  }, [options.directors, directorSearch]);

  const filteredActors = useMemo(() => {
    if (!options.actors) return [];
    if (!actorSearch.trim()) return options.actors;
    const q = actorSearch.toLowerCase().trim();
    return options.actors.filter((a) => a.toLowerCase().includes(q));
  }, [options.actors, actorSearch]);

  return (
    <div className="w-full space-y-1.5 pb-1">
      {/* ── 1. Titre & Sous-Titre CinéLyon + Contrôle Réglages (Thème/Langue dans Réglages) ── */}
      <div className="pt-2 pb-2 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            CinéLyon
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {t('header.subtitle')}
          </p>
        </div>

        {/* Contrôles & Actions : Bouton Réglages */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={openSettings}
            className="p-2.5 rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-white/25 transition-colors shadow-sm active:scale-95 flex items-center justify-center touch-manipulation select-none"
            title="Paramètres"
            aria-label="Ouvrir les paramètres"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* ── 2. Barre de recherche Apple + 3 Boutons carrés arrondis ── */}
      <div className="flex items-center gap-2">
        {/* Champ de recherche */}
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-3.5 text-neutral-400 pointer-events-none" size={17} />
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Recherche"
            className="w-full pl-10 pr-9 py-2.5 rounded-[18px] bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-primary shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all"
          />
          {localQuery && (
            <button
              type="button"
              onClick={() => {
                setLocalQuery('');
                onFiltersChange({ titleQuery: '' });
              }}
              className="absolute right-3 p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white touch-manipulation"
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
          className="w-11 h-11 rounded-[16px] bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-white/25 transition-all flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.02)] active:scale-95 touch-manipulation select-none"
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
          className="w-11 h-11 rounded-[16px] bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-white/25 transition-all flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.02)] active:scale-95 touch-manipulation select-none"
          title="Double Programme"
        >
          <Shuffle size={19} />
        </button>

        {/* Bouton Modale de Filtres */}
        <button
          type="button"
          onClick={() => setShowFiltersModal(true)}
          className={`relative w-11 h-11 rounded-[16px] border transition-all flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.02)] active:scale-95 touch-manipulation select-none ${
            activeFilterCount > 0
              ? 'bg-primary border-primary text-primary-contrast shadow-md shadow-primary/25'
              : 'bg-white dark:bg-[#1c1c1e] border-black/[0.08] dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-white/25'
          }`}
          title="Tous les filtres"
        >
          <SlidersHorizontal size={19} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[9px] font-medium text-white flex items-center justify-center border border-white dark:border-[#1c1c1e]">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Chips des filtres actifs (Horizontal Scroll) ── */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {filters.showOnlyFavorites && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
              <Heart size={11} className="fill-current" />
              <span>Favoris</span>
              <button
                type="button"
                onClick={() => onFiltersChange({ showOnlyFavorites: false })}
                className="ml-0.5 hover:opacity-75"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {filters.showOnlyNew && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-primary/10 text-primary border border-primary/20 shrink-0">
              <Sparkles size={11} />
              <span>Nouveautés</span>
              <button
                type="button"
                onClick={() => onFiltersChange({ showOnlyNew: false })}
                className="ml-0.5 hover:opacity-75"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {filters.formats.map((f) => (
            <span
              key={`chip-fmt-${f}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-neutral-100 dark:bg-[#2c2c2e] text-neutral-800 dark:text-neutral-200 border border-black/5 dark:border-white/10 shrink-0"
            >
              <span>{f}</span>
              <button
                type="button"
                onClick={() => toggleFormat(f)}
                className="ml-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {filters.timeSlots.map((slot) => {
            const label = TIME_SLOTS.find((s) => s.id === slot)?.label || slot;
            return (
              <span
                key={`chip-slot-${slot}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-neutral-100 dark:bg-[#2c2c2e] text-neutral-800 dark:text-neutral-200 border border-black/5 dark:border-white/10 shrink-0"
              >
                <span>{label}</span>
                <button
                  type="button"
                  onClick={() => toggleTimeSlot(slot)}
                  className="ml-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
          {filters.genres.map((g) => (
            <span
              key={`chip-genre-${g}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-neutral-100 dark:bg-[#2c2c2e] text-neutral-800 dark:text-neutral-200 border border-black/5 dark:border-white/10 shrink-0"
            >
              <span>{formatLocalizedGenres(g, locale)}</span>
              <button
                type="button"
                onClick={() => toggleGenre(g)}
                className="ml-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {filters.cinemas.map((c) => (
            <span
              key={`chip-cinema-${c}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-neutral-100 dark:bg-[#2c2c2e] text-neutral-800 dark:text-neutral-200 border border-black/5 dark:border-white/10 shrink-0"
            >
              <span>{c}</span>
              <button
                type="button"
                onClick={() => toggleCinema(c)}
                className="ml-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {filters.directors.map((d) => (
            <span
              key={`chip-dir-${d}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-neutral-100 dark:bg-[#2c2c2e] text-neutral-800 dark:text-neutral-200 border border-black/5 dark:border-white/10 shrink-0"
            >
              <span>Réal: {d}</span>
              <button
                type="button"
                onClick={() => toggleDirector(d)}
                className="ml-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {filters.actors &&
            filters.actors.map((a) => (
              <span
                key={`chip-actor-${a}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-neutral-100 dark:bg-[#2c2c2e] text-neutral-800 dark:text-neutral-200 border border-black/5 dark:border-white/10 shrink-0"
              >
                <span>Acteur: {a}</span>
                <button
                  type="button"
                  onClick={() => toggleActor(a)}
                  className="ml-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          <button
            type="button"
            onClick={clearAll}
            className="px-2.5 py-1 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0"
          >
            Effacer tout
          </button>
        </div>
      )}

      {/* Compteur "167 films" sous la barre */}
      <div className="px-1 text-[11px] font-medium text-neutral-400">
        {filteredCount} film{filteredCount > 1 ? 's' : ''}
      </div>

      {/* ── 3. Modale Complète de Filtres (Bottom Sheet Apple : pleine largeur, ancrée en bas) ── */}
      <AnimatePresence>
        {showFiltersModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFiltersModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
            />

            {/* Bottom Sheet Modal */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 380 }}
              className="pointer-events-auto relative w-full max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto bg-white dark:bg-[#1c1c1e] rounded-t-[32px] rounded-b-none border-t border-x border-black/10 dark:border-white/10 shadow-2xl z-10 flex flex-col max-h-[90vh] md:max-h-[85vh] overflow-hidden"
            >
              {/* Drag Handle Indicator */}
              <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-auto mt-3 mb-1 shrink-0" />

              {/* Header Modale */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.06] dark:border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-primary" />
                  <h3 className="font-semibold text-base text-neutral-900 dark:text-white">Filtres de Séances</h3>
                </div>
                <div className="flex items-center gap-3">
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="text-xs font-medium text-rose-500 hover:underline"
                    >
                      Effacer tout ({activeFilterCount})
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

              {/* Contenu : Défilement Général Unique — Tous les filtres déployés directement sans sous-scrolls */}
              <div className="flex-1 overflow-y-auto space-y-6 px-5 py-5 overscroll-contain">
                {/* 1. Nouveautés & Sélections Rapides */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2.5">
                    Sélection rapide
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onFiltersChange({ showOnlyFavorites: !filters.showOnlyFavorites })}
                      className={`px-3 py-1.5 rounded-2xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                        filters.showOnlyFavorites
                          ? 'bg-rose-500 border-rose-500 text-white shadow-sm'
                          : 'bg-neutral-100 dark:bg-[#2c2c2e] border-transparent text-neutral-700 dark:text-neutral-200 hover:border-neutral-300 dark:hover:border-white/15'
                      }`}
                    >
                      <Heart size={13} className={filters.showOnlyFavorites ? 'fill-white' : ''} />
                      <span>Favoris uniquement</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onFiltersChange({ showOnlyNew: !filters.showOnlyNew })}
                      className={`px-3 py-1.5 rounded-2xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                        filters.showOnlyNew
                          ? 'bg-primary border-primary text-primary-contrast shadow-sm'
                          : 'bg-neutral-100 dark:bg-[#2c2c2e] border-transparent text-neutral-700 dark:text-neutral-200 hover:border-neutral-300 dark:hover:border-white/15'
                      }`}
                    >
                      <Sparkles size={13} />
                      <span>Nouveautés de la semaine</span>
                    </button>
                  </div>
                </div>

                {/* 2. Créneaux Horaires */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2.5">
                    Créneau Horaire
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => toggleTimeSlot(slot.id)}
                        className={`px-3 py-1.5 rounded-2xl text-xs font-medium border transition-all ${
                          filters.timeSlots.includes(slot.id)
                            ? 'bg-primary border-primary text-primary-contrast shadow-sm'
                            : 'bg-neutral-100 dark:bg-[#2c2c2e] border-transparent text-neutral-700 dark:text-neutral-200 hover:border-neutral-300 dark:hover:border-white/15'
                        }`}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Formats & Expériences */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2.5">
                    Formats &amp; Expériences
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {FORMAT_OPTIONS.map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => toggleFormat(fmt)}
                        className={`px-3 py-1.5 rounded-2xl text-xs font-medium border transition-all ${
                          filters.formats.includes(fmt)
                            ? 'bg-primary border-primary text-primary-contrast shadow-sm'
                            : 'bg-neutral-100 dark:bg-[#2c2c2e] border-transparent text-neutral-700 dark:text-neutral-200 hover:border-neutral-300 dark:hover:border-white/15'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Cinémas Lyonnais */}
                {options.cinemas && options.cinemas.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2.5">
                      Cinémas Lyonnais
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {options.cinemas.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleCinema(c)}
                          className={`px-3 py-1.5 rounded-2xl text-xs font-medium border transition-all ${
                            filters.cinemas.includes(c)
                              ? 'bg-primary border-primary text-primary-contrast shadow-sm'
                              : 'bg-neutral-100 dark:bg-[#2c2c2e] border-transparent text-neutral-700 dark:text-neutral-200 hover:border-neutral-300 dark:hover:border-white/15'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Genres */}
                {options.genres && options.genres.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2.5">
                      Genres
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {options.genres.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => toggleGenre(g)}
                          className={`px-3 py-1.5 rounded-2xl text-xs font-medium border transition-all ${
                            filters.genres.includes(g)
                              ? 'bg-primary border-primary text-primary-contrast shadow-sm'
                              : 'bg-neutral-100 dark:bg-[#2c2c2e] border-transparent text-neutral-700 dark:text-neutral-200 hover:border-neutral-300 dark:hover:border-white/15'
                          }`}
                        >
                          {formatLocalizedGenres(g, locale)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Réalisateurs */}
                {options.directors && options.directors.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2.5">
                      Réalisateurs
                    </label>
                    {options.directors.length > 8 && (
                      <div className="mb-2.5">
                        <input
                          type="text"
                          value={directorSearch}
                          onChange={(e) => setDirectorSearch(e.target.value)}
                          placeholder="Rechercher un réalisateur..."
                          className="w-full px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#2c2c2e] border border-black/5 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-primary"
                        />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {filteredDirectors.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDirector(d)}
                          className={`px-3 py-1.5 rounded-2xl text-xs font-medium border transition-all ${
                            filters.directors.includes(d)
                              ? 'bg-primary border-primary text-primary-contrast shadow-sm'
                              : 'bg-neutral-100 dark:bg-[#2c2c2e] border-transparent text-neutral-700 dark:text-neutral-200 hover:border-neutral-300 dark:hover:border-white/15'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 7. Acteurs & Casting */}
                {options.actors && options.actors.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2.5">
                      Acteurs &amp; Casting
                    </label>
                    {options.actors.length > 8 && (
                      <div className="mb-2.5">
                        <input
                          type="text"
                          value={actorSearch}
                          onChange={(e) => setActorSearch(e.target.value)}
                          placeholder="Rechercher un acteur..."
                          className="w-full px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#2c2c2e] border border-black/5 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-primary"
                        />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {filteredActors.map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => toggleActor(a)}
                          className={`px-3 py-1.5 rounded-2xl text-xs font-medium border transition-all ${
                            filters.actors?.includes(a)
                              ? 'bg-primary border-primary text-primary-contrast shadow-sm'
                              : 'bg-neutral-100 dark:bg-[#2c2c2e] border-transparent text-neutral-700 dark:text-neutral-200 hover:border-neutral-300 dark:hover:border-white/15'
                          }`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-black/[0.06] dark:border-white/10 flex items-center justify-between shrink-0 bg-white dark:bg-[#1c1c1e] pb-6 sm:pb-6">
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  {filteredCount} film{filteredCount > 1 ? 's' : ''} disponible{filteredCount > 1 ? 's' : ''}
                </span>
                <button
                  type="button"
                  onClick={() => setShowFiltersModal(false)}
                  className="px-6 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-contrast font-medium text-xs shadow-md shadow-primary/25 transition-all active:scale-95"
                >
                  Afficher les séances
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
