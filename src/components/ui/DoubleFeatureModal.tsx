// src/components/ui/DoubleFeatureModal.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shuffle, Clock, MapPin, Sparkles, Film as FilmIcon, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Film, DateLabel } from '@/types';
import { findDoubleFeaturePairs, DoubleFeaturePair, DoubleFeatureTimeSlot } from '@/utils/doubleFeature';

interface DoubleFeatureModalProps {
  films: Film[];
  dates: DateLabel[];
}

export function DoubleFeatureModal({ films, dates }: DoubleFeatureModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const [timeSlot, setTimeSlot] = useState<DoubleFeatureTimeSlot>('afternoon');
  const [sameCinemaOnly, setSameCinemaOnly] = useState<boolean>(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('cinelyon:open-double-feature', handleOpen);
    return () => window.removeEventListener('cinelyon:open-double-feature', handleOpen);
  }, []);

  const selectedDate = dates && dates.length > 0 ? dates[selectedDayIdx] || dates[0] : null;

  const pairs: DoubleFeaturePair[] = useMemo(() => {
    if (!films || films.length === 0 || !selectedDate) return [];
    return findDoubleFeaturePairs(films, selectedDate, {
      timeSlot,
      allowCrossCinema: !sameCinemaOnly,
      minBreakMinutes: 10,
      maxBreakMinutes: 45,
    });
  }, [films, selectedDate, timeSlot, sameCinemaOnly]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-2xl max-h-[90vh] liquid-glass rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/15 z-10 flex flex-col my-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Shuffle size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Double Séance Lyon</h3>
                  <p className="text-xs text-neutral-400">Enchaîne 2 films avec le temps de pause idéal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Controls */}
            <div className="space-y-3 mb-4">
              {/* Day Selector */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {dates.slice(0, 7).map((d, idx) => (
                  <button
                    key={d.isoDate}
                    onClick={() => setSelectedDayIdx(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                      selectedDayIdx === idx
                        ? 'bg-[#444cf7] border-[#444cf7] text-white shadow-sm'
                        : 'bg-black/30 border-white/10 text-neutral-300 hover:bg-white/5'
                    }`}
                  >
                    {d.jour} {d.chiffre} {d.mois}
                  </button>
                ))}
              </div>

              {/* Time slot filter */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex gap-1.5 bg-black/30 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => setTimeSlot('afternoon')}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      timeSlot === 'afternoon' ? 'bg-[#444cf7] text-white font-medium' : 'text-neutral-400'
                    }`}
                  >
                    Après-midi (13h-19h)
                  </button>
                  <button
                    onClick={() => setTimeSlot('evening')}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      timeSlot === 'evening' ? 'bg-[#444cf7] text-white font-medium' : 'text-neutral-400'
                    }`}
                  >
                    Soirée (17h-23h)
                  </button>
                </div>

                <label className="flex items-center gap-1.5 text-neutral-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sameCinemaOnly}
                    onChange={(e) => setSameCinemaOnly(e.target.checked)}
                    className="rounded text-[#444cf7] focus:ring-0"
                  />
                  <span>Même cinéma</span>
                </label>
              </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {pairs.length === 0 ? (
                <div className="text-center py-12 text-neutral-400 text-xs">
                  <p>Aucun enchaînement trouvé pour ces critères ce jour-là.</p>
                  <p className="text-neutral-500 mt-1">Essaie de changer de créneau ou d&apos;activer d&apos;autres cinémas.</p>
                </div>
              ) : (
                pairs.slice(0, 10).map((pair, i) => {
                  const slot = pair.sampleSlot;
                  if (!slot) return null;

                  return (
                    <div
                      key={pair.id || i}
                      className="p-4 rounded-2xl bg-black/30 border border-white/10 hover:border-white/20 transition-all flex flex-col gap-3"
                    >
                      {/* Film 1 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={slot.first.film.affiche || '/images/nocontent.png'}
                            alt={slot.first.film.title}
                            className="w-10 h-14 object-cover rounded-lg border border-white/10 shrink-0"
                          />
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Film 1</span>
                            <h4 className="font-bold text-sm text-white line-clamp-1">{slot.first.film.title}</h4>
                            <p className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
                              <span className="text-white font-semibold">{slot.first.seance.time}</span>
                              <span>•</span>
                              <span>{slot.first.cinema}</span>
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/film/${slot.first.film.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="text-xs text-[#444cf7] hover:underline"
                        >
                          Fiche
                        </Link>
                      </div>

                      {/* Transition badge */}
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 w-fit self-center">
                        <Clock size={12} className="text-amber-400" />
                        <span>{slot.breakTimeMinutes || slot.gapMinutes} min de pause entre les 2 films</span>
                        {!slot.isSameCinema && (
                          <span className="text-neutral-500">• Changement de cinéma ({slot.travelTimeMinutes} min trajet)</span>
                        )}
                      </div>

                      {/* Film 2 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={slot.second.film.affiche || '/images/nocontent.png'}
                            alt={slot.second.film.title}
                            className="w-10 h-14 object-cover rounded-lg border border-white/10 shrink-0"
                          />
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Film 2</span>
                            <h4 className="font-bold text-sm text-white line-clamp-1">{slot.second.film.title}</h4>
                            <p className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
                              <span className="text-white font-semibold">{slot.second.seance.time}</span>
                              <span>•</span>
                              <span>{slot.second.cinema}</span>
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/film/${slot.second.film.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="text-xs text-[#444cf7] hover:underline"
                        >
                          Fiche
                        </Link>
                      </div>
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
