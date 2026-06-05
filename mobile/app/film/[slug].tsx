// app/film/[slug].tsx
// Page détail d'un film — séances groupées par enseigne + trailer + streaming

import React, { useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import YoutubePlayer from 'react-native-youtube-iframe';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { useShowtimes } from '../../src/hooks/useShowtimes';
import { useFavorites } from '../../src/hooks/useFavorites';
import { findFilmBySlug } from '../../src/utils/showtimes';
import { ShowtimeRow } from '../../src/components/ui/ShowtimeRow';
import { COLORS } from '../../src/lib/constants';
import { optimizePosterUrl, extractYoutubeId } from '../../src/utils/imageUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function FilmDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();


  const { rawRows, isLoading } = useShowtimes(null);
  const { isFavorite, toggleFavorite } = useFavorites();

  const film = useMemo(
    () => (rawRows.length ? findFilmBySlug(rawRows, slug) : null),
    [rawRows, slug]
  );

  if (isLoading || !film) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const posterUrl = optimizePosterUrl(film.affiche, 300);
  const youtubeId = film.trailer_url ? extractYoutubeId(film.trailer_url) : null;
  const fav = isFavorite(film.slug);

  const dayLabels = Object.keys(film.seancesByDayGrouped);

  const handleShare = async () => {
    try {
      // Pour l'instant, on partage l'URL du site web (l'app n'est pas encore publiée avec deep links actifs)
      const url = `https://cinelyon.fr/film/${film.slug}`;
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(url, {
          dialogTitle: `Séances pour ${film.title} sur CinéLyon`,
        });
      }
    } catch (e) {
      console.log('Erreur partage:', e);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Hero : affiche + gradient */}
        <View style={styles.hero}>
          <Image
            source={posterUrl}
            style={styles.backdrop}
            contentFit="cover"
            blurRadius={20}
          />
          <View style={styles.heroOverlay} />
          <Image
            source={posterUrl}
            style={styles.poster}
            contentFit="cover"
            transition={200}
          />
        </View>

        {/* Titre + actions */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{film.title}</Text>
            <TouchableOpacity
              style={[styles.favBtn, fav && styles.favBtnActive]}
              onPress={() => toggleFavorite(film.slug)}
              accessibilityLabel={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Ionicons 
                name={fav ? "heart" : "heart-outline"} 
                size={22} 
                color={fav ? COLORS.favActive : COLORS.textMuted} 
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.meta}>
            {film.director !== 'Inconnu' ? `${film.director} · ` : ''}
            {film.release_year !== 'inconnue' ? `${film.release_year} · ` : ''}
            {film.duree}
          </Text>

          {/* Notes */}
          <View style={styles.ratingsRow}>
            {film.rating !== 'Note inconnue' && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>⭐ {film.rating}</Text>
              </View>
            )}
            {film.tmdb_score !== null && (
              <View style={[styles.badge, styles.tmdbBadge]}>
                <Text style={styles.badgeText}>TMDB {film.tmdb_score}/10</Text>
              </View>
            )}
            {film.rt_score && (
              <View style={[styles.badge, styles.rtBadge]}>
                <Text style={styles.badgeText}>🍅 {film.rt_score}</Text>
              </View>
            )}
          </View>

          {/* Genres */}
          {film.genres && (
            <Text style={styles.genres}>{film.genres}</Text>
          )}

          {/* Trailer YouTube — affiché par défaut si disponible */}
          {youtubeId ? (
            <View style={styles.trailerContainer}>
              <YoutubePlayer
                height={Math.round((SCREEN_WIDTH - 32) * 0.5625)}
                width={SCREEN_WIDTH - 32}
                videoId={youtubeId}
                play={false}
              />
            </View>
          ) : null}

          {/* Boutons action */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnSecondary]}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={16} color={COLORS.text} style={{ marginRight: 4 }} />
              <Text style={[styles.actionBtnText, { color: COLORS.text }]}>Partager</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnSecondary]}
              onPress={() => Linking.openURL(film.url)}
            >
              <Text style={[styles.actionBtnText, { color: COLORS.text }]}>Letterboxd</Text>
            </TouchableOpacity>
            {film.allocine_url ? (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnSecondary]}
                onPress={() => Linking.openURL(film.allocine_url)}
              >
                <Text style={[styles.actionBtnText, { color: COLORS.text }]}>Allociné</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Synopsis */}
        {film.synopsis && film.synopsis !== 'Synopsis non disponible' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Synopsis</Text>
            <Text style={styles.synopsis}>{film.synopsis}</Text>
          </View>
        )}

        {/* Streaming */}
        {film.watch_providers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Disponible sur</Text>
            <View style={styles.providersRow}>
              {film.watch_providers.map((p) => (
                <View key={p.name} style={styles.provider}>
                  {p.logo_path && (
                    <Image source={p.logo_path} style={styles.providerLogo} contentFit="cover" />
                  )}
                  <Text style={styles.providerName} numberOfLines={1}>{p.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Séances */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Séances</Text>

          {dayLabels.map((dayLabel, dayIdx) => {
            // Calculer la vraie date ISO à partir du delta (index du jour)
            const today = new Date();
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + dayIdx);
            const isoDate = targetDate.toISOString().split('T')[0];

            return (
              <View key={dayLabel} style={styles.daySection}>
                <Text style={styles.dayLabel}>{dayLabel}</Text>
                {Object.entries(film.seancesByDayGrouped[dayLabel]).map(([brand, cinemas]) => (
                  <View key={brand} style={styles.brandSection}>
                    <Text style={styles.brandLabel}>{brand}</Text>
                    {Object.entries(cinemas).map(([cinemaName, seances]) => (
                      <ShowtimeRow
                        key={cinemaName}
                        cinemaName={cinemaName}
                        seances={seances}
                        isoDate={isoDate}
                        filmTitle={film.title}
                        filmDuree={film.duree}
                      />
                    ))}
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: COLORS.textMuted, fontSize: 16 },
  scrollContent: { paddingBottom: 40 },

  // Hero
  hero: {
    height: 220,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13,13,20,0.6)',
  },
  poster: {
    width: 130,
    height: 195,
    borderRadius: 10,
    marginBottom: -48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },

  // Titre
  titleSection: {
    paddingTop: 58,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    lineHeight: 28,
    marginRight: 12,
  },
  favBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  favBtnActive: { borderColor: COLORS.favActive },
  favIcon: { fontSize: 20 },
  meta: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  ratingsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  badge: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tmdbBadge: { borderColor: '#01b4e4' },
  rtBadge: { borderColor: '#fa520f' },
  badgeText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  genres: {
    fontSize: 13,
    color: COLORS.textSubtle,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtnSecondary: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  trailerContainer: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },

  // Sections
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  synopsis: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 22,
  },
  providersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  provider: {
    alignItems: 'center',
    gap: 4,
  },
  providerLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  providerName: {
    fontSize: 10,
    color: COLORS.textMuted,
    maxWidth: 50,
    textAlign: 'center',
  },

  // Séances
  daySection: { marginBottom: 16 },
  dayLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  brandSection: { marginBottom: 8 },
  brandLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    marginLeft: 4,
  },
});
