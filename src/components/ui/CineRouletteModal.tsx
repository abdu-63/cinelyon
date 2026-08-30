// src/components/ui/CineRouletteModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Dices, ArrowRight, Star, Moon, Languages, Ticket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Film, Seance } from '@/types';
import { PopcornIcon } from '@/components/ui/PopcornIcon';

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
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shadow-xs">
                  <PopcornIcon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-white leading-tight">
                    Ciné-Roulette
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Une séance au hasard ce soir à Lyon
                  </p>
                </div>
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
              {/* Filtres Pilules */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setOnlyEvening(!onlyEvening);
                    setTimeout(roll, 50);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 border active:scale-95 ${
                    onlyEvening
                      ? 'bg-[#444cf7] border-[#444cf7] text-white shadow-sm'
                      : 'bg-white dark:bg-[#242428] border-black/[0.08] dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:border-neutral-300 dark:hover:border-white/25'
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
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 border active:scale-95 ${
                    onlyVO
                      ? 'bg-[#444cf7] border-[#444cf7] text-white shadow-sm'
                      : 'bg-white dark:bg-[#242428] border-black/[0.08] dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:border-neutral-300 dark:hover:border-white/25'
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
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 border active:scale-95 ${
                    onlyTopRated
                      ? 'bg-[#444cf7] border-[#444cf7] text-white shadow-sm'
                      : 'bg-white dark:bg-[#242428] border-black/[0.08] dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:border-neutral-300 dark:hover:border-white/25'
                  }`}
                >
                  <Star size={12} />
                  <span>Film bien noté</span>
                </button>
              </div>

              {/* Carte Résultat */}
              {selectedResult ? (
                <div className="p-4 rounded-[24px] bg-neutral-50 dark:bg-[#161618] border border-black/[0.06] dark:border-white/10 space-y-3 shadow-sm">
                  <div className="flex items-start gap-3.5">
                    <img
                      src={selectedResult.film.affiche || '/images/nocontent.png'}
                      alt={selectedResult.film.title}
                      className="w-20 h-28 object-cover rounded-[16px] shadow-sm border border-black/5 dark:border-white/10 shrink-0"
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className="font-normal text-base text-neutral-900 dark:text-white line-clamp-2 leading-tight">
                        {selectedResult.film.title}
                      </h4>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        {selectedResult.film.duree && (
                          <span className="px-2 py-0.5 rounded-full bg-neutral-200/80 dark:bg-[#242428] text-[10px] font-normal text-neutral-700 dark:text-neutral-300">
                            {selectedResult.film.duree}
                          </span>
                        )}
                        {selectedResult.film.rating && selectedResult.film.rating !== 'Note inconnue' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-[10px] font-normal flex items-center gap-1">
                            <Star size={10} className="fill-amber-500 text-amber-500" />
                            <span>{selectedResult.film.rating}</span>
                          </span>
                        )}
                      </div>

                      <div className="p-2.5 rounded-xl bg-white dark:bg-[#242428] border border-black/[0.06] dark:border-white/10 shadow-sm mt-2">
                        <p className="text-xs font-normal text-neutral-800 dark:text-neutral-200 truncate">
                          {selectedResult.cinema}
                        </p>
                        <p className="text-base font-normal text-[#444cf7]">
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
                    <Ticket size={14} />
                    <span>Voir la fiche &amp; les séances</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-neutral-400">
                  Aucune séance trouvée avec ces critères.
                </div>
              )}
            </div>

            {/* Footer avec Bouton Principal de Relance */}
            <div className="p-4 border-t border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#1c1c1e] pb-6 sm:pb-6">
              <button
                type="button"
                onClick={roll}
                className="w-full py-3.5 rounded-2xl bg-[#444cf7] hover:bg-[#3339c4] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#444cf7]/30 transition-all active:scale-98"
              >
                <Dices size={18} />
                <span>Relancer la roulette</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
