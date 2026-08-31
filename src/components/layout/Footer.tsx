// src/components/layout/Footer.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Film, Heart, MessageSquare } from 'lucide-react';
import {
  LetterboxdLogo,
  SerializdLogo,
  TwitterLogo,
  InstagramLogo,
} from '@/components/ui/BrandIcons';

export default function Footer() {
  return (
    <footer className="w-full border-t border-black/[0.06] dark:border-white/10 bg-white/60 dark:bg-black/50 backdrop-blur-xl pt-10 pb-14 mt-16 text-neutral-500">
      <div className="max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 text-center space-y-6">
        {/* Brand & Tagline */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-contrast shadow-md shadow-primary/20">
              <Film size={17} />
            </div>
            <span className="font-bold text-lg text-neutral-900 dark:text-white tracking-tight">
              CinéLyon
            </span>
          </div>

          <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400 max-w-md mx-auto font-normal">
            Toutes les séances, horaires en temps réel, scènes post-génériques et pauses RunPee des 19 cinémas de la métropole lyonnaise.
          </p>
        </div>

        {/* Boutons Réseaux Sociaux (Style Apple Glass Pills) */}
        <div className="flex items-center justify-center gap-3">
          {/* Letterboxd */}
          <a
            href="https://boxd.it/6GBU5"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-white/30 hover:scale-105 active:scale-95 transition-all shadow-xs"
            title="Letterboxd"
            aria-label="Letterboxd"
          >
            <LetterboxdLogo width={18} height={18} />
          </a>

          {/* Serializd */}
          <a
            href="https://srlzd.com/u/skyfear"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-white/30 hover:scale-105 active:scale-95 transition-all shadow-xs"
            title="Serializd"
            aria-label="Serializd"
          >
            <SerializdLogo size={18} />
          </a>

          {/* Twitter / X */}
          <a
            href="https://x.com/abduplt?s=21"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 flex items-center justify-center text-neutral-800 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-white/30 hover:scale-105 active:scale-95 transition-all shadow-xs"
            title="Twitter / X"
            aria-label="Twitter / X"
          >
            <TwitterLogo size={15} />
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/cinelyon.fr/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-white/30 hover:scale-105 active:scale-95 transition-all shadow-xs"
            title="Instagram @cinelyon.fr"
            aria-label="Instagram"
          >
            <InstagramLogo size={17} />
          </a>
        </div>

        {/* Navigation & Liens Légaux */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-medium">
          <Link
            href="/"
            className="text-neutral-700 dark:text-neutral-300 hover:text-primary transition-colors"
          >
            Séances
          </Link>
          <span className="text-neutral-300 dark:text-neutral-700">•</span>
          <Link
            href="/suggestions"
            className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300 hover:text-primary transition-colors"
          >
            <MessageSquare size={13} className="text-primary" />
            <span>Suggestions & Retours</span>
          </Link>
          <span className="text-neutral-300 dark:text-neutral-700">•</span>
          <Link
            href="/politique-de-confidentialite"
            className="text-neutral-700 dark:text-neutral-300 hover:text-primary transition-colors"
          >
            Politique de confidentialité
          </Link>
          <span className="text-neutral-300 dark:text-neutral-700">•</span>
          <Link
            href="/cgu"
            className="text-neutral-700 dark:text-neutral-300 hover:text-primary transition-colors"
          >
            Conditions d&apos;utilisation
          </Link>
        </div>

        {/* Copyright & Mentions */}
        <div className="pt-5 border-t border-black/[0.06] dark:border-white/10 flex items-center justify-center text-[11px] text-neutral-400 gap-1.5 font-normal">
          <span>© {new Date().getFullYear()} CinéLyon. Fait avec</span>
          <Heart size={11} className="text-rose-500 fill-rose-500 inline mx-0.5" />
          <span>pour les cinéphiles lyonnais.</span>
        </div>
      </div>
    </footer>
  );
}
