// src/components/ui/FilterBar.tsx
// Barre de recherche + filtres rapides pour la liste des films
// Portage de la section filters de index.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';
import { FiltersState, TimeSlot } from '../../types';
import { FilmFilterOptions } from '../../utils/showtimes';

interface FilterBarProps {
  filters: FiltersState;
  options: FilmFilterOptions;
  onFiltersChange: (filters: Partial<FiltersState>) => void;
  totalCount: number;
  filteredCount: number;
}

export function FilterBar({
  filters,
  options,
  onFiltersChange,
  totalCount,
  filteredCount,
}: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [localTitleQuery, setLocalTitleQuery] = useState(filters.titleQuery);

  // Sync with parent filters when cleared or changed externally
  useEffect(() => {
    setLocalTitleQuery(filters.titleQuery);
  }, [filters.titleQuery]);

  // Debounce the text inputs to avoid database/API overloading on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localTitleQuery !== filters.titleQuery) {
        onFiltersChange({ titleQuery: localTitleQuery });
      }
    }, 300); // 300ms debounce window

    return () => clearTimeout(handler);
  }, [localTitleQuery]);

  const hasActiveFilters =
    filters.genre ||
    filters.director ||
    filters.cinema ||
    filters.format ||
    filters.timeSlot;

  const clearAll = () => {
    onFiltersChange({
      titleQuery: '',
      genre: '',
      director: '',
      cinema: '',
      format: '',
      timeSlot: null,
    });
  };

  return (
    <View style={styles.container}>
      {/* Barre de recherche */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un film…"
          placeholderTextColor={COLORS.textSubtle}
          value={localTitleQuery}
          onChangeText={setLocalTitleQuery}
          clearButtonMode="while-editing"
          returnKeyType="search"
          accessibilityLabel="Rechercher un film"
        />
        <TouchableOpacity
          style={[styles.filterToggleBtn, hasActiveFilters && styles.filterToggleBtnActive]}
          onPress={() => setShowFilters(true)}
          accessibilityLabel="Ouvrir les filtres"
        >
          <Ionicons name="options" size={20} color={COLORS.text} />
          {hasActiveFilters && <View style={styles.filterActiveDot} />}
        </TouchableOpacity>
      </View>

      {/* Chips de filtres actifs */}
      {hasActiveFilters && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {filters.genre ? (
            <FilterChip
              label={filters.genre}
              onRemove={() => onFiltersChange({ genre: '' })}
            />
          ) : null}
          {filters.cinema ? (
            <FilterChip
              label={filters.cinema}
              onRemove={() => onFiltersChange({ cinema: '' })}
            />
          ) : null}
          {filters.format ? (
            <FilterChip
              label={filters.format.toUpperCase()}
              onRemove={() => onFiltersChange({ format: '' })}
            />
          ) : null}
          {filters.director ? (
            <FilterChip
              label={filters.director}
              onRemove={() => onFiltersChange({ director: '' })}
            />
          ) : null}
          {filters.timeSlot ? (
            <FilterChip
              label={TIME_SLOT_LABELS[filters.timeSlot]}
              onRemove={() => onFiltersChange({ timeSlot: null })}
            />
          ) : null}
          <TouchableOpacity style={styles.clearAllBtn} onPress={clearAll}>
            <Text style={styles.clearAllText}>Tout effacer</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Compteur résultats */}
      <Text style={styles.resultCount}>
        {filteredCount === totalCount
          ? `${totalCount} films`
          : `${filteredCount} / ${totalCount} films`}
      </Text>

      {/* Modal filtres avancés */}
      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        options={options}
        onFiltersChange={(f) => {
          onFiltersChange(f);
        }}
      />
    </View>
  );
}

// ── Composants internes ───────────────────────────────────────────────────────

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
        <Text style={styles.chipRemove}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  morning: 'Matin (avant 13h)',
  afternoon: 'Après-midi (13h-18h)',
  evening: 'Soirée (18h-22h)',
  night: 'Nuit (après 22h)',
};

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: FiltersState;
  options: FilmFilterOptions;
  onFiltersChange: (f: Partial<FiltersState>) => void;
}

function FilterModal({ visible, onClose, filters, options, onFiltersChange }: FilterModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modal}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filtres</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
            <Text style={styles.modalCloseBtnText}>Fermer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          {/* Créneau horaire */}
          <FilterSection title="Créneau horaire">
            <View style={styles.pillsGrid}>
              {(Object.entries(TIME_SLOT_LABELS) as [TimeSlot, string][]).map(([slot, label]) => (
                <SelectPill
                  key={slot}
                  label={label}
                  isSelected={filters.timeSlot === slot}
                  onPress={() =>
                    onFiltersChange({ timeSlot: filters.timeSlot === slot ? null : slot })
                  }
                />
              ))}
            </View>
          </FilterSection>

          {/* Cinéma */}
          {options.cinemas.length > 0 && (
            <FilterSection title="Cinéma">
              <View style={styles.pillsGrid}>
                {options.cinemas.map((c) => (
                  <SelectPill
                    key={c}
                    label={c}
                    isSelected={filters.cinema === c}
                    onPress={() => onFiltersChange({ cinema: filters.cinema === c ? '' : c })}
                  />
                ))}
              </View>
            </FilterSection>
          )}

          {/* Format */}
          {options.formats.length > 0 && (
            <FilterSection title="Format">
              <View style={styles.pillsGrid}>
                {options.formats.map((f) => (
                  <SelectPill
                    key={f}
                    label={f.toUpperCase()}
                    isSelected={filters.format === f}
                    onPress={() => onFiltersChange({ format: filters.format === f ? '' : f })}
                  />
                ))}
              </View>
            </FilterSection>
          )}

          {/* Genre */}
          {options.genres.length > 0 && (
            <FilterSection title="Genre">
              <View style={styles.pillsGrid}>
                {options.genres.map((g) => (
                  <SelectPill
                    key={g}
                    label={g}
                    isSelected={filters.genre === g}
                    onPress={() => onFiltersChange({ genre: filters.genre === g ? '' : g })}
                  />
                ))}
              </View>
            </FilterSection>
          )}

          {/* Réalisateur */}
          {options.directors && options.directors.length > 0 && (
            <FilterSection title="Réalisateur">
              <View style={styles.pillsGrid}>
                {options.directors.map((d) => (
                  <SelectPill
                    key={d}
                    label={d}
                    isSelected={filters.director === d}
                    onPress={() => onFiltersChange({ director: filters.director === d ? '' : d })}
                  />
                ))}
              </View>
            </FilterSection>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterSectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function SelectPill({
  label,
  isSelected,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.selectPill, isSelected && styles.selectPillActive]}
      onPress={onPress}
    >
      <Text style={[styles.selectPillText, isSelected && styles.selectPillTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // .search-container du site: background rgba(255,255,255,0.8) + backdrop-filter + border-radius 15px
  container: {
    backgroundColor: '#ffffff', // solid color to avoid shadow warning on iOS
    borderRadius: 15,
    marginHorizontal: 10,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 4,
    // box-shadow: 0 4px 16px rgba(0,0,0,0.08)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 8,
  },
  searchInput: {
    fontFamily: 'healTheWebA',
    flex: 1,
    // .search-input du site: border 2px #ddd, border-radius 8px, padding 12px 15px
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontSize: 14,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  filterToggleBtn: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
  },
  filterToggleBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  filterToggleIcon: { fontSize: 18 },
  filterActiveDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },

  chipsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingBottom: 6,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '33',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.primary + '66',
  },
  chipText: { fontFamily: 'healTheWebA', color: COLORS.primary, fontSize: 12, fontWeight: '600' },
  chipRemove: { fontFamily: 'healTheWebA', color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  clearAllBtn: { paddingHorizontal: 8 },
  clearAllText: { fontFamily: 'healTheWebA', color: COLORS.textSubtle, fontSize: 12 },

  resultCount: {
    fontFamily: 'healTheWebA',
    fontSize: 11,
    color: COLORS.textSubtle,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 2,
  },

  // Modal
  modal: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { fontFamily: 'healTheWebA', fontSize: 18, fontWeight: '700', color: COLORS.text },
  modalCloseBtn: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modalCloseBtnText: { fontFamily: 'healTheWebA', color: COLORS.primary, fontWeight: '600' },
  modalContent: { padding: 16, paddingBottom: 48 },

  filterSection: { marginBottom: 24 },
  filterSectionTitle: {
    fontFamily: 'healTheWebA',
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  pillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectPillActive: {
    backgroundColor: COLORS.primary + '33',
    borderColor: COLORS.primary,
  },
  selectPillText: { fontFamily: 'healTheWebA', fontSize: 13, color: COLORS.textMuted },
  selectPillTextActive: { fontFamily: 'healTheWebA', color: COLORS.primary, fontWeight: '600' },
});
