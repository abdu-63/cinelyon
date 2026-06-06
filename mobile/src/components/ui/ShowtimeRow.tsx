// src/components/ui/ShowtimeRow.tsx
// Rangée de séances — fidèle au design web
// .cinema = badge bleu primary | .horaire = carte blanche avec ombre
// Nouveau: bouton calendrier sur chaque séance

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Seance } from '../../types';
import { COLORS } from '../../lib/constants';
import { isPastSeance } from '../../utils/showtimes';
import { getDeltaForDate, formatTime } from '../../utils/dateUtils';
import { useCalendar } from '../../hooks/useCalendar';
import { safeOpenURL } from '../../utils/urlUtils';

interface ShowtimeRowProps {
  cinemaName: string;
  seances: Seance[];
  isoDate: string;
  filmTitle?: string;
  filmDuree?: string;
  onCalendarPress?: (seance: Seance) => void;
  hidePastSessions?: boolean;
}

export function ShowtimeRow({
  cinemaName,
  seances,
  isoDate,
  filmTitle,
  filmDuree,
  onCalendarPress,
  hidePastSessions = true,
}: ShowtimeRowProps) {
  const isToday = getDeltaForDate(isoDate) === 0;
  const { addToCalendar } = useCalendar();

  const visibleSeances = isToday && hidePastSessions
    ? seances.filter((s) => !isPastSeance(s.time))
    : seances;

  if (!visibleSeances.length) return null;

  const handleCalendar = (seance: Seance) => {
    if (onCalendarPress) {
      onCalendarPress(seance);
    } else if (filmTitle) {
      addToCalendar(filmTitle, cinemaName, seance, isoDate, filmDuree);
    }
  };

  return (
    // .seance_container du site — flex row avec cinéma + horaires
    <View style={styles.container}>
      {/* .cinema du site — badge bleu primary avec texte blanc */}
      <View style={styles.cinemaLabelContainer}>
        <View style={styles.cinemaLabel}>
          <Text style={styles.cinemaText} numberOfLines={3}>
            {cinemaName}
          </Text>
        </View>
      </View>

      {/* .horaires_container du site — scroll horizontal */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.seancesRow}
      >
        {visibleSeances.map((seance, idx) => (
          <SeancePill
            key={`${seance.time}-${idx}`}
            seance={seance}
            onCalendarPress={filmTitle ? () => handleCalendar(seance) : undefined}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface SeancePillProps {
  seance: Seance;
  onCalendarPress?: () => void;
}

function SeancePill({ seance, onCalendarPress }: SeancePillProps) {
  const handleTicketPress = () => {
    if (seance.ticketing_url) {
      safeOpenURL(seance.ticketing_url);
    }
  };

  const hasTicket = !!seance.ticketing_url;
  const isAvantPremiere = seance.format && seance.format.toLowerCase().includes('première');

  return (
    // .horaire du site — carte blanche avec ombre, couleur primary pour le texte
    <View
      style={[
        styles.pill,
        hasTicket && styles.pillClickable,
        isAvantPremiere && styles.pillAvantPremiere,
      ]}
    >
      {/* Ligne du haut : lang + format badges */}
      <View style={styles.pillTop}>
        <Text style={styles.langBadge}>{seance.lang}</Text>
        {seance.format ? (
          <Text style={styles.formatBadge} numberOfLines={1}>
            {seance.format.split(', ')[0]}
          </Text>
        ) : null}
      </View>

      {/* Ligne du bas : heure + boutons action */}
      <View style={styles.pillBottom}>
        <TouchableOpacity
          onPress={hasTicket ? handleTicketPress : undefined}
          activeOpacity={hasTicket ? 0.75 : 1}
          accessibilityRole={hasTicket ? 'link' : 'text'}
          accessibilityLabel={`${seance.time} ${seance.lang}${seance.format ? ' ' + seance.format : ''}`}
          style={styles.timeTouch}
        >
          <Text style={styles.time}>{formatTime(seance.time)}</Text>
        </TouchableOpacity>

        {/* Bouton calendrier */}
        {onCalendarPress ? (
          <TouchableOpacity
            onPress={onCalendarPress}
            style={styles.calendarBtn}
            accessibilityLabel="Ajouter au calendrier"
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          >
            <Ionicons name="calendar-outline" size={13} color={COLORS.primary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // .seance_container du site: flex row
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    overflow: 'hidden',
  },

  cinemaLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 130,
    minWidth: 130,
    flexShrink: 0,
  },
  cinemaLabel: {
    backgroundColor: COLORS.primary,
    borderRadius: 5,
    height: 48,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  gpsBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cinemaText: {
    fontFamily: 'healTheWebA',
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    textAlign: 'center',
  },

  // .horaires_container: scroll horizontal
  seancesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
    gap: 6,
  },

  // .horaire du site: carte blanche, border-radius 6px, min-width 72px
  pill: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    minWidth: 72,
    minHeight: 48,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexShrink: 0,
    justifyContent: 'space-between',
    // Bordure légère au lieu d'ombre (iOS shadow warning)
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    elevation: 2,
  },
  pillClickable: {
    // Légère bordure primary pour les billets disponibles
    borderWidth: 1,
    borderColor: 'rgba(68,76,247,0.25)',
  },
  pillAvantPremiere: {
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.5)',
    backgroundColor: 'rgba(255,107,107,0.06)',
  },

  // .horaire-top : lang-badge + format-badge en petits textes gris
  pillTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  langBadge: {
    fontFamily: 'healTheWebA',
    fontSize: 9,
    fontWeight: '700',
    color: '#999', // identique à .lang-badge du site
  },
  formatBadge: {
    fontFamily: 'healTheWebA',
    fontSize: 8,
    fontWeight: '700',
    color: '#999', // identique à .format-badge du site
    textTransform: 'uppercase',
    flexShrink: 1,
  },

  // .horaire-bottom : heure + bouton calendrier
  pillBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  timeTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  // .seance-time: font-size 13px bold, color primary (#444cf7)
  time: {
    fontFamily: 'healTheWebA',
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary, // identique au site: color var(--primary)
    lineHeight: 16,
  },
  ticketIcon: {
    fontSize: 10,
  },

  // Bouton calendrier — icône discrète en bas à droite de la pill
  calendarBtn: {
    padding: 2,
    opacity: 0.8,
  },
});
