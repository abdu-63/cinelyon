// src/components/ui/CineRouletteModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Dices, ArrowRight, Star, Moon, Languages } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Film, Seance } from '@/types';

interface CineRouletteModalProps {
  films?: Film[];
}

export function CineRouletteModal({ films = [] }: CineRouletteModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [onlyEvening, setOnlyEvening] = useState(true);
  const [onlyVO, setOnlyVO] = useState(false);
  const [onlyTopRated, setOnlyTopRated] = useState(false);
  const [selectedResult, setSelectedResult] = useState<{
    film: Film;
    cinema: string;
    seance: Seance;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      roll();
    };
    window.addEventListener('cinelyon:open-roulette', handleOpen);
    return () => window.removeEventListener('cinelyon:open-roulette', handleOpen);
  }, [films, onlyEvening, onlyVO, onlyTopRated]);

  const roll = () => {
    if (!films || films.length === 0) return;

    let pool: { film: Film; cinema: string; seance: Seance }[] = [];

    films.forEach((f) => {
      if (onlyTopRated) {
        const rating = parseFloat(f.rating?.replace(',', '.') || '0');
        if (isNaN(rating) || rating < 3.5) return;
      }

      Object.values(f.seancesByDay || {}).forEach((cinemas) => {
        Object.entries(cinemas).forEach(([cinemaName, seances]) => {
          seances.forEach((s) => {
            if (onlyVO && s.lang !== 'VO') return;
            if (onlyEvening) {
              const hour = parseInt(s.time.split(':')[0] || '0', 10);
              if (hour < 19) return;
            }
            pool.push({ film: f, cinema: cinemaName, seance: s });
          });
        });
      });
    });

    if (pool.length === 0) {
      // Fallback
      const f = films[Math.floor(Math.random() * films.length)];
      if (f) {
        const days = Object.values(f.seancesByDay || {});
        if (days.length > 0) {
          const firstDay = days[0];
          const cinemaEntries = Object.entries(firstDay);
          if (cinemaEntries.length > 0) {
            const [cName, sList] = cinemaEntries[0];
            if (sList.length > 0) {
              setSelectedResult({ film: f, cinema: cName, seance: sList[0] });
              return;
            }
          }
        }
      }
      return;
    }

    const picked = pool[Math.floor(Math.random() * pool.length)];
    setSelectedResult(picked);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-[#1e1e1e] rounded-[28px] p-5 shadow-2xl border border-black/10 dark:border-white/10 z-10 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🍿</span>
                <div>
                  <h3 className="font-bold text-lg text-neutral-900 dark:text-white leading-tight">
                    Ciné-Roulette
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Une séance au hasard ce soir à Lyon
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-white flex items-center justify-center hover:bg-neutral-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Filtres Pilules (comme sur le screenshot) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              <button
                type="button"
                onClick={() => {
                  setOnlyEvening(!onlyEvening);
                  setTimeout(roll, 50);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 border ${
                  onlyEvening
                    ? 'bg-[#444cf7] border-[#444cf7] text-white shadow-sm'
                    : 'bg-white dark:bg-[#1e1e1e] border-black/[0.08] dark:border-white/10 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <Moon size={12} />
                <span>Ce soir (&gt; 19h)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOnlyVO(!onlyVO);
                  setTimeout(roll, 50);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 border ${
                  onlyVO
                    ? 'bg-[#444cf7] border-[#444cf7] text-white shadow-sm'
                    : 'bg-white dark:bg-[#1e1e1e] border-black/[0.08] dark:border-white/10 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <Languages size={12} />
                <span>VOST uniquement</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOnlyTopRated(!onlyTopRated);
                  setTimeout(roll, 50);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 border ${
                  onlyTopRated
                    ? 'bg-[#444cf7] border-[#444cf7] text-white shadow-sm'
                    : 'bg-white dark:bg-[#1e1e1e] border-black/[0.08] dark:border-white/10 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <Star size={12} />
                <span>Film bien noté</span>
              </button>
            </div>

            {/* Carte Résultat */}
            {selectedResult ? (
              <div className="p-4 rounded-[24px] bg-neutral-50 dark:bg-black/30 border border-black/[0.06] dark:border-white/10 space-y-3">
                <div className="flex items-start gap-3">
                  <img
                    src={selectedResult.film.affiche || '/images/nocontent.png'}
                    alt={selectedResult.film.title}
                    className="w-20 h-28 object-cover rounded-[16px] shadow-sm border border-black/5 shrink-0"
                  />
                  <div className="space-y-1 min-w-0">
                    <h4 className="font-extrabold text-base text-neutral-900 dark:text-white line-clamp-2 leading-tight">
                      {selectedResult.film.title}
                    </h4>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {selectedResult.film.duree && (
                        <span className="px-2 py-0.5 rounded-full bg-neutral-200/80 dark:bg-white/10 text-[10px] font-bold text-neutral-700 dark:text-neutral-300">
                          {selectedResult.film.duree}
                        </span>
                      )}
                      {selectedResult.film.rating && selectedResult.film.rating !== 'Note inconnue' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center gap-1">
                          <Star size={10} className="fill-amber-500 text-amber-500" />
                          <span>{selectedResult.film.rating}</span>
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#1e1e1e] border border-black/[0.06] dark:border-white/10 shadow-sm mt-2">
                      <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                        {selectedResult.cinema}
                      </p>
                      <p className="text-base font-extrabold text-[#444cf7]">
                        {selectedResult.seance.time}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    router.push(`/film/${selectedResult.film.slug}`);
                  }}
                  className="w-full py-3 rounded-2xl bg-[#444cf7] hover:bg-[#3339c4] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-[#444cf7]/20 transition-all active:scale-98"
                >
                  <span>🎟️ Voir la fiche &amp; les séances</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-neutral-400">
                Aucune séance trouvée avec ces critères.
              </div>
            )}

            {/* Bouton Principal de Relance */}
            <button
              type="button"
              onClick={roll}
              className="w-full py-3.5 rounded-2xl bg-[#444cf7] hover:bg-[#3339c4] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#444cf7]/30 transition-all active:scale-98"
            >
              <Dices size={18} />
              <span>Relancer la roulette</span>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
