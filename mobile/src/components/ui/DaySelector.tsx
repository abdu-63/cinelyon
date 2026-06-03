// src/components/ui/DaySelector.tsx
// Sélecteur de jours horizontal — équivalent de la mini-calendar web

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
    // Auto-scroll vers le bouton sélectionné
    if (delta !== null && scrollRef.current) {
      scrollRef.current.scrollTo({ x: delta * 68, animated: true });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Bouton "Tous" */}
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
  container: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 56,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayBtnToday: {
    borderColor: COLORS.primary,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  dayLabelActive: {
    color: '#fff',
  },
  daySubLabel: {
    fontSize: 10,
    color: COLORS.textSubtle,
    marginTop: 1,
  },
  daySubLabelActive: {
    color: 'rgba(255,255,255,0.85)',
  },
});
