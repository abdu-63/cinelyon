// src/components/ui/DaySelector.tsx
// Sélecteur de jours horizontal — portage fidèle des .mini-cal-btn du site web

import React, { useRef } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { DateLabel } from '../../types';
import { COLORS } from '../../lib/constants';

interface DaySelectorProps {
  dates: DateLabel[];
  selectedDelta: number | null; // null = "Tous"
  onSelect: (delta: number | null) => void;
}

export function DaySelector({ dates, selectedDelta, onSelect }: DaySelectorProps) {
  const scrollRef = useRef<ScrollView>(null);

  const handleSelect = (delta: number | null) => {
    onSelect(delta);
    if (delta !== null && scrollRef.current) {
      scrollRef.current.scrollTo({ x: delta * 80, animated: true });
    }
  };

  return (
    // Container du mini-calendar — même padding que .search-container du site
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Bouton "Tous" — identique à .mini-cal-btn */}
        <DayButton
          label="Tous"
          sublabel=""
          isSelected={selectedDelta === null}
          onPress={() => handleSelect(null)}
        />

        {dates.map((date) => (
          <DayButton
            key={date.isoDate}
            label={date.index === 0 ? 'Auj.' : date.jour}
            sublabel={`${date.chiffre} ${date.mois}`}
            isSelected={selectedDelta === date.index}
            onPress={() => handleSelect(date.index)}
            isToday={date.index === 0}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface DayButtonProps {
  label: string;
  sublabel: string;
  isSelected: boolean;
  onPress: () => void;
  isToday?: boolean;
}

function DayButton({ label, sublabel, isSelected, onPress, isToday }: DayButtonProps) {
  return (
    // .mini-cal-btn du site: padding 4px 8px, border-radius 20px, font-size 11px
    <TouchableOpacity
      style={[
        styles.dayBtn,
        isSelected && styles.dayBtnActive,
        isToday && !isSelected && styles.dayBtnToday,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
    >
      <Text style={[styles.dayLabel, isSelected && styles.dayLabelActive]}>
        {label}
      </Text>
      {sublabel ? (
        <Text style={[styles.daySubLabel, isSelected && styles.daySubLabelActive]}>
          {sublabel}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Wrapper du mini-calendar
  container: {
    backgroundColor: 'transparent',
    paddingTop: 8,
    paddingBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // .mini-cal-btn : premium style
  dayBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    minWidth: 64,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  // .mini-cal-btn.active : background primary, texte blanc
  dayBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },
  // Bouton aujourd'hui — bordure primary sans fond
  dayBtnToday: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(68,76,247,0.05)',
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  dayLabelActive: {
    color: '#ffffff',
  },
  daySubLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  daySubLabelActive: {
    color: 'rgba(255,255,255,0.9)',
  },
});
