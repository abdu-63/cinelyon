// app/(tabs)/favorites.tsx
// Onglet Favoris — mes films favoris + favoris des amis

import React, { useState } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShowtimes } from '../../src/hooks/useShowtimes';
import { useFavorites } from '../../src/hooks/useFavorites';
import { useFriends } from '../../src/hooks/useFriends';
import { filterFilms } from '../../src/utils/showtimes';
import { FilmCard } from '../../src/components/ui/FilmCard';
import { COLORS } from '../../src/lib/constants';
import { Film, FavTab } from '../../src/types';
import { useRouter } from 'expo-router';

export default function FavoritesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FavTab>('perso');

  const { films, dates, isLoading } = useShowtimes(null);
  const { favorites, isFavorite, toggleFavorite, syncId } = useFavorites();
  const { friendFavorites, getFriendsWhoFavorited } = useFriends(syncId);

  const displayedFilms =
    activeTab === 'perso'
      ? filterFilms(films, { showOnlyFavorites: true, favorites })
      : filterFilms(films, {
          showOnlyFavorites: true,
          showFriendFavorites: true,
          friendFavorites,
        });

  const renderItem = ({ item }: ListRenderItemInfo<Film>) => (
    <FilmCard
      film={item}
      isFavorite={isFavorite(item.filmId)}
      onToggleFavorite={toggleFavorite}
      friendsWhoFavorited={getFriendsWhoFavorited(item.filmId)}
      showFriendBadge={activeTab === 'amis'}
      dates={dates}
    />
  );

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      {/* Onglets perso / amis */}
      <View style={styles.tabs}>
        {(['perso', 'amis'] as FavTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'perso' ? 'Mes favoris' : 'Favoris amis'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={displayedFilms}
        renderItem={renderItem}
        keyExtractor={(item) => item.slug}
        contentContainerStyle={[
          styles.listContent,
          !displayedFilms.length && styles.emptyList,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>
              {activeTab === 'perso' ? '🎬' : '👥'}
            </Text>
            <Text style={styles.emptyText}>
              {isLoading
                ? 'Chargement…'
                : activeTab === 'perso'
                ? 'Aucun favori pour le moment.\nAppuyez sur le ❤️ d\'un film pour l\'ajouter.'
                : 'Aucun ami suivi ou aucun favori commun.\nAjoutez un ami pour voir ses favoris !'}
            </Text>
            {activeTab === 'amis' && !isLoading && (
              <TouchableOpacity
                style={styles.addFriendBtn}
                onPress={() => router.push('/(tabs)/settings')}
              >
                <Text style={styles.addFriendBtnText}>Ajouter un ami</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    padding: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  addFriendBtn: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFriendBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
