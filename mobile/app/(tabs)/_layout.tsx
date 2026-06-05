// app/(tabs)/_layout.tsx
// Navigation par onglets — header fidèle au design web

import { Tabs, useRouter } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/lib/constants';

function TabIcon({ color, size, name }: { color: any; size: number; name: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.iconContainer}>
      <Ionicons name={name} size={size || 24} color={color} />
    </View>
  );
}

/** Header identique au site web : titre + sous-titre à gauche, roue dentée à droite */
function HomeHeader() {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerTitle}>CinéLyon</Text>
        <Text style={styles.headerSubtitle}>Toutes les séances à Lyon, en un seul endroit !</Text>
      </View>
      <TouchableOpacity
        style={styles.settingsBtn}
        onPress={() => router.push('/(tabs)/settings')}
        accessibilityLabel="Paramètres"
      >
        <Ionicons name="settings-outline" size={22} color={COLORS.text} />
      </TouchableOpacity>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 24,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 5,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: { backgroundColor: 'transparent' },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 24,
          color: COLORS.text,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'CinéLyon',
          header: () => <HomeHeader />,
          tabBarLabel: 'Séances',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="film" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favoris',
          tabBarLabel: 'Favoris',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="heart" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Cinémas',
          tabBarLabel: 'Carte',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="map" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="reservation"
        options={{
          title: 'Réservations',
          tabBarLabel: 'Réservation',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="ticket" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Réglages',
          tabBarLabel: 'Réglages',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="settings" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Header identique au site web ────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '400',
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
});
