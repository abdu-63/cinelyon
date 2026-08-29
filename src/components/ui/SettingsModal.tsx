// src/components/ui/SettingsModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Globe,
  Bell,
  Clock,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Edit2,
  Trash2,
  UserPlus,
  Palette,
  Sparkles,
  Smartphone,
  ChevronDown,
  Check,
  Shield,
  Download,
  Upload,
  Info,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation, SUPPORTED_LANGUAGES, SupportedLocale } from '@/i18n';

export function SettingsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { mode, setMode, primaryColor, setPrimaryColor, isDark } = useTheme();
  const { locale, setLocale } = useTranslation();

  const [username, setUsername] = useState('Abdu');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [syncCode, setSyncCode] = useState('a0cc4a');
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hidePast, setHidePast] = useState(true);
  const [notifications, setNotifications] = useState(false);
  const [glassEffect, setGlassEffect] = useState<'disabled' | 'blur' | 'crystal'>('crystal');

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('cinelyon:open-settings', handleOpen);
    return () => window.removeEventListener('cinelyon:open-settings', handleOpen);
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(syncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateNewCode = () => {
    const newCode = Math.random().toString(36).substring(2, 8);
    setSyncCode(newCode);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg max-h-[88vh] bg-[#f5f6f8] dark:bg-[#121212] rounded-[28px] shadow-2xl border border-black/10 dark:border-white/10 z-10 flex flex-col overflow-hidden my-auto"
          >
            {/* Header */}
            <div className="p-4 bg-white dark:bg-[#1e1e1e] border-b border-black/[0.06] dark:border-white/10 flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-neutral-900 dark:text-white">Réglages</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-white flex items-center justify-center hover:bg-neutral-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Contenu Réglages Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* ── 1. Carte Profil & Code de Sync (Screenshot 1.5:5) ── */}
              <div className="p-4 rounded-[24px] bg-white dark:bg-[#1e1e1e] border border-black/[0.06] dark:border-white/10 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-full bg-amber-500 text-white font-extrabold text-lg flex items-center justify-center shadow-md">
                    <span>{username.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {isEditingUsername ? (
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          onBlur={() => setIsEditingUsername(false)}
                          autoFocus
                          className="font-bold text-base text-neutral-900 dark:text-white bg-transparent border-b border-[#444cf7] focus:outline-none"
                        />
                      ) : (
                        <h4 className="font-bold text-base text-neutral-900 dark:text-white">
                          {username}
                        </h4>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsEditingUsername(!isEditingUsername)}
                        className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                      >
                        <Edit2 size={13} />
                      </button>
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Vos amis pourront vous trouver via ce pseudo.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-black/[0.06] dark:border-white/10 space-y-1.5">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                    Votre code de sync
                  </span>
                  <p className="text-[11px] text-neutral-500">
                    Partagez ce code avec un autre appareil pour synchroniser vos favoris.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex-1 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-black/30 border border-black/[0.06] dark:border-white/10 font-mono text-xs text-neutral-800 dark:text-neutral-200">
                      {showCode ? syncCode : '••••••'}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCode(!showCode)}
                      className="p-2 rounded-xl bg-neutral-100 dark:bg-black/30 hover:bg-neutral-200 text-neutral-600 dark:text-neutral-300"
                    >
                      {showCode ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button
                      type="button"
                      onClick={generateNewCode}
                      className="p-2 rounded-xl bg-neutral-100 dark:bg-black/30 hover:bg-neutral-200 text-neutral-600 dark:text-neutral-300"
                    >
                      <RefreshCw size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-3.5 py-2 rounded-xl bg-[#444cf7] hover:bg-[#3339c4] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <Copy size={13} />
                      <span>{copied ? 'Copié !' : 'Copier'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── 2. Section GÉNÉRAL (Screenshot 2:5) ── */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 px-1">
                  Général
                </span>
                <div className="rounded-[24px] bg-white dark:bg-[#1e1e1e] border border-black/[0.06] dark:border-white/10 shadow-sm divide-y divide-black/[0.06] dark:divide-white/10">
                  {/* Langue */}
                  <div className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-sm">
                        <Globe size={16} />
                      </div>
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">
                        Langue
                      </span>
                    </div>

                    <select
                      value={locale}
                      onChange={(e) => setLocale(e.target.value as SupportedLocale)}
                      className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-black/30 text-xs font-semibold text-neutral-900 dark:text-white border-none focus:outline-none"
                    >
                      {SUPPORTED_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.flag} {l.nativeName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Masquer les séances passées */}
                  <div className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                        <Clock size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                          Masquer les séances passées
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          Ne plus afficher les films dont les horaires sont dépassés
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setHidePast(!hidePast)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${
                        hidePast ? 'bg-[#444cf7]' : 'bg-neutral-300 dark:bg-neutral-700'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          hidePast ? 'left-6' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* ── 3. Section APPARENCE (Screenshot 3:5) ── */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 px-1">
                  Apparence
                </span>
                <div className="p-4 rounded-[24px] bg-white dark:bg-[#1e1e1e] border border-black/[0.06] dark:border-white/10 shadow-sm space-y-4">
                  {/* Mode */}
                  <div>
                    <label className="text-xs font-bold text-neutral-900 dark:text-white block mb-2">
                      Mode
                    </label>
                    <div className="grid grid-cols-3 gap-2 p-1 bg-neutral-100 dark:bg-black/30 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setMode('system')}
                        className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                          mode === 'system'
                            ? 'bg-white dark:bg-[#1e1e1e] text-[#444cf7] shadow-sm'
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        📱 Système
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode('light')}
                        className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                          mode === 'light'
                            ? 'bg-white dark:bg-[#1e1e1e] text-[#444cf7] shadow-sm'
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        ☀️ Clair
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode('dark')}
                        className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                          mode === 'dark'
                            ? 'bg-white dark:bg-[#1e1e1e] text-[#444cf7] shadow-sm'
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        🌙 Sombre
                      </button>
                    </div>
                  </div>

                  {/* Couleur Principale */}
                  <div>
                    <label className="text-xs font-bold text-neutral-900 dark:text-white block mb-2">
                      Couleur Principale
                    </label>
                    <div className="flex items-center gap-6">
                      {[
                        { id: 'violet', label: 'Violet', color: 'bg-[#444cf7]' },
                        { id: 'blue', label: 'Bleu', color: 'bg-[#0161a7]' },
                        { id: 'white', label: 'Blanc', color: 'bg-white border border-black/10' },
                        { id: 'black', label: 'Noir', color: 'bg-[#1c1c1e]' },
                      ].map((c) => (
                        <div
                          key={c.id}
                          onClick={() => setPrimaryColor(c.id as any)}
                          className="flex flex-col items-center gap-1 cursor-pointer select-none"
                        >
                          <div
                            className={`w-9 h-9 rounded-full ${c.color} flex items-center justify-center shadow-sm relative`}
                          >
                            {primaryColor === c.id && (
                              <Check
                                size={16}
                                className={c.id === 'white' ? 'text-black' : 'text-white'}
                              />
                            )}
                          </div>
                          <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                            {c.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Effet Liquid Glass */}
                  <div>
                    <div className="mb-2">
                      <label className="text-xs font-bold text-neutral-900 dark:text-white block">
                        Effet Liquid Glass (Verre dépoli)
                      </label>
                      <span className="text-[10px] text-neutral-500">
                        Ajuster l&apos;intensité de translucidité et de flou liquide.
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-1 bg-neutral-100 dark:bg-black/30 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setGlassEffect('disabled')}
                        className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                          glassEffect === 'disabled'
                            ? 'bg-white dark:bg-[#1e1e1e] text-[#444cf7] shadow-sm'
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        ✕ Désactivé
                      </button>
                      <button
                        type="button"
                        onClick={() => setGlassEffect('blur')}
                        className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                          glassEffect === 'blur'
                            ? 'bg-white dark:bg-[#1e1e1e] text-[#444cf7] shadow-sm'
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        💧 Dépoli
                      </button>
                      <button
                        type="button"
                        onClick={() => setGlassEffect('crystal')}
                        className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                          glassEffect === 'crystal'
                            ? 'bg-white dark:bg-[#1e1e1e] text-[#444cf7] shadow-sm'
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        ✨ Cristallin
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 4. À PROPOS ── */}
              <div className="p-4 rounded-[24px] bg-white dark:bg-[#1e1e1e] border border-black/[0.06] dark:border-white/10 shadow-sm text-center space-y-1">
                <p className="text-xs font-bold text-neutral-900 dark:text-white">
                  CinéLyon Web v2.0 (Build 69)
                </p>
                <p className="text-[10px] text-neutral-500">
                  Plateforme indépendante développée pour les passionnés de cinéma à Lyon.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
