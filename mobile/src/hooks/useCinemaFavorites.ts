import { useState, useEffect } from 'react';
import { secureStore } from '../lib/secureStore';

const CINEMA_FAVS_KEY = 'cinelyon_cinema_favorites';

export function useCinemaFavorites() {
  const [cinemaFavs, setCinemaFavs] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const stored = await secureStore.getItemAsync(CINEMA_FAVS_KEY);
      if (stored) {
        try {
          setCinemaFavs(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
      setIsLoaded(true);
    }
    load();
  }, []);

  const toggleCinemaFavorite = async (cinemaName: string) => {
    const next = cinemaFavs.includes(cinemaName)
      ? cinemaFavs.filter((c) => c !== cinemaName)
      : [...cinemaFavs, cinemaName];

    setCinemaFavs(next);
    await secureStore.setItemAsync(CINEMA_FAVS_KEY, JSON.stringify(next));
  };

  const isCinemaFavorite = (cinemaName: string) => cinemaFavs.includes(cinemaName);

  return {
    cinemaFavs,
    toggleCinemaFavorite,
    isCinemaFavorite,
    isLoaded,
  };
}
