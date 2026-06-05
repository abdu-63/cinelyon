// src/components/ui/FilmCard.tsx
// Carte film principale — fidèle au design glassmorphism du site web

import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Film } from '../../types';
import { COLORS } from '../../lib/constants';
import { optimizePosterUrl, PLACEHOLDER_POSTER } from '../../utils/imageUtils';

// Dimensions identiques au site web en mobile (affiche: 100px × 144px)
const POSTER_WIDTH = 100;
const POSTER_HEIGHT = 144;

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

  const ratingDisplay =
    film.rating !== 'Note inconnue' ? film.rating.replace('/5', '★') : null;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={handlePress}
      accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
      accessibilityLabel={`Voir les séances de ${film.title}`}
    >
      {/* Affiche — identique au site: width 100px height 144px, border-radius 15px 0 0 15px */}
      <View style={styles.posterContainer}>
        <Image
          source={posterUrl || PLACEHOLDER_POSTER}
          style={styles.poster}
          contentFit="cover"
          transition={200}
          placeholder={{ uri: PLACEHOLDER_POSTER }}
        />
        {/* Badge format (VO/VF etc.) en bas à gauche de l'affiche */}
        {film.formats ? (
          <View style={styles.formatBadge}>
            <Text style={styles.formatBadgeText}>
              {film.formats.split(',')[0].toUpperCase()}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Infos film — zone avec fond semi-transparent (glassmorphism) */}
      <View style={styles.info}>
        {/* Titre + bouton favori */}
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {film.title}
            {film.release_year !== 'inconnue' ? (
              <Text style={styles.releaseYear}> ({film.release_year})</Text>
            ) : null}
          </Text>
          <TouchableOpacity
            style={styles.favoriteBtn}
            onPress={() => onToggleFavorite(film.slug)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? COLORS.favActive : COLORS.textSubtle}
            />
          </TouchableOpacity>
        </View>

        {/* Réalisateur */}
        {film.director !== 'Inconnu' ? (
          <Text style={styles.meta} numberOfLines={1}>
            Réalisateur : {film.director}
          </Text>
        ) : null}

        {/* Genre */}
        {film.genres ? (
          <Text style={styles.genre} numberOfLines={1}>
            Genre : {film.genres}
          </Text>
        ) : null}

        {/* Durée */}
        {film.duree ? (
          <Text style={styles.meta}>Durée : {film.duree}</Text>
        ) : null}

        {/* Notes */}
        <View style={styles.ratingsRow}>
          {ratingDisplay ? (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>Note : {ratingDisplay}</Text>
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

      {/* Chevron navigation identique au site */}
      <View style={styles.chevronContainer}>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  // ── Carte principale — glassmorphism identique au site ────────────────
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    // --card-bg: rgba(255,255,255,0.6) + border-radius 15px + box-shadow
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 15,
    marginHorizontal: 10,      // margin-left/right 10% sur mobile → 10px environ
    marginBottom: 10,
    overflow: 'hidden',
    // box-shadow: 0 8px 32px rgba(0,0,0,0.1) — identique au site
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },

  // ── Affiche — identique au site mobile: 100×144, radius 15px 0 0 15px ──
  posterContainer: {
    position: 'relative',
    flexShrink: 0,
  },
  poster: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
  },
  formatBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  formatBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },

  // ── Zone info film ─────────────────────────────────────────────────────
  info: {
    flex: 1,
    padding: 10,
    paddingRight: 6,
    justifyContent: 'flex-start',
    // padding-right identique à .infoFilm du site
    paddingBottom: 15,
  },

  // Titre + année + bouton favori
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    // h3.titreFilm du site: font-size 14px sur mobile
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 18,
    marginRight: 4,
  },
  releaseYear: {
    fontWeight: '400',
    color: COLORS.textMuted,
    fontSize: 12,
  },

  // Bouton favori — identique au site
  favoriteBtn: {
    padding: 2,
    marginTop: 1,
  },

  // Métadonnées — .realisateur, .duree, .genre du site: font-size 10px mobile
  meta: {
    fontSize: 10,
    color: COLORS.text,
    marginBottom: 0,
    lineHeight: 14,
  },
  genre: {
    fontSize: 10,
    color: COLORS.text,
    marginBottom: 0,
    lineHeight: 14,
  },

  // Badges de notes
  ratingsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
    marginBottom: 4,
  },
  ratingBadge: {
    backgroundColor: 'rgba(68,76,247,0.08)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(68,76,247,0.2)',
  },
  tmdbBadge: {
    borderColor: '#01b4e4',
    backgroundColor: 'rgba(1,180,228,0.08)',
  },
  rtBadge: {
    borderColor: '#fa520f',
    backgroundColor: 'rgba(250,82,15,0.08)',
  },
  ratingText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },

  // Watch providers
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

  // Badge amis
  friendBadge: {
    marginTop: 6,
    backgroundColor: 'rgba(68,76,247,0.08)',
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

  // Chevron navigation — .chevron-nav du site: position absolute bas droite
  chevronContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    opacity: 0.7,
  },
});
