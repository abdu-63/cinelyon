import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const secureStore = Platform.OS === 'web' ? {
  getItemAsync: async (key: string): Promise<string | null> => {
    try {
      return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItemAsync: async (key: string, value: string): Promise<void> => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
    } catch {}
  },
  deleteItemAsync: async (key: string): Promise<void> => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch {}
  },
} : {
  getItemAsync: (key: string): Promise<string | null> =>
    SecureStore.getItemAsync(key),

  setItemAsync: (key: string, value: string): Promise<void> =>
    SecureStore.setItemAsync(key, value),

  deleteItemAsync: (key: string): Promise<void> =>
    SecureStore.deleteItemAsync(key),
};
