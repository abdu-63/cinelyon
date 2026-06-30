// src/types/index.ts
// Types TypeScript partagés avec cinelyon-app
// Source: cinelyon-app/src/types/index.ts (portage web)

export interface Seance {
  time: string; // "HH:MM"
  lang: 'VF' | 'VO';
  format: string | null;
  ticketing_url: string | null;
}

export interface WatchProvider {
  name: string;
  logo_path: string | null;
}

export interface Review {
  author: string;
  rating: number;
  date: string;
  text: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface FilmRaw {
  title: string;
  release_year: string;
  duree: string;
  rating: string;
  genres: string;
  realisateur: string;
  synopsis: string;
  affiche: string;
  backdrop?: string | null;
  director: string;
  wantToSee: number;
  url: string;
  allocine_url: string;
  trailer_url: string | null;
  watch_providers: WatchProvider[];
  tmdb_score: number | null;
  rt_score: string | null;
  reviews?: Review[];
  seances: Record<string, Seance[]>;
  added_at: string | null;
}

export interface Film extends Omit<FilmRaw, 'seances'> {
  slug: string;
  filmId: string;
  formats: string;
  seancesByDay: Record<string, Record<string, Seance[]>>;
  seancesByDayGrouped: Record<string, Record<string, Record<string, Seance[]>>>;
  isNew: boolean;
  isYesterday: boolean;
  isDayBefore: boolean;
  addedAtByDay?: Record<string, string | null>;
}

export interface DateLabel {
  jour: string;
  chiffre: number;
  mois: string;
  index: number;
  isoDate: string;
  fullDate: string;
}

export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';

export interface CinemaInfo {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  url: string;
}

export interface SyncDevice {
  sync_id: string;
  device_id: string;
  name: string | null;
  last_seen: string;
}

export interface FriendFollow {
  follower_id: string;
  followed_id: string;
  followed_name: string;
  created_at: string;
  is_hidden?: boolean;
}

