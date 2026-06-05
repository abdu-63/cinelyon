// src/hooks/useFavorites.ts
// Gestion des favoris avec sync Supabase
// Portage de la logique index.js lines 924–1220 (syncToSupabase, syncFromSupabase, toggleFavorite)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { secureStore } from '../lib/secureStore';
import { supabase } from '../lib/supabase';
import { SECURE_KEYS } from '../lib/constants';
import { FavoriteRecord } from '../types';
import { generateUUID } from '../utils/uuid';

// ── Helpers UUID sécurisé ────────────────────────────────────────────────────

async function getOrCreateSyncId(): Promise<string> {
  let id = await secureStore.getItemAsync(SECURE_KEYS.syncId);
  if (!id) {
    id = generateUUID();
    await secureStore.setItemAsync(SECURE_KEYS.syncId, id);
  }
  return id;
}

async function getOrCreateDeviceId(): Promise<string> {
  let id = await secureStore.getItemAsync(SECURE_KEYS.deviceId);
  if (!id) {
    id = generateUUID();
    await secureStore.setItemAsync(SECURE_KEYS.deviceId, id);
  }
  return id;
}

// ── Code de sync 6 caractères (identique à index.js::getSyncCode) ────────────

export function getSyncCode(syncId: string): string {
  return syncId.substring(0, 6).toUpperCase();
}

// ── Hook principal ────────────────────────────────────────────────────────────

export function useFavorites() {
  const qc = useQueryClient();

  // 1. Charge ou crée le syncId
  const { data: syncId } = useQuery({
    queryKey: ['syncId'],
    queryFn: getOrCreateSyncId,
    staleTime: Infinity, // UUID constant, jamais re-fetché
  });

  const { data: deviceId } = useQuery({
    queryKey: ['deviceId'],
    queryFn: getOrCreateDeviceId,
    staleTime: Infinity,
  });

  // 2. Charge les favoris depuis Supabase (portage syncFromSupabase — LWW)
  const { data: remoteRecord } = useQuery<FavoriteRecord | null>({
    queryKey: ['favorites', syncId],
    queryFn: async () => {
      const { data } = await supabase
        .from('favorites')
        .select('films, updated_at, pseudo')
        .eq('user_id', syncId!)
        .maybeSingle();
      return data as FavoriteRecord | null;
    },
    enabled: !!syncId,
    staleTime: 30_000, // 30 sec — les favoris changent moins souvent
    refetchInterval: 10_000, // Polling toutes les 10s pour mise à jour en temps réel
  });

  const favorites: string[] = remoteRecord?.films ?? [];
  const pseudo: string = remoteRecord?.pseudo ?? '';

  // 3. Upsert vers Supabase (portage syncToSupabase — debounced via useMutation)
  const upsertMutation = useMutation({
    mutationFn: async (films: string[]) => {
      if (!syncId) throw new Error('syncId non disponible');
      const { error } = await supabase.from('favorites').upsert(
        {
          user_id: syncId,
          films,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorites', syncId] });
    },
  });

  const updatePseudoMutation = useMutation({
    mutationFn: async (newPseudo: string) => {
      if (!syncId) throw new Error('syncId non disponible');
      const { error } = await supabase.from('favorites').upsert(
        {
          user_id: syncId,
          films: favorites,
          pseudo: newPseudo,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorites', syncId] });
    },
  });

  // 4. Toggle favori
  const toggleFavorite = (slug: string) => {
    if (!syncId) return; // Protection

    const next = favorites.includes(slug)
      ? favorites.filter((f) => f !== slug)
      : [...favorites, slug];
    upsertMutation.mutate(next);
    // Mise à jour optimiste du cache local
    qc.setQueryData<FavoriteRecord | null>(['favorites', syncId], (old) =>
      old ? { ...old, films: next } : { user_id: syncId, films: next, updated_at: new Date().toISOString(), pseudo }
    );
  };

  const updatePseudo = (newPseudo: string) => {
    if (!syncId) return;
    updatePseudoMutation.mutate(newPseudo);
    qc.setQueryData<FavoriteRecord | null>(['favorites', syncId], (old) =>
      old ? { ...old, pseudo: newPseudo } : { user_id: syncId, films: favorites, updated_at: new Date().toISOString(), pseudo: newPseudo }
    );
  };

  // 5. Liaison d'appareils (portage syncLinkBtn — index.js lines 1162–1217)
  const linkDevice = async (code: string): Promise<'success' | 'not_found' | 'error'> => {
    try {
      const prefix = code.toLowerCase();
      const { data, error } = await supabase
        .from('favorites')
        .select('user_id, films, updated_at')
        .ilike('user_id', `${prefix}%`)
        .limit(1);

      if (error || !data?.length) return 'not_found';

      const remote = data[0];
      const merged = Array.from(new Set([...favorites, ...(remote.films ?? [])]));

      // Adopter l'ID distant
      await secureStore.setItemAsync(SECURE_KEYS.syncId, remote.user_id);
      await supabase.from('favorites').upsert(
        { user_id: remote.user_id, films: merged, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );

      // Invalider les queries pour forcer un refetch immédiat
      await qc.invalidateQueries({ queryKey: ['syncId'] });
      await qc.invalidateQueries({ queryKey: ['favorites'] });
      return 'success';
    } catch {
      return 'error';
    }
  };

  // 6. Déconnexion d'appareil (génère un nouveau syncId)
  const unlinkDevice = async () => {
    const newId = generateUUID();
    await secureStore.setItemAsync(SECURE_KEYS.syncId, newId);
    // Push les favoris existants vers le nouveau ID
    await supabase.from('favorites').upsert(
      { user_id: newId, films: favorites, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
    qc.invalidateQueries({ queryKey: ['syncId'] });
    qc.invalidateQueries({ queryKey: ['favorites'] });
  };

  return {
    favorites,
    pseudo,
    syncId: syncId ?? '',
    deviceId: deviceId ?? '',
    syncCode: syncId ? getSyncCode(syncId) : '',
    isFavorite: (slug: string) => favorites.includes(slug),
    toggleFavorite,
    updatePseudo,
    linkDevice,
    unlinkDevice,
    isSyncing: upsertMutation.isPending || updatePseudoMutation.isPending,
  };
}
