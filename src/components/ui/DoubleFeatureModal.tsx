// src/components/ui/DoubleFeatureModal.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ChevronDown, MapPin, Building2, Timer, ArrowRight } from 'lucide-react';
import { Film, DateLabel } from '@/types';
import { findDoubleFeaturePairs, DoubleFeaturePair } from '@/utils/doubleFeature';

interface DoubleFeatureModalProps {
  films?: Film[];
  dates?: DateLabel[];
  isOpen?: boolean;
  onClose?: () => void;
}

export function DoubleFeatureModal({
  films = [],
  dates = [],
  isOpen: controlledIsOpen,
  onClose,
}: DoubleFeatureModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isModalOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const [timePeriod, setTimePeriod] = useState<'all' | 'afternoon' | 'evening'>('all');
  const [sameCinemaOnly, setSameCinemaOnly] = useState(true);
  const [priorityFilmQuery, setPriorityFilmQuery] = useState('');
  const [expandedPairId, setExpandedPairId] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  }, [onClose]);

  useEffect(() => {
    const handleOpen = () => setInternalIsOpen(true);
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
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="relative w-full max-w-2xl rounded-[28px] overflow-hidden bg-[#f5f6f8] dark:bg-[#121214] border border-black/10 dark:border-white/10 shadow-2xl z-10 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#1c1c1e]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#444cf7]/10 text-[#444cf7] flex items-center justify-center">
                  <Timer size={22} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-title font-extrabold text-neutral-900 dark:text-white leading-tight">
                    Double Programme
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Enchaîne deux séances compatibles sans temps mort
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center transition-colors active:scale-95 touch-manipulation"
              >
                <X size={16} />
              </button>
            </div>

            {/* Filtres & Contrôles */}
            <div className="p-4 bg-white dark:bg-[#1c1c1e] border-b border-black/[0.06] dark:border-white/10 space-y-3">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                {dates.map((d, idx) => (
                  <button
                    key={d.isoDate}
                    type="button"
                    onClick={() => setSelectedDayIdx(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-normal transition-all shrink-0 active:scale-95 touch-manipulation ${
                      selectedDayIdx === idx
                        ? 'bg-[#444cf7] text-white shadow-xs'
                        : 'bg-neutral-100 dark:bg-[#252528] text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {d.jour} {d.chiffre} {d.mois}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSameCinemaOnly(!sameCinemaOnly)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-normal border transition-all active:scale-95 touch-manipulation ${
                      sameCinemaOnly
                        ? 'bg-[#444cf7] border-[#444cf7] text-white'
                        : 'bg-neutral-100 dark:bg-[#252528] border-black/5 dark:border-white/10 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    Même cinéma uniquement
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {(['all', 'afternoon', 'evening'] as const).map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setTimePeriod(period)}
                      className={`px-2.5 py-1 rounded-lg text-xs transition-all active:scale-95 touch-manipulation ${
                        timePeriod === period
                          ? 'bg-neutral-800 dark:bg-white text-white dark:text-neutral-900 font-bold'
                          : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                      }`}
                    >
                      {period === 'all' ? 'Toute la journée' : period === 'afternoon' ? 'Après-midi' : 'Soirée'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Liste des Combos */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
