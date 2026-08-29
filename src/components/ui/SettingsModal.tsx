// src/components/ui/SettingsModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Moon, Sun, Smartphone, Palette, Globe, Trash2, Shield, Heart, Share2, Sparkles, Check } from 'lucide-react';
import { useTheme, ThemeMode, PrimaryColorVariant } from '@/context/ThemeContext';
import { useTranslation, SUPPORTED_LANGUAGES, SupportedLocale } from '@/i18n';

export function SettingsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { mode, setMode, primaryColor, setPrimaryColor, liquidGlassEnabled, setLiquidGlassEnabled } = useTheme();
  const { t, locale, setLocale } = useTranslation();
  const [syncCode, setSyncCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('cinelyon:open-settings', handleOpen);
    return () => window.removeEventListener('cinelyon:open-settings', handleOpen);
  }, []);

  useEffect(() => {
    if (isOpen) {
      let code = localStorage.getItem('cinelyon_sync_id');
      if (!code) {
        code = 'CL-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        localStorage.setItem('cinelyon_sync_id', code);
      }
      setSyncCode(code);
    }
  }, [isOpen]);

  const handleSyncSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      localStorage.setItem('cinelyon_sync_id', inputCode.trim().toUpperCase());
      setSyncCode(inputCode.trim().toUpperCase());
      setInputCode('');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  const handleClearCache = () => {
    if (confirm('Voulez-vous vraiment réinitialiser le cache et les données locales ?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative w-full max-w-xl liquid-glass rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/15 dark:border-white/10 z-10 my-8 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-5 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#444cf7]/20 border border-[#444cf7]/40 flex items-center justify-center text-[#444cf7]">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Paramètres CinéLyon</h2>
                  <p className="text-xs text-neutral-400">Personnalisation, synchronisation et langue</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Section Thème */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2.5 flex items-center gap-2">
                  <Palette size={14} />
                  <span>Apparence & Thème</span>
                </label>
                <div className="grid grid-cols-3 gap-2 bg-black/30 p-1.5 rounded-2xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setMode('dark')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                      mode === 'dark' ? 'bg-[#444cf7] text-white shadow-md' : 'text-neutral-300 hover:bg-white/5'
                    }`}
                  >
                    <Moon size={14} />
                    <span>Sombre</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('light')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                      mode === 'light' ? 'bg-[#444cf7] text-white shadow-md' : 'text-neutral-300 hover:bg-white/5'
                    }`}
                  >
                    <Sun size={14} />
                    <span>Clair</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('system')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                      mode === 'system' ? 'bg-[#444cf7] text-white shadow-md' : 'text-neutral-300 hover:bg-white/5'
                    }`}
                  >
                    <Smartphone size={14} />
                    <span>Système</span>
                  </button>
                </div>
              </div>

              {/* Couleur d'Accent */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2.5 block">
                  Couleur d&apos;accent
                </label>
                <div className="flex items-center gap-3">
                  {[
                    { id: 'violet', label: 'Violet', color: '#444cf7' },
                    { id: 'blue', label: 'Bleu', color: '#0161A7' },
                    { id: 'white', label: 'Blanc', color: '#ffffff' },
                    { id: 'black', label: 'Noir', color: '#1c1c1e' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setPrimaryColor(c.id as PrimaryColorVariant)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                        primaryColor === c.id
                          ? 'border-white ring-2 ring-white/20 bg-white/10 text-white'
                          : 'border-white/10 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section Langue */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2.5 flex items-center gap-2">
                  <Globe size={14} />
                  <span>Langue de l&apos;interface</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setLocale(lang.code as SupportedLocale)}
                      className={`py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-between border transition-all ${
                        locale === lang.code
                          ? 'bg-[#444cf7]/20 border-[#444cf7] text-white font-semibold'
                          : 'border-white/10 bg-black/20 text-neutral-300 hover:bg-white/5'
                      }`}
                    >
                      <span>
                        {lang.flag} {lang.nativeName}
                      </span>
                      {locale === lang.code && <Check size={12} className="text-[#444cf7]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section Synchronisation Supabase */}
              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                    <Share2 size={14} className="text-[#444cf7]" />
                    <span>Synchroniser avec l&apos;application mobile</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-[#444cf7] bg-[#444cf7]/15 px-2 py-0.5 rounded-md border border-[#444cf7]/30">
                    {syncCode}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Entrez votre code de synchronisation pour retrouver vos cinémas et films favoris sur tous vos appareils.
                </p>

                <form onSubmit={handleSyncSubmit} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: CL-AB12CD"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#444cf7]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#444cf7] hover:bg-[#3339c4] text-xs font-semibold text-white transition-colors"
                  >
                    Lier
                  </button>
                </form>

                {savedSuccess && (
                  <p className="text-xs text-emerald-400 flex items-center gap-1">
                    <Check size={12} /> Code synchronisé avec succès !
                  </p>
                )}
              </div>

              {/* Cache & Maintenance */}
              <div className="pt-2 flex items-center justify-between border-t border-white/10">
                <span className="text-xs text-neutral-500">Version 2.0 (Next.js)</span>
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors"
                >
                  <Trash2 size={13} />
                  <span>Réinitialiser les données</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
