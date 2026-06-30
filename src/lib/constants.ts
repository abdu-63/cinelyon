// src/lib/constants.ts
// Constantes partagées — portage de cinelyon-app/src/lib/constants.ts

export const BRAND_ORDER = [
  'Pathé',
  'UGC',
  'Lumière',
  'Institut Lumière',
  'Comoedia',
  'CGR',
  'Ciné Meyzieu',
  'Ciné Toboggan',
  'Cinéma Saint-Denis',
  'Cinéma Les Amphis',
  'Gérard-Philipe',
  'Autre',
] as const;

export type Brand = (typeof BRAND_ORDER)[number];

export function getBrand(cinemaName: string): Brand {
  const name = cinemaName.toLowerCase();
  if (name.startsWith('pathé') || name.startsWith('pathe')) return 'Pathé';
  if (name.startsWith('ugc')) return 'UGC';
  if (name.includes('institut lumière') || name.includes('institut lumiere'))
    return 'Institut Lumière';
  if (name.includes('lumière') || name.includes('lumiere')) return 'Lumière';
  if (name.startsWith('cgr')) return 'CGR';
  if (name.includes('comoedia')) return 'Comoedia';
  if (name.includes('amphis')) return 'Cinéma Les Amphis';
  if (name.includes('gerard-philipe') || name.includes('gérard-philipe')) return 'Gérard-Philipe';
  if (name.includes('meyzieu')) return 'Ciné Meyzieu';
  if (name.includes('toboggan')) return 'Ciné Toboggan';
  if (name.includes('saint-denis')) return 'Cinéma Saint-Denis';
  return 'Autre';
}

export const DAYS_FR: Record<number, string> = {
  0: 'Dim',
  1: 'Lun',
  2: 'Mar',
  3: 'Mer',
  4: 'Jeu',
  5: 'Ven',
  6: 'Sam',
};

export const MONTHS_FR: Record<number, string> = {
  1: 'janv',
  2: 'févr',
  3: 'mars',
  4: 'avr',
  5: 'mai',
  6: 'juin',
  7: 'juil',
  8: 'août',
  9: 'sept',
  10: 'oct',
  11: 'nov',
  12: 'déc',
};

export const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — identique au TTL Flask
