import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { EnrichedFilm, Cinema } from './types';
import { INSTAGRAM } from './constants';

const dirname = process.cwd();
dotenv.config({ path: path.join(dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeTitle(title: string): string {
  if (!title) return '';
  return title.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/^(le |la |les |the |a |an |l')/i, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getPassesForCinema(cinemaName: string): string[] {
  const name = cinemaName.toLowerCase();
  if (name.includes('ugc')) return ['UGC Illimité'];
  if (name.includes('pathé') || name.includes('pathe')) return ['CinéPass Pathé'];
  // Pour Comoedia, Lumière, etc., on peut lister "CinéCarte" ou simplifier
  return [];
}

export async function fetchShowtimes(): Promise<void> {
  const inputPath = path.join(dirname, 'output', 'selected_films.json');
  const selectedFilms = fs.existsSync(inputPath)
    ? JSON.parse(fs.readFileSync(inputPath, 'utf8'))
    : [];

  // Construire un Map normalisé des scores de reference_films
  const refScores = new Map<string, number>();
  for (const f of selectedFilms) {
    refScores.set(normalizeTitle(f.title), f.score ?? 0);
  }

  // Cible : date spécifiée ou demain
  const dateArg = process.argv.find(a => a.startsWith('--date='))?.split('=')[1];
  let targetDateStr: string;

  if (dateArg) {
    targetDateStr = dateArg;
  } else {
    const targetDateObj = new Date(Date.now() + 86400000);
    targetDateStr = targetDateObj.toISOString().split('T')[0];
  }

  console.log(`Recherche des séances pour : ${targetDateStr}`);

  // Récupération de l'historique des 7 derniers jours
  const historyDate = new Date();
  historyDate.setDate(historyDate.getDate() - 7);
  const { data: historyData, error: historyError } = await supabase
    .from('instagram_history')
    .select('films')
    .gte('published_at', historyDate.toISOString());

  if (historyError) {
    console.warn("⚠️ Impossible de récupérer l'historique Instagram (table instagram_history peut-être manquante).", historyError.message);
  }

  const recentlyPostedFilms = new Set<string>();
  if (historyData) {
    for (const row of historyData) {
      if (Array.isArray(row.films)) {
        for (const title of row.films) {
          recentlyPostedFilms.add(title);
        }
      }
    }
  }
  
  if (recentlyPostedFilms.size > 0) {
    console.log(`🕒 ${recentlyPostedFilms.size} films ont été publiés récemment et seront pénalisés.`);
  }

  const { data, error } = await supabase
    .from('showtimes')
    .select('movies')
    .eq('date', targetDateStr)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.error("Aucune donnée trouvée pour demain dans Supabase.");
    } else {
      console.error("Erreur requête Supabase:", error);
    }
  }

  const showtimesMovies: any[] = data?.movies || [];

  if (showtimesMovies.length === 0) {
    throw new Error("NO_FILMS_AVAILABLE");
  }

  // Construire les films enrichis directement depuis showtimes (source de vérité pour les séances)
  const enrichedFilms: EnrichedFilm[] = [];

  for (const dbMovie of showtimesMovies) {
    if (!dbMovie.seances || Object.keys(dbMovie.seances).length === 0) continue;

    // Score : priorité aux reprises (films anciens) sur les nouveautés
    // 1. Film connu de reference_films → score calculé (2.0 pour reprises, 0.85 pour nouveautés)
    // 2. Film inconnu de reference_films → fallback progressif selon l'âge du film
    const currentYear = new Date().getFullYear();
    const knownScore = refScores.get(normalizeTitle(dbMovie.title));
    let refScore: number;

    if (knownScore !== undefined) {
      refScore = knownScore;
    } else {
      // Fallback progressif : plus le film est ancien, plus il est prioritaire
      // IMPORTANT : release_year est stocké en string dans showtimes, parseInt obligatoire
      const movieYear = parseInt(dbMovie.release_year, 10) || 0;
      const age = movieYear > 0 ? currentYear - movieYear : -1;

      if (age < 0) {
        refScore = 0.4; // Année inconnue → priorité minimale
      } else if (age <= 1) {
        refScore = 0.5; // Nouveauté (cette année ou l'an dernier) → priorité basse
      } else if (age <= 5) {
        refScore = 0.7; // Film récent (2-5 ans) → légère priorité
      } else if (age <= 15) {
        refScore = 1.2; // Reprise récente (6-15 ans) → bonne priorité
      } else if (age <= 40) {
        refScore = 1.6; // Classique (16-40 ans) → haute priorité
      } else {
        refScore = 1.9; // Grand classique (40+ ans) → priorité maximale parmi les non-référencés
      }
    }

    // PÉNALITÉ DE RÉCENCE : éviter la redondance
    if (recentlyPostedFilms.has(normalizeTitle(dbMovie.title))) {
      refScore = refScore * 0.01;
    }

    const cinemas: Cinema[] = [];
    for (const [cinemaName, seancesRaw] of Object.entries(dbMovie.seances)) {
      const showtimes = (seancesRaw as any[]).map(s => {
        if (typeof s === 'string') return s;
        return s.time || s.heure || '?';
      }).filter(t => t !== '?');

      cinemas.push({
        name: cinemaName,
        address: 'Lyon',
        showtimes,
        passes: getPassesForCinema(cinemaName)
      });
    }

    if (cinemas.length > 0) {
      enrichedFilms.push({
        title: dbMovie.title,
        director: dbMovie.director || dbMovie.realisateur || 'Inconnu',
        year: dbMovie.release_year,
        poster_url: dbMovie.affiche,
        cinema: cinemas,
        // @ts-ignore — on passe le score pour permettre un tri éventuel
        refScore
      });
    }
  }

  // Trier : films en reference_films (score > 0) en premier, puis les autres
  enrichedFilms.sort((a, b) => ((b as any).refScore ?? 0) - ((a as any).refScore ?? 0));

  // Limiter à 14 films max (limite carousel Instagram de 15 slides) avec max 3 films par cinéma
  const finalFilms: EnrichedFilm[] = [];
  const cinemaCounts = new Map<string, number>();
  const MAX_PER_CINEMA = 3;

  for (const film of enrichedFilms) {
    if (finalFilms.length >= (INSTAGRAM.maxSlides - 1)) break;

    // Chercher un cinéma pour ce film qui n'a pas atteint la limite
    let selectedCinemaIndex = -1;
    for (let i = 0; i < film.cinema.length; i++) {
      const cName = film.cinema[i].name;
      const count = cinemaCounts.get(cName) || 0;
      if (count < MAX_PER_CINEMA) {
        selectedCinemaIndex = i;
        break;
      }
    }

    if (selectedCinemaIndex !== -1) {
      // On a trouvé un cinéma valide
      const selectedCinema = film.cinema[selectedCinemaIndex];
      
      // On le garde comme unique cinéma pour l'affichage
      film.cinema = [selectedCinema];
      
      // On incrémente le compteur de ce cinéma
      cinemaCounts.set(selectedCinema.name, (cinemaCounts.get(selectedCinema.name) || 0) + 1);
      finalFilms.push(film);
    }
    // Sinon, le film est ignoré pour forcer la diversité
  }

  if (finalFilms.length === 0) {
    console.error("⚠️ Aucun film avec séances trouvé pour demain à Lyon !");
    throw new Error("NO_FILMS_AVAILABLE");
  }

  // Nettoyage du champ interne refScore avant sauvegarde
  const cleanFilms = finalFilms.map(({ ...f }) => { delete (f as any).refScore; return f; });

  const outputDir = path.join(dirname, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const outPath = path.join(outputDir, 'enriched_films.json');
  fs.writeFileSync(outPath, JSON.stringify(cleanFilms, null, 2));

  console.log(`✅ Module 2 terminé : ${cleanFilms.length} films avec séances sauvegardés dans ${outPath}`);
}

if (process.argv[1] && process.argv[1].includes('02_fetch_showtimes.ts')) {
  fetchShowtimes().catch(err => {
    if (err.message === "NO_FILMS_AVAILABLE") {
      process.exit(0); // On exit(0) pour ne pas faire échouer tout le workflow Github inutilement
    } else {
      console.error(err);
      process.exit(1);
    }
  });
}
