// src/hooks/useFriends.ts
// Système amis — portage de la section Friends Feature de index.js (lines 1344–1700)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { supabase } from '../lib/supabase';
import { FriendFollow, FavoriteRecord } from '../types';
import { useShowtimes } from './useShowtimes';

export function useFriends(syncId: string, hiddenFriends: string[] = []) {
  const qc = useQueryClient();
  const { films: activeFilms } = useShowtimes();
  const activeFilmIds = React.useMemo(() => activeFilms.map(f => f.filmId), [activeFilms]);
  // Use a string representation or length for query key to avoid deep comparison issues
  const activeFilmIdsKey = activeFilmIds.join(',');

  // Charge la liste des amis suivis
  const { data: follows = [] } = useQuery<FriendFollow[]>({
    queryKey: ['friends', syncId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('friend_follows')
        .select('*')
        .eq('follower_id', syncId);
      if (error) throw new Error(error.message);
      return (data ?? []) as FriendFollow[];
    },
    enabled: !!syncId,
    staleTime: 60_000,
  });

  // Charge les favoris de tous les amis
  const friendIds = follows.map((f) => f.followed_id);

  const { data: friendFavoritesMap = {} } = useQuery<Record<string, string[]>>({
    queryKey: ['friendFavoritesMap', ...friendIds.sort(), ...hiddenFriends.sort(), activeFilmIdsKey],
    queryFn: async () => {
      if (!friendIds.length) return {};
      const { data } = await supabase
        .from('favorites')
        .select('user_id, films')
        .in('user_id', friendIds);
      
      const map: Record<string, string[]> = {};
      (data ?? []).forEach((row: { user_id: string; films: string[] }) => {
        if (hiddenFriends.includes(row.user_id)) return; // Masquer cet ami
        
        const friend = follows.find((f) => f.followed_id === row.user_id);
        const name = friend?.followed_name || 'Ami';
        row.films?.forEach((f) => {
          if (activeFilmIds.includes(f)) {
            if (!map[f]) map[f] = [];
            if (!map[f].includes(name)) map[f].push(name);
          }
        });
      });
      return map;
    },
    enabled: friendIds.length > 0 && activeFilmIds.length > 0,
    staleTime: 60_000,
  });

  const { data: friendFavoritesCountMap = {} } = useQuery<Record<string, number>>({
    queryKey: ['friendFavoritesCountMap', ...friendIds.sort(), activeFilmIdsKey],
    queryFn: async () => {
      if (!friendIds.length) return {};
      const { data } = await supabase
        .from('favorites')
        .select('user_id, films')
        .in('user_id', friendIds);
      
      const map: Record<string, number> = {};
      (data ?? []).forEach((row) => {
        let count = 0;
        row.films?.forEach((filmId: string) => {
          if (activeFilmIds.includes(filmId)) {
            count++;
          }
        });
        map[row.user_id] = count;
      });
      return map;
    },
    enabled: friendIds.length > 0 && activeFilmIds.length > 0,
    staleTime: 60_000,
  });

  const friendFavorites = React.useMemo(() => Object.keys(friendFavoritesMap), [friendFavoritesMap]);
  const EMPTY_ARRAY = React.useMemo<string[]>(() => [], []);

  // Ajouter un ami par syncId ou pseudo
  const addFriend = useMutation({
    mutationFn: async ({ searchKey, nickname }: { searchKey: string; nickname: string }) => {
      // Vérifier que le user_id ou pseudo existe dans favorites
      const { data: check } = await supabase
        .from('favorites')
        .select('user_id, pseudo')
        .or(`user_id.ilike.${searchKey.substring(0, 6).toLowerCase()}%,pseudo.ilike.${searchKey}`)
        .limit(1);

      if (!check?.length) throw new Error('not_found');

      const realId = check[0].user_id;
      const actualNickname = check[0].pseudo || nickname;

      const { error } = await supabase.from('friend_follows').upsert({
        follower_id: syncId,
        followed_id: realId,
        followed_name: actualNickname,
        created_at: new Date().toISOString(),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['friends', syncId] }),
  });

  // Retirer un ami
  const removeFriend = useMutation({
    mutationFn: async (followedId: string) => {
      const { error } = await supabase
        .from('friend_follows')
        .delete()
        .eq('follower_id', syncId)
        .eq('followed_id', followedId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['friends', syncId] }),
  });

  return {
    follows,
    friendFavorites,
    friendFavoritesCountMap,
    hasFriendFavorited: React.useCallback((slug: string) => friendFavorites.includes(slug), [friendFavorites]),
    getFriendsWhoFavorited: React.useCallback((slug: string) => friendFavoritesMap[slug] || EMPTY_ARRAY, [friendFavoritesMap, EMPTY_ARRAY]),
    addFriend: (searchKey: string, nickname: string) =>
      addFriend.mutateAsync({ searchKey, nickname }),
    removeFriend: (followedId: string) => removeFriend.mutateAsync(followedId),
    isLoading: addFriend.isPending || removeFriend.isPending,
  };
}
