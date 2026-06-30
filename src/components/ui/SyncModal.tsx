'use client';
// src/components/ui/SyncModal.tsx
// Modale de synchronisation d'appareils, gestion des amis et paramètres (sans aucun émoji)

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { SyncDevice, FriendFollow } from '@/types';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncId: string;
  deviceId: string;
  favorites: string[];
  onSyncComplete: (newSyncId: string) => void;
  onFriendsUpdate: () => void;
  hidePastShowtimes: boolean;
  onHidePastShowtimesChange: (val: boolean) => void;
}

export default function SyncModal({
  isOpen,
  onClose,
  syncId,
  deviceId,
  favorites,
  onSyncComplete,
  onFriendsUpdate,
  hidePastShowtimes,
  onHidePastShowtimesChange,
}: SyncModalProps) {
  const [activeTab, setActiveTab] = useState<'device' | 'friends'>('device');
  const [syncCodeInput, setSyncCodeInput] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [devices, setDevices] = useState<SyncDevice[]>([]);
  
  // Onglet Amis
  const [friendAddMode, setFriendAddMode] = useState<'code' | 'name'>('code');
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [friendNameInput, setFriendNameInput] = useState('');
  const [friendSearchInput, setFriendSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<{ user_id: string; pseudo: string }[]>([]);
  const [friendsList, setFriendsList] = useState<(FriendFollow & { is_hidden?: boolean })[]>([]);
  
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'warning' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  const getSyncCode = useCallback(() => {
    return syncId ? syncId.substring(0, 6).toUpperCase() : '------';
  }, [syncId]);

  // Charger les appareils synchronisés
  const loadDevices = useCallback(async () => {
    if (!syncId) return;
    try {
      const { data, error } = await supabase
        .from('sync_devices')
        .select('*')
        .eq('sync_id', syncId)
        .order('last_seen', { ascending: false });

      if (error) throw error;
      setDevices(data || []);
    } catch (e) {
      console.warn('Erreur chargement appareils:', e);
    }
  }, [syncId]);

  // Charger les amis suivis
  const loadFriends = useCallback(async () => {
    if (!syncId) return;
    try {
      const { data, error } = await supabase
        .from('friend_follows')
        .select('*')
        .eq('follower_id', syncId);

      if (error) throw error;
      setFriendsList(data || []);
    } catch (e) {
      console.warn('Erreur chargement amis:', e);
    }
  }, [syncId]);

  // Enregistrer ou rafraîchir l'appareil actuel dans Supabase
  const registerCurrentDevice = useCallback(async () => {
    if (!syncId || !deviceId) return;
    try {
      const defaultName = typeof window !== 'undefined' ? (window.navigator.userAgent.includes('Mobile') ? 'Mobile Web' : 'Desktop Web') : 'Web';
      const name = localStorage.getItem('cinelyon_device_name') || defaultName;
      setDeviceName(name);

      const { data, error: checkError } = await supabase
        .from('sync_devices')
        .select('*')
        .eq('sync_id', syncId)
        .eq('device_id', deviceId);

      if (checkError) throw checkError;

      const payload = {
        sync_id: syncId,
        device_id: deviceId,
        name: name,
        last_seen: new Date().toISOString(),
      };

      if (data && data.length > 0) {
        await supabase
          .from('sync_devices')
          .update(payload)
          .eq('sync_id', syncId)
          .eq('device_id', deviceId);
      } else {
        await supabase.from('sync_devices').insert(payload);
      }

      loadDevices();
    } catch (e) {
      console.warn('Erreur enregistrement appareil:', e);
    }
  }, [syncId, deviceId, loadDevices]);

  useEffect(() => {
    if (isOpen && syncId) {
      registerCurrentDevice();
      loadDevices();
      loadFriends();
    }
  }, [isOpen, syncId, registerCurrentDevice, loadDevices, loadFriends]);

  // Copier le code de sync
  const copySyncCode = () => {
    const code = getSyncCode();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code)
        .then(() => showToast('Code copié !'))
        .catch(() => showToast('Impossible de copier le code', 'warning'));
    } else {
      showToast('Copie non supportée sur ce navigateur', 'warning');
    }
  };

  // Lier l'appareil à un compte existant
  const linkDevice = async () => {
    const code = syncCodeInput.trim().toUpperCase();
    if (code.length !== 6) {
      showToast('Le code doit comporter 6 caractères', 'warning');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('user_id, films')
        .like('user_id', `${code.toLowerCase()}%`);

      if (error) throw error;

      if (!data || data.length === 0) {
        showToast('Code introuvable. Vérifiez la saisie.', 'warning');
        return;
      }

      const remoteId = data[0].user_id;
      const remoteFilms = data[0].films || [];

      const merged = Array.from(new Set([...favorites, ...remoteFilms]));

      localStorage.setItem('cinelyon_sync_id', remoteId);
      localStorage.setItem('cinelyon_local_updated_at', new Date().toISOString());

      await supabase
        .from('favorites')
        .upsert({
          user_id: remoteId,
          films: merged,
          updated_at: new Date().toISOString()
        });

      showToast('Appareils synchronisés !');
      onSyncComplete(remoteId);
      setSyncCodeInput('');
    } catch (e) {
      console.error('Erreur liaison:', e);
      showToast('Une erreur est survenue lors de la liaison', 'warning');
    }
  };

  // Déconnecter cet appareil
  const unlinkDevice = () => {
    if (confirm('Voulez-vous vraiment déconnecter cet appareil ?\nVos favoris actuels resteront enregistrés ici.')) {
      const newSyncId = crypto.randomUUID();
      localStorage.setItem('cinelyon_sync_id', newSyncId);
      localStorage.setItem('cinelyon_local_updated_at', new Date().toISOString());
      
      showToast('Appareil déconnecté !');
      onSyncComplete(newSyncId);
    }
  };

  // Modifier le nom de l'appareil
  const renameDevice = async (targetDeviceId: string, currentName: string) => {
    const newName = prompt('Nom de l\'appareil :', currentName);
    if (!newName || !newName.trim()) return;

    try {
      const { error } = await supabase
        .from('sync_devices')
        .update({ name: newName.trim() })
        .eq('sync_id', syncId)
        .eq('device_id', targetDeviceId);

      if (error) throw error;
      
      if (targetDeviceId === deviceId) {
        localStorage.setItem('cinelyon_device_name', newName.trim());
        setDeviceName(newName.trim());
      }
      
      loadDevices();
      showToast('Nom mis à jour !');
    } catch (e) {
      showToast('Erreur lors du renommage', 'warning');
    }
  };

  // Ajouter un ami par son code
  const addFriendByCode = async () => {
    const code = friendCodeInput.trim().toUpperCase();
    const pseudo = friendNameInput.trim();

    if (code.length !== 6) {
      showToast('Le code doit comporter 6 caractères', 'warning');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('user_id, pseudo')
        .like('user_id', `${code.toLowerCase()}%`);

      if (error) throw error;

      if (!data || data.length === 0) {
        showToast('Code d\'ami introuvable.', 'warning');
        return;
      }

      const friendId = data[0].user_id;
      const finalName = pseudo || data[0].pseudo || `Ami ${code}`;

      if (friendId === syncId) {
        showToast('Vous ne pouvez pas vous ajouter vous-même !', 'warning');
        return;
      }

      const { error: followError } = await supabase
        .from('friend_follows')
        .upsert({
          follower_id: syncId,
          followed_id: friendId,
          followed_name: finalName,
          created_at: new Date().toISOString()
        });

      if (followError) throw followError;

      showToast('Ami ajouté avec succès !');
      setFriendCodeInput('');
      setFriendNameInput('');
      loadFriends();
      onFriendsUpdate();
    } catch (e) {
      console.error(e);
      showToast('Erreur lors de l\'ajout d\'ami', 'warning');
    }
  };

  // Rechercher un ami par nom / pseudo
  useEffect(() => {
    const searchFriends = async () => {
      const q = friendSearchInput.trim();
      if (q.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('user_id, pseudo')
          .ilike('pseudo', `%${q}%`)
          .limit(5);

        if (error) throw error;

        setSearchResults((data || []).filter((u) => u.user_id !== syncId));
      } catch (e) {
        console.warn(e);
      }
    };

    const debounce = setTimeout(searchFriends, 300);
    return () => clearTimeout(debounce);
  }, [friendSearchInput, syncId]);

  // Ajouter un ami depuis les résultats de recherche
  const addFriendFromSearch = async (friendId: string, pseudo: string) => {
    try {
      const { error } = await supabase
        .from('friend_follows')
        .upsert({
          follower_id: syncId,
          followed_id: friendId,
          followed_name: pseudo,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      showToast(`Ami ${pseudo} ajouté !`);
      setFriendSearchInput('');
      setSearchResults([]);
      loadFriends();
      onFriendsUpdate();
    } catch (e) {
      showToast('Erreur lors de l\'ajout', 'warning');
    }
  };

  // Supprimer un ami
  const removeFriend = async (followedId: string, name: string) => {
    if (confirm(`Voulez-vous vraiment supprimer ${name} de vos amis ?`)) {
      try {
        const { error } = await supabase
          .from('friend_follows')
          .delete()
          .eq('follower_id', syncId)
          .eq('followed_id', followedId);

        if (error) throw error;

        showToast('Ami supprimé');
        loadFriends();
        onFriendsUpdate();
      } catch (e) {
        showToast('Erreur suppression', 'warning');
      }
    }
  };

  // Masquer / Afficher les favoris d'un ami
  const toggleHideFriend = async (friend: FriendFollow & { is_hidden?: boolean }) => {
    const nextHidden = !friend.is_hidden;
    try {
      const { error } = await supabase
        .from('friend_follows')
        .update({ is_hidden: nextHidden })
        .eq('follower_id', syncId)
        .eq('followed_id', friend.followed_id);

      if (error) throw error;

      showToast(nextHidden ? 'Favoris masqués' : 'Favoris affichés');
      loadFriends();
      onFriendsUpdate();
    } catch (e) {
      showToast('Erreur modification ami', 'warning');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="sync-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="sync-modal" onClick={(e) => e.stopPropagation()}>
        <button className="sync-modal-close" onClick={onClose} aria-label="Fermer">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Onglets */}
        <div className="sync-modal-tabs">
          <button
            className={`sync-modal-tab${activeTab === 'device' ? ' active' : ''}`}
            onClick={() => setActiveTab('device')}
          >
            Mes Appareils
          </button>
          <button
            className={`sync-modal-tab${activeTab === 'friends' ? ' active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            Mes Amis
          </button>
        </div>

        {/* Toast interne */}
        {toastMsg && (
          <div className={`sync-toast toast-${toastMsg.type}`}>
            {toastMsg.text}
          </div>
        )}

        {/* ── Onglet Appareils ── */}
        {activeTab === 'device' && (
          <div className="sync-tab-content active">
            {/* Paramètres d'affichage locaux */}
            <div className="sync-modal-section" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 16, marginBottom: 16 }}>
              <p className="sync-modal-label">Options d'affichage</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text-main)' }}>Masquer les séances passées</span>
                <label className="toggle-switch-wrap" style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
                  <input
                    type="checkbox"
                    checked={hidePastShowtimes}
                    onChange={(e) => onHidePastShowtimesChange(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span className={`slider round${hidePastShowtimes ? ' active' : ''}`} style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: hidePastShowtimes ? 'var(--primary)' : '#ccc',
                    transition: '0.3s',
                    borderRadius: 24
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: 16, width: 16,
                      left: hidePastShowtimes ? 24 : 4,
                      bottom: 4,
                      backgroundColor: 'white',
                      transition: '0.3s',
                      borderRadius: '50%'
                    }} />
                  </span>
                </label>
              </div>
            </div>

            <div className="sync-modal-section">
              <p className="sync-modal-label">Votre code de synchro :</p>
              <div className="sync-code-display">
                <span id="sync-code">{getSyncCode()}</span>
                <button className="sync-copy-btn" onClick={copySyncCode} title="Copier le code" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="sync-modal-divider">
              <span>ou</span>
            </div>

            <div className="sync-modal-section">
              <p className="sync-modal-label">Entrer un code pour lier cet appareil :</p>
              <div className="sync-input-row">
                <input
                  type="text"
                  className="sync-code-input"
                  maxLength={6}
                  placeholder="ABC123"
                  value={syncCodeInput}
                  onChange={(e) => setSyncCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  aria-label="Code de synchronisation"
                />
                <button className="sync-link-btn" onClick={linkDevice}>
                  Lier
                </button>
              </div>
            </div>
            
            <p className="sync-modal-hint">
              Liez vos différents navigateurs et smartphones pour retrouver vos favoris de manière transparente !
            </p>

            <div className="sync-modal-divider"></div>

            <div className="sync-modal-section">
              <p className="sync-modal-label">Appareils synchronisés :</p>
              <div className="synced-devices-list">
                {devices.length === 0 ? (
                  <p className="friends-empty">Aucun appareil enregistré</p>
                ) : (
                  devices.map((device) => {
                    const isCurrent = device.device_id === deviceId;
                    return (
                      <div key={device.device_id} className="friend-item">
                        <div className="friend-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                            <line x1="8" y1="21" x2="16" y2="21" />
                            <line x1="12" y1="17" x2="12" y2="21" />
                          </svg>
                        </div>
                        <div className="friend-info">
                          <div className="friend-name-row">
                            <span className="friend-name">
                              {device.name || 'Appareil Web'} {isCurrent ? '(Moi)' : ''}
                            </span>
                            <button
                              className="friend-edit-btn"
                              onClick={() => renameDevice(device.device_id, device.name || '')}
                              title="Modifier le nom"
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                              </svg>
                            </button>
                          </div>
                          <div className="friend-stats">
                            Activité : {new Date(device.last_seen).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="sync-modal-divider"></div>
            <button className="sync-unlink-btn" onClick={unlinkDevice}>
              Déconnecter et générer un nouveau code
            </button>
          </div>
        )}

        {/* ── Onglet Amis ── */}
        {activeTab === 'friends' && (
          <div className="sync-tab-content active">
            <div className="sync-modal-section">
              <p className="sync-modal-label">Ajouter un ami :</p>
              
              <div className="friend-add-mode-tabs">
                <button
                  className={`friend-mode-tab${friendAddMode === 'code' ? ' active' : ''}`}
                  onClick={() => setFriendAddMode('code')}
                >
                  Par code
                </button>
                <button
                  className={`friend-mode-tab${friendAddMode === 'name' ? ' active' : ''}`}
                  onClick={() => setFriendAddMode('name')}
                >
                  Par nom
                </button>
              </div>

              {friendAddMode === 'code' ? (
                <div className="friend-add-panel">
                  <div className="sync-input-row friends-add-row">
                    <input
                      type="text"
                      className="sync-code-input"
                      maxLength={6}
                      placeholder="CODE12"
                      value={friendCodeInput}
                      onChange={(e) => setFriendCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      aria-label="Code de l'ami"
                    />
                    <input
                      type="text"
                      className="friend-name-input"
                      maxLength={20}
                      placeholder="Prénom (optionnel)"
                      value={friendNameInput}
                      onChange={(e) => setFriendNameInput(e.target.value)}
                      aria-label="Prénom de l'ami"
                    />
                    <button className="sync-link-btn" onClick={addFriendByCode}>
                      Ajouter
                    </button>
                  </div>
                </div>
              ) : (
                <div className="friend-add-panel">
                  <input
                    type="text"
                    className="friend-name-search-input"
                    placeholder="Rechercher un prénom/pseudo..."
                    value={friendSearchInput}
                    onChange={(e) => setFriendSearchInput(e.target.value)}
                    aria-label="Recherche d'ami par nom"
                  />
                  {searchResults.length > 0 && (
                    <div className="friend-search-results">
                      {searchResults.map((user) => (
                        <div
                          key={user.user_id}
                          className="search-result-item"
                          onClick={() => addFriendFromSearch(user.user_id, user.pseudo || '')}
                        >
                          <span>{user.pseudo}</span>
                          <button className="add-btn-small" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="sync-modal-divider"></div>

            <div className="sync-modal-section">
              <p className="sync-modal-label">Mes amis :</p>
              <div className="friends-list">
                {friendsList.length === 0 ? (
                  <p className="friends-empty">Aucun ami ajouté pour l'instant</p>
                ) : (
                  friendsList.map((friend) => (
                    <div key={friend.followed_id} className="friend-item">
                      <div className="friend-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <div className="friend-info">
                        <div className="friend-name-row">
                          <span className={`friend-name${friend.is_hidden ? ' hidden-friend' : ''}`}>
                            {friend.followed_name}
                          </span>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="friend-action-btn"
                              onClick={() => toggleHideFriend(friend)}
                              title={friend.is_hidden ? 'Afficher les favoris' : 'Masquer les favoris'}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              {friend.is_hidden ? (
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              ) : (
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                  <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                              )}
                            </button>
                            <button
                              className="friend-action-btn delete"
                              onClick={() => removeFriend(friend.followed_id, friend.followed_name)}
                              title="Supprimer l'ami"
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
