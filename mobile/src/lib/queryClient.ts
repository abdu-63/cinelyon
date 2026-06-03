import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { Platform } from 'react-native';
import { STALE_TIME_MS, GC_TIME_MS } from './constants';

// Stockage MMKV ou LocalStorage (Web fallback)
const mmkvStorage = Platform.OS === 'web' ? {
  getItem: (key: string) => {
    try {
      return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
    } catch {}
  },
  removeItem: (key: string) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch {}
  },
} : (() => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { MMKV } = require('react-native-mmkv') as { MMKV: new (config: { id: string }) => {
    getString(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
  }};
  const mmkvInstance = new MMKV({ id: 'cinelyon-query-cache' });
  return {
    getItem: (key: string) => mmkvInstance.getString(key) ?? null,
    setItem: (key: string, value: string) => mmkvInstance.set(key, value),
    removeItem: (key: string) => mmkvInstance.delete(key),
  };
})();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME_MS,   // 5 min — identique au TTL Flask
      gcTime: GC_TIME_MS,          // 24h en cache disque
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      /**
       * offlineFirst : retourne le cache sans lancer de requête réseau
       * si l'appareil est hors ligne — remplace le fallback SW (sw.js lines 96–103)
       */
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

const persister = createSyncStoragePersister({
  storage: mmkvStorage,
  key: 'cinelyon-rq-cache',
  throttleTime: 1000, // évite les writes trop fréquents
});

// Persiste le cache sur disque — survit aux redémarrages de l'app
persistQueryClient({
  queryClient,
  persister,
  maxAge: GC_TIME_MS,
  buster: '1', // incrémenter pour invalider le cache persisté lors de changements de schéma
});

export { persister };
