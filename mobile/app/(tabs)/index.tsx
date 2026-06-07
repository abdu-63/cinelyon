// app/(tabs)/index.tsx
// Écran principal — liste des films + sélecteur de jours + filtres

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ListRenderItemInfo,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useShowtimes } from '../../src/hooks/useShowtimes';
import { useFavorites } from '../../src/hooks/useFavorites';
import { useFriends } from '../../src/hooks/useFriends';
import { filterFilms, extractFilterOptions, hasVisibleSeances } from '../../src/utils/showtimes';
import { FilmCard } from '../../src/components/ui/FilmCard';
import { DaySelector } from '../../src/components/ui/DaySelector';
import { FilterBar } from '../../src/components/ui/FilterBar';
import { FilmListSkeleton } from '../../src/components/skeletons/FilmCardSkeleton';
import { secureStore } from '../../src/lib/secureStore';
import { COLORS, PAGE_SIZE } from '../../src/lib/constants';
import { Film, FiltersState } from '../../src/types';

const DEFAULT_FILTERS: FiltersState = {
  titleQuery: '',
  genre: '',
  director: '',
  cinema: '',
  dayIndex: null,
  format: '',
  timeSlot: null,
  showOnlyFavorites: false,
  showOnlyNew: false,
  showFriendFavorites: false,
  favTab: 'perso',
};

export default function HomeScreen() {
  const [selectedDelta, setSelectedDelta] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [filterState, setFilterState] = useState<FiltersState>(DEFAULT_FILTERS);
  const flatListRef = useRef<FlatList>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [hidePastSessions, setHidePastSessions] = useState(true);
  const [hiddenFriends, setHiddenFriends] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      secureStore.getItemAsync('hidePastSessions').then((val) => {
        if (val !== null) setHidePastSessions(val === 'true');
      });
      secureStore.getItemAsync('hiddenFriends').then((val) => {
        if (val !== null) setHiddenFriends(JSON.parse(val));
      });
    }, [])
  );

  const { films, dates, isLoading, isFetching, isError, refetch } = useShowtimes(selectedDelta);
  const { favorites, isFavorite, toggleFavorite, syncId } = useFavorites();
  const { friendFavorites, getFriendsWhoFavorited } = useFriends(syncId, hiddenFriends);

  const filterOptions = useMemo(() => extractFilterOptions(films), [films]);

  const filteredFilms = useMemo(() => {
    let result = filterFilms(films, {
      titleQuery: filterState.titleQuery,
      genre: filterState.genre,
      director: filterState.director,
      cinema: filterState.cinema,
      format: filterState.format,
      timeSlot: filterState.timeSlot,
      showOnlyNew: filterState.showOnlyNew,
      favorites,
      friendFavorites,
    });

    if (selectedDelta !== null) {
      const selectedDateObj = dates.find(d => d.index === selectedDelta);
      if (selectedDateObj) {
        result = result.filter(f => hasVisibleSeances(f, selectedDateObj.isoDate, dates, hidePastSessions));
      }
    } else {
      // In "Tous" mode, a film must have at least one visible seance on ANY available day.
      result = result.filter(f => dates.some(d => hasVisibleSeances(f, d.isoDate, dates, hidePastSessions)));
    }

    return result;
  }, [films, filterState, favorites, friendFavorites, selectedDelta, dates, hidePastSessions]);

  const paginatedFilms = useMemo(
    () => filteredFilms.slice(0, visibleCount),
    [filteredFilms, visibleCount]
  );

  const handleDayChange = useCallback((delta: number | null) => {
    setSelectedDelta(delta);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleFiltersChange = useCallback((partial: Partial<FiltersState>) => {
    setFilterState((prev) => ({ ...prev, ...partial }));
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleEndReached = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredFilms.length));
  }, [filteredFilms.length]);

  const handleScroll = useCallback((event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    setShowScrollTop(y > 300);
  }, []);

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Film>) => (
      <FilmCard
        film={item}
        isFavorite={isFavorite(item.filmId)}
        onToggleFavorite={toggleFavorite}
        friendsWhoFavorited={getFriendsWhoFavorited(item.filmId)}
        showFriendBadge={filterState.showFriendFavorites}
        dates={dates}
      />
    ),
    [isFavorite, toggleFavorite, getFriendsWhoFavorited, filterState.showFriendFavorites, dates]
  );

  const keyExtractor = useCallback((item: Film) => item.slug, []);

  const listHeaderElement = useMemo(
    () => (
      <>
        <FilterBar
          filters={filterState}
          options={filterOptions}
          onFiltersChange={handleFiltersChange}
          totalCount={films.length}
          filteredCount={filteredFilms.length}
        />
        <DaySelector
          dates={dates}
          selectedDelta={selectedDelta}
          onSelect={handleDayChange}
        />
      </>
    ),
    [dates, selectedDelta, handleDayChange, filterState, filterOptions, handleFiltersChange, films.length, filteredFilms.length]
  );

  const ListEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        {isLoading ? (
          <FilmListSkeleton count={6} />
        ) : isError ? (
          <Text style={styles.errorText}>
            Impossible de charger les séances.{'\n'}Vérifiez votre connexion.
          </Text>
        ) : (
          <Text style={styles.emptyText}>Aucun film pour cette sélection.</Text>
        )}
      </View>
    ),
    [isLoading, isError]
  );

  const ListFooter = useCallback(
    () =>
      visibleCount < filteredFilms.length ? (
        <View style={styles.footerLoader}>
          <Text style={styles.footerText}>Chargement…</Text>
        </View>
      ) : filteredFilms.length > 0 ? (
        <View style={styles.footerLoader}>
          <Text style={styles.footerText}>🎉 Vous avez atteint la fin ! 🍿</Text>
        </View>
      ) : null,
    [visibleCount, filteredFilms.length]
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <DaySelector dates={[]} selectedDelta={null} onSelect={() => {}} />
        <FilmListSkeleton count={6} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <FlatList
        ref={flatListRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        data={paginatedFilms}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeaderElement}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={PAGE_SIZE}
      />
      
      {showScrollTop && (
        <View style={styles.fabShadow}>
          <TouchableOpacity style={styles.fab} onPress={scrollToTop} accessibilityLabel="Revenir en haut">
            <Ionicons name="arrow-up" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background, // #f5f6f8 identique au site
  },
  listContent: {
    paddingBottom: 24,
    paddingTop: 4,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    marginTop: 60,
    fontSize: 15,
  },
  errorText: {
    textAlign: 'center',
    color: COLORS.warning,
    marginTop: 60,
    fontSize: 15,
    lineHeight: 24,
  },
  footerLoader: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.textSubtle,
    fontSize: 12,
  },
  fabShadow: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
