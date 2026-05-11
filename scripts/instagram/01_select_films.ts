import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { KNOWN_DIRECTORS, SCORING } from './constants';

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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export async function selectFilms(): Promise<void> {
  console.log("Démarrage de la sélection des films...");

  // ÉTAPE 1 — Récupérer UNIQUEMENT les films qui passent à la date cible
  const dateArg = process.argv.find(a => a.startsWith('--date='))?.split('=')[1];
  let targetDateStr: string;

  if (dateArg) {
    targetDateStr = dateArg;
  } else {
    const targetDateObj = new Date(Date.now() + 86400000);
    targetDateStr = targetDateObj.toISOString().split('T')[0];
  }

  const { data: showtimesData, error: showtimesError } = await supabase
    .from('showtimes')
    .select('movies')
    .eq('date', targetDateStr);
  
  if (showtimesError) {
    console.error("Erreur lors de la récupération des séances", showtimesError);
  }

  // Map titre normalisé → données complètes du film (pour enrichissement)
  const tomorrowFilmsMap = new Map<string, any>();
  if (showtimesData) {
    for (const row of showtimesData) {
      if (row.movies) {
        for (const m of row.movies) {
          if (m.title) tomorrowFilmsMap.set(normalizeTitle(m.title), m);
        }
      }
    }
  }
  const currentFilms = tomorrowFilmsMap;
  
  console.log(`${currentFilms.size} films trouvés dans 'showtimes' pour demain (${targetDateStr}).`);

  // ÉTAPE 2 — Récupérer TOUS les films de reference_films (pagination pour dépasser la limite de 1000 par défaut de Supabase)
  let referenceFilms: any[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('reference_films')
      .select('*')
      .range(from, from + pageSize - 1);

    if (error) {
      console.error("Erreur lors de la récupération des films de référence", error);
      return;
    }
    if (!data || data.length === 0) break;
    referenceFilms = referenceFilms.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  console.log(`${referenceFilms.length} films de référence récupérés.`);

  const scoredFilms = [];

  for (const film of referenceFilms) {
    // Si le film passe DEMAIN : distinguer reprise vs nouveauté
    if (currentFilms.has(film.title_normalized)) {
      const dbData = currentFilms.get(film.title_normalized);
      // IMPORTANT : release_year dans showtimes est stocké en string → parseInt obligatoire
      const filmYear = film.year || parseInt(dbData?.release_year, 10) || 0;
      const currentYear = new Date().getFullYear();

      // Reprise : film sorti avant l'année courante → priorité maximale
      // Nouveauté : film sorti cette année → priorité modérée (évite la domination des sorties récentes)
      const isReprise = filmYear > 0 && filmYear < currentYear;
      const playingScore = isReprise ? SCORING.repriseScore : SCORING.nouveauteScore;

      scoredFilms.push({
        title: film.title,
        year: filmYear,
        director: film.director || dbData?.director || dbData?.realisateur,
        poster_url: film.poster_url || dbData?.affiche,
        score: playingScore,
        sources: film.sources,
        source_count: film.source_count,
        is_playing: true,
        is_reprise: isReprise
      });
      continue;
    }

    // Si le film ne passe pas demain, on l'ignore complètement !
    // Il est inutile de calculer un score pour un film qu'on ne peut pas aller voir.
    continue;
  }

  // ÉTAPE 3 — Tri et conservation
  scoredFilms.sort((a, b) => b.score - a.score);
  
  // Éliminer les doublons potentiels liés au titre normalisé
  const seenTitles = new Set();
  const topFilms = [];
  
  for (const film of scoredFilms) {
    const norm = normalizeTitle(film.title);
    if (!seenTitles.has(norm)) {
      seenTitles.add(norm);
      topFilms.push(film);
    }
    // On garde les N premiers comme dicté par les constantes
    if (topFilms.length >= SCORING.topFilmsToKeep) break;
  }

  // ÉTAPE 4 — Output JSON
  const outputDir = path.join(dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outPath = path.join(outputDir, 'selected_films.json');
  fs.writeFileSync(outPath, JSON.stringify(topFilms, null, 2));

  console.log(`✅ Module 1 terminé : ${topFilms.length} films retenus (sauvegardé dans ${outPath})`);
}

// Lancement script complet
if (process.argv[1] && process.argv[1].includes('01_select_films.ts')) {
  selectFilms().catch(console.error);
}
