'use client';
// src/components/ui/FilmsList.tsx
// Liste interactive des films avec filtres, favoris et synchro Supabase (Phase 2)

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Film, DateLabel, FriendFollow } from '@/types';
import { FilmCard } from './FilmCard';
import SearchFilters, { FiltersState } from './SearchFilters';
import ChatBot from './ChatBot';
import SyncModal from './SyncModal';
import { formatDayLabel } from '@/utils/dateUtils';
import { supabase } from '@/lib/supabase';

interface FilmsListProps {
  films: Film[];
  dates: DateLabel[];
  allGenres: string[];
  allDirectors: string[];
  allCinemas: string[];
  allFormats: string[];
}

const FAVORITES_KEY = 'cinelyon-favorites';
const SYNC_ID_KEY = 'cinelyon_sync_id';
const DEVICE_ID_KEY = 'cinelyon_device_id';

// Helpers UUID
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function loadLocalFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveLocalFavorites(favs: string[]) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    localStorage.setItem('cinelyon_local_updated_at', new Date().toISOString());
  } catch { /* ignore */ }
}

function normalizeStr(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export default function FilmsList({
  films,
  dates,
  allGenres,
  allDirectors,
  allCinemas,
  allFormats,
}: FilmsListProps) {
  const [filters, setFilters] = useState<FiltersState>({
    titleQuery: '',
    genre: '',
    director: '',
    cinema: '',
    format: '',
    dayIndex: '',
    showOnlyFavorites: false,
  });

  const [favorites, setFavorites] = useState<string[]>([]);
  const [syncId, setSyncId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  
  // Onglet favoris : 'perso' | 'amis'
  const [favTab, setFavTab] = useState<'perso' | 'amis'>('perso');
  
  // Liste d'amis et favoris d'amis
  const [friendsList, setFriendsList] = useState<FriendFollow[]>([]);
  const [friendsFavoritesMap, setFriendsFavoritesMap] = useState<Record<string, string[]>>({});
  
  const [hidePastShowtimes, setHidePastShowtimes] = useState(true);
  const [showGoTop, setShowGoTop] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Listen to global open-settings event to show the settings modal
  useEffect(() => {
    const handleOpenSettings = () => {
      setIsSyncModalOpen(true);
    };
    window.addEventListener('open-settings', handleOpenSettings);
    return () => window.removeEventListener('open-settings', handleOpenSettings);
  }, []);

  // Initialisation IDs et favoris locaux
  useEffect(() => {
    let sId = localStorage.getItem(SYNC_ID_KEY) || '';
    if (!sId) {
      sId = generateUUID();
      localStorage.setItem(SYNC_ID_KEY, sId);
    }
    setSyncId(sId);

    let dId = localStorage.getItem(DEVICE_ID_KEY) || '';
    if (!dId) {
      dId = generateUUID();
      localStorage.setItem(DEVICE_ID_KEY, dId);
    }
    setDeviceId(dId);

    setFavorites(loadLocalFavorites());
    setHidePastShowtimes(localStorage.getItem('cinelyon_hide_past_showtimes') !== 'false');
    setMounted(true);
  }, []);

  // Synchronisation depuis Supabase (Last Write Wins)
  useEffect(() => {
    if (!syncId || !mounted) return;

    const pullFromSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('films, updated_at')
          .eq('user_id', syncId);

        if (error) throw error;

        if (data && data.length > 0) {
          const remoteFilms = data[0].films || [];
          const remoteTime = new Date(data[0].updated_at || 0).getTime();
          const localTime = new Date(localStorage.getItem('cinelyon_local_updated_at') || 0).getTime();

          if (remoteTime > localTime) {
            setFavorites(remoteFilms);
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(remoteFilms));
            localStorage.setItem('cinelyon_local_updated_at', data[0].updated_at);
          } else if (localTime > remoteTime || remoteTime === 0) {
            // Push local to remote
            await supabase
              .from('favorites')
              .upsert({
                user_id: syncId,
                films: favorites,
                updated_at: new Date().toISOString()
              });
          }
        } else {
          // Aucun enregistrement distant, créer avec favoris locaux
          await supabase
            .from('favorites')
            .insert({
              user_id: syncId,
              films: favorites,
              updated_at: new Date().toISOString()
            });
        }
      } catch (e) {
        console.warn('Erreur synchro Supabase:', e);
      }
    };

    pullFromSupabase();
  }, [syncId, mounted]);

  // Push des favoris vers Supabase à chaque changement (avec debounce)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!syncId) return;

    const pushTimer = setTimeout(async () => {
      try {
        await supabase
          .from('favorites')
          .upsert({
            user_id: syncId,
            films: favorites,
            updated_at: new Date().toISOString()
          });
      } catch (e) {
        console.warn('Erreur push favoris:', e);
      }
    }, 800);

    return () => clearTimeout(pushTimer);
  }, [favorites, syncId]);

  // Charger les favoris des amis
  const loadFriendsFavorites = useCallback(async () => {
    if (!syncId) return;
    try {
      // 1. Récupérer les amis suivis non masqués
      const { data: follows, error: followError } = await supabase
        .from('friend_follows')
        .select('followed_id, followed_name')
        .eq('follower_id', syncId)
        .eq('is_hidden', false);

      if (followError) throw followError;

      if (!follows || follows.length === 0) {
        setFriendsFavoritesMap({});
        return;
      }

      // 2. Charger les listes de favoris pour chaque ami
      const followedIds = follows.map((f) => f.followed_id);
      const { data: favs, error: favsError } = await supabase
        .from('favorites')
        .select('user_id, films')
        .in('user_id', followedIds);

      if (favsError) throw favsError;

      // 3. Associer les films aux prénoms des amis
      const newMap: Record<string, string[]> = {};
      favs?.forEach((row) => {
        const friend = follows.find((f) => f.followed_id === row.user_id);
        const name = friend ? friend.followed_name : 'Ami';
        const filmsArray = row.films || [];
        
        filmsArray.forEach((filmId: string) => {
          if (!newMap[filmId]) {
            newMap[filmId] = [];
          }
          if (!newMap[filmId].includes(name)) {
            newMap[filmId].push(name);
          }
        });
      });

      setFriendsFavoritesMap(newMap);
    } catch (e) {
      console.warn('Erreur chargement favoris amis:', e);
    }
  }, [syncId]);

  useEffect(() => {
    if (syncId && mounted) {
      loadFriendsFavorites();
    }
  }, [syncId, mounted, loadFriendsFavorites]);

  // Bouton "go to top"
  useEffect(() => {
    const onScroll = () => setShowGoTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleFavorite = useCallback((filmId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(filmId)
        ? prev.filter((id) => id !== filmId)
        : [...prev, filmId];
      saveLocalFavorites(next);
      return next;
    });
  }, []);

  const handleSyncComplete = (newSyncId: string) => {
    setSyncId(newSyncId);
    // Recharger immédiatement favoris locaux
    setFavorites(loadLocalFavorites());
    loadFriendsFavorites();
  };

  // Filtrage côté client
  const filteredFilms = useMemo(() => {
    let result = films;
    const { titleQuery, genre, director, cinema, format, dayIndex, showOnlyFavorites } = filters;

    if (showOnlyFavorites) {
      if (favTab === 'perso') {
        result = result.filter((f) => favorites.includes(f.filmId));
      } else {
        // Favoris des Amis
        result = result.filter((f) => friendsFavoritesMap[f.filmId] && friendsFavoritesMap[f.filmId].length > 0);
      }
    }

    if (titleQuery.trim()) {
      const q = normalizeStr(titleQuery.trim());
      result = result.filter((f) => normalizeStr(f.title).includes(q));
    }

    if (genre) {
      const g = normalizeStr(genre);
      result = result.filter((f) => normalizeStr(f.genres || '').includes(g));
    }

    if (director) {
      const d = normalizeStr(director);
      result = result.filter((f) => normalizeStr(f.director || '').includes(d));
    }

    if (cinema) {
      result = result.filter((f) => {
        const dayEntries = Object.values(f.seancesByDay);
        return dayEntries.some((cinemas) => {
          const cinemaNames = Object.keys(cinemas);
          if (cinema.startsWith('group:')) {
            const group = cinema.split(':')[1];
            return cinemaNames.some((cn) => {
              const lc = cn.toLowerCase();
              if (group === 'pathe') return lc.includes('pathé');
              if (group === 'ugc') return lc.includes('ugc');
              if (group === 'lumiere')
                return lc.includes('lumière') || lc.includes('institut lumière');
              return false;
            });
          }
          return cinemaNames.some((cn) => normalizeStr(cn).includes(normalizeStr(cinema)));
        });
      });
    }

    if (format) {
      result = result.filter((f) =>
        (f.formats || '').toLowerCase().includes(format.toLowerCase())
      );
    }

    if (dayIndex !== '') {
      const idx = parseInt(dayIndex, 10);
      const targetDate = dates[idx];
      if (targetDate) {
        const label = formatDayLabel(targetDate);
        result = result.filter((f) => f.seancesByDay[label]);
      }
    }

    return result;
  }, [films, filters, favorites, dates, favTab, friendsFavoritesMap]);

  const dateOptions = useMemo(
    () => dates.map((d) => ({ label: formatDayLabel(d), index: d.index })),
    [dates]
  );

  // Liste des filtres actifs pour les chips
  const activeChips = useMemo(() => {
    const list: { key: keyof FiltersState; label: string }[] = [];
    if (filters.titleQuery) list.push({ key: 'titleQuery', label: `Recherche: "${filters.titleQuery}"` });
    if (filters.genre) {
      const matchingGenre = allGenres.find(g => g.toLowerCase() === filters.genre.toLowerCase());
      list.push({ key: 'genre', label: matchingGenre || filters.genre });
    }
    if (filters.director) {
      const matchingDir = allDirectors.find(d => d.toLowerCase() === filters.director.toLowerCase());
      list.push({ key: 'director', label: `Réal: ${matchingDir || filters.director}` });
    }
    if (filters.cinema) {
      let label = filters.cinema;
      if (filters.cinema === 'group:pathe') label = 'Pathé';
      else if (filters.cinema === 'group:ugc') label = 'UGC';
      else if (filters.cinema === 'group:lumiere') label = 'Lumière';
      else {
        const matchingCinema = allCinemas.find(c => c.toLowerCase() === filters.cinema.toLowerCase());
        label = matchingCinema || filters.cinema;
      }
      list.push({ key: 'cinema', label });
    }
    if (filters.dayIndex !== '') {
      const idx = parseInt(filters.dayIndex, 10);
      const targetDate = dates[idx];
      if (targetDate) list.push({ key: 'dayIndex', label: formatDayLabel(targetDate) });
    }
    if (filters.format) list.push({ key: 'format', label: filters.format.toUpperCase() });
    
    return list;
  }, [filters, allGenres, allDirectors, allCinemas, dates]);

  const removeChip = (key: keyof FiltersState) => {
    setFilters(prev => ({
      ...prev,
      [key]: key === 'dayIndex' ? '' : (key === 'showOnlyFavorites' ? false : '')
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      titleQuery: '',
      genre: '',
      director: '',
      cinema: '',
      format: '',
      dayIndex: '',
      showOnlyFavorites: false,
    });
  };

  return (
    <>
      <SearchFilters
        filters={filters}
        onFiltersChange={setFilters}
        allGenres={allGenres}
        allDirectors={allDirectors}
        allCinemas={allCinemas}
        allFormats={allFormats}
        dates={dateOptions}
        favoritesCount={mounted ? favorites.length : 0}
        onSyncClick={() => setIsSyncModalOpen(true)}
      />

      {/* ── Chips de filtres actifs (style mobile) ── */}
      {activeChips.length > 0 && (
        <div 
          className="active-chips-container" 
          style={{ 
            margin: '0 10% 12px 10%', 
            display: 'flex', 
            gap: 8, 
            flexWrap: 'wrap', 
            alignItems: 'center' 
          }}
        >
          {activeChips.map((chip) => (
            <div key={chip.key} className="filter-chip">
              <span className="filter-chip-label">{chip.label}</span>
              <button 
                type="button" 
                className="filter-chip-remove" 
                onClick={() => removeChip(chip.key)}
                aria-label={`Retirer le filtre ${chip.label}`}
              >
                ✕
              </button>
            </div>
          ))}
          <button 
            type="button" 
            className="filter-chips-clear-all" 
            onClick={clearAllFilters}
          >
            Tout effacer
          </button>
        </div>
      )}

      {/* ── Onglets de favoris : Mes favoris / Favoris amis ── */}
      {filters.showOnlyFavorites && (
        <div className="favorites-tabs-container">
          <div className="favorites-tabs">
            <button
              className={`fav-tab${favTab === 'perso' ? ' active' : ''}`}
              onClick={() => setFavTab('perso')}
            >
              Mes Favoris
            </button>
            <button
              className={`fav-tab${favTab === 'amis' ? ' active' : ''}`}
              onClick={() => setFavTab('amis')}
            >
              Favoris Amis
            </button>
          </div>
        </div>
      )}

      <div className="planning">
        {/* Compteur de résultats */}
        {(filters.titleQuery || filters.genre || filters.director || filters.cinema || filters.format || filters.dayIndex || filters.showOnlyFavorites) && (
          <p
            style={{
              margin: '0 10% 12px',
              fontSize: 14,
              color: 'var(--text-muted)',
              fontStyle: 'italic',
            }}
          >
            {filteredFilms.length} film{filteredFilms.length !== 1 ? 's' : ''} trouvé{filteredFilms.length !== 1 ? 's' : ''}
          </p>
        )}

        <div id="films-container" className="films-container">
          {filteredFilms.length === 0 ? (
            <div
              style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 16, color: 'var(--text-light)' }}>
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <line x1="2" y1="7" x2="7" y2="7" />
                <line x1="2" y1="17" x2="7" y2="17" />
                <line x1="17" y1="17" x2="22" y2="17" />
                <line x1="17" y1="7" x2="22" y2="7" />
              </svg>
              <p style={{ fontSize: 16 }}>Aucun film ne correspond à vos critères.</p>
              <button
                onClick={clearAllFilters}
                className="reset-btn"
                style={{ marginTop: 16 }}
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            filteredFilms.map((film) => (
              <FilmCard
                key={film.slug}
                film={film}
                isFavorite={mounted ? favorites.includes(film.filmId) : false}
                onToggleFavorite={toggleFavorite}
                dates={dates}
                friendsWhoFavorited={mounted ? (friendsFavoritesMap[film.filmId] || []) : []}
                hidePastShowtimes={hidePastShowtimes}
              />
            ))
          )}
        </div>
      </div>

      {/* Bouton retour en haut */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`goTop${showGoTop ? ' visible' : ''}`}
        aria-label="Retour en haut"
        style={{ border: 'none', padding: 0 }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>

      {/* Modale de synchronisation */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        syncId={syncId}
        deviceId={deviceId}
        favorites={favorites}
        onSyncComplete={handleSyncComplete}
        onFriendsUpdate={loadFriendsFavorites}
        hidePastShowtimes={hidePastShowtimes}
        onHidePastShowtimesChange={(val) => {
          setHidePastShowtimes(val);
          localStorage.setItem('cinelyon_hide_past_showtimes', String(val));
        }}
      />

      {/* Chatbot */}
      <ChatBot showGoTop={showGoTop} />
    </>
  );
}
