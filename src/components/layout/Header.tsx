// src/components/layout/Header.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Film, Settings } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openSettings = () => {
    window.dispatchEvent(new CustomEvent('cinelyon:open-settings'));
  };

  const openCineBot = () => {
    window.dispatchEvent(new CustomEvent('cinelyon:open-cinebot'));
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 ${
        isScrolled
          ? 'bg-white/85 dark:bg-[#121214]/85 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/10 shadow-sm py-2.5'
          : 'bg-transparent py-3'
      }`}
    >
      <div className="max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto px-3 sm:px-4 flex items-center justify-between">
        {/* Logo CinéLyon */}
        <Link href="/" className="flex items-center gap-2.5 group select-none">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
            <Film className="w-4 h-4 text-primary-contrast" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-lg tracking-tight text-neutral-900 dark:text-white">
              CinéLyon
            </span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-primary/15 text-primary">
              69
            </span>
          </div>
        </Link>

        {/* Contrôles & Actions */}
        <div className="flex items-center gap-2">
          {/* Bouton Réglages (Ouvre la modale complète avec Langue, Thème et Synchronisation) */}
          <button
            type="button"
            onClick={openSettings}
            className="p-2 rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-white/25 transition-colors shadow-sm active:scale-95 flex items-center justify-center touch-manipulation select-none"
            title="Réglages"
            aria-label="Ouvrir les réglages"
          >
            <Settings size={17} />
          </button>
        </div>
      </div>
    </header>
  );
}
