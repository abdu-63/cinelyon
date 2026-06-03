import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../src/lib/constants';
import { Ionicons } from '@expo/vector-icons';

export default function MapScreenWeb() {
  return (
    <View style={styles.container}>
      <Ionicons name="map-outline" size={64} color={COLORS.textMuted} style={styles.icon} />
      <Text style={styles.title}>Carte indisponible sur le Web</Text>
      <Text style={styles.text}>
        La carte interactive des cinémas est actuellement réservée à l'application mobile (iOS et Android).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  text: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
});
