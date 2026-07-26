// src/lib/constants.ts
// Portage exact des constantes de app.py et index.js

import { CinemaInfo } from '../types';

// ── Ordre des enseignes (app.py lines 559–572) ────────────────────────────────

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

/**
 * Portage exact de app.py::get_brand()
 * Ordre des conditions identique pour éviter les collisions (ex: "Institut Lumière" avant "Lumière")
 */
export function getBrand(cinemaName: string): Brand {
  const name = cinemaName.toLowerCase();
  if (name.startsWith('pathé') || name.startsWith('pathe')) return 'Pathé';
  if (name.startsWith('ugc')) return 'UGC';
  if (name.includes('institut lumière') || name.includes('institut lumiere')) return 'Institut Lumière';
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

// ── Traductions jours/mois (app.py lines 199–221) ────────────────────────────

/** Jours de la semaine en français abrégé (getDay() : 0=Dim, 1=Lun…) */
export const DAYS_FR: Record<number, string> = {
  0: 'Dim',
  1: 'Lun',
  2: 'Mar',
  3: 'Mer',
  4: 'Jeu',
  5: 'Ven',
  6: 'Sam',
};

/** Mois en français abrégé (getMonth()+1 : 1=janv…) */
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

// ── URLs & adresses des cinémas (index.js lines 644–695) ─────────────────────

export const CINEMAS: CinemaInfo[] = [
  {
    name: 'Pathé Carré de Soie',
    address: '2 Rue Jacquard, 69120 Vaulx-en-Velin',
    latitude: 45.7642031,
    longitude: 4.9187449,
    url: 'https://www.pathe.fr/cinemas/cinema-pathe-carre-de-soie',
  },
  {
    name: 'Pathé Bellecour',
    address: '79 Rue de la République, 69002 Lyon',
    latitude: 45.7587213,
    longitude: 4.832407,
    url: 'https://www.pathe.fr/cinemas/cinema-pathe-bellecour',
  },
  {
    name: 'Pathé Vaise',
    address: '43 Rue des Docks, 69009 Lyon',
    latitude: 45.7876326,
    longitude: 4.8093236,
    url: 'https://www.pathe.fr/cinemas/cinema-pathe-vaise',
  },
  {
    name: 'UGC Part-Dieu',
    address: '17 Rue Dr Bouchut, 69003 Lyon',
    latitude: 45.7620306,
    longitude: 4.8520603,
    url: 'https://www.ugc.fr/cinema-ugc-cine-cite-part-dieu.html',
  },
  {
    name: 'UGC Confluence',
    address: '112 Cours Charlemagne, 69002 Lyon',
    latitude: 45.740664,
    longitude: 4.8157211,
    url: 'https://www.ugc.fr/cinema-ugc-cine-cite-confluence.html',
  },
  {
    name: 'UGC Internationale',
    address: '80 Quai Charles de Gaulle, 69006 Lyon',
    latitude: 45.7845,
    longitude: 4.8495466,
    url: 'https://www.ugc.fr/cinema-ugc-cine-cite-internationale-lyon.html',
  },
  {
    name: 'UGC Astoria',
    address: '31 Cr Vitton, 69006 Lyon',
    latitude: 45.7697363,
    longitude: 4.8505645,
    url: 'https://www.ugc.fr/cinema-ugc-astoria.html',
  },
  {
    name: 'CGR Brignais',
    address: 'ZI Nord, Les Vallières, 69530 Brignais',
    latitude: 45.678431,
    longitude: 4.7736781,
    url: 'https://www.cgrcinemas.fr/films-a-l-affiche/',
  },
  {
    name: 'Ciné Meyzieu',
    address: '27 Rue Louis Saulnier, 69330 Meyzieu',
    latitude: 45.7648852,
    longitude: 5.0006316,
    url: 'https://cinemeyzieu.fr/',
  },
  {
    name: 'Ciné Toboggan',
    address: '14 Avenue Jean Macé, 69150 Décines-Charpieu',
    latitude: 45.7687735,
    longitude: 4.9531903,
    url: 'https://www.letoboggan.com/cinema/',
  },
  {
    name: 'Cinéma Saint-Denis',
    address: '77 Gd Rue de la Croix-Rousse, 69004 Lyon',
    latitude: 45.7800456,
    longitude: 4.8293649,
    url: 'https://www.cinema-saint-denis.fr/',
  },
  {
    name: 'Lumière Bellecour',
    address: '12 Rue de la Barre, 69002 Lyon',
    latitude: 45.7574364,
    longitude: 4.8330444,
    url: 'https://www.cinemas-lumiere.com/programmation/bellecour.html',
  },
  {
    name: 'Lumière Fourmi',
    address: '68 Rue Pierre Corneille, 69003 Lyon',
    latitude: 45.7632535,
    longitude: 4.8411015,
    url: 'https://www.cinemas-lumiere.com/programmation/fourmi.html',
  },
  {
    name: 'Lumière Terreaux',
    address: '40 Rue du Président Édouard Herriot, 69001 Lyon',
    latitude: 45.765328,
    longitude: 4.8316141,
    url: 'https://www.cinemas-lumiere.com/programmation/terreaux.html',
  },
  {
    name: 'Institut Lumière',
    address: '25 Rue du Premier-Film, 69008 Lyon',
    latitude: 45.7450563,
    longitude: 4.8658668,
    url: 'https://www.institut-lumiere.org/',
  },
  {
    name: 'Le Comoedia',
    address: '13 Av. Berthelot, 69007 Lyon',
    latitude: 45.747503,
    longitude: 4.8307605,
    url: 'https://www.allocine.fr/seance/salle_gen_csalle=P3757.html',
  },
  {
    name: 'Les Amphis',
    address: '12 Rue Pierre Cot, 69120 Vaulx-en-Velin',
    latitude: 45.78833,
    longitude: 4.9153971,
    url: 'https://www.allocine.fr/seance/salle_gen_csalle=P0013.html',
  },
  {
    name: 'Cinéma Gerard-Philipe',
    address: '12 Av. Jean Cagne, 69200 Vénissieux',
    latitude: 45.6970063,
    longitude: 4.8668488,
    url: 'https://www.allocine.fr/seance/salle_gen_csalle=P0003.html',
  },
  {
    name: 'Cinéma Opéra',
    address: '6 Rue Joseph Serlin, 69001 Lyon',
    latitude: 45.7673192,
    longitude: 4.8325142,
    url: 'https://www.allocine.fr/seance/salle_gen_csalle=P0006.html',
  },
];

/** Lookup rapide nom → CinemaInfo */
export const CINEMA_MAP: Record<string, CinemaInfo> = Object.fromEntries(
  CINEMAS.map((c) => [c.name, c])
);

// ── Couleurs de l'application ─────────────────────────────────────────────────

export const COLORS = {
  primary: '#444cf7',         // Identique au site web (--primary)
  primaryHover: '#3339c4',    // --primary-hover
  primaryDark: '#3339c4',
  background: '#f5f6f8',      // --bg-main identique au site
  surface: '#ffffff',         // --card-solid
  surfaceElevated: '#f8f9fa', // légèrement surélevé
  cardBg: 'rgba(255,255,255,0.6)',  // --card-bg glassmorphism
  cardBlur: 'rgba(255,255,255,0.5)', // --card-blur
  border: '#dddddd',          // --border-color identique au site
  borderLight: '#eeeeee',     // --border-light
  text: '#111111',            // --text-main identique au site
  textMuted: '#666666',       // --text-muted identique
  textSubtle: '#999999',      // --text-light identique
  shadowSm: 'rgba(0,0,0,0.05)',
  shadowMd: 'rgba(0,0,0,0.15)',
  shadowLg: 'rgba(0,0,0,0.1)',
  voBadge: '#444cf7',         // Bleu primary comme le site
  vfBadge: '#444cf7',         // Bleu primary comme le site
  favActive: '#ff6b6b',       // Rouge favori comme le site (#ff6b6b)
  success: '#3ecf8e',
  warning: '#f59e0b',
} as const;

// ── Clés SecureStore ──────────────────────────────────────────────────────────

export const SECURE_KEYS = {
  syncId: 'cinelyon_sync_id',
  deviceId: 'cinelyon_device_id',
  deviceName: 'cinelyon_device_name',
  localUpdatedAt: 'cinelyon_local_updated_at',
} as const;

// ── Cache / réseau ────────────────────────────────────────────────────────────

export const STALE_TIME_MS = 5 * 60 * 1000;     // 5 min — identique au TTL Flask
export const GC_TIME_MS = 24 * 60 * 60 * 1000;  // 24h en cache disque
export const PAGE_SIZE = 20;                      // films par batch (infinite scroll)
