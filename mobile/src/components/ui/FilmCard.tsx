// src/components/ui/FilmCard.tsx
// Carte film principale — affiche + métadonnées + bouton favori

import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Film } from '../../types';
import { COLORS } from '../../lib/constants';
import { optimizePosterUrl, PLACEHOLDER_POSTER } from '../../utils/imageUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_PADDING = 16;
const POSTER_WIDTH = 90;
const POSTER_HEIGHT = 135;

interface FilmCardProps {
  film: Film;
  isFavorite: boolean;
  onToggleFavorite: (slug: string) => void;
  hasFriendFavorited?: boolean;
  showFriendBadge?: boolean;
}

export const FilmCard = memo(function FilmCard({
  film,
  isFavorite,
  onToggleFavorite,
  hasFriendFavorited = false,
  showFriendBadge = false,
}: FilmCardProps) {
  const router = useRouter();
  const posterUrl = optimizePosterUrl(film.affiche, POSTER_WIDTH * 2);

  const handlePress = () => {
    router.push(`/film/${film.slug}`);
  };

  // Raccourcir la note Allociné pour l'affichage compact
  const ratingDisplay =
    film.rating !== 'Note inconnue' ? film.rating.replace('/5', '★') : null;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={handlePress}
      accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
      accessibilityLabel={`Voir les séances de ${film.title}`}
    >
      {/* Affiche */}
      <View style={styles.posterContainer}>
        <Image
          source={posterUrl || PLACEHOLDER_POSTER}
          style={styles.poster}
          contentFit="cover"
          transition={200}
          placeholder={{ uri: PLACEHOLDER_POSTER }}
        />
        {/* Badge VO/VF (premier format disponible) */}
        {film.formats ? (
          <View style={styles.formatBadge}>
            <Text style={styles.formatBadgeText}>
              {film.formats.split(',')[0].toUpperCase()}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Infos film */}
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {film.title}
          </Text>
          {/* Bouton favori */}
          <TouchableOpacity
            style={styles.favoriteBtn}
            onPress={() => onToggleFavorite(film.slug)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={22} 
              color={isFavorite ? COLORS.favActive : COLORS.textMuted} 
            />
          </TouchableOpacity>
        </View>

        {/* Réalisateur + année */}
        <Text style={styles.meta} numberOfLines={1}>
          {film.director !== 'Inconnu' ? film.director : ''}
          {film.release_year !== 'inconnue' ? ` · ${film.release_year}` : ''}
        </Text>

        {/* Durée */}
        {film.duree ? (
          <Text style={styles.duration}>{film.duree}</Text>
        ) : null}

        {/* Notes */}
        <View style={styles.ratingsRow}>
          {ratingDisplay ? (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>{ratingDisplay}</Text>
            </View>
          ) : null}
          {film.tmdb_score !== null ? (
            <View style={[styles.ratingBadge, styles.tmdbBadge]}>
              <Text style={styles.ratingText}>TMDB {film.tmdb_score}</Text>
            </View>
          ) : null}
          {film.rt_score ? (
            <View style={[styles.ratingBadge, styles.rtBadge]}>
              <Text style={styles.ratingText}>🍅 {film.rt_score}</Text>
            </View>
          ) : null}
        </View>

        {/* Genres */}
        {film.genres ? (
          <Text style={styles.genres} numberOfLines={1}>
            {film.genres}
          </Text>
        ) : null}

        {/* Watch providers */}
        {film.watch_providers && film.watch_providers.length > 0 ? (
          <View style={styles.providersRow}>
            {film.watch_providers.slice(0, 4).map((p) => (
              <Image
                key={p.name}
                source={p.logo_path ?? ''}
                style={styles.providerLogo}
                contentFit="cover"
              />
            ))}
          </View>
        ) : null}

        {/* Badge amis */}
        {showFriendBadge && hasFriendFavorited ? (
          <View style={styles.friendBadge}>
            <Ionicons name="people" size={12} color={COLORS.primary} style={styles.friendBadgeIcon} />
            <Text style={styles.friendBadgeText}>Un ami aime ce film</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginHorizontal: CARD_PADDING,
    marginVertical: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  posterContainer: {
    position: 'relative',
  },
  poster: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
  },
  formatBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  formatBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    padding: 10,
    justifyContent: 'flex-start',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 20,
    marginRight: 6,
  },
  favoriteBtn: {
    padding: 2,
  },
  favoriteIcon: {
    fontSize: 18,
  },
  favoriteBtnActive: {
    // cœur rouge déjà via l'emoji ❤️
  },
  meta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  duration: {
    fontSize: 11,
    color: COLORS.textSubtle,
    marginBottom: 6,
  },
  ratingsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  ratingBadge: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tmdbBadge: {
    borderColor: '#01b4e4',
  },
  rtBadge: {
    borderColor: '#fa520f',
  },
  ratingText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  genres: {
    fontSize: 11,
    color: COLORS.textSubtle,
    fontStyle: 'italic',
    marginTop: 2,
  },
  providersRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  providerLogo: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  friendBadge: {
    marginTop: 6,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendBadgeIcon: {
    marginRight: 4,
  },
  friendBadgeText: {
    fontSize: 10,
    color: COLORS.primary,
  },
});
