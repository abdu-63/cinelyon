// app/_layout.tsx
// Layout racine Expo Router — configure les Providers globaux

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { queryClient } from '../src/lib/queryClient';
import { COLORS } from '../src/lib/constants';
import { usePushNotifications } from '../src/hooks/usePushNotifications';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-gesture-handler';
import LottieView from 'lottie-react-native';
import Animated, { FadeOut } from 'react-native-reanimated';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function AnimatedSplashScreen({ onFinish }: { onFinish: () => void }) {
  return (
    <Animated.View 
      exiting={FadeOut.duration(300)} 
      style={[StyleSheet.absoluteFillObject, { backgroundColor: '#f5f6f8', zIndex: 9999, justifyContent: 'center', alignItems: 'center' }]}
    >
      <LottieView
        source={require('../assets/lottie/splash.json')}
        autoPlay
        loop={false}
        onAnimationFinish={onFinish}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftWidth: 0, borderRadius: 12, backgroundColor: COLORS.surfaceElevated, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontFamily: 'healTheWebA',
        color: COLORS.text,
        textAlign: 'center'
      }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftWidth: 0, borderRadius: 12, backgroundColor: COLORS.surfaceElevated, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 }}
      text1Style={{
        fontSize: 15,
        fontFamily: 'healTheWebA',
        color: COLORS.warning,
        textAlign: 'center'
      }}
    />
  )
};

export default function RootLayout() {
  const [isSplashAnimationComplete, setSplashAnimationComplete] = React.useState(false);
  usePushNotifications(); // Initialise les écouteurs et demande la permission

  const [loaded, error] = useFonts({
    'healTheWebA': require('../assets/fonts/HealTheWebA-Regular.otf'),
    'healTheWebB': require('../assets/fonts/HealTheWebB-Regular.otf'),
    'Montserrat-ExtraBold': require('../assets/fonts/montserrat_extrabold.ttf'),
    'Impact': require('../assets/fonts/impact.ttf'),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Appliquer la police par défaut globalement
  useEffect(() => {
    if (loaded) {
      const { Text, TextInput } = require('react-native');
      const oldTextRender = Text.render;
      if (oldTextRender && !Text._fontPolyfilled) {
        Text.render = function (...args: any[]) {
          const origin = oldTextRender.call(this, ...args);
          return React.cloneElement(origin, {
            style: [{ fontFamily: 'healTheWebA' }, origin.props.style]
          });
        };
        Text._fontPolyfilled = true;
      }
      
      const oldTextInputRender = TextInput.render;
      if (oldTextInputRender && !TextInput._fontPolyfilled) {
        TextInput.render = function (...args: any[]) {
          const origin = oldTextInputRender.call(this, ...args);
          return React.cloneElement(origin, {
            style: [{ fontFamily: 'healTheWebA' }, origin.props.style]
          });
        };
        TextInput._fontPolyfilled = true;
      }
    }
  }, [loaded]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        {/* Fond identique au site: #f5f6f8 */}
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
        <Toast config={toastConfig} topOffset={60} />
        {!isSplashAnimationComplete && (
          <AnimatedSplashScreen onFinish={() => setSplashAnimationComplete(true)} />
        )}
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
