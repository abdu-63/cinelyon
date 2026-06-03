// src/types/index.ts
// Interfaces TypeScript strictes déduites de scrape.py, Classes.py et app.py

// ── Entité brute en base Supabase ────────────────────────────────────────────

/** Ligne brute de la table `showtimes` */
export interface ShowtimeRow {
  date: string;        // "YYYY-MM-DD" — clé primaire
  movies: FilmRaw[];   // colonne JSONB
  generated_at: string;
}

// ── Modèle de données JSONB (colonne `movies`) ───────────────────────────────

/** Séance individuelle (Showtime dans Classes.py) */
export interface Seance {
  time: string;                        // "HH:MM"
  lang: 'VF' | 'VO';
  format: string | null;               // "IMAX", "3D", "4DX", "Dolby", "ICE", "Avant-première", "Live" ou null
  ticketing_url: string | null;
}

/** Fournisseur de streaming TMDB */
export interface WatchProvider {
  name: string;
  logo_path: string | null;            // URL absolue image.tmdb.org
}

/**
 * Film brut tel que stocké dans la colonne JSONB `movies[]`
 * Structure construite par scrape.py::get_showtimes()
 */
export interface FilmRaw {
  title: string;
  release_year: string;                // "2024" ou "inconnue"
  duree: string;                       // "2h 05min"
  rating: string;                      // "3.9/5" ou "Note inconnue"
  genres: string;                      // "Drame, Thriller" (séparés par ", ")
  realisateur: string;
  synopsis: string;
  affiche: string;                     // URL affiche (TMDB ou Allociné)
  director: string;                    // identique à realisateur
  wantToSee: number;                   // score popularité Allociné
  url: string;                         // URL Letterboxd search
  allocine_url: string;
  trailer_url: string | null;          // URL YouTube watch
  watch_providers: WatchProvider[];
  tmdb_score: number | null;           // /10
  rt_score: string | null;             // "87%"
  seances: Record<string, Seance[]>;   // { cinemaName: Seance[] }
}

// ── Modèle enrichi côté client ────────────────────────────────────────────────

/** Film après transformation par buildFilmList() */
export interface Film extends Omit<FilmRaw, 'seances'> {
  slug: string;
  formats: string;                     // "imax,3d" (lowercase, concat)
  seancesByDay: Record<string, Record<string, Seance[]>>;
  // { dayLabel: { cinemaName: Seance[] } }
  seancesByDayGrouped: Record<string, Record<string, Record<string, Seance[]>>>;
  // { dayLabel: { brand: { cinemaName: Seance[] } } }
}

// ── Authentification & sync ───────────────────────────────────────────────────

/** Table `favorites` */
export interface FavoriteRecord {
  user_id: string;
  films: string[];     // slugs de films favoris
  updated_at: string;
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
  nickname: string;
  created_at: string;
}

// ── Filtres UI ────────────────────────────────────────────────────────────────

export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';
export type FavTab = 'perso' | 'amis';

export interface FiltersState {
  titleQuery: string;
  genre: string;
  director: string;
  cinema: string;
  dayIndex: number | null;   // null = tous les jours
  format: string;
  timeSlot: TimeSlot | null;
  showOnlyFavorites: boolean;
  favTab: FavTab;
}

// ── Labels de dates ───────────────────────────────────────────────────────────

export interface DateLabel {
  jour: string;        // "Lun", "Mar"…
  chiffre: number;
  mois: string;        // "janv", "févr"…
  index: number;       // delta depuis aujourd'hui
  isoDate: string;     // "YYYY-MM-DD"
  fullDate: string;    // "DD/MM"
}

// ── Cinéma ────────────────────────────────────────────────────────────────────

export interface CinemaInfo {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  url: string;
}
