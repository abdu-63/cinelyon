// src/components/ui/DoubleFeatureModal.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ChevronDown, MapPin, Building2, Timer, ArrowRight } from 'lucide-react';
import { Film, DateLabel } from '@/types';
import { findDoubleFeaturePairs, DoubleFeaturePair } from '@/utils/doubleFeature';

interface DoubleFeatureModalProps {
  films?: Film[];
  dates?: DateLabel[];
}

export function DoubleFeatureModal({ films = [], dates = [] }: DoubleFeatureModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const [timePeriod, setTimePeriod] = useState<'all' | 'afternoon' | 'evening'>('all');
  const [sameCinemaOnly, setSameCinemaOnly] = useState(true);
  const [priorityFilmQuery, setPriorityFilmQuery] = useState('');
  const [expandedPairId, setExpandedPairId] = useState<string | null>(null);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('cinelyon:open-double-feature', handleOpen);
    return () => window.removeEventListener('cinelyon:open-double-feature', handleOpen);
  }, []);

  const currentDateObj = dates[selectedDayIdx] || dates[0];

  const pairs: DoubleFeaturePair[] = useMemo(() => {
    if (!films || films.length === 0 || !currentDateObj) return [];
    return findDoubleFeaturePairs(films, currentDateObj, {
      allowCrossCinema: !sameCinemaOnly,
      timeSlot: timePeriod,
    });
  }, [films, currentDateObj, sameCinemaOnly, timePeriod]);

  const filteredPairs = useMemo(() => {
    if (!priorityFilmQuery.trim()) return pairs;
    const q = priorityFilmQuery.toLowerCase();
    return pairs.filter(
      (p) =>
        p.filmA.title.toLowerCase().includes(q) ||
        p.filmB.title.toLowerCase().includes(q)
    );
  }, [pairs, priorityFilmQuery]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
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
            {/* Drag Handle */}
            <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-auto mt-3 mb-1 shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.06] dark:border-white/10 shrink-0">
              <div>
                <h3 className="font-bold text-base text-neutral-900 dark:text-white leading-tight">
                  Double Programme
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  2 séances consécutives · 10 à 30 min de pause
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-white flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-white/20 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-4 px-5 py-4 overscroll-contain">
              {/* Sélecteur de Jours Pilules */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {dates.slice(0, 7).map((d, i) => (
                  <button
                    key={d.isoDate}
                    type="button"
                    onClick={() => setSelectedDayIdx(i)}
                    className={`h-11 min-w-[64px] px-3 rounded-[20px] flex flex-col items-center justify-center text-xs font-bold shrink-0 border transition-all active:scale-95 ${
                      selectedDayIdx === i
                        ? 'bg-[#444cf7] border-[#444cf7] text-white shadow-sm'
                        : 'bg-neutral-100 dark:bg-[#242428] border-transparent text-neutral-700 dark:text-neutral-200 hover:border-neutral-300 dark:hover:border-white/20'
                    }`}
                  >
                    <span className="leading-tight">{i === 0 ? 'Auj.' : d.jour}</span>
                    <span className="text-[10px] font-normal leading-tight opacity-80">
                      {d.chiffre} {d.mois}
                    </span>
                  </button>
                ))}
              </div>

              {/* Filtres : Film prioritaire & Créneau */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 text-neutral-400 pointer-events-none" size={15} />
                  <input
                    type="text"
                    placeholder="Film prioritaire"
                    value={priorityFilmQuery}
                    onChange={(e) => setPriorityFilmQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-100 dark:bg-[#242428] border border-black/[0.06] dark:border-white/10 focus:border-[#444cf7] text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none"
                  />
                </div>

                {/* Segmented Control Midi / Soir / Tout */}
                <div className="flex items-center bg-neutral-100 dark:bg-[#242428] p-0.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                  <button
                    type="button"
                    onClick={() => setTimePeriod('afternoon')}
                    className={`px-2.5 py-1.5 rounded-lg transition-all ${
                      timePeriod === 'afternoon' ? 'bg-white dark:bg-[#1c1c1e] text-[#444cf7] shadow-sm font-bold' : ''
                    }`}
                  >
                    Midi
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimePeriod('evening')}
                    className={`px-2.5 py-1.5 rounded-lg transition-all ${
                      timePeriod === 'evening' ? 'bg-white dark:bg-[#1c1c1e] text-[#444cf7] shadow-sm font-bold' : ''
                    }`}
                  >
                    Soir
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimePeriod('all')}
                    className={`px-2.5 py-1.5 rounded-lg transition-all ${
                      timePeriod === 'all' ? 'bg-white dark:bg-[#1c1c1e] text-[#444cf7] shadow-sm font-bold' : ''
                    }`}
                  >
                    Tout
                  </button>
                </div>
              </div>

              {/* Toggle Même Cinéma */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSameCinemaOnly(!sameCinemaOnly)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    sameCinemaOnly
                      ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-[#444cf7]'
                      : 'bg-neutral-100 dark:bg-[#242428] border-transparent text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <MapPin size={12} />
                  <span>Même cinéma</span>
                </button>

                <span className="text-xs text-neutral-400 flex items-center gap-1">
                  <Building2 size={12} />
                  <span>Tous les cinémas</span>
                </span>
              </div>

              {/* Liste des Duos */}
              <div className="space-y-2.5 pb-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  {filteredPairs.length} duos disponibles
                </div>

                {filteredPairs.length === 0 ? (
                  <div className="py-12 text-center text-xs text-neutral-400">
                    Aucun duo compatible trouvé pour ce jour avec ces filtres.
                  </div>
                ) : (
                  filteredPairs.map((pair) => {
                    const isExpanded = expandedPairId === pair.id;
                    const firstSlot = pair.slots[0];
                    if (!firstSlot) return null;

                    return (
                      <div
                        key={pair.id}
                        className="p-3.5 rounded-[22px] bg-white dark:bg-[#242428] border border-black/[0.06] dark:border-white/10 shadow-sm space-y-2 transition-all hover:border-neutral-300 dark:hover:border-white/20"
                      >
                        <div
                          onClick={() => setExpandedPairId(isExpanded ? null : pair.id)}
                          className="flex items-center justify-between cursor-pointer select-none"
                        >
                          {/* Affiches superposées */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative w-14 h-16 shrink-0">
                              <img
                                src={pair.filmA.affiche || '/images/nocontent.png'}
                                alt={pair.filmA.title}
                                className="absolute top-0 left-0 w-10 h-14 rounded-lg object-cover shadow-sm border border-white dark:border-[#1c1c1e]"
                              />
                              <img
                                src={pair.filmB.affiche || '/images/nocontent.png'}
                                alt={pair.filmB.title}
                                className="absolute bottom-0 right-0 w-10 h-14 rounded-lg object-cover shadow-md border border-white dark:border-[#1c1c1e] z-10"
                              />
                            </div>

                            <div className="min-w-0 space-y-0.5">
                              <p className="text-xs font-normal text-neutral-900 dark:text-white truncate">
                                1. {pair.filmA.title}
                              </p>
                              <p className="text-xs font-normal text-neutral-900 dark:text-white truncate">
                                2. {pair.filmB.title}
                              </p>
                              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                Dès {firstSlot.first.startTimeFormatted} · {pair.slots.length} options
                              </p>
                            </div>
                          </div>

                          <ChevronDown
                            size={16}
                            className={`text-neutral-400 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </div>

                        {/* Détail des créneaux */}
                        {isExpanded && (
                          <div className="pt-2 border-t border-black/[0.06] dark:border-white/10 space-y-2 text-xs">
                            {pair.slots.slice(0, 3).map((slot) => (
                              <div
                                key={slot.id}
                                className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#161618] border border-black/[0.04] dark:border-white/5 space-y-1.5"
                              >
                                <div className="flex items-center justify-between text-xs font-normal">
                                  <span className="text-neutral-800 dark:text-neutral-200">
                                    {slot.first.startTimeFormatted} <ArrowRight size={11} className="inline mx-0.5 text-neutral-400" /> {slot.first.endTimeFormatted} : {slot.first.film.title}
                                  </span>
                                  <span className="text-neutral-500 dark:text-neutral-400">{slot.cinema1}</span>
                                </div>

                                <div className="text-center text-[10px] font-normal text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                                  <Timer size={12} className="text-emerald-500" />
                                  <span>{slot.breakTimeMinutes} min de pause</span>
                                </div>

                                <div className="flex items-center justify-between text-xs font-normal">
                                  <span className="text-neutral-800 dark:text-neutral-200">
                                    {slot.second.startTimeFormatted} <ArrowRight size={11} className="inline mx-0.5 text-neutral-400" /> {slot.second.endTimeFormatted} : {slot.second.film.title}
                                  </span>
                                  <span className="text-neutral-500 dark:text-neutral-400">{slot.cinema2}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
