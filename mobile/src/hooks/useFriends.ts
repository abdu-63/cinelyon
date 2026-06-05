// src/hooks/useFriends.ts
// Système amis — portage de la section Friends Feature de index.js (lines 1344–1700)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { FriendFollow, FavoriteRecord } from '../types';

export function useFriends(syncId: string) {
  const qc = useQueryClient();

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

  const { data: friendFavorites = [] } = useQuery<string[]>({
    queryKey: ['friendFavorites', ...friendIds.sort()],
    queryFn: async () => {
      if (!friendIds.length) return [];
      const { data } = await supabase
        .from('favorites')
        .select('films')
        .in('user_id', friendIds);
      const allFilms = new Set<string>();
      (data ?? []).forEach((row: { films: string[] }) => {
        row.films?.forEach((f) => allFilms.add(f));
      });
      return Array.from(allFilms);
    },
    enabled: friendIds.length > 0,
    staleTime: 60_000,
  });

  // Ajouter un ami par syncId
  const addFriend = useMutation({
    mutationFn: async ({ followedId, nickname }: { followedId: string; nickname: string }) => {
      // Vérifier que le user_id existe dans favorites
      const { data: check } = await supabase
        .from('favorites')
        .select('user_id')
        .ilike('user_id', `${followedId.substring(0, 6).toLowerCase()}%`)
        .limit(1);

      if (!check?.length) throw new Error('not_found');

      const realId = check[0].user_id;

      const { error } = await supabase.from('friend_follows').upsert({
        follower_id: syncId,
        followed_id: realId,
        followed_name: nickname,
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
    hasFriendFavorited: (slug: string) => friendFavorites.includes(slug),
    addFriend: (followedId: string, nickname: string) =>
      addFriend.mutateAsync({ followedId, nickname }),
    removeFriend: (followedId: string) => removeFriend.mutateAsync(followedId),
    isLoading: addFriend.isPending || removeFriend.isPending,
  };
}
