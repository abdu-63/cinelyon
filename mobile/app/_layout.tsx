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
import Svg, { Path } from 'react-native-svg';
import Animated, { 
  FadeOut, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing,
  cancelAnimation
} from 'react-native-reanimated';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function AnimatedSplashScreen({ onFinish }: { onFinish: () => void }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1200,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    const timer = setTimeout(() => {
      onFinish();
    }, 1500);

    return () => {
      cancelAnimation(rotation);
      clearTimeout(timer);
    };
  }, [onFinish]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <Animated.View 
      exiting={FadeOut.duration(300)} 
      style={[StyleSheet.absoluteFillObject, { backgroundColor: '#f5f6f8', zIndex: 9999, justifyContent: 'center', alignItems: 'center' }]}
    >
      <Animated.View style={animatedStyle}>
        <Svg width={80} height={80} viewBox="0 0 24 24" fill="none">
          <Path 
            d="M20.0001 12C20.0001 13.3811 19.6425 14.7386 18.9623 15.9405C18.282 17.1424 17.3022 18.1477 16.1182 18.8587C14.9341 19.5696 13.5862 19.9619 12.2056 19.9974C10.825 20.0328 9.45873 19.7103 8.23975 19.0612" 
            stroke={COLORS.primary} 
            strokeWidth={3.55556} 
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
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
