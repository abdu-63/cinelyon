// src/components/ui/CineRouletteModal.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Dices, ArrowRight, Star, Moon, Languages, Ticket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Film, Seance } from '@/types';
import { PopcornIcon } from '@/components/ui/PopcornIcon';

interface CineRouletteModalProps {
  films?: Film[];
  isOpen?: boolean;
  onClose?: () => void;
}

export function CineRouletteModal({ films = [], isOpen: controlledIsOpen, onClose }: CineRouletteModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isModalOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const [onlyEvening, setOnlyEvening] = useState(true);
  const [onlyVO, setOnlyVO] = useState(false);
  const [onlyTopRated, setOnlyTopRated] = useState(false);
  const [selectedResult, setSelectedResult] = useState<{
    film: Film;
    cinema: string;
    seance: Seance;
  } | null>(null);
  const router = useRouter();

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  }, [onClose]);

  const roll = useCallback(() => {
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

    if (pool.length > 0) {
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      setSelectedResult(chosen);
    } else {
      setSelectedResult(null);
    }
  }, [films, onlyTopRated, onlyVO, onlyEvening]);

  useEffect(() => {
    const handleOpen = () => {
      setInternalIsOpen(true);
      roll();
    };
    window.addEventListener('cinelyon:open-roulette', handleOpen);
    return () => window.removeEventListener('cinelyon:open-roulette', handleOpen);
  }, [roll]);

  // Si ouvert via props, lancer un roll automatiquement s'il n'y a pas de résultat
  useEffect(() => {
    if (controlledIsOpen && !selectedResult) {
      roll();
    }
  }, [controlledIsOpen, selectedResult, roll]);

  return (
    <AnimatePresence>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="relative w-full max-w-lg rounded-[28px] overflow-hidden bg-[#f5f6f8] dark:bg-[#121214] border border-black/10 dark:border-white/10 shadow-2xl z-10 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#1c1c1e]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#444cf7]/10 text-[#444cf7] flex items-center justify-center">
                  <Dices size={22} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-title font-extrabold text-neutral-900 dark:text-white leading-tight">
                    Ciné-Roulette
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Laisse le hasard choisir ta prochaine séance à Lyon !
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

            {/* Corps & Filtres de la Roulette */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* Options & Filtres rapides */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setOnlyEvening(!onlyEvening)}
                  className={`p-2.5 rounded-2xl border text-xs font-normal flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation ${
                    onlyEvening
                      ? 'bg-[#444cf7] border-[#444cf7] text-white shadow-sm'
                      : 'bg-white dark:bg-[#1c1c1e] border-black/[0.06] dark:border-white/10 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <Moon size={16} />
                  <span>En soirée (&gt;19h)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOnlyVO(!onlyVO)}
                  className={`p-2.5 rounded-2xl border text-xs font-normal flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation ${
                    onlyVO
                      ? 'bg-[#444cf7] border-[#444cf7] text-white shadow-sm'
                      : 'bg-white dark:bg-[#1c1c1e] border-black/[0.06] dark:border-white/10 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <Languages size={16} />
                  <span>Uniquement VO</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOnlyTopRated(!onlyTopRated)}
                  className={`p-2.5 rounded-2xl border text-xs font-normal flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation ${
                    onlyTopRated
                      ? 'bg-[#444cf7] border-[#444cf7] text-white shadow-sm'
                      : 'bg-white dark:bg-[#1c1c1e] border-black/[0.06] dark:border-white/10 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <Star size={16} />
                  <span>Bien notés (≥3.5)</span>
                </button>
              </div>

              {/* Résultat Tiré au sort */}
              {selectedResult ? (
                <div className="p-4 rounded-[22px] bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 shadow-sm space-y-3">
                  <div className="flex items-start gap-3.5">
                    <img
                      src={selectedResult.film.affiche || '/images/nocontent.png'}
                      alt={selectedResult.film.title}
                      className="w-[72px] h-[104px] object-cover rounded-xl shrink-0 bg-neutral-900 shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs text-[#444cf7] font-bold">
                        <PopcornIcon size={14} />
                        <span>Séance Recommandée</span>
                      </div>
                      <h4 className="font-title font-bold text-base text-neutral-900 dark:text-white truncate mt-0.5">
                        {selectedResult.film.title}
                      </h4>

                      <div className="flex flex-wrap gap-1.5 mt-1.5">
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
                      handleClose();
                      router.push(`/film/${selectedResult.film.slug}`);
                    }}
                    className="w-full py-3 rounded-2xl bg-[#444cf7] hover:bg-[#3339c4] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-[#444cf7]/20 transition-all active:scale-98 touch-manipulation"
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
                className="w-full py-3.5 rounded-2xl bg-[#444cf7] hover:bg-[#3339c4] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#444cf7]/30 transition-all active:scale-98 touch-manipulation"
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
