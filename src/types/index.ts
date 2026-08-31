// src/types/index.ts
// Interfaces TypeScript strictes déduites de scrape.py, Classes.py et app.py

// ── Entité brute en base Supabase ────────────────────────────────────────────

/** Ligne brute de la table `showtimes` */
export interface ShowtimeRow {
  date: string; // "YYYY-MM-DD" — clé primaire
  movies: FilmRaw[]; // colonne JSONB
  generated_at: string;
}

// ── Modèle de données JSONB (colonne `movies`) ───────────────────────────────

/** Séance individuelle (Showtime dans Classes.py) */
export interface Seance {
  time: string; // "HH:MM"
  lang: 'VF' | 'VO';
  format: string | null; // "IMAX", "3D", "4DX", "Dolby", "ICE", "Avant-première", "Live" ou null
  ticketing_url: string | null;
}

/** Fournisseur de streaming TMDB */
export interface WatchProvider {
  name: string;
  logo_path: string | null; // URL absolue image.tmdb.org
}

/** Critique spectateur AlloCiné */
export interface Review {
  author: string;
  rating: number; // sur 5
  date: string;
  text: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

/**
 * Film brut tel que stocké dans la colonne JSONB `movies[]`
 * Structure construite par scrape.py::get_showtimes()
 */
export interface FilmRaw {
  title: string;
  release_year: string; // "2024" ou "inconnue"
  duree: string; // "2h 05min"
  rating: string; // "3.9/5" ou "Note inconnue"
  genres: string; // "Drame, Thriller" (séparés par ", ")
  realisateur: string;
  synopsis: string;
  affiche: string; // URL affiche (TMDB ou Allociné)
  backdrop?: string | null; // URL image paysage backdrop (TMDB) ou null
  director: string; // identique à realisateur
  wantToSee: number; // score popularité Allociné
  url: string; // URL Letterboxd search
  allocine_url: string;
  trailer_url: string | null; // URL YouTube watch
  watch_providers: WatchProvider[];
  tmdb_score: number | null; // /10
  rt_score: string | null; // "87%"
  reviews?: Review[];
  cast?: (CastMember | string)[] | null;
  actors?: string[] | null;
  seances: Record<string, Seance[]>; // { cinemaName: Seance[] }
  added_at: string | null; // Date d'ajout au scraping
  nsfw?: boolean | null;
  nsfw_details?: string[] | Record<string, string> | null;
  advisory?: string | null;
  age_rating?: string | null; // ex: "-18", "-16", "-12", "Tous publics"
  post_credits?: PostCreditsInfo | null;
  toilet_breaks?: ToiletBreaksInfo | null;
  original_language?: string | null;
}

// ── Modèle Pause Toilettes (RunPee-style) ───────────────────────────────────

export interface ToiletBreak {
  id: string;
  timestamp: string; // ex: "0h 48min"
  timestampMinutes: number; // ex: 48
  durationMinutes: number; // ex: 3.5
  quality: 'best' | 'good'; // "Moment idéal" ou "Pause secondaire"
  title: string; // ex: "Discussion dans le hangar"
  sceneDescription: string; // Ex: "Scène de transition où les personnages secondaires préparent la route."
  catchUpSummary: string; // Ex: "Pendant votre absence, Paul et Sarah ont convenu de se retrouver au quai 4. Aucun élément dramatique manqué."
  cue: string; // Signal de départ visual/audio (ex: "Dès que Marcus ouvre la carte sur la table")
}

export interface ToiletBreaksInfo {
  eligible: boolean; // true si durée >= 120 min
  movieDurationMinutes: number; // ex: 145
  badgeLabel: string; // ex: "2 Pauses conseillées"
  badgeColor: string; // hex color (ex: #3B82F6 ou #10B981)
  summary: string; // ex: "Ce film de 2h 25min comporte 2 moments propices pour s'absenter sans rater les révélations majeures."
  breaks: ToiletBreak[];
}

// ── Modèle Scène Post-Générique ─────────────────────────────────────────────

export type PostCreditsStatus =
  | 'both' // Scène pendant ET après le générique
  | 'mid_credits' // Scène pendant le générique uniquement
  | 'end_credits' // Scène après le générique uniquement
  | 'no_post_credits' // Aucune scène post-générique
  | 'unknown'; // Donnée non disponible

export interface PostCreditsInfo {
  status: PostCreditsStatus;
  hasMidCredits: boolean;
  hasEndCredits: boolean;
  count: number;
  title: string; // Ex: "Scènes post-générique", "Aucune scène post-générique"
  badgeLabel: string; // Ex: "2 Scènes à la fin", "Pas de scène post-générique", "1 Scène au milieu"
  badgeShortLabel: string; // Ex: "2 Scènes fin", "Pas de scène", "1 Mid-credits"
  badgeColor: string; // Hex color (ex: #10B981, #F59E0B, #6B7280)
  icon: string; // Ionicons icon name (ex: "sparkles", "film-outline", "close-circle-outline")
  summary: string; // Ex: "Restez assis ! Il y a une scène pendant le générique et une autre à la toute fin."
  source: 'tmdb' | 'heuristic' | 'database';
}

// ── Modèle enrichi côté client ────────────────────────────────────────────────

/** Film après transformation par buildFilmList() */
export interface Film extends Omit<FilmRaw, 'seances'> {
  slug: string;
  filmId: string;
  formats: string; // "imax,3d" (lowercase, concat)
  seancesByDay: Record<string, Record<string, Seance[]>>;
  // { dayLabel: { cinemaName: Seance[] } }
  seancesByDayGrouped: Record<string, Record<string, Record<string, Seance[]>>>;
  // { dayLabel: { brand: { cinemaName: Seance[] } } }
  isNew: boolean; // Récemment ajouté (<= 24h)
  isYesterday: boolean; // Ajouté hier (24h - 48h)
  isDayBefore: boolean; // Ajouté avant-hier (48h - 72h)
  isThisWeek: boolean; // Nouveautés de la semaine (<= 7 jours)
  addedAtByDay?: Record<string, string | null>; // Date d'ajout par jour
}

// ── Authentification & sync ───────────────────────────────────────────────────

export type AvatarType = 'monogram' | 'preset' | 'photo';

export type CineAvatarPresetId =
  | 'popcorn'
  | 'clapperboard'
  | 'glasses3d'
  | 'projector'
  | 'film_reel'
  | 'director_chair'
  | 'ticket'
  | 'camera'
  | 'trophy'
  | 'star'
  | 'bat_hero'
  | 'astronaut';

export type AvatarBorderId = 'classic' | 'neon' | 'film_strip' | 'gold';

export interface UserAvatarConfig {
  type: AvatarType;
  photoUri: string | null;
  presetId: CineAvatarPresetId;
  backgroundColor: string;
  borderColor?: string;
  borderStyle: AvatarBorderId;
}

/** Table `favorites` */
export interface FavoriteRecord {
  user_id: string;
  films: string[]; // slugs de films favoris
  updated_at: string;
  pseudo?: string | null;
}

/** Table `sync_devices` */
export interface SyncDevice {
  sync_id: string;
  device_id: string;
  name: string;
  last_seen: string;
}

/** Table `friend_follows` */
export interface FriendFollow {
  follower_id: string;
  followed_id: string;
  followed_name: string;
  created_at: string;
}

/** Table `reservations` */
export interface Reservation {
  id: string;
  user_id: string;
  event_id: string;
  title: string;
  cinema_name: string;
  start_date: string;
  end_date: string;
  movie_title: string;
  movie_year: string;
  duree: string;
  language: 'VF' | 'VO';
  format: string | null;
  ticketing_url: string | null;
  letterboxd_url: string | null;
  created_at: string;
}

// ── Transports en commun TCL ──────────────────────────────────────────────────

export type TCLLineType = 'metro' | 'tram' | 'bus' | 'funiculaire';

export interface TCLLine {
  id: string; // ex: "MA", "MB", "MC", "MD", "T1", "T2", "C3"
  label: string; // ex: "A", "B", "C", "D", "T1", "T2", "C3"
  type: TCLLineType;
  color: string; // hex
  textColor?: string; // hex (default white)
}

export interface TCLStop {
  stationName: string; // ex: "Bellecour", "Centre Berthelot"
  lines: string[]; // IDs des lignes (ex: ["MA", "MD"])
  walkTimeMinutes?: number; // ex: 2
}

// ── Filtres UI ────────────────────────────────────────────────────────────────

export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';
export type FavTab = 'perso' | 'amis';

export interface FiltersState {
  titleQuery: string;
  genres: string[];
  directors: string[];
  actors?: string[];
  cinemas: string[];
  tclLines?: string[]; // IDs des lignes TCL (ex: ["MD", "T2"])
  dayIndex: number | null; // null = tous les jours
  formats: string[];
  timeSlots: TimeSlot[];
  showOnlyFavorites: boolean;
  showOnlyNew: boolean;
  showOnlyYesterday: boolean;
  showOnlyDayBefore: boolean;
  showOnlyWeek: boolean;
  showFriendFavorites: boolean;
  favTab: FavTab;
}

// ── Labels de dates ───────────────────────────────────────────────────────────

export interface DateLabel {
  jour: string; // "Lun", "Mar"…
  chiffre: number;
  mois: string; // "janv", "févr"…
  index: number; // delta depuis aujourd'hui
  isoDate: string; // "YYYY-MM-DD"
  fullDate: string; // "DD/MM"
}

// ── Cinéma ────────────────────────────────────────────────────────────────────

export interface CinemaInfo {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  url: string;
  tclStops?: TCLStop[];
}

// ── Widget iOS Partagé ────────────────────────────────────────────────────────

export interface ActiveReservationWidgetData {
  id: string;
  title: string;
  cinema: string;
  startDate: string; // ISO 8601
  endDate?: string; // ISO 8601
  duree?: string;
  format?: string | null;
  lang?: 'VF' | 'VO' | 'VOST' | null;
  posterUrl?: string | null;
  ticketingUrl?: string | null;
  filmSlug?: string | null;
  updatedAt: string;
}

export interface FilmFilterOptions {
  genres: string[];
  directors: string[];
  actors?: string[];
  cinemas: string[];
  formats: string[];
}


