// src/components/skeletons/FilmCardSkeleton.tsx
// Skeleton de chargement pour FilmCard

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../../lib/constants';

function Shimmer({ style }: { style: object }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return <Animated.View style={[style, { opacity }]} />;
}

export function FilmCardSkeleton() {
  return (
    <View style={styles.card}>
      <Shimmer style={styles.poster} />
      <View style={styles.info}>
        <Shimmer style={styles.titleLine} />
        <Shimmer style={styles.metaLine} />
        <Shimmer style={styles.smallLine} />
        <View style={styles.ratingsRow}>
          <Shimmer style={styles.badge} />
          <Shimmer style={styles.badge} />
        </View>
        <Shimmer style={styles.genreLine} />
      </View>
    </View>
  );
}

export function FilmListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <FilmCardSkeleton key={i} />
      ))}
    </>
  );
}

const SKELETON_COLOR = COLORS.surfaceElevated;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    marginHorizontal: '5%',  // Identique à FilmCard
    marginBottom: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  poster: {
    width: 100,
    height: 144,
    backgroundColor: SKELETON_COLOR,
  },
  info: {
    flex: 1,
    padding: 10,
    gap: 8,
  },
  titleLine: {
    height: 16,
    backgroundColor: SKELETON_COLOR,
    borderRadius: 4,
    width: '80%',
  },
  metaLine: {
    height: 12,
    backgroundColor: SKELETON_COLOR,
    borderRadius: 4,
    width: '60%',
  },
  smallLine: {
    height: 10,
    backgroundColor: SKELETON_COLOR,
    borderRadius: 4,
    width: '40%',
  },
  ratingsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    height: 20,
    width: 60,
    backgroundColor: SKELETON_COLOR,
    borderRadius: 6,
  },
  genreLine: {
    height: 10,
    backgroundColor: SKELETON_COLOR,
    borderRadius: 4,
    width: '70%',
  },
});
