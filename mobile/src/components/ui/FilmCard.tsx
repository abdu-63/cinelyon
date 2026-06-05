// src/components/ui/FilmCard.tsx
// Carte film principale — fidèle au design glassmorphism du site web
// Structure EXACTE du site : card + seances-wrapper séparés

import React, { memo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Film, Seance } from '../../types';
import { COLORS } from '../../lib/constants';
import { optimizePosterUrl, PLACEHOLDER_POSTER } from '../../utils/imageUtils';
import { isPastSeance } from '../../utils/showtimes';
import { getDeltaForDate, formatTime, formatDayLabel } from '../../utils/dateUtils';
import { useCalendar } from '../../hooks/useCalendar';

// Dimensions exactes du site web sur mobile (.affiche mobile: 100px × 144px)
const POSTER_WIDTH = 100;
const POSTER_HEIGHT = 144;

interface FilmCardProps {
  film: Film;
  isFavorite: boolean;
  onToggleFavorite: (slug: string) => void;
  friendsWhoFavorited?: string[];
  showFriendBadge?: boolean;
  dates: DateLabel[];
}

export const FilmCard = memo(function FilmCard({
  film,
  isFavorite,
  onToggleFavorite,
  friendsWhoFavorited = [],
  showFriendBadge = false,
  dates,
}: FilmCardProps) {
  const router = useRouter();
  const posterUrl = optimizePosterUrl(film.affiche, POSTER_WIDTH * 2);

  // Jours disponibles pour ce film (identique à film.seances_by_day.keys())
  const dayLabels = Object.keys(film.seancesByDay);

  // Fermé par défaut
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);

  const handlePress = () => {
    router.push(`/film/${film.slug}`);
  };

  const ratingDisplay =
    film.rating !== 'Note inconnue' ? film.rating.replace('/5', '★') : null;

  // Séances du jour sélectionné (seancesByDay[dayLabel] = { cinemaName: Seance[] })
  const selectedDayLabel = selectedDayIdx !== null ? dayLabels[selectedDayIdx] ?? null : null;
  const seancesForDay: Record<string, Seance[]> = selectedDayLabel
    ? film.seancesByDay[selectedDayLabel] ?? {}
    : {};

  // Date ISO pour le jour sélectionné (pour le filtre séances passées + calendrier)
  const selectedIsoDate = selectedDayLabel ? (() => {
    const dObj = dates.find((d) => formatDayLabel(d) === selectedDayLabel);
    return dObj ? dObj.isoDate : '';
  })() : '';

  return (
    <View style={styles.filmBlock}>
      {/* ── .container_infoFilm du site : card avec glassmorphism ── */}
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={handlePress}
        accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
        accessibilityLabel={`Voir les séances de ${film.title}`}
      >
        {/* .blur-background sur mobile: rgba(255,255,255,0.3) + blur(20px) */}
        <View style={styles.blurBackground} />

        {/* .affiche mobile: 100px × 144px, border-radius 15px 0 0 15px */}
        <View style={styles.posterContainer}>
          <Image
            source={posterUrl || PLACEHOLDER_POSTER}
            style={styles.poster}
            contentFit="cover"
            transition={200}
            placeholder={{ uri: PLACEHOLDER_POSTER }}
          />
        </View>

        {/* .infoFilm du site: padding-right 15px, padding-bottom 15px */}
        <View style={styles.infoFilm}>
          {/* .titreFilm: font-size 14px sur mobile */}
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {film.title}
              {film.release_year !== 'inconnue' ? (
                <Text style={styles.releaseYear}> ({film.release_year})</Text>
              ) : null}
            </Text>
            {/* .favorite-btn identique au site */}
            <TouchableOpacity
              style={styles.favoriteBtn}
              onPress={() => onToggleFavorite(film.filmId)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorite ? COLORS.favActive : COLORS.textSubtle}
              />
            </TouchableOpacity>
          </View>

          {/* .info-content — .realisateur, .genre, .duree, .rating: font-size 10px mobile */}
          <View style={styles.infoContent}>
            {film.director !== 'Inconnu' ? (
              <Text style={styles.metaText} numberOfLines={1}>
                Réalisateur : {film.director}
              </Text>
            ) : null}
            {film.genres ? (
              <Text style={styles.metaText} numberOfLines={1}>
                Genre : {film.genres}
              </Text>
            ) : null}
            {film.duree ? (
              <Text style={styles.metaText}>Durée : {film.duree}</Text>
            ) : null}

            {/* Notes — badges identiques au site */}
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
            {showFriendBadge && friendsWhoFavorited && friendsWhoFavorited.length > 0 ? (
              <View style={styles.friendBadge}>
                <Ionicons name="people" size={11} color={COLORS.primary} style={{ marginRight: 2 }} />
                <Text style={styles.friendBadgeText} numberOfLines={1}>
                  {friendsWhoFavorited.length === 1
                    ? `${friendsWhoFavorited[0]} aime ce film`
                    : `${friendsWhoFavorited.slice(0, 2).join(', ')}${friendsWhoFavorited.length > 2 ? '...' : ''} aiment ce film`}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* .chevron-nav du site — positionné en bas à droite */}
        <View style={styles.chevronNav}>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </View>
      </Pressable>

      {/* ── div height:10px séparateur identique au site ── */}
      <View style={styles.spacer} />

      {/* ── .seances-wrapper du site : mini-calendar + day-seances ── */}
      {dayLabels.length > 0 ? (
        <View style={styles.seancesWrapper}>
          {/* .mini-calendar : flex row, gap 5px sur mobile */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.miniCalendar}
          >
            {dayLabels.map((dayLabel, idx) => {
              // Détecter avant-premières pour le point rouge (.has-notification)
              const cinemas = film.seancesByDay[dayLabel] ?? {};
              const hasAvantPremiere = Object.values(cinemas).some((seances) =>
                seances.some(
                  (s) => s.format && s.format.toLowerCase().includes('première')
                )
              );
              const isActive = selectedDayIdx === idx;

              return (
                <TouchableOpacity
                  key={dayLabel}
                  style={[styles.miniCalBtn, isActive && styles.miniCalBtnActive]}
                  onPress={() => setSelectedDayIdx(isActive ? null : idx)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  {/* Point rouge avant-première */}
                  {hasAvantPremiere ? (
                    <View style={styles.notifDot} />
                  ) : null}
                  <Text style={[styles.miniCalBtnText, isActive && styles.miniCalBtnTextActive]}>
                    {dayLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* .day-seances.show : séances du jour actif */}
          {selectedDayLabel ? (
            <DaySeances
              cinemas={seancesForDay}
              isoDate={selectedIsoDate}
              filmTitle={film.title}
              filmDuree={film.duree}
            />
          ) : null}
        </View>
      ) : null}

      {/* ── .responsive-div (height: 10px sur mobile) ── */}
      <View style={styles.responsiveDiv} />
    </View>
  );
});

// ── Composant DaySeances — portage exact de .day-seances ────────────────────

interface DaySeancesProps {
  cinemas: Record<string, Seance[]>;
  isoDate: string;
  filmTitle: string;
  filmDuree?: string;
}

function DaySeances({ cinemas, isoDate, filmTitle, filmDuree }: DaySeancesProps) {
  const isToday = getDeltaForDate(isoDate) === 0;
  const { addToCalendar } = useCalendar();

  return (
    <View style={styles.daySeances}>
      {Object.entries(cinemas).map(([cinemaName, seances]) => {
        const visibleSeances = isToday
          ? seances.filter((s) => !isPastSeance(s.time))
          : seances;

        if (!visibleSeances.length) return null;

        return (
          <View key={cinemaName}>
            {/* .seance_container : flex row, cinema + horaires */}
            <View style={styles.seanceContainer}>
              {/* .cinema mobile: height 42px, width 100px, background primary */}
              <View style={styles.cinema}>
                <Text style={styles.cinemaText} numberOfLines={3}>
                  {cinemaName}
                </Text>
              </View>

              {/* .horaires_container : scroll horizontal */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horairesContainer}
              >
                {visibleSeances.map((seance, idx) => (
                  <SeancePill
                    key={`${seance.time}-${idx}`}
                    seance={seance}
                    onCalendarPress={() =>
                      addToCalendar(filmTitle, cinemaName, seance, isoDate, filmDuree)
                    }
                  />
                ))}
              </ScrollView>
            </View>

            {/* .responsive-petite-div (height: 5px sur mobile) */}
            <View style={styles.petiteDiv} />
          </View>
        );
      })}
    </View>
  );
}

// ── Composant SeancePill — portage exact de .horaire ────────────────────────

interface SeancePillProps {
  seance: Seance;
  onCalendarPress: () => void;
}

function SeancePill({ seance, onCalendarPress }: SeancePillProps) {
  const isAvantPremiere =
    seance.format && seance.format.toLowerCase().includes('première');

  const handlePress = () => {
    if (seance.ticketing_url) {
      Linking.openURL(seance.ticketing_url);
    }
  };

  return (
    // .horaire-wrapper
    <View style={styles.horaireWrapper}>
      <TouchableOpacity
        style={[
          styles.horaire,
          isAvantPremiere && styles.horaireAvantPremiere,
          seance.ticketing_url && styles.horaireClickable,
        ]}
        onPress={seance.ticketing_url ? handlePress : undefined}
        activeOpacity={seance.ticketing_url ? 0.7 : 1}
        accessibilityRole={seance.ticketing_url ? 'link' : 'text'}
        accessibilityLabel={`${seance.time} ${seance.lang}${seance.format ? ' ' + seance.format : ''}`}
      >
        {/* .horaire-top : lang-badge + format-badge */}
        <View style={styles.horaireTop}>
          <Text style={styles.langBadge}>{seance.lang}</Text>
          {seance.format ? (
            <Text style={styles.formatBadge} numberOfLines={1}>
              {seance.format.split(', ')[0]}
            </Text>
          ) : null}
        </View>

        {/* .horaire-bottom : .seance-time + .calendar-btn */}
        <View style={styles.horaireBottom}>
          {/* .seance-time : font-size 13px, bold, color primary */}
          <Text style={styles.seanceTime}>{formatTime(seance.time)}</Text>
          {/* .calendar-btn — icône calendrier (visible sur desktop, masqué mobile sur le site mais on le garde en petit) */}
          <TouchableOpacity
            onPress={onCalendarPress}
            style={styles.calendarBtn}
            accessibilityLabel="Ajouter au calendrier"
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          >
            <Ionicons name="calendar-outline" size={13} color="#999" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles — portage pixel-perfect du CSS web (mobile breakpoint ≤576px) ─────

const styles = StyleSheet.create({
  // Bloc complet film (card + seances-wrapper)
  filmBlock: {
    marginBottom: 0,
  },

  // ── .container_infoFilm mobile ──────────────────────────────────────
  // background: var(--card-bg) = rgba(255,255,255,0.6)
  // border-radius: 15px
  // box-shadow: 0 8px 32px var(--shadow-lg) = rgba(0,0,0,0.1)
  // margin: 0 5% (mobile) → ~10px horizontal
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff', // fond solide pour iOS shadow (site: rgba(255,255,255,0.6))
    borderRadius: 15,
    marginHorizontal: '5%',
    marginBottom: 0,
    overflow: 'hidden',
    position: 'relative',
    // box-shadow: 0 8px 32px rgba(0,0,0,0.1)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },

  // .blur-background mobile: rgba(255,255,255,0.3) + backdrop-filter: blur(20px)
  // En React Native on simule avec une View semi-transparente
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.3)',
    zIndex: -1,
  },

  // ── .affiche mobile: 100×144, border-radius 15px 0 0 15px ──────────
  posterContainer: {
    flexShrink: 0,
  },
  poster: {
    width: POSTER_WIDTH,       // 100px identique au site mobile
    height: POSTER_HEIGHT,     // 144px identique au site mobile
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
  },

  // ── .infoFilm : padding-right 15px, padding-bottom 15px ─────────────
  infoFilm: {
    flex: 1,
    paddingTop: 8,
    paddingLeft: 8,
    paddingRight: 15,   // padding-right: 15px identique au site
    paddingBottom: 15,  // padding-bottom: 15px identique au site
  },

  // .titreFilm mobile: font-size 14px
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'healTheWebA',
    flex: 1,
    fontSize: 14,        // .titreFilm mobile: font-size 14px
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 18,
    marginRight: 4,
    marginTop: 3,
  },
  releaseYear: {
    fontFamily: 'healTheWebA',
    fontWeight: '400',
    color: COLORS.textMuted,
    fontSize: 13,
  },

  // .favorite-btn
  favoriteBtn: {
    padding: 2,
    marginTop: 1,
  },

  // .info-content
  infoContent: {
    position: 'relative',
  },

  // .realisateur, .duree, .rating, .genre mobile: font-size 10px
  metaText: {
    fontFamily: 'healTheWebA',
    fontSize: 10,          // font-size: 10px sur mobile
    color: COLORS.text,
    lineHeight: 14,
    marginBottom: 0,
  },

  // Notes — badges
  ratingsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
    marginBottom: 3,
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
    fontFamily: 'healTheWebA',
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },

  // Watch providers
  providersRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  providerLogo: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },

  // Badge amis
  friendBadge: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendBadgeText: {
    fontFamily: 'healTheWebA',
    fontSize: 10,
    color: COLORS.primary,
  },

  // .chevron-nav: position absolute, bas-droite
  chevronNav: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    opacity: 0.6,
  },

  // ── div height:10px entre card et seances-wrapper ────────────────────
  spacer: {
    height: 10,
  },

  // ── .seances-wrapper mobile: margin 0 5% ─────────────────────────────
  seancesWrapper: {
    marginHorizontal: '5%',
  },

  // ── .mini-calendar mobile: gap 5px, margin-left 0 ───────────────────
  miniCalendar: {
    flexDirection: 'row',
    gap: 5,                    // gap: 5px sur mobile
    paddingVertical: 2,
    marginBottom: 10,          // margin-bottom: 15px (légèrement réduit)
  },

  // ── .mini-cal-btn mobile: padding 4px 8px, font-size 11px ───────────
  // border-radius: 20px, border: 1px solid var(--border-color), transparent bg
  miniCalBtn: {
    paddingHorizontal: 8,      // padding: 4px 8px sur mobile
    paddingVertical: 4,
    borderRadius: 20,          // border-radius: 20px
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border, // border: 1px solid var(--border-color) = #ddd
    position: 'relative',
  },
  miniCalBtnActive: {
    backgroundColor: COLORS.primary, // .mini-cal-btn.active: background var(--primary)
    borderColor: COLORS.primary,
    // Pas d'ombre iOS (overflow: hidden sur parent bloque le rendu)
  },
  miniCalBtnText: {
    fontFamily: 'healTheWebA',
    fontSize: 11,              // font-size: 11px sur mobile (text-transform: capitalize)
    color: COLORS.textMuted,   // color: var(--text-muted) = #666
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  miniCalBtnTextActive: {
    color: '#ffffff',           // .active: color var(--card-solid) = #fff
  },

  // Point rouge avant-première (.has-notification::after)
  notifDot: {
    position: 'absolute',
    top: -2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff3b30',
    borderWidth: 1.5,
    borderColor: '#fff',
    zIndex: 1,
  },

  // ── .day-seances : affiché quand .show ───────────────────────────────
  daySeances: {
    // Pas de style particulier — affiché via state
  },

  // ── .seance_container mobile: flex row, overflow scroll ─────────────
  seanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },

  // ── .cinema mobile: height 42px, width 100px, background primary ─────
  cinema: {
    backgroundColor: COLORS.primary,   // background-color: var(--primary)
    borderRadius: 5,
    height: 42,                         // height: 42px sur mobile
    width: 100,                         // width: 100px sur mobile
    minWidth: 100,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,               // padding: 5px 8px sur mobile
    paddingVertical: 5,
    // Ombre supprimée (remplacée par fond solid primary)
  },
  cinemaText: {
    fontFamily: 'healTheWebA',
    color: '#ffffff',                   // color: var(--card-solid)
    fontSize: 12,                       // font-size: 12px sur mobile
    fontWeight: '600',
    lineHeight: 14,                     // line-height: 1.2
    textAlign: 'center',
  },

  // ── .horaires_container: flex row scroll horizontal ──────────────────
  horairesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
    gap: 6,
  },

  // ── .horaire-wrapper mobile: margin-left 5px ─────────────────────────
  horaireWrapper: {
    flexShrink: 0,
    marginLeft: 0,
  },

  // ── .horaire mobile: height 42px, min-width 72px, border-radius 6px ─
  // background: var(--card-solid) = #fff, color: var(--primary)
  // padding: 4px 8px, box-shadow: 0 6px 20px var(--shadow-md)
  horaire: {
    backgroundColor: '#ffffff',       // background: var(--card-solid)
    borderRadius: 6,                   // border-radius: 6px sur mobile
    height: 42,                        // height: 42px sur mobile
    minWidth: 72,                      // min-width: 72px sur mobile
    paddingHorizontal: 8,              // padding: 4px 8px
    paddingVertical: 4,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    // Bordure légère au lieu d'ombre (iOS shadow warning avec overflow: hidden)
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    flexShrink: 0,
  },
  horaireClickable: {
    borderWidth: 1,
    borderColor: 'rgba(68,76,247,0.25)',
  },
  horaireAvantPremiere: {
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.5)',
    backgroundColor: 'rgba(255,107,107,0.06)',
  },

  // ── .horaire-top : lang + format, gap: 3px, height: 14px ─────────────
  horaireTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 14,
    overflow: 'hidden',
  },

  // ── .lang-badge mobile: font-size 9px, color grey ────────────────────
  langBadge: {
    fontFamily: 'healTheWebA',
    fontSize: 9,
    fontWeight: '700',
    color: '#999',           // color: grey
    marginRight: 0,
  },

  // ── .format-badge mobile: font-size 8px, uppercase ───────────────────
  formatBadge: {
    fontFamily: 'healTheWebA',
    fontSize: 8,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    flexShrink: 1,
  },

  // ── .horaire-bottom: gap 3px, justify-content space-between ──────────
  horaireBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 3,
  },

  // ── .seance-time mobile: font-size 13px, bold, color primary ─────────
  seanceTime: {
    fontFamily: 'healTheWebA',
    fontSize: 13,           // font-size: 13px sur mobile
    fontWeight: '700',
    color: COLORS.primary,  // color: var(--primary) = #444cf7
    lineHeight: 16,
    margin: 0,
  },
  ticketEmoji: {
    fontSize: 10,
  },

  // .calendar-btn: icône calendrier (discret sur mobile)
  calendarBtn: {
    padding: 1,
    opacity: 0.75,
    marginLeft: 'auto',
  },

  // ── .responsive-petite-div (height: 5px) ─────────────────────────────
  petiteDiv: {
    height: 5,
  },

  // ── .responsive-div (height: 10px sur mobile) ────────────────────────
  responsiveDiv: {
    height: 10,
  },
});
