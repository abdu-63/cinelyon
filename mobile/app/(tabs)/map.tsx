import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { CINEMAS, COLORS } from '../../src/lib/constants';

const { width, height } = Dimensions.get('window');

const LYON_REGION = {
  latitude: 45.7640,
  longitude: 4.8357,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={LYON_REGION}
        showsUserLocation={true}
        showsMyLocationButton={true}
        userInterfaceStyle="dark"
      >
        {CINEMAS.map((cinema) => (
          <Marker
            key={cinema.name}
            coordinate={{
              latitude: cinema.latitude,
              longitude: cinema.longitude,
            }}
          >
            <Ionicons name="location" size={32} color={COLORS.primary} />
            <Callout tooltip>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{cinema.name}</Text>
                <Text style={styles.calloutDesc}>{cinema.address}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    width,
    height,
  },
  calloutContainer: {
    backgroundColor: COLORS.surfaceElevated,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 220,
  },
  calloutTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  calloutDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
});
