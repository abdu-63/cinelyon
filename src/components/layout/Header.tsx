// src/components/layout/Header.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Film, Sparkles, Moon, Sun, Settings, Globe } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation, SUPPORTED_LANGUAGES, SupportedLocale } from '@/i18n';

export default function Header() {
  const pathname = usePathname();
  const { mode, setMode, isDark } = useTheme();
  const { locale, setLocale } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

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
          <div className="w-8 h-8 rounded-xl bg-[#444cf7] flex items-center justify-center shadow-md shadow-[#444cf7]/20 group-hover:scale-105 transition-transform">
            <Film className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-lg tracking-tight text-neutral-900 dark:text-white">
              CinéLyon
            </span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-[#444cf7]/15 text-[#444cf7]">
              69
            </span>
          </div>
        </Link>

        {/* Contrôles & Actions */}
        <div className="flex items-center gap-2">
          {/* Sélecteur de Langue */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-white/25 transition-colors flex items-center gap-1 text-xs font-bold shadow-sm active:scale-95"
              title="Changer de langue"
            >
              <Globe size={14} />
              <span className="uppercase">{locale}</span>
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/10 dark:border-white/15 shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                {SUPPORTED_LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLocale(l.code as SupportedLocale);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors ${
                      locale === l.code ? 'font-bold text-[#444cf7]' : 'text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{l.flag}</span>
                      <span>{l.nativeName}</span>
                    </span>
                    {locale === l.code && <span className="text-[#444cf7]">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bascule Thème Sombre / Clair */}
          <button
            type="button"
            onClick={() => setMode(isDark ? 'light' : 'dark')}
            className="p-2 rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-white/25 transition-colors shadow-sm active:scale-95"
            title={isDark ? 'Mode clair' : 'Mode sombre'}
          >
            {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
          </button>

          {/* Bouton Réglages */}
          <button
            type="button"
            onClick={openSettings}
            className="p-2 rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-white/25 transition-colors shadow-sm active:scale-95"
            title="Paramètres"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
