// src/components/ui/SettingsModal.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SettingsIconBadge,
  RefreshOutlineIcon,
  EyeOutlineIcon,
  EyeOffOutlineIcon,
  CopyOutlineIcon,
  PencilIcon,
  PhonePortraitIcon,
  PersonAddIcon,
  NotificationsIcon,
  TimeIcon,
  LanguageIcon,
  ShareSocialIcon,
  DownloadOutlineIcon,
  TrashOutlineIcon,
  ShieldCheckmarkIcon,
  DocumentTextIcon,
  HelpCircleIcon,
  ColorPaletteIcon,
  BrushIcon,
  MoonOutlineIcon,
  SunnyOutlineIcon,
  ChevronForwardIcon,
  ChevronDownIcon,
  CloseIcon,
  CheckmarkIcon,
  WarningOutlineIcon,
  AddCircleIcon,
  InformationCircleIcon,
} from '@/components/ui/IonIcons';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation, SUPPORTED_LANGUAGES, SupportedLocale } from '@/i18n';
import { FlagIcon } from '@/components/ui/FlagIcon';
import {
  LetterboxdLogo,
  SerializdLogo,
  TwitterLogo,
  InstagramLogo,
} from '@/components/ui/BrandIcons';

interface FriendItem {
  id: string;
  name: string;
  code: string;
  favoritesCount: number;
}

export function SettingsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { mode, setMode, primaryColor, setPrimaryColor, liquidGlassMode, setLiquidGlassMode, isDark } = useTheme();
  const { locale, setLocale, t } = useTranslation();

  const isWhiteLight = primaryColor === 'white' && !isDark;
  const isBlackDark = primaryColor === 'black' && isDark;

  const switchActiveTrack = isWhiteLight
    ? 'bg-neutral-900'
    : isBlackDark
    ? 'bg-white'
    : 'bg-primary';

  const switchActiveThumb = isBlackDark ? 'bg-neutral-900' : 'bg-white';

  const themeModeActiveText = isWhiteLight
    ? 'text-neutral-900'
    : isBlackDark
    ? 'text-white'
    : 'text-primary';

  const [username, setUsername] = useState('Abdu');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [syncCode, setSyncCode] = useState('A0CC4A');
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hidePast, setHidePast] = useState(false);
  const [useOriginalTitleLogo, setUseOriginalTitleLogo] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [isLinkingDeviceOpen, setIsLinkingDeviceOpen] = useState(false);
  const [linkCodeInput, setLinkCodeInput] = useState('');
  const [isAddingFriendOpen, setIsAddingFriendOpen] = useState(false);
  const [newFriendCode, setNewFriendCode] = useState('');
  const [newFriendName, setNewFriendName] = useState('');

  // Masquage individuel des codes d'amis
  const [revealedFriendCodes, setRevealedFriendCodes] = useState<Record<string, boolean>>({});
  // Édition inline d'un ami
  const [editingFriendId, setEditingFriendId] = useState<string | null>(null);
  const [editFriendName, setEditFriendName] = useState('');
  const [editFriendCode, setEditFriendCode] = useState('');

  // Modale confirmation suppression de données
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [friends, setFriends] = useState<FriendItem[]>([
    { id: '1', name: 'ilhan', code: '2C62F2', favoritesCount: 0 },
    { id: '2', name: 'Abdu', code: 'A0CC4A', favoritesCount: 48 },
  ]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cinelyon_hide_past_sessions');
      if (stored !== null) {
        setHidePast(stored === 'true');
      }
      const storedOrigLogo = localStorage.getItem('cinelyon_useOriginalTitleLogo');
      if (storedOrigLogo !== null) {
        setUseOriginalTitleLogo(storedOrigLogo === 'true');
      }
      const storedUsername = localStorage.getItem('cinelyon_user_name');
      if (storedUsername) setUsername(storedUsername);
      const storedSync = localStorage.getItem('cinelyon_sync_code');
      if (storedSync) setSyncCode(storedSync.toUpperCase());
      const storedFriends = localStorage.getItem('cinelyon_friends');
      if (storedFriends) {
        setFriends(JSON.parse(storedFriends));
      }
    } catch {}
  }, []);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('cinelyon:open-settings', handleOpen);
    return () => window.removeEventListener('cinelyon:open-settings', handleOpen);
  }, []);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(syncCode.toUpperCase());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateNewCode = () => {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setSyncCode(newCode);
    try {
      localStorage.setItem('cinelyon_sync_code', newCode);
    } catch {}
  };

  const handleSaveUsername = (newName: string) => {
    const trimmed = newName.trim() || 'Utilisateur';
    setUsername(trimmed);
    setIsEditingUsername(false);
    try {
      localStorage.setItem('cinelyon_user_name', trimmed);
    } catch {}
  };

  const handleAddFriend = () => {
    if (!newFriendCode.trim()) return;
    const cleanCode = newFriendCode.trim().toUpperCase();
    const newF: FriendItem = {
      id: String(Date.now()),
      name: newFriendName.trim() || `Ami ${cleanCode}`,
      code: cleanCode,
      favoritesCount: 0,
    };
    const updated = [...friends, newF];
    setFriends(updated);
    try {
      localStorage.setItem('cinelyon_friends', JSON.stringify(updated));
    } catch {}
    setNewFriendCode('');
    setNewFriendName('');
    setIsAddingFriendOpen(false);
    showStatus('Ami ajouté');
  };

  const handleDeleteFriend = (id: string) => {
    const updated = friends.filter((f) => f.id !== id);
    setFriends(updated);
    try {
      localStorage.setItem('cinelyon_friends', JSON.stringify(updated));
    } catch {}
  };

  const handleToggleRevealFriendCode = (id: string) => {
    setRevealedFriendCodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleStartEditFriend = (friend: FriendItem) => {
    setEditingFriendId(friend.id);
    setEditFriendName(friend.name);
    setEditFriendCode(friend.code);
  };

  const handleSaveEditFriend = () => {
    if (!editingFriendId) return;
    const updated = friends.map((f) =>
      f.id === editingFriendId
        ? {
            ...f,
            name: editFriendName.trim() || f.name,
            code: editFriendCode.trim().toUpperCase() || f.code,
          }
        : f
    );
    setFriends(updated);
    try {
      localStorage.setItem('cinelyon_friends', JSON.stringify(updated));
    } catch {}
    setEditingFriendId(null);
    showStatus('Ami mis à jour');
  };

  // ── Exportation des données JSON (RGPD) ──
  const handleExportData = () => {
    try {
      const backupData: Record<string, any> = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        username,
        syncCode,
        friends,
        settings: {
          locale,
          mode,
          primaryColor,
          hidePast,
          notifications,
          liquidGlassMode,
        },
      };

      // Exporter également les favoris existants du localStorage
      const favorites = localStorage.getItem('cinelyon_favorites');
      if (favorites) {
        backupData.favorites = JSON.parse(favorites);
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cinelyon_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showStatus('Sauvegarde exportée avec succès');
    } catch (err) {
      showStatus("Erreur lors de l'export");
    }
  };

  // ── Importation des données JSON ──
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (parsed.username) {
          setUsername(parsed.username);
          localStorage.setItem('cinelyon_user_name', parsed.username);
        }
        if (parsed.syncCode) {
          const sc = parsed.syncCode.toUpperCase();
          setSyncCode(sc);
          localStorage.setItem('cinelyon_sync_code', sc);
        }
        if (Array.isArray(parsed.friends)) {
          setFriends(parsed.friends);
          localStorage.setItem('cinelyon_friends', JSON.stringify(parsed.friends));
        }
        if (parsed.favorites) {
          localStorage.setItem('cinelyon_favorites', JSON.stringify(parsed.favorites));
        }
        if (parsed.settings) {
          if (parsed.settings.mode) setMode(parsed.settings.mode);
          if (parsed.settings.primaryColor) setPrimaryColor(parsed.settings.primaryColor);
          if (parsed.settings.locale) setLocale(parsed.settings.locale);
          if (parsed.settings.liquidGlassMode) {
            setLiquidGlassMode(parsed.settings.liquidGlassMode);
          } else if (parsed.settings.glassEffect) {
            const ge = parsed.settings.glassEffect;
            setLiquidGlassMode(ge === 'blur' ? 'medium' : ge === 'crystal' ? 'high' : ge);
          }
        }

        window.dispatchEvent(new CustomEvent('cinelyon:data-restored'));
        showStatus('Données importées avec succès !');
      } catch (err) {
        showStatus('Fichier de sauvegarde invalide');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Suppression des données ──
  const handleDeleteAllData = () => {
    try {
      localStorage.removeItem('cinelyon_favorites');
      localStorage.removeItem('cinelyon_friends');
      localStorage.removeItem('cinelyon_user_name');
      localStorage.removeItem('cinelyon_sync_code');
      localStorage.removeItem('cinelyon_hide_past_sessions');
      setFriends([]);
      setUsername('Utilisateur');
      generateNewCode();
      setShowDeleteConfirm(false);
      window.dispatchEvent(new CustomEvent('cinelyon:data-restored'));
      showStatus('Toutes vos données ont été effacées');
    } catch {
      showStatus('Erreur lors de la suppression');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none pt-14 pb-[env(safe-area-inset-bottom,0px)]">
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
            className="pointer-events-auto relative w-full max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto bg-[#f5f6f8] dark:bg-[#121214] rounded-t-[32px] rounded-b-none border-t border-x border-black/10 dark:border-white/10 shadow-2xl z-10 flex flex-col max-h-[78vh] md:max-h-[85vh] overflow-hidden"
          >
            {/* Input file caché pour l'import JSON */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleImportFileChange}
              className="hidden"
            />

            {/* Drag Handle & Bouton Fermer discret */}
            <div className="relative pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-auto" />
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-2.5 w-7 h-7 rounded-full bg-neutral-200/70 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 flex items-center justify-center hover:bg-neutral-300 dark:hover:bg-white/20 transition-colors"
                aria-label="Fermer"
              >
                <CloseIcon size={14} />
              </button>
            </div>

            {/* Toast status discret */}
            {statusMessage && (
              <div className="px-5 py-2 mx-5 mt-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-medium flex items-center justify-center shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
                {statusMessage}
              </div>
            )}

            {/* Contenu Réglages Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 pb-20 sm:pb-8 space-y-4 overscroll-contain">
              {/* ── 1. Carte Profil & Code de Sync ── */}
              <div className="p-4 rounded-[22px] bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/10 shadow-sm space-y-3.5">
                {/* Profil Header */}
                <div className="flex items-center gap-3">
                  {/* Avatar épuré sans icône caméra */}
                  <div className="w-12 h-12 rounded-full bg-amber-500 text-white font-semibold text-base flex items-center justify-center shadow-sm shrink-0 select-none">
                    <span>{username.slice(0, 2).toUpperCase()}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      {isEditingUsername ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveUsername(username);
                            }}
                            autoFocus
                            className="font-medium text-[15px] text-neutral-900 dark:text-white bg-transparent border-b border-primary focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveUsername(username)}
                            className="p-1 rounded-md bg-primary text-primary-contrast"
                          >
                            <CheckmarkIcon size={12} />
                          </button>
                        </div>
                      ) : (
                        <h4 className="font-medium text-[15px] text-neutral-900 dark:text-white">
                          {username}
                        </h4>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsEditingUsername(!isEditingUsername)}
                        className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/10 text-neutral-500 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-white flex items-center justify-center transition-colors"
                        aria-label="Modifier le pseudo"
                      >
                        <PencilIcon size={13} />
                      </button>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-normal">
                      Vos amis pourront vous trouver via ce pseudo.
                    </p>
                  </div>
                </div>

                {/* Section Code de sync */}
                <div className="pt-3 border-t border-black/[0.06] dark:border-white/10 space-y-1.5">
                  <span className="text-[15px] font-medium text-neutral-900 dark:text-white block leading-tight">
                    Votre code de sync
                  </span>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-snug font-normal">
                    Partagez ce code avec un autre appareil pour synchroniser vos favoris.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    {/* Display box avec pastilles ou code clair en majuscules */}
                    <div className="flex-1 h-10 px-3.5 rounded-lg bg-neutral-100 dark:bg-[#242428] border border-black/[0.06] dark:border-white/10 flex items-center font-mono text-xs text-neutral-800 dark:text-neutral-200">
                      {showCode ? (
                        <span
                          className={`font-semibold tracking-widest ${
                            isWhiteLight
                              ? 'text-neutral-900'
                              : isBlackDark
                              ? 'text-white'
                              : 'text-primary'
                          }`}
                        >
                          {syncCode.toUpperCase()}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {[...Array(6)].map((_, i) => (
                            <span
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                isWhiteLight
                                  ? 'bg-neutral-900'
                                  : isBlackDark
                                  ? 'bg-white'
                                  : 'bg-primary'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCode(!showCode)}
                      className={`w-10 h-10 rounded-lg bg-neutral-100 dark:bg-[#242428] hover:bg-neutral-200 dark:hover:bg-white/10 border border-black/[0.06] dark:border-white/10 ${themeModeActiveText} flex items-center justify-center transition-colors active:scale-95`}
                      title={showCode ? 'Masquer' : 'Afficher'}
                    >
                      {showCode ? <EyeOffOutlineIcon size={18} /> : <EyeOutlineIcon size={18} />}
                    </button>

                    <button
                      type="button"
                      onClick={generateNewCode}
                      className={`w-10 h-10 rounded-lg bg-neutral-100 dark:bg-[#242428] hover:bg-neutral-200 dark:hover:bg-white/10 border border-black/[0.06] dark:border-white/10 ${themeModeActiveText} flex items-center justify-center transition-colors active:scale-95`}
                      title="Générer un nouveau code"
                    >
                      <RefreshOutlineIcon size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="h-10 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-contrast font-medium text-xs flex items-center gap-1.5 shadow-sm shadow-primary/25 transition-all active:scale-95"
                    >
                      <CopyOutlineIcon size={14} />
                      <span>{copied ? 'Copié !' : 'Copier'}</span>
                    </button>
                  </div>
                </div>

                {/* Accordéon "Lier un appareil existant" */}
                <div className="pt-2 border-t border-black/[0.06] dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsLinkingDeviceOpen(!isLinkingDeviceOpen)}
                    className="w-full flex items-center justify-between text-left py-1.5 group select-none"
                  >
                    <div className="flex items-center gap-3">
                      <SettingsIconBadge backgroundColor="#007AFF" icon={PhonePortraitIcon} size={16} />
                      <span className="text-[15px] font-medium text-neutral-900 dark:text-white group-hover:text-primary transition-colors">
                        Lier un appareil existant
                      </span>
                    </div>
                    <ChevronDownIcon
                      size={16}
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
                          className="flex-1 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-[#242428] border border-black/[0.06] dark:border-white/10 text-xs text-neutral-900 dark:text-white font-mono placeholder-neutral-400 focus:outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (linkCodeInput.trim().length === 6) {
                              const sc = linkCodeInput.trim().toUpperCase();
                              setSyncCode(sc);
                              try {
                                localStorage.setItem('cinelyon_sync_code', sc);
                              } catch {}
                              setLinkCodeInput('');
                              setIsLinkingDeviceOpen(false);
                              showStatus('Appareil lié avec succès');
                            }
                          }}
                          className="px-4 py-2 rounded-lg bg-primary text-primary-contrast text-xs font-medium shadow-sm active:scale-95"
                        >
                          Lier
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── 2. Section AMIS SUIVIS ── */}
              <div className="space-y-1.5">
                <span className="text-[13px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 px-3">
                  {t('settings.friends')} ({friends.length})
                </span>

                <div className="rounded-[22px] bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/10 shadow-sm divide-y divide-black/[0.06] dark:divide-white/10 overflow-hidden">
                  {/* Ligne Ajouter un ami */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <SettingsIconBadge backgroundColor="#5856D6" icon={PersonAddIcon} size={16} />
                      <span className="text-[15px] font-medium text-neutral-900 dark:text-white">
                        {t('settings.addFriend')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddingFriendOpen(!isAddingFriendOpen)}
                      className="text-primary hover:opacity-80 active:scale-95 transition-all p-1"
                      title={t('settings.addFriend')}
                    >
                      <AddCircleIcon size={22} />
                    </button>
                  </div>

                  {/* Formulaire dépliable Ajouter un ami */}
                  {isAddingFriendOpen && (
                    <div className="p-4 bg-neutral-50 dark:bg-black/20 space-y-2.5 animate-in fade-in duration-150">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Code (6 lettres)"
                          value={newFriendCode}
                          onChange={(e) => setNewFriendCode(e.target.value.toUpperCase())}
                          className="w-32 px-3 py-2 rounded-lg bg-white dark:bg-[#242428] border border-black/[0.06] dark:border-white/10 text-xs text-neutral-900 dark:text-white font-mono placeholder-neutral-400 focus:outline-none focus:border-primary"
                        />
                        <input
                          type="text"
                          placeholder="Prénom"
                          value={newFriendName}
                          onChange={(e) => setNewFriendName(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-[#242428] border border-black/[0.06] dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-primary"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddFriend}
                        className="w-full py-2 rounded-lg bg-primary text-primary-contrast text-xs font-medium shadow-sm active:scale-95"
                      >
                        Valider l&apos;ami
                      </button>
                    </div>
                  )}

                  {/* Liste des Amis */}
                  {friends.map((friend) => {
                    const isCodeRevealed = !!revealedFriendCodes[friend.id];
                    const isEditing = editingFriendId === friend.id;

                    return (
                      <div key={friend.id} className="px-4 py-3 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors text-left group">
                        {isEditing ? (
                          <div className="flex-1 flex items-center gap-2 mr-2">
                            <input
                              type="text"
                              value={editFriendName}
                              onChange={(e) => setEditFriendName(e.target.value)}
                              placeholder="Nom"
                              className="w-28 px-2 py-1 rounded-md bg-neutral-100 dark:bg-[#242428] text-xs text-neutral-900 dark:text-white focus:outline-none"
                            />
                            <input
                              type="text"
                              maxLength={6}
                              value={editFriendCode}
                              onChange={(e) => setEditFriendCode(e.target.value.toUpperCase())}
                              placeholder="Code"
                              className="w-20 px-2 py-1 rounded-md bg-neutral-100 dark:bg-[#242428] text-xs font-mono text-neutral-900 dark:text-white focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleSaveEditFriend}
                              className="p-1 rounded-md bg-primary text-primary-contrast"
                              title="Valider"
                            >
                              <CheckmarkIcon size={13} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3.5">
                            <div className="w-[30px] h-[30px] rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-medium text-xs shrink-0">
                              {friend.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="text-[15px] font-medium block text-neutral-900 dark:text-white leading-tight">
                                {friend.name}
                              </span>
                              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-normal block mt-0.5 leading-snug">
                                Code : {isCodeRevealed ? friend.code.toUpperCase() : '••••••'} •{' '}
                                {friend.favoritesCount} favori{friend.favoritesCount > 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleRevealFriendCode(friend.id)}
                            className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-500 dark:text-neutral-300 flex items-center justify-center transition-colors"
                            title={isCodeRevealed ? 'Masquer le code' : 'Afficher le code'}
                          >
                            {isCodeRevealed ? <EyeOffOutlineIcon size={14} /> : <EyeOutlineIcon size={14} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEditFriend(friend)}
                            className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-500 dark:text-neutral-300 flex items-center justify-center transition-colors"
                            title="Modifier l'ami"
                          >
                            <PencilIcon size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFriend(friend.id)}
                            className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-500 flex items-center justify-center transition-colors"
                            title="Supprimer l'ami"
                          >
                            <TrashOutlineIcon size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs text-neutral-500 dark:text-neutral-400 px-3 pt-1.5 leading-relaxed font-normal">
                  {t('settings.friendsFooter')}
                </p>
              </div>

              {/* ── 3. Section GÉNÉRAL ── */}
              <div className="space-y-1.5">
                <span className="text-[13px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 px-3">
                  {t('settings.generalHeader')}
                </span>

                <div className="rounded-[22px] bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/10 shadow-sm divide-y divide-black/[0.06] dark:divide-white/10 overflow-hidden">
                  {/* Langue avec drapeau SVG */}
                  <div className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors text-left group">
                    <div className="flex items-center gap-3.5">
                      <SettingsIconBadge backgroundColor="#007AFF" icon={LanguageIcon} size={17} />
                      <span className="text-[15px] font-medium text-neutral-900 dark:text-white">
                        {t('settings.language')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <FlagIcon code={locale} size={18} />
                      <select
                        value={locale}
                        onChange={(e) => setLocale(e.target.value as SupportedLocale)}
                        className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-[#242428] text-xs font-medium text-neutral-900 dark:text-white border-none focus:outline-none cursor-pointer"
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
                  <div className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors text-left group">
                    <div className="flex items-center gap-3.5 pr-2 min-w-0">
                      <SettingsIconBadge backgroundColor="#FF3B30" icon={NotificationsIcon} size={17} />
                      <div className="min-w-0">
                        <span className="text-[15px] font-medium text-neutral-900 dark:text-white block leading-tight">
                          {t('settings.notifTitle')}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-normal block mt-0.5 leading-snug">
                          {t('settings.notifDesc')}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setNotifications(!notifications)}
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                        notifications ? switchActiveTrack : 'bg-neutral-300 dark:bg-neutral-700'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full transition-transform shadow-xs ${
                          notifications ? `left-6 ${switchActiveThumb}` : 'left-1 bg-white'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Masquer les séances passées */}
                  <div className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors text-left group">
                    <div className="flex items-center gap-3.5 pr-2 min-w-0">
                      <SettingsIconBadge backgroundColor="#FF9500" icon={TimeIcon} size={17} />
                      <div className="min-w-0">
                        <span className="text-[15px] font-medium text-neutral-900 dark:text-white block leading-tight">
                          {t('settings.hidePastTitle')}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-normal block mt-0.5 leading-snug">
                          {t('settings.hidePastDesc')}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = !hidePast;
                        setHidePast(nextVal);
                        try {
                          localStorage.setItem('cinelyon_hide_past_sessions', nextVal ? 'true' : 'false');
                          window.dispatchEvent(
                            new CustomEvent('cinelyon:settings-changed', {
                              detail: { hidePastSessions: nextVal },
                            })
                          );
                        } catch {}
                      }}
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                        hidePast ? switchActiveTrack : 'bg-neutral-300 dark:bg-neutral-700'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full transition-transform shadow-xs ${
                          hidePast ? `left-6 ${switchActiveThumb}` : 'left-1 bg-white'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Préférer les logos originaux (VO) */}
                  <div className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors text-left group">
                    <div className="flex items-center gap-3.5 pr-2 min-w-0">
                      <SettingsIconBadge backgroundColor="#5856D6" icon={LanguageIcon} size={17} />
                      <div className="min-w-0">
                        <span className="text-[15px] font-medium text-neutral-900 dark:text-white block leading-tight">
                          {t('settings.voLogosTitle')}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-normal block mt-0.5 leading-snug">
                          {t('settings.voLogosDesc')}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = !useOriginalTitleLogo;
                        setUseOriginalTitleLogo(nextVal);
                        try {
                          localStorage.setItem('cinelyon_useOriginalTitleLogo', nextVal ? 'true' : 'false');
                          window.dispatchEvent(
                            new CustomEvent('cinelyon:settings-changed', {
                              detail: { useOriginalTitleLogo: nextVal },
                            })
                          );
                        } catch {}
                      }}
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                        useOriginalTitleLogo ? switchActiveTrack : 'bg-neutral-300 dark:bg-neutral-700'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full transition-transform shadow-xs ${
                          useOriginalTitleLogo ? `left-6 ${switchActiveThumb}` : 'left-1 bg-white'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* ── 4. Section APPARENCE ── */}
              <div className="space-y-1.5">
                <span className="text-[13px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 px-3">
                  {t('settings.appearanceHeader')}
                </span>

                <div className="rounded-[22px] bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/10 shadow-sm divide-y divide-black/[0.06] dark:divide-white/10 overflow-hidden">
                  {/* Mode Sombre / Clair / Système */}
                  <div className="px-4 py-3.5 space-y-3">
                    <div className="flex items-center gap-3">
                      <SettingsIconBadge backgroundColor="#AF52DE" icon={ColorPaletteIcon} size={17} />
                      <span className="text-[15px] font-medium text-neutral-900 dark:text-white leading-tight">
                        {t('settings.themeMode')}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-1 bg-neutral-100 dark:bg-[#242428] rounded-xl">
                      <button
                        type="button"
                        onClick={() => setMode('system')}
                        className={`py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                          mode === 'system'
                            ? `bg-white dark:bg-[#1c1c1e] ${themeModeActiveText} shadow-sm font-semibold`
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        <PhonePortraitIcon size={14} />
                        <span>{t('settings.themeSystem')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode('light')}
                        className={`py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                          mode === 'light'
                            ? `bg-white dark:bg-[#1c1c1e] ${themeModeActiveText} shadow-sm font-semibold`
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        <SunnyOutlineIcon size={14} />
                        <span>{t('settings.themeLight')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode('dark')}
                        className={`py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                          mode === 'dark'
                            ? `bg-white dark:bg-[#1c1c1e] ${themeModeActiveText} shadow-sm font-semibold`
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        <MoonOutlineIcon size={14} />
                        <span>{t('settings.themeDark')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Couleur Principale */}
                  <div className="px-4 py-3.5 space-y-3">
                    <div className="flex items-center gap-3">
                      <SettingsIconBadge backgroundColor="#5856D6" icon={BrushIcon} size={17} />
                      <span className="text-[15px] font-medium text-neutral-900 dark:text-white leading-tight">
                        {t('settings.primaryColor')}
                      </span>
                    </div>

                    <div className="flex items-center justify-around py-1">
                      {[
                        { id: 'violet', label: t('settings.colorViolet'), color: 'bg-[#444cf7]' },
                        { id: 'blue', label: t('settings.colorBlue'), color: 'bg-[#0161a7]' },
                        { id: 'white', label: t('settings.colorWhite'), color: 'bg-white border-2 border-neutral-300 dark:border-white/30' },
                        { id: 'black', label: t('settings.colorBlack'), color: 'bg-[#1c1c1e] border-2 border-neutral-300 dark:border-white/30' },
                      ].map((c) => {
                        const isSelected = primaryColor === c.id;
                        const isWhiteOption = c.id === 'white';
                        const checkColor = isWhiteOption ? '#121212' : '#ffffff';
                        const ringColor = isSelected
                          ? isWhiteOption && !isDark
                            ? 'ring-neutral-800'
                            : 'ring-primary'
                          : '';

                        return (
                          <div
                            key={c.id}
                            onClick={() => setPrimaryColor(c.id as any)}
                            className="flex flex-col items-center gap-1.5 cursor-pointer select-none group"
                          >
                            <div
                              className={`w-9 h-9 rounded-full ${c.color} flex items-center justify-center shadow-sm relative transition-transform active:scale-95 ${
                                isSelected ? `ring-2 ring-offset-2 ${ringColor} ring-offset-white dark:ring-offset-[#1c1c1e] scale-105` : ''
                              }`}
                            >
                              {isSelected && (
                                <CheckmarkIcon
                                  size={16}
                                  color={checkColor}
                                />
                              )}
                            </div>
                            <span className={`text-xs transition-colors ${
                              isSelected ? 'text-neutral-900 dark:text-white font-semibold' : 'text-neutral-500 dark:text-neutral-400 font-normal'
                            }`}>
                              {c.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 5. DONNÉES PERSONNELLES & CONFIDENTIALITÉ (RGPD) ── */}
              <div className="space-y-1.5">
                <span className="text-[13px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 px-3">
                  {t('settings.gdprHeader')}
                </span>

                <div className="rounded-[22px] bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/10 shadow-sm divide-y divide-black/[0.06] dark:divide-white/10 overflow-hidden">
                  {/* Exporter */}
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <SettingsIconBadge backgroundColor="#007AFF" icon={ShareSocialIcon} size={17} />
                      <div className="min-w-0">
                        <span className="text-[15px] font-medium text-neutral-900 dark:text-white block leading-tight">
                          {t('settings.exportData')}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-normal block mt-0.5 leading-snug">
                          {t('settings.exportDataSubtitle')}
                        </span>
                      </div>
                    </div>
                    <ChevronForwardIcon size={18} className="text-neutral-400/80 dark:text-neutral-500/80 shrink-0 ml-2" />
                  </button>

                  {/* Importer */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <SettingsIconBadge backgroundColor="#34C759" icon={DownloadOutlineIcon} size={17} />
                      <div className="min-w-0">
                        <span className="text-[15px] font-medium text-neutral-900 dark:text-white block leading-tight">
                          {t('settings.importData')}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-normal block mt-0.5 leading-snug">
                          {t('settings.importDataSubtitle')}
                        </span>
                      </div>
                    </div>
                    <ChevronForwardIcon size={18} className="text-neutral-400/80 dark:text-neutral-500/80 shrink-0 ml-2" />
                  </button>

                  {/* Supprimer mes données */}
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <SettingsIconBadge backgroundColor="#FF3B30" icon={TrashOutlineIcon} size={17} />
                      <div className="min-w-0">
                        <span className="text-[15px] font-medium text-[#FF3B30] dark:text-[#FF453A] block leading-tight">
                          {t('settings.deleteData')}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-normal block mt-0.5 leading-snug">
                          {t('settings.deleteDataSubtitle')}
                        </span>
                      </div>
                    </div>
                    <ChevronForwardIcon size={18} className="text-neutral-400/80 dark:text-neutral-500/80 shrink-0 ml-2" />
                  </button>
                </div>

                {/* Note explicative RGPD */}
                <p className="text-xs text-neutral-500 dark:text-neutral-400 px-3 pt-1.5 leading-relaxed font-normal">
                  {t('settings.gdprDesc')}
                </p>
              </div>

              {/* ── 6. ASSISTANCE & INFORMATIONS LÉGALES (Identique à CinéLyon App) ── */}
              <div className="space-y-1.5">
                <span className="text-[13px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 px-3">
                  Assistance &amp; À propos
                </span>

                <div className="rounded-[22px] bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/10 shadow-sm divide-y divide-black/[0.06] dark:divide-white/10 overflow-hidden">
                  {/* Suggestions & Retours */}
                  <a
                    href="/suggestions"
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <SettingsIconBadge backgroundColor="#007AFF" icon={HelpCircleIcon} size={17} />
                      <div className="min-w-0">
                        <span className="text-[15px] font-medium text-neutral-900 dark:text-white block leading-tight">
                          Suggestions &amp; Retours
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-normal block mt-0.5 leading-snug">
                          Partagez vos idées pour améliorer CinéLyon
                        </span>
                      </div>
                    </div>
                    <ChevronForwardIcon size={18} className="text-neutral-400/80 dark:text-neutral-500/80 shrink-0 ml-2" />
                  </a>

                  {/* Politique de confidentialité */}
                  <a
                    href="/politique-de-confidentialite"
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <SettingsIconBadge backgroundColor="#34C759" icon={ShieldCheckmarkIcon} size={17} />
                      <div className="min-w-0">
                        <span className="text-[15px] font-medium text-neutral-900 dark:text-white block leading-tight">
                          {t('settings.privacyPolicy')}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-normal block mt-0.5 leading-snug">
                          Protection des données &amp; vie privée
                        </span>
                      </div>
                    </div>
                    <ChevronForwardIcon size={18} className="text-neutral-400/80 dark:text-neutral-500/80 shrink-0 ml-2" />
                  </a>

                  {/* Conditions Générales d'Utilisation (CGU) */}
                  <a
                    href="/cgu"
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <SettingsIconBadge backgroundColor="#8E8E93" icon={DocumentTextIcon} size={17} />
                      <div className="min-w-0">
                        <span className="text-[15px] font-medium text-neutral-900 dark:text-white block leading-tight">
                          {t('settings.termsOfService')}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-normal block mt-0.5 leading-snug">
                          Conditions d&apos;utilisation et mentions
                        </span>
                      </div>
                    </div>
                    <ChevronForwardIcon size={18} className="text-neutral-400/80 dark:text-neutral-500/80 shrink-0 ml-2" />
                  </a>

                  {/* Mentions Légales */}
                  <a
                    href="/mentions-legales"
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <SettingsIconBadge backgroundColor="#5AC8FA" icon={InformationCircleIcon} size={17} />
                      <div className="min-w-0">
                        <span className="text-[15px] font-medium text-neutral-900 dark:text-white block leading-tight">
                          {t('settings.legalNotices') || 'Mentions Légales'}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-normal block mt-0.5 leading-snug">
                          Édition, hébergement &amp; crédits
                        </span>
                      </div>
                    </div>
                    <ChevronForwardIcon size={18} className="text-neutral-400/80 dark:text-neutral-500/80 shrink-0 ml-2" />
                  </a>
                </div>
              </div>

              {/* ── 6. RÉSEAUX SOCIAUX & LIENS OFFICIELS (CinéLyon App Style) ── */}
              <div className="pt-5 pb-3 flex flex-col items-center gap-4">
                <div className="flex items-center justify-center gap-3">
                  {/* Letterboxd */}
                  <a
                    href="https://boxd.it/6GBU5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-full bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:border-primary/40 dark:hover:border-primary/40 hover:text-primary hover:scale-105 active:scale-95 transition-all shadow-sm"
                    title="Letterboxd @CineLyon"
                    aria-label="Profil Letterboxd de CinéLyon"
                  >
                    <LetterboxdLogo width={20} height={20} />
                  </a>

                  {/* Serializd */}
                  <a
                    href="https://srlzd.com/u/skyfear"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-full bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:border-primary/40 dark:hover:border-primary/40 hover:text-primary hover:scale-105 active:scale-95 transition-all shadow-sm"
                    title="Serializd"
                    aria-label="Profil Serializd"
                  >
                    <SerializdLogo size={20} />
                  </a>

                  {/* Twitter / X */}
                  <a
                    href="https://x.com/abduplt?s=21"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-full bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:border-primary/40 dark:hover:border-primary/40 hover:text-black dark:hover:text-white hover:scale-105 active:scale-95 transition-all shadow-sm"
                    title="Twitter / X @abduplt"
                    aria-label="Compte Twitter de CinéLyon"
                  >
                    <TwitterLogo size={17} />
                  </a>

                  {/* Instagram */}
                  <a
                    href="https://www.instagram.com/cinelyon.fr/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-full bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:border-primary/40 dark:hover:border-primary/40 hover:text-primary hover:scale-105 active:scale-95 transition-all shadow-sm"
                    title="Instagram @cinelyon.fr"
                    aria-label="Page Instagram officielle de CinéLyon"
                  >
                    <InstagramLogo size={20} />
                  </a>
                </div>

                {/* Footer App Version & Craft */}
                <div className="text-center space-y-0.5">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                    CinéLyon Web · v3.0
                  </p>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                    {t('settings.craftedWithLove')}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Modal Confirmation de Suppression */}
          <AnimatePresence>
            {showDeleteConfirm && (
              <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm pointer-events-auto">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="w-full max-w-sm bg-white dark:bg-[#1c1c1e] rounded-[24px] p-5 shadow-2xl border border-black/10 dark:border-white/10 text-center space-y-3"
                >
                  <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                    <WarningOutlineIcon size={24} />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                    Supprimer toutes vos données ?
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-normal leading-relaxed">
                    Cette action réinitialisera l&apos;ensemble de vos favoris, amis suivis et réglages sur cet appareil. Cette opération est irréversible.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2 rounded-xl bg-neutral-100 dark:bg-white/10 text-xs font-medium text-neutral-700 dark:text-neutral-300"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAllData}
                      className="flex-1 py-2 rounded-xl bg-rose-500 text-xs font-medium text-white shadow-sm"
                    >
                      Confirmer
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
