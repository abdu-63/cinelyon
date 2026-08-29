// src/components/ui/CineRouletteModal.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Dices, Sparkles, MapPin, Clock, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import { Film, DateLabel } from '@/types';
import { formatDayLabel } from '@/utils/dateUtils';

interface CineRouletteModalProps {
  films: Film[];
  dates: DateLabel[];
}

export function CineRouletteModal({ films, dates }: CineRouletteModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [selectedCinema, setSelectedCinema] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('cinelyon:open-roulette', handleOpen);
    return () => window.removeEventListener('cinelyon:open-roulette', handleOpen);
  }, []);

  const spin = () => {
    if (!films || films.length === 0 || isSpinning) return;

    setIsSpinning(true);
    setSelectedFilm(null);

    let counter = 0;
    const totalTicks = 24;
    const interval = setInterval(() => {
      const randomF = films[Math.floor(Math.random() * films.length)];
      setSelectedFilm(randomF);
      counter++;

      if (counter >= totalTicks) {
        clearInterval(interval);
        // Sélection finale
        const finalFilm = films[Math.floor(Math.random() * films.length)];
        setSelectedFilm(finalFilm);

        // Trouver une séance
        const days = Object.keys(finalFilm.seancesByDay);
        if (days.length > 0) {
          const firstDay = days[0];
          const cinemas = Object.keys(finalFilm.seancesByDay[firstDay] || {});
          if (cinemas.length > 0) {
            const randomCin = cinemas[Math.floor(Math.random() * cinemas.length)];
            const seances = finalFilm.seancesByDay[firstDay][randomCin] || [];
            if (seances.length > 0) {
              setSelectedCinema(randomCin);
              setSelectedTime(seances[0].time);
            }
          }
        }

        setIsSpinning(false);
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // Ignorer
        }
      }
    }, 80);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSpinning && setIsOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            className="relative w-full max-w-md liquid-glass rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/15 z-10 text-center"
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <Dices size={20} />
                </div>
                <h3 className="font-bold text-lg text-white">CinéRoulette Lyon</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isSpinning}
                className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-neutral-300 mb-6 leading-relaxed">
              Indécis sur le film à voir ce soir ? Laisse la roulette cinéphile choisir au hasard parmi les séances de
              Lyon !
            </p>

            {/* Display Area */}
            <div className="min-h-[220px] flex flex-col items-center justify-center p-4 bg-black/40 rounded-2xl border border-white/10 mb-6">
              {selectedFilm ? (
                <motion.div
                  key={selectedFilm.filmId}
                  initial={{ scale: 0.95, opacity: 0.8 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center"
                >
                  <img
                    src={selectedFilm.affiche || '/images/nocontent.png'}
                    alt={selectedFilm.title}
                    className="w-24 h-36 object-cover rounded-xl shadow-lg mb-3 border border-white/20"
                  />
                  <h4 className="font-bold text-base text-white line-clamp-1">{selectedFilm.title}</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">{selectedFilm.genres || 'Cinéma'}</p>

                  {selectedCinema && (
                    <div className="flex items-center gap-3 mt-3 text-xs text-neutral-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-[#444cf7]" /> {selectedCinema}
                      </span>
                      {selectedTime && (
                        <span className="flex items-center gap-1 font-semibold text-amber-400">
                          <Clock size={12} /> {selectedTime}
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="text-neutral-500 text-sm flex flex-col items-center gap-2">
                  <Sparkles size={28} className="text-amber-400/50" />
                  <span>Prêt pour le tirage au sort ?</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={spin}
                disabled={isSpinning}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Dices size={18} className={isSpinning ? 'animate-spin' : ''} />
                <span>{isSpinning ? 'Tirage en cours...' : 'Lancer la Roulette !'}</span>
              </button>

              {selectedFilm && !isSpinning && (
                <Link
                  href={`/film/${selectedFilm.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-white/10"
                >
                  <span>Voir toutes les séances de ce film</span>
                  <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
