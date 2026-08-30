// src/utils/streamingProviders.ts
// Gestion des liens vers les plateformes de streaming pour le Web

export interface StreamingProviderConfig {
  getWebUrl: (title: string) => string;
}

export const STREAMING_PROVIDERS: Record<string, StreamingProviderConfig> = {
  netflix: {
    getWebUrl: (title) =>
      title
        ? `https://www.netflix.com/search?q=${encodeURIComponent(title)}`
        : 'https://www.netflix.com',
  },
  'amazon prime video': {
    getWebUrl: (title) =>
      title
        ? `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodeURIComponent(title)}`
        : 'https://www.primevideo.com',
  },
  'disney plus': {
    getWebUrl: (title) =>
      title
        ? `https://www.disneyplus.com/search?q=${encodeURIComponent(title)}`
        : 'https://www.disneyplus.com',
  },
  canal: {
    getWebUrl: (title) =>
      title
        ? `https://www.canalplus.com/recherche/${encodeURIComponent(title)}`
        : 'https://www.canalplus.com',
  },
  'apple tv': {
    getWebUrl: (title) =>
      title
        ? `https://tv.apple.com/search?term=${encodeURIComponent(title)}`
        : 'https://tv.apple.com',
  },
  paramount: {
    getWebUrl: (title) =>
      title
        ? `https://www.paramountplus.com/fr/search/?q=${encodeURIComponent(title)}`
        : 'https://www.paramountplus.com',
  },
  max: {
    getWebUrl: (title) =>
      title ? `https://www.max.com/search?q=${encodeURIComponent(title)}` : 'https://www.max.com',
  },
  arte: {
    getWebUrl: (title) =>
      title
        ? `https://www.arte.tv/fr/search/?q=${encodeURIComponent(title)}`
        : 'https://www.arte.tv',
  },
  'france tv': {
    getWebUrl: (title) =>
      title
        ? `https://www.france.tv/recherche/?q=${encodeURIComponent(title)}`
        : 'https://www.france.tv',
  },
  mubi: {
    getWebUrl: (title) =>
      title ? `https://mubi.com/search?query=${encodeURIComponent(title)}` : 'https://mubi.com',
  },
};

export function getStreamingProviderWebUrl(providerName: string, movieTitle: string): string {
  const normalized = providerName.toLowerCase();
  const matchedKey = Object.keys(STREAMING_PROVIDERS).find((key) => normalized.includes(key));
  const config = matchedKey ? STREAMING_PROVIDERS[matchedKey] : null;

  if (config) {
    return config.getWebUrl(movieTitle);
  }
  return `https://www.justwatch.com/fr/recherche?q=${encodeURIComponent(movieTitle)}`;
}

export function openStreamingProvider(providerName: string, movieTitle: string): void {
  const webUrl = getStreamingProviderWebUrl(providerName, movieTitle);
  if (typeof window !== 'undefined') {
    window.open(webUrl, '_blank', 'noopener,noreferrer');
  }
}

