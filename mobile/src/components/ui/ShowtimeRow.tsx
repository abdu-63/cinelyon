// src/components/ui/ShowtimeRow.tsx
// Rangée de séances pour un cinéma donné

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
  isoDate: string;  // pour déterminer si c'est aujourd'hui
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
    <View style={styles.container}>
      <Text style={styles.cinemaName} numberOfLines={1}>
        {cinemaName}
      </Text>
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

  return (
    <TouchableOpacity
      style={[styles.pill, hasTicket && styles.pillClickable]}
      onPress={hasTicket ? handleTicketPress : undefined}
      activeOpacity={hasTicket ? 0.7 : 1}
      accessibilityRole={hasTicket ? 'link' : 'text'}
      accessibilityLabel={`${seance.time} ${seance.lang}${seance.format ? ' ' + seance.format : ''}`}
    >
      {/* Heure */}
      <Text style={styles.time}>{formatTime(seance.time)}</Text>

      {/* Badges lang + format */}
      <View style={styles.badgesRow}>
        <View style={[styles.langBadge, seance.lang === 'VO' ? styles.voBadge : styles.vfBadge]}>
          <Text style={styles.langText}>{seance.lang}</Text>
        </View>
        {seance.format && (
          <View style={styles.formatBadge}>
            <Text style={styles.formatText}>{seance.format.split(', ')[0]}</Text>
          </View>
        )}
      </View>

      {/* Icône billet si URL disponible */}
      {hasTicket && (
        <Text style={styles.ticketIcon}>🎟</Text>
      )}
    </TouchableOpacity>
  );
}



const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cinemaName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 6,
    paddingLeft: 4,
  },
  seancesRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  pill: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 68,
  },
  pillClickable: {
    borderColor: COLORS.primary + '66',
  },
  time: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  langBadge: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  voBadge: {
    backgroundColor: COLORS.voBadge,
  },
  vfBadge: {
    backgroundColor: COLORS.vfBadge,
  },
  langText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  formatBadge: {
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formatText: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  ticketIcon: {
    fontSize: 11,
    marginTop: 3,
  },
});
