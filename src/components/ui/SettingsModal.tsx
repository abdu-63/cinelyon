// src/components/ui/SettingsModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Smartphone,
  ChevronDown,
  ChevronRight,
  Check,
  Camera,
  Plus,
  Sun,
  Moon,
  CircleOff,
  Droplets,
  Sparkles,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation, SUPPORTED_LANGUAGES, SupportedLocale } from '@/i18n';
import { FlagIcon } from '@/components/ui/FlagIcon';

interface FriendItem {
  id: string;
  name: string;
  code: string;
  favoritesCount: number;
  isHidden?: boolean;
}

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
  const [notifications, setNotifications] = useState(true);
  const [glassEffect, setGlassEffect] = useState<'disabled' | 'blur' | 'crystal'>('crystal');
  const [isLinkingDeviceOpen, setIsLinkingDeviceOpen] = useState(false);
  const [linkCodeInput, setLinkCodeInput] = useState('');
  const [isAddingFriendOpen, setIsAddingFriendOpen] = useState(false);
  const [newFriendCode, setNewFriendCode] = useState('');
  const [newFriendName, setNewFriendName] = useState('');

  const [friends, setFriends] = useState<FriendItem[]>([
    { id: '1', name: 'ilhan', code: '2c62f2', favoritesCount: 0, isHidden: false },
    { id: '2', name: 'Abdu', code: 'a0cc4a', favoritesCount: 48, isHidden: false },
  ]);

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

  const handleAddFriend = () => {
    if (!newFriendCode.trim()) return;
    const newF: FriendItem = {
      id: String(Date.now()),
      name: newFriendName.trim() || `Ami ${newFriendCode.trim().toUpperCase()}`,
      code: newFriendCode.trim().toLowerCase(),
      favoritesCount: 0,
      isHidden: false,
    };
    setFriends((prev) => [...prev, newF]);
    setNewFriendCode('');
    setNewFriendName('');
    setIsAddingFriendOpen(false);
  };

  const handleDeleteFriend = (id: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== id));
  };

  const handleToggleHideFriend = (id: string) => {
    setFriends((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isHidden: !f.isHidden } : f))
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
          />

          {/* Bottom Sheet Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 380 }}
            className="pointer-events-auto relative w-full max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto bg-[#f5f6f8] dark:bg-[#121214] rounded-t-[32px] rounded-b-none border-t border-x border-black/10 dark:border-white/10 shadow-2xl z-10 flex flex-col max-h-[90vh] md:max-h-[85vh] overflow-hidden"
          >
            {/* Drag Handle & Bouton Fermer discret */}
            <div className="relative pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-auto" />
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-2.5 w-7 h-7 rounded-full bg-neutral-200/70 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 flex items-center justify-center hover:bg-neutral-300 dark:hover:bg-white/20 transition-colors"
                aria-label="Fermer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Contenu Réglages Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain">
              {/* ── 1. Carte Profil & Code de Sync (Screenshot 1 Exact) ── */}
              <div className="p-4 rounded-[24px] bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/10 shadow-sm space-y-3.5">
                {/* Profil Header */}
                <div className="flex items-center gap-3">
                  {/* Avatar Orange avec Badge Caméra Bleu */}
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-full bg-amber-500 text-white font-extrabold text-lg flex items-center justify-center shadow-md select-none">
                      <span>{username.slice(0, 2).toUpperCase()}</span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#444cf7] border-2 border-white dark:border-[#1c1c1e] text-white flex items-center justify-center shadow-xs">
                      <Camera size={10} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
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
                        className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-500 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-white flex items-center justify-center transition-colors"
                        aria-label="Modifier le pseudo"
                      >
                        <Edit2 size={13} />
                      </button>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Vos amis pourront vous trouver via ce pseudo.
                    </p>
                  </div>
                </div>

                {/* Section Code de sync */}
                <div className="pt-3 border-t border-black/[0.06] dark:border-white/10 space-y-1.5">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                    Votre code de sync
                  </span>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Partagez ce code avec un autre appareil pour synchroniser vos favoris.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    {/* Display box avec pastilles bleues ou code clair */}
                    <div className="flex-1 h-10 px-3.5 rounded-xl bg-neutral-100 dark:bg-[#242428] border border-black/[0.06] dark:border-white/10 flex items-center font-mono text-xs text-neutral-800 dark:text-neutral-200">
                      {showCode ? (
                        <span className="font-bold tracking-widest text-[#444cf7]">{syncCode}</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {[...Array(6)].map((_, i) => (
                            <span key={i} className="w-2 h-2 rounded-full bg-[#444cf7]" />
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCode(!showCode)}
                      className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-[#242428] hover:bg-neutral-200 dark:hover:bg-white/10 border border-black/[0.06] dark:border-white/10 text-neutral-600 dark:text-neutral-300 flex items-center justify-center transition-colors"
                      title={showCode ? 'Masquer' : 'Afficher'}
                    >
                      {showCode ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>

                    <button
                      type="button"
                      onClick={generateNewCode}
                      className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-[#242428] hover:bg-neutral-200 dark:hover:bg-white/10 border border-black/[0.06] dark:border-white/10 text-neutral-600 dark:text-neutral-300 flex items-center justify-center transition-colors"
                      title="Générer un nouveau code"
                    >
                      <RefreshCw size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="h-10 px-4 rounded-xl bg-[#444cf7] hover:bg-[#3339c4] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-[#444cf7]/25 transition-all active:scale-95"
                    >
                      <Copy size={13} />
                      <span>{copied ? 'Copié !' : 'Copier'}</span>
                    </button>
                  </div>
                </div>

                {/* Accordéon "Lier un appareil existant" */}
                <div className="pt-2 border-t border-black/[0.06] dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsLinkingDeviceOpen(!isLinkingDeviceOpen)}
                    className="w-full flex items-center justify-between text-left py-1 group select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-blue-500/10 text-[#444cf7] flex items-center justify-center">
                        <Smartphone size={14} />
                      </div>
                      <span className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:text-[#444cf7] transition-colors">
                        Lier un appareil existant
                      </span>
                    </div>
                    <ChevronDown
                      size={15}
                      className={`text-neutral-400 transition-transform ${isLinkingDeviceOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isLinkingDeviceOpen && (
                    <div className="mt-2.5 pt-2 space-y-2 animate-in fade-in duration-150">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Ex: ABC123"
                          value={linkCodeInput}
                          onChange={(e) => setLinkCodeInput(e.target.value.toUpperCase())}
                          className="flex-1 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-[#242428] border border-black/[0.06] dark:border-white/10 text-xs text-neutral-900 dark:text-white font-mono placeholder-neutral-400 focus:outline-none focus:border-[#444cf7]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (linkCodeInput.trim().length === 6) {
                              setSyncCode(linkCodeInput.trim().toLowerCase());
                              setLinkCodeInput('');
                              setIsLinkingDeviceOpen(false);
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-[#444cf7] text-white text-xs font-bold shadow-sm active:scale-95"
                        >
                          Lier
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── 2. Section AMIS SUIVIS (Screenshot 1 Exact) ── */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 px-1">
                  Amis suivis
                </span>

                <div className="rounded-[24px] bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/10 shadow-sm divide-y divide-black/[0.06] dark:divide-white/10 overflow-hidden">
                  {/* Ligne Ajouter un ami */}
                  <div className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#444cf7] text-white flex items-center justify-center shadow-sm">
                        <UserPlus size={16} />
                      </div>
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">
                        Ajouter un ami
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddingFriendOpen(!isAddingFriendOpen)}
                      className="w-6 h-6 rounded-full bg-[#444cf7] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xs"
                      title="Ajouter un ami"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Formulaire dépliable Ajouter un ami */}
                  {isAddingFriendOpen && (
                    <div className="p-3.5 bg-neutral-50 dark:bg-black/20 space-y-2 animate-in fade-in duration-150">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Code (6 lettres)"
                          value={newFriendCode}
                          onChange={(e) => setNewFriendCode(e.target.value.toUpperCase())}
                          className="w-32 px-3 py-2 rounded-xl bg-white dark:bg-[#242428] border border-black/[0.06] dark:border-white/10 text-xs text-neutral-900 dark:text-white font-mono placeholder-neutral-400 focus:outline-none focus:border-[#444cf7]"
                        />
                        <input
                          type="text"
                          placeholder="Prénom"
                          value={newFriendName}
                          onChange={(e) => setNewFriendName(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#242428] border border-black/[0.06] dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#444cf7]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddFriend}
                        className="w-full py-2 rounded-xl bg-[#444cf7] text-white text-xs font-bold shadow-sm active:scale-95"
                      >
                        Valider l&apos;ami
                      </button>
                    </div>
                  )}

                  {/* Liste des Amis */}
                  {friends.map((friend) => (
                    <div key={friend.id} className="p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-950/80 border border-blue-800 text-blue-400 flex items-center justify-center font-bold text-xs">
                          {friend.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className={`text-xs font-bold block ${friend.isHidden ? 'line-through opacity-60 text-neutral-400' : 'text-neutral-900 dark:text-white'}`}>
                            {friend.name}
                          </span>
                          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                            Code : {friend.code} • {friend.favoritesCount} favori{friend.favoritesCount > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleHideFriend(friend.id)}
                          className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-500 dark:text-neutral-300 flex items-center justify-center transition-colors"
                          title={friend.isHidden ? 'Afficher les favoris' : 'Masquer les favoris'}
                        >
                          <Eye size={13} className={friend.isHidden ? 'opacity-40' : ''} />
                        </button>
                        <button
                          type="button"
                          className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-500 dark:text-neutral-300 flex items-center justify-center transition-colors"
                          title="Modifier"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFriend(friend.id)}
                          className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-500 flex items-center justify-center transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 px-1 leading-relaxed">
                  Les favoris de vos amis s&apos;affichent automatiquement dans l&apos;onglet Favoris et Réservations.
                </p>
              </div>

              {/* ── 3. Section GÉNÉRAL (Langue avec SVG, Notifications, Masquer séances passées) ── */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 px-1">
                  Général
                </span>

                <div className="rounded-[24px] bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/10 shadow-sm divide-y divide-black/[0.06] dark:divide-white/10 overflow-hidden">
                  {/* Langue avec drapeau SVG */}
                  <div className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-sm">
                        <Globe size={16} />
                      </div>
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">
                        Langue
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <FlagIcon code={locale} size={18} />
                      <select
                        value={locale}
                        onChange={(e) => setLocale(e.target.value as SupportedLocale)}
                        className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#242428] text-xs font-semibold text-neutral-900 dark:text-white border-none focus:outline-none cursor-pointer"
                      >
                        {SUPPORTED_LANGUAGES.map((l) => (
                          <option key={l.code} value={l.code}>
                            {l.nativeName} ({l.name})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Afficher les notifications */}
                  <div className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3 pr-2">
                      <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-sm shrink-0">
                        <Bell size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                          Afficher les notifications
                        </span>
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                          Recevoir des rappels pour vos séances réservées dans votre calendrier.
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setNotifications(!notifications)}
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                        notifications ? 'bg-[#444cf7]' : 'bg-neutral-300 dark:bg-neutral-700'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-xs ${
                          notifications ? 'left-6' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Masquer les séances passées */}
                  <div className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3 pr-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm shrink-0">
                        <Clock size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                          Masquer les séances passées
                        </span>
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                          Ne plus afficher les films dont les horaires sont dépassés
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setHidePast(!hidePast)}
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                        hidePast ? 'bg-[#444cf7]' : 'bg-neutral-300 dark:bg-neutral-700'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-xs ${
                          hidePast ? 'left-6' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* ── 4. Section APPARENCE (Thème clair/sombre/système avec icônes SVG) ── */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 px-1">
                  Apparence
                </span>

                <div className="p-4 rounded-[24px] bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/10 shadow-sm space-y-4">
                  {/* Mode Sombre / Clair / Système */}
                  <div>
                    <label className="text-xs font-bold text-neutral-900 dark:text-white block mb-2">
                      Mode d&apos;affichage
                    </label>
                    <div className="grid grid-cols-3 gap-2 p-1 bg-neutral-100 dark:bg-[#242428] rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setMode('system')}
                        className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          mode === 'system'
                            ? 'bg-white dark:bg-[#1c1c1e] text-[#444cf7] shadow-sm font-bold'
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        <Smartphone size={14} />
                        <span>Système</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode('light')}
                        className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          mode === 'light'
                            ? 'bg-white dark:bg-[#1c1c1e] text-[#444cf7] shadow-sm font-bold'
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        <Sun size={14} />
                        <span>Clair</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode('dark')}
                        className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          mode === 'dark'
                            ? 'bg-white dark:bg-[#1c1c1e] text-[#444cf7] shadow-sm font-bold'
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        <Moon size={14} />
                        <span>Sombre</span>
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
                        { id: 'black', label: 'Noir', color: 'bg-[#1c1c1e] border border-white/20' },
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
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                        Ajuster l&apos;intensité de translucidité et de flou liquide.
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-1 bg-neutral-100 dark:bg-[#242428] rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setGlassEffect('disabled')}
                        className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          glassEffect === 'disabled'
                            ? 'bg-white dark:bg-[#1c1c1e] text-[#444cf7] shadow-sm font-bold'
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        <CircleOff size={14} />
                        <span>Désactivé</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGlassEffect('blur')}
                        className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          glassEffect === 'blur'
                            ? 'bg-white dark:bg-[#1c1c1e] text-[#444cf7] shadow-sm font-bold'
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        <Droplets size={14} />
                        <span>Dépoli</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGlassEffect('crystal')}
                        className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          glassEffect === 'crystal'
                            ? 'bg-white dark:bg-[#1c1c1e] text-[#444cf7] shadow-sm font-bold'
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        <Sparkles size={14} />
                        <span>Cristallin</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 5. LÉGAL & CONFIDENTIALITÉ ── */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 px-1">
                  Légal & Confidentialité
                </span>

                <div className="rounded-[24px] bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/10 shadow-sm divide-y divide-black/[0.06] dark:divide-white/10 overflow-hidden">
                  <Link
                    href="/politique-de-confidentialite"
                    onClick={() => setIsOpen(false)}
                    className="p-3.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <ShieldCheck size={16} />
                      </div>
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">
                        Politique de confidentialité
                      </span>
                    </div>
                    <ChevronRight size={14} className="text-neutral-400 group-hover:text-[#444cf7] transition-colors" />
                  </Link>

                  <Link
                    href="/cgu"
                    onClick={() => setIsOpen(false)}
                    className="p-3.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 flex items-center justify-center">
                        <FileText size={16} />
                      </div>
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">
                        Conditions d&apos;utilisation
                      </span>
                    </div>
                    <ChevronRight size={14} className="text-neutral-400 group-hover:text-[#444cf7] transition-colors" />
                  </Link>
                </div>
              </div>

              {/* ── 6. À PROPOS ── */}
              <div className="p-4 rounded-[24px] bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/10 shadow-sm text-center space-y-1 pb-6">
                <p className="text-xs font-bold text-neutral-900 dark:text-white">
                  CinéLyon Web v2.0 (Build 69)
                </p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
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
