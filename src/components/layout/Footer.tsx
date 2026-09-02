// src/components/layout/Footer.tsx
// Pied de page officiel CinéLyon — Liquid Glass & Design Apple
'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, MessageSquare, Scale, Shield, FileText } from 'lucide-react';
import {
  LetterboxdLogo,
  SerializdLogo,
  TwitterLogo,
  InstagramLogo,
} from '@/components/ui/BrandIcons';

export default function Footer() {
  return (
    <footer className="w-full border-t border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-[#121214]/80 backdrop-blur-2xl pt-8 pb-16 sm:pt-9 sm:pb-10 mt-8 sm:mt-12 text-neutral-500 transition-colors">
      <div className="max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 text-center space-y-5">
        {/* Boutons Réseaux Sociaux (Ronds & Apple Glass) */}
        <div className="flex items-center justify-center gap-3">
          {/* Letterboxd */}
          <a
            href="https://boxd.it/6GBU5"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:border-primary/40 dark:hover:border-primary/40 hover:text-primary hover:scale-105 active:scale-95 transition-all shadow-xs"
            title="Letterboxd @CineLyon"
            aria-label="Profil Letterboxd de CinéLyon"
          >
            <LetterboxdLogo width={18} height={18} />
          </a>

          {/* Serializd */}
          <a
            href="https://srlzd.com/u/skyfear"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:border-primary/40 dark:hover:border-primary/40 hover:text-primary hover:scale-105 active:scale-95 transition-all shadow-xs"
            title="Serializd"
            aria-label="Profil Serializd"
          >
            <SerializdLogo size={18} />
          </a>

          {/* Twitter / X */}
          <a
            href="https://x.com/abduplt?s=21"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 flex items-center justify-center text-neutral-800 dark:text-neutral-200 hover:border-primary/40 dark:hover:border-primary/40 hover:text-primary hover:scale-105 active:scale-95 transition-all shadow-xs"
            title="Twitter / X @abduplt"
            aria-label="Compte Twitter de CinéLyon"
          >
            <TwitterLogo size={15} />
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/cinelyon.fr/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:border-primary/40 dark:hover:border-primary/40 hover:text-primary hover:scale-105 active:scale-95 transition-all shadow-xs"
            title="Instagram @cinelyon.fr"
            aria-label="Page Instagram officielle de CinéLyon"
          >
            <InstagramLogo size={17} />
          </a>
        </div>

        {/* Navigation & Liens Légaux */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 text-xs font-medium pt-1">
          <Link
            href="/suggestions"
            className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 hover:text-primary transition-colors"
          >
            <MessageSquare size={12} className="text-neutral-400 dark:text-neutral-500" />
            <span>Suggestions & Retours</span>
          </Link>
          <span className="text-neutral-300 dark:text-neutral-700">•</span>
          <Link
            href="/mentions-legales"
            className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 hover:text-primary transition-colors"
          >
            <Scale size={12} className="text-neutral-400 dark:text-neutral-500" />
            <span>Mentions légales</span>
          </Link>
          <span className="text-neutral-300 dark:text-neutral-700">•</span>
          <Link
            href="/politique-de-confidentialite"
            className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 hover:text-primary transition-colors"
          >
            <Shield size={12} className="text-neutral-400 dark:text-neutral-500" />
            <span>Politique de confidentialité</span>
          </Link>
          <span className="text-neutral-300 dark:text-neutral-700">•</span>
          <Link
            href="/cgu"
            className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 hover:text-primary transition-colors"
          >
            <FileText size={12} className="text-neutral-400 dark:text-neutral-500" />
            <span>CGU</span>
          </Link>
        </div>

        {/* Copyright & Mentions */}
        <div className="pt-5 border-t border-black/[0.06] dark:border-white/10 flex items-center justify-center text-[11px] text-neutral-400 dark:text-neutral-500 gap-1.5 font-normal">
          <span>© {new Date().getFullYear()} CinéLyon. Fait avec</span>
          <Heart size={12} className="text-rose-500 fill-rose-500 inline mx-0.5" />
          <span>pour les cinéphiles lyonnais.</span>
        </div>
      </div>
    </footer>
  );
}
