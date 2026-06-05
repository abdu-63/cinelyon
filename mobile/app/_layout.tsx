// app/_layout.tsx
// Layout racine Expo Router — configure les Providers globaux

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { queryClient } from '../src/lib/queryClient';
import { COLORS } from '../src/lib/constants';
import { usePushNotifications } from '../src/hooks/usePushNotifications';
import 'react-native-gesture-handler';

export default function RootLayout() {
  usePushNotifications(); // Initialise les écouteurs et demande la permission

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#f5f6f8' }]} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: 'transparent' },
            headerTintColor: COLORS.text,
            headerTitleStyle: { fontWeight: '700', color: COLORS.text },
            contentStyle: { backgroundColor: 'transparent' },
            animation: 'fade_from_bottom',
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="film/[slug]"
            options={{
              title: '',
              headerTransparent: true,
              headerBackTitle: 'Retour',
              headerTintColor: COLORS.text,
            }}
          />
        </Stack>
        <Toast />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
