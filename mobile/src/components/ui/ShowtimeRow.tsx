// src/components/ui/ShowtimeRow.tsx
// Rangée de séances — fidèle au design web
// .cinema = badge bleu primary | .horaire = carte blanche avec ombre

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
} from 'react-native';
import { Seance } from '../../types';
import { COLORS } from '../../lib/constants';
import { isPastSeance } from '../../utils/showtimes';
import { getDeltaForDate, formatTime } from '../../utils/dateUtils';

interface ShowtimeRowProps {
  cinemaName: string;
  seances: Seance[];
  isoDate: string;
  onCalendarPress?: (seance: Seance) => void;
}

export function ShowtimeRow({
  cinemaName,
  seances,
  isoDate,
  onCalendarPress,
}: ShowtimeRowProps) {
  const isToday = getDeltaForDate(isoDate) === 0;

  const visibleSeances = isToday
    ? seances.filter((s) => !isPastSeance(s.time))
    : seances;

  if (!visibleSeances.length) return null;

  return (
    // .seance_container du site — flex row avec cinéma + horaires
    <View style={styles.container}>
      {/* .cinema du site — badge bleu primary avec texte blanc */}
      <View style={styles.cinemaLabel}>
        <Text style={styles.cinemaText} numberOfLines={3}>
          {cinemaName}
        </Text>
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
            onCalendarPress={onCalendarPress ? () => onCalendarPress(seance) : undefined}
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
      Linking.openURL(seance.ticketing_url);
    }
  };

  const hasTicket = !!seance.ticketing_url;
  const isAvantPremiere = seance.format && seance.format.toLowerCase().includes('première');

  return (
    // .horaire du site — carte blanche avec ombre, couleur primary pour le texte
    <TouchableOpacity
      style={[
        styles.pill,
        hasTicket && styles.pillClickable,
        isAvantPremiere && styles.pillAvantPremiere,
      ]}
      onPress={hasTicket ? handleTicketPress : undefined}
      activeOpacity={hasTicket ? 0.75 : 1}
      accessibilityRole={hasTicket ? 'link' : 'text'}
      accessibilityLabel={`${seance.time} ${seance.lang}${seance.format ? ' ' + seance.format : ''}`}
    >
      {/* .horaire-top : lang-badge + format-badge */}
      <View style={styles.pillTop}>
        <Text style={styles.langBadge}>{seance.lang}</Text>
        {seance.format ? (
          <Text style={styles.formatBadge} numberOfLines={1}>
            {seance.format.split(', ')[0]}
          </Text>
        ) : null}
      </View>

      {/* .horaire-bottom : heure en grand + icône calendrier */}
      <View style={styles.pillBottom}>
        {/* .seance-time: font-size 13px, bold, color primary */}
        <Text style={styles.time}>{formatTime(seance.time)}</Text>
        {/* Icône billet si URL disponible */}
        {hasTicket ? (
          <Text style={styles.ticketIcon}>🎟</Text>
        ) : null}
      </View>
    </TouchableOpacity>
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

  // .cinema du site: background primary, hauteur 42px, width 100px, texte blanc
  cinemaLabel: {
    backgroundColor: COLORS.primary,
    borderRadius: 5,
    height: 42,
    width: 100,
    minWidth: 100,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    // box-shadow: 0 6px 20px rgba(0,0,0,0.15)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  cinemaText: {
    color: '#ffffff',
    fontSize: 12,
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

  // .horaire du site: carte blanche, border-radius 6px, height 42px, min-width 72px
  pill: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    height: 42,
    minWidth: 72,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 0,
    justifyContent: 'space-between',
    // box-shadow: 0 6px 20px rgba(0,0,0,0.15)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
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
    height: 14,
    overflow: 'hidden',
  },
  langBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#999',   // identique à .lang-badge du site
  },
  formatBadge: {
    fontSize: 8,
    fontWeight: '700',
    color: '#999',   // identique à .format-badge du site
    textTransform: 'uppercase',
    flexShrink: 1,
  },

  // .horaire-bottom : heure + icône billet
  pillBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // .seance-time: font-size 13px bold, color primary (#444cf7)
  time: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,   // identique au site: color var(--primary)
    lineHeight: 15,
  },
  ticketIcon: {
    fontSize: 10,
    marginLeft: 3,
  },
});
