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
    paddingTop: 4,
    paddingBottom: 4,
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // .mini-cal-btn : padding 4px 8px, border-radius 20px, border 1px, fond transparent
  dayBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,    // --border-color: #ddd
    minWidth: 56,
  },
  // .mini-cal-btn.active : background primary, texte blanc
  dayBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    // box-shadow: 0 6px 20px rgba(0,0,0,0.15)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  // Bouton aujourd'hui — bordure primary sans fond
  dayBtnToday: {
    borderColor: COLORS.primary,
  },
  dayLabel: {
    fontSize: 11,                  // identique .mini-cal-btn: font-size 11px
    fontWeight: '700',
    color: COLORS.textMuted,       // --text-muted: #666
    textTransform: 'capitalize',
  },
  dayLabelActive: {
    color: '#ffffff',              // --card-solid: #fff
  },
  daySubLabel: {
    fontSize: 10,
    color: COLORS.textSubtle,     // --text-light: #999
    marginTop: 1,
  },
  daySubLabelActive: {
    color: 'rgba(255,255,255,0.85)',
  },
});
