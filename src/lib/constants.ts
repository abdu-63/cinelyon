// src/lib/constants.ts
// Portage exact des constantes de app.py et index.js

import { CinemaInfo } from '@/types';
import { getCinemaTCLStops } from './tclData';

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

export const RAW_CINEMAS: CinemaInfo[] = [
  {
    name: 'Pathé Carré de Soie',
    address: '2 Rue Jacquard, 69120 Vaulx-en-Velin',
    latitude: 45.764180617353794,
    longitude: 4.921330525686558,
    url: 'https://www.pathe.fr/cinemas/cinema-pathe-carre-de-soie',
  },
  {
    name: 'Pathé Bellecour',
    address: '79 Rue de la République, 69002 Lyon',
    latitude: 45.758706300459416,
    longitude: 4.835003354522103,
    url: 'https://www.pathe.fr/cinemas/cinema-pathe-bellecour',
  },
  {
    name: 'Pathé Vaise',
    address: '43 Rue des Docks, 69009 Lyon',
    latitude: 45.78761012678636,
    longitude: 4.811919954523657,
    url: 'https://www.pathe.fr/cinemas/cinema-pathe-vaise',
  },
  {
    name: 'UGC Part-Dieu',
    address: '17 Rue Dr Bouchut, 69003 Lyon',
    latitude: 45.762015601347436,
    longitude: 4.854645925686461,
    url: 'https://www.ugc.fr/cinema-ugc-cine-cite-part-dieu.html',
  },
  {
    name: 'UGC Confluence',
    address: '112 Cours Charlemagne, 69002 Lyon',
    latitude: 45.740663971079755,
    longitude: 4.818317454521092,
    url: 'https://www.ugc.fr/cinema-ugc-cine-cite-confluence.html',
  },
  {
    name: 'UGC Internationale',
    address: '80 Quai Charles de Gaulle, 69006 Lyon',
    latitude: 45.78448500737807,
    longitude: 4.852142954523537,
    url: 'https://www.ugc.fr/cinema-ugc-cine-cite-internationale-lyon.html',
  },
  {
    name: 'UGC Astoria',
    address: '31 Cr Vitton, 69006 Lyon',
    latitude: 45.769721303415345,
    longitude: 4.853160854522712,
    url: 'https://www.ugc.fr/cinema-ugc-astoria.html',
  },
  {
    name: 'CGR Brignais',
    address: 'ZI Nord, Les Vallières, 69530 Brignais',
    latitude: 45.67846845143082,
    longitude: 4.776188623830859,
    url: 'https://www.cgrcinemas.fr/films-a-l-affiche/',
  },
  {
    name: 'Cinéma Meyzieu',
    address: '27 Rue Louis Saulnier, 69330 Meyzieu',
    latitude: 45.7648776865974,
    longitude: 5.003206496850774,
    url: 'https://cinemeyzieu.fr/',
  },
  {
    name: 'Le Toboggan',
    address: '14 Avenue Jean Macé, 69150 Décines-Charpieu',
    latitude: 45.76875850315696,
    longitude: 4.955797383358534,
    url: 'https://www.letoboggan.com/cinema/',
  },
  {
    name: 'Cinéma Saint-Denis',
    address: '77 Gd Rue de la Croix-Rousse, 69004 Lyon',
    latitude: 45.78003808863204,
    longitude: 4.831961254523278,
    url: 'https://www.cinema-saint-denis.fr/',
  },
  {
    name: 'Lumière Bellecour',
    address: '12 Rue de la Barre, 69002 Lyon',
    latitude: 45.75742888559788,
    longitude: 4.835630025686188,
    url: 'https://www.cinemas-lumiere.com/programmation/bellecour.html',
  },
  {
    name: 'Lumière Fourmi',
    address: '68 Rue Pierre Corneille, 69003 Lyon',
    latitude: 45.76328340987806,
    longitude: 4.843826600552498,
    url: 'https://www.cinemas-lumiere.com/programmation/fourmi.html',
  },
  {
    name: 'Lumière Terreaux',
    address: '40 Rue du Président Édouard Herriot, 69001 Lyon',
    latitude: 45.76533545550311,
    longitude: 4.83423191219415,
    url: 'https://www.cinemas-lumiere.com/programmation/terreaux.html',
  },
  {
    name: 'Institut Lumière',
    address: '25 Rue du Premier-Film, 69008 Lyon',
    latitude: 45.7450563710799,
    longitude: 4.870769883357172,
    url: 'https://www.institut-lumiere.org/',
  },
  {
    name: 'Le Comoedia',
    address: '13 Av. Berthelot, 69007 Lyon',
    latitude: 45.74749558426532,
    longitude: 4.83565285452147,
    url: 'https://www.allocine.fr/seance/salle_gen_csalle=P3757.html',
  },
  {
    name: 'Cinéma Les Amphis',
    address: '12 Rue Pierre Cot, 69120 Vaulx-en-Velin',
    latitude: 45.788304988672884,
    longitude: 4.917945936898541,
    url: 'https://www.allocine.fr/seance/salle_gen_csalle=P0013.html',
  },
  {
    name: 'Cinéma Gerard-Philipe',
    address: '12 Av. Jean Cagne, 69200 Vénissieux',
    latitude: 45.69699128390844,
    longitude: 4.869455883354512,
    url: 'https://www.allocine.fr/seance/salle_gen_csalle=P0003.html',
  },
  {
    name: 'Cinéma-Opéra',
    address: '6 Rue Joseph Serlin, 69001 Lyon',
    latitude: 45.76732665523603,
    longitude: 4.835099825686746,
    url: 'https://www.allocine.fr/seance/salle_gen_csalle=P0006.html',
  },
];

export const CINEMAS: CinemaInfo[] = RAW_CINEMAS.map((c) => ({
  ...c,
  tclStops: getCinemaTCLStops(c.name),
}));

/** Lookup rapide nom → CinemaInfo */
export const CINEMA_MAP: Record<string, CinemaInfo> = Object.fromEntries(
  CINEMAS.map((c) => [c.name, c])
);

// ── Couleurs de l'application ─────────────────────────────────────────────────

export const COLORS = {
  primary: '#4f5af6', // Identique au site web (--primary)
  primaryHover: '#3d49e6', // --primary-hover
  primaryDark: '#3d49e6',
  background: '#f5f6f8', // --bg-main identique au site
  surface: '#ffffff', // --card-solid
  surfaceElevated: '#f8f9fa', // légèrement surélevé
  cardBg: 'rgba(255,255,255,0.6)', // --card-bg glassmorphism
  cardBlur: 'rgba(255,255,255,0.5)', // --card-blur
  border: '#dddddd', // --border-color identique au site
  borderLight: '#eeeeee', // --border-light
  text: '#111111', // --text-main identique au site
  textMuted: '#666666', // --text-muted identique
  textSubtle: '#999999', // --text-light identique
  shadowSm: 'rgba(0,0,0,0.05)',
  shadowMd: 'rgba(0,0,0,0.15)',
  shadowLg: 'rgba(0,0,0,0.1)',
  voBadge: '#4f5af6', // Bleu primary comme le site
  vfBadge: '#4f5af6', // Bleu primary comme le site
  favActive: '#ff6b6b', // Rouge favori comme le site (#ff6b6b)
  success: '#3ecf8e',
  warning: '#f59e0b',
} as const;

// ── Clés SecureStore ──────────────────────────────────────────────────────────

export const SECURE_KEYS = {
  syncId: 'cinelyon_sync_id',
  deviceId: 'cinelyon_device_id',
  deviceName: 'cinelyon_device_name',
  localUpdatedAt: 'cinelyon_local_updated_at',
  adminPasswordVerified: 'cinelyon_admin_password_verified',
  adminLockoutUntil: 'cinelyon_admin_lockout_until',
  adminAttempts: 'cinelyon_admin_attempts',
  hapticsEnabled: 'cinelyon_haptics_enabled',
  userAvatarConfig: 'cinelyon_user_avatar_config',
} as const;

// ── Avatars Cinéphiles & Identité ─────────────────────────────────────────────

export interface CineAvatarPreset {
  id: import('../types').CineAvatarPresetId;
  labelKey: string;
  icon: string; // Ionicons name or vector glyph
  defaultColor: string;
  emoji: string;
}

export const CINE_AVATARS: CineAvatarPreset[] = [
  {
    id: 'popcorn',
    labelKey: 'avatar.presets.popcorn',
    icon: 'fast-food-outline',
    defaultColor: '#F59E0B',
    emoji: '🍿',
  },
  {
    id: 'clapperboard',
    labelKey: 'avatar.presets.clapperboard',
    icon: 'film-outline',
    defaultColor: '#444CF7',
    emoji: '🎬',
  },
  {
    id: 'glasses3d',
    labelKey: 'avatar.presets.glasses3d',
    icon: 'glasses-outline',
    defaultColor: '#E11D48',
    emoji: '🕶️',
  },
  {
    id: 'projector',
    labelKey: 'avatar.presets.projector',
    icon: 'videocam-outline',
    defaultColor: '#8B5CF6',
    emoji: '📽️',
  },
  {
    id: 'film_reel',
    labelKey: 'avatar.presets.film_reel',
    icon: 'disc-outline',
    defaultColor: '#06B6D4',
    emoji: '🎞️',
  },
  {
    id: 'director_chair',
    labelKey: 'avatar.presets.director_chair',
    icon: 'easel-outline',
    defaultColor: '#D97706',
    emoji: '🪑',
  },
  {
    id: 'ticket',
    labelKey: 'avatar.presets.ticket',
    icon: 'ticket-outline',
    defaultColor: '#10B981',
    emoji: '🎟️',
  },
  {
    id: 'camera',
    labelKey: 'avatar.presets.camera',
    icon: 'camera-outline',
    defaultColor: '#6366F1',
    emoji: '🎥',
  },
  {
    id: 'trophy',
    labelKey: 'avatar.presets.trophy',
    icon: 'trophy-outline',
    defaultColor: '#FBBF24',
    emoji: '🏆',
  },
  {
    id: 'star',
    labelKey: 'avatar.presets.star',
    icon: 'star-outline',
    defaultColor: '#F43F5E',
    emoji: '⭐',
  },
  {
    id: 'bat_hero',
    labelKey: 'avatar.presets.bat_hero',
    icon: 'moon-outline',
    defaultColor: '#475569',
    emoji: '🦇',
  },
  {
    id: 'astronaut',
    labelKey: 'avatar.presets.astronaut',
    icon: 'planet-outline',
    defaultColor: '#3B82F6',
    emoji: '👨‍🚀',
  },
];

export const AVATAR_COLORS = [
  { id: 'blue', color: '#444CF7', labelKey: 'avatar.colors.blue' },
  { id: 'red', color: '#E11D48', labelKey: 'avatar.colors.red' },
  { id: 'purple', color: '#8B5CF6', labelKey: 'avatar.colors.purple' },
  { id: 'gold', color: '#F59E0B', labelKey: 'avatar.colors.gold' },
  { id: 'emerald', color: '#10B981', labelKey: 'avatar.colors.emerald' },
  { id: 'pink', color: '#EC4899', labelKey: 'avatar.colors.pink' },
  { id: 'cyan', color: '#06B6D4', labelKey: 'avatar.colors.cyan' },
  { id: 'dark', color: '#1E293B', labelKey: 'avatar.colors.dark' },
];

export interface AvatarBorderOption {
  id: import('../types').AvatarBorderId;
  labelKey: string;
  color: string;
}

export const AVATAR_BORDERS: AvatarBorderOption[] = [
  { id: 'classic', labelKey: 'avatar.borders.classic', color: 'rgba(255,255,255,0.2)' },
  { id: 'neon', labelKey: 'avatar.borders.neon', color: '#8B5CF6' },
  { id: 'film_strip', labelKey: 'avatar.borders.film_strip', color: '#F59E0B' },
  { id: 'gold', labelKey: 'avatar.borders.gold', color: '#FBBF24' },
];

export const DEFAULT_AVATAR_CONFIG: import('../types').UserAvatarConfig = {
  type: 'monogram',
  photoUri: null,
  presetId: 'popcorn',
  backgroundColor: '#444CF7',
  borderStyle: 'classic',
};

// ── Cache / réseau ────────────────────────────────────────────────────────────

export const STALE_TIME_MS = 5 * 60 * 1000; // 5 min — identique au TTL Flask
export const GC_TIME_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours en cache disque (offline métro)
export const PAGE_SIZE = 20; // films par batch (infinite scroll)
