// src/components/ui/ScrollToTopButton.tsx
// Bouton flottant « Revenir en haut » (Parité intégrale avec l'application mobile CinéLyon)
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Seuil de défilement pour faire apparaître le bouton (300px)
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Passive listener pour des performances maximales à 60/120 fps
    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility(); // Vérification initiale

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          type="button"
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0.5, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 16 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="fixed bottom-6 right-5 sm:right-8 z-40 w-12 h-12 sm:w-[50px] sm:h-[50px] rounded-full bg-[#444cf7] text-white shadow-lg shadow-[#444cf7]/40 hover:shadow-xl hover:shadow-[#444cf7]/50 flex items-center justify-center border border-white/20 touch-manipulation select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Revenir en haut de la page"
          title="Revenir en haut"
        >
          <ArrowUp size={22} strokeWidth={2.6} className="text-white drop-shadow-xs" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
