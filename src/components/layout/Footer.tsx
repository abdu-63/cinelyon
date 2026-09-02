// src/components/layout/Footer.tsx
// Pied de page officiel CinéLyon — Liquid Glass & Design Apple
'use client';

import React from 'react';
import Link from 'next/link';
import { Film, Heart, MessageSquare, Scale, Shield, FileText } from 'lucide-react';
import {
  LetterboxdLogo,
  SerializdLogo,
  TwitterLogo,
  InstagramLogo,
} from '@/components/ui/BrandIcons';

export default function Footer() {
  return (
    <footer className="w-full border-t border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-[#121214]/80 backdrop-blur-2xl pt-12 pb-24 sm:pb-14 mt-16 text-neutral-500 transition-colors">
      <div className="max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 text-center space-y-7">
        {/* Brand & Tagline */}
        <div className="space-y-2.5">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2.5 group select-none cursor-pointer"
          >
            <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center text-primary-contrast shadow-md shadow-primary/25 group-hover:scale-105 transition-transform duration-200">
              <Film size={18} />
            </div>
            <span className="font-montserrat font-extrabold text-xl text-neutral-900 dark:text-white tracking-tight group-hover:text-primary transition-colors">
              CinéLyon
            </span>
          </Link>

          <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 max-w-lg mx-auto font-normal">
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
            className="w-11 h-11 rounded-[16px] bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:border-primary/40 dark:hover:border-primary/40 hover:text-primary hover:scale-105 active:scale-95 transition-all shadow-xs"
            title="Letterboxd @CineLyon"
            aria-label="Profil Letterboxd de CinéLyon"
          >
            <LetterboxdLogo width={19} height={19} />
          </a>

          {/* Serializd */}
          <a
            href="https://srlzd.com/u/skyfear"
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 rounded-[16px] bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:border-primary/40 dark:hover:border-primary/40 hover:text-primary hover:scale-105 active:scale-95 transition-all shadow-xs"
            title="Serializd"
            aria-label="Profil Serializd"
          >
            <SerializdLogo size={19} />
          </a>

          {/* Twitter / X */}
          <a
            href="https://x.com/abduplt?s=21"
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 rounded-[16px] bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 flex items-center justify-center text-neutral-800 dark:text-neutral-200 hover:border-primary/40 dark:hover:border-primary/40 hover:text-primary hover:scale-105 active:scale-95 transition-all shadow-xs"
            title="Twitter / X @abduplt"
            aria-label="Compte Twitter de CinéLyon"
          >
            <TwitterLogo size={16} />
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/cinelyon.fr/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 rounded-[16px] bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:border-primary/40 dark:hover:border-primary/40 hover:text-primary hover:scale-105 active:scale-95 transition-all shadow-xs"
            title="Instagram @cinelyon.fr"
            aria-label="Page Instagram officielle de CinéLyon"
          >
            <InstagramLogo size={18} />
          </a>
        </div>

        {/* Navigation & Liens Légaux */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 text-xs font-medium pt-1">
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
            <MessageSquare size={12} className="text-primary" />
            <span>Suggestions & Retours</span>
          </Link>
          <span className="text-neutral-300 dark:text-neutral-700">•</span>
          <Link
            href="/mentions-legales"
            className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300 hover:text-primary transition-colors"
          >
            <Scale size={12} className="text-neutral-400" />
            <span>Mentions légales</span>
          </Link>
          <span className="text-neutral-300 dark:text-neutral-700">•</span>
          <Link
            href="/politique-de-confidentialite"
            className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300 hover:text-primary transition-colors"
          >
            <Shield size={12} className="text-neutral-400" />
            <span>Politique de confidentialité</span>
          </Link>
          <span className="text-neutral-300 dark:text-neutral-700">•</span>
          <Link
            href="/cgu"
            className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300 hover:text-primary transition-colors"
          >
            <FileText size={12} className="text-neutral-400" />
            <span>CGU</span>
          </Link>
        </div>

        {/* Copyright & Mentions */}
        <div className="pt-6 border-t border-black/[0.06] dark:border-white/10 flex items-center justify-center text-[11px] text-neutral-400 dark:text-neutral-500 gap-1.5 font-normal">
          <span>© {new Date().getFullYear()} CinéLyon. Fait avec</span>
          <Heart size={12} className="text-rose-500 fill-rose-500 inline mx-0.5" />
          <span>pour les cinéphiles lyonnais.</span>
        </div>
      </div>
    </footer>
  );
}
