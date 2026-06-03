// src/lib/supabase.ts
// Client Supabase avec SecureStore pour la persistance sécurisée des sessions

import { createClient } from '@supabase/supabase-js';
import { secureStore } from './secureStore';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Adaptateur SecureStore pour le stockage des sessions Supabase.
 * Remplace le localStorage web par un stockage chiffré natif iOS/Android.
 * Compatible avec expo-secure-store (chiffrement AES-256 sur iOS Keychain,
 * EncryptedSharedPreferences sur Android).
 *
 * Utilise localStorage en fallback sur la plateforme Web via secureStore helper.
 */
const ExpoSecureStoreAdapter = {
  getItem: (key: string): Promise<string | null> =>
    secureStore.getItemAsync(key),

  setItem: (key: string, value: string): Promise<void> =>
    secureStore.setItemAsync(key, value),

  removeItem: (key: string): Promise<void> =>
    secureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // géré par expo-router deep links
  },
});
