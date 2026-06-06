import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { CINEMAS, COLORS } from '@/lib/constants';
import { useCinemaFavorites } from '@/hooks/useCinemaFavorites';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const LYON_REGION = {
  latitude: 45.7640,
  longitude: 4.8357,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

type MapTab = 'tous' | 'favoris';

export default function MapScreen() {
  const [activeTab, setActiveTab] = useState<MapTab>('tous');
  const { isCinemaFavorite, toggleCinemaFavorite } = useCinemaFavorites();

  const displayedCinemas = activeTab === 'tous' 
    ? CINEMAS 
    : CINEMAS.filter(c => isCinemaFavorite(c.name));

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.tabs}>
        {(['tous', 'favoris'] as MapTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'tous' ? 'Tous les cinémas' : 'Cinémas favoris'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <MapView
        style={styles.map}
        initialRegion={LYON_REGION}
        showsUserLocation={true}
        showsMyLocationButton={true}
        userInterfaceStyle="dark"
      >
        {displayedCinemas.map((cinema) => {
          const isFav = isCinemaFavorite(cinema.name);

          const handleCalloutPress = () => {
            Alert.alert(
              cinema.name,
              cinema.address,
              [
                {
                  text: 'S\'y rendre (GPS)',
                  onPress: () => {
                    const scheme = Platform.select({ ios: 'maps://0,0?q=', android: 'geo:0,0?q=' });
                    const latLng = `${cinema.latitude},${cinema.longitude}`;
                    const label = encodeURIComponent(cinema.name);
                    const url = Platform.select({
                      ios: `${scheme}${label}@${latLng}`,
                      android: `${scheme}${latLng}(${label})`
                    });
                    if (url) Linking.openURL(url);
                  }
                },
                {
                  text: isFav ? 'Retirer des favoris' : 'Ajouter aux favoris',
                  onPress: () => toggleCinemaFavorite(cinema.name)
                },
                { text: 'Annuler', style: 'cancel' }
              ],
              { cancelable: true }
            );
          };

          return (
            <Marker
              key={`${cinema.name}-${isFav}`}
              coordinate={{
                latitude: cinema.latitude,
                longitude: cinema.longitude,
              }}
              tracksViewChanges={false} // optimise les perfs des marqueurs custom
            >
              <View style={styles.markerContainer}>
                <Ionicons 
                  name={isFav ? "heart" : "location"} 
                  size={32} 
                  color={isFav ? COLORS.favActive : COLORS.primary} 
                />
              </View>
              <Callout tooltip onPress={handleCalloutPress}>
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>{cinema.name}</Text>
                  <Text style={styles.calloutDesc}>{cinema.address}</Text>
                  <View style={styles.favAction}>
                    <Ionicons 
                      name={isFav ? "heart" : "heart-outline"} 
                      size={14} 
                      color={isFav ? COLORS.favActive : COLORS.textMuted} 
                    />
                    <Text style={[styles.favActionText, { color: COLORS.text }]}>
                      Options (GPS, Favoris...)
                    </Text>
                  </View>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {activeTab === 'favoris' && displayedCinemas.length === 0 && (
        <View style={styles.emptyOverlay}>
          <Text style={styles.emptyText}>Aucun cinéma favori pour le moment.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    padding: 8,
    gap: 8,
    zIndex: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: '#fff',
  },
  map: {
    flex: 1,
    width,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
  },
  calloutContainer: {
    backgroundColor: COLORS.surfaceElevated,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 200,
    alignItems: 'center',
  },
  calloutTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  calloutDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  favAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    width: '100%',
    justifyContent: 'center',
  },
  favActionText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  emptyOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: COLORS.surfaceElevated,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});
