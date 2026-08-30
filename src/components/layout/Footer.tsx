// src/components/layout/Footer.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Film, Heart, Sparkles } from 'lucide-react';
import { InstagramIcon } from '@/components/ui/InstagramIcon';

export default function Footer() {
  return (
    <footer className="w-full border-t border-black/[0.06] dark:border-white/10 bg-white/50 dark:bg-black/40 backdrop-blur-md pt-8 pb-12 mt-12 text-neutral-500">
      <div className="max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 text-center space-y-4">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#444cf7] flex items-center justify-center text-white shadow-sm">
            <Film size={15} />
          </div>
          <span className="font-bold text-base text-neutral-900 dark:text-white">CinéLyon</span>
        </div>

        <p className="text-xs leading-relaxed text-neutral-500 max-w-md mx-auto">
          Toutes les séances, horaires en temps réel, scènes post-génériques et pauses RunPee de la métropole lyonnaise.
        </p>

        {/* Liens & Réseaux */}
        <div className="flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5 text-xs font-medium">
          <Link href="/" className="text-neutral-700 dark:text-neutral-300 hover:text-[#444cf7] transition-colors">
            Séances
          </Link>
          <span className="text-neutral-400 dark:text-neutral-600">•</span>
          <Link href="/suggestions" className="text-neutral-700 dark:text-neutral-300 hover:text-[#444cf7] transition-colors">
            Suggestions & Bugs
          </Link>
          <span className="text-neutral-400 dark:text-neutral-600">•</span>
          <Link href="/politique-de-confidentialite" className="text-neutral-700 dark:text-neutral-300 hover:text-[#444cf7] transition-colors">
            Politique de confidentialité
          </Link>
          <span className="text-neutral-400 dark:text-neutral-600">•</span>
          <Link href="/cgu" className="text-neutral-700 dark:text-neutral-300 hover:text-[#444cf7] transition-colors">
            Conditions d&apos;utilisation
          </Link>
          <span className="text-neutral-400 dark:text-neutral-600">•</span>
          <a
            href="https://www.instagram.com/cinelyon.fr/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 hover:text-[#e1306c] transition-colors"
          >
            <InstagramIcon size={14} />
            <span>@cinelyon.fr</span>
          </a>
        </div>

        <div className="pt-4 border-t border-black/[0.06] dark:border-white/10 flex items-center justify-center text-[11px] text-neutral-400 gap-1">
          <span>© {new Date().getFullYear()} CinéLyon. Conçu avec</span>
          <Heart size={11} className="text-rose-500 fill-rose-500 inline" />
          <span>pour les Lyonnais.</span>
        </div>
      </div>
    </footer>
  );
}
