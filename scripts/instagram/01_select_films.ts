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

  // ÉTAPE 1 — Récupérer UNIQUEMENT les films qui passent DEMAIN
  const targetDateObj = new Date(Date.now() + 86400000);
  const targetDateStr = targetDateObj.toISOString().split('T')[0];

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

  // ÉTAPE 2 — Récupérer les films de reference_films
  const { data: referenceFilms, error: refError } = await supabase
    .from('reference_films')
    .select('*');

  if (refError || !referenceFilms) {
    console.error("Erreur lors de la récupération des films de référence", refError);
    return;
  }

  console.log(`${referenceFilms.length} films de référence récupérés.`);

  const scoredFilms = [];

  for (const film of referenceFilms) {
    // Si le film passe DEMAIN => score = 1.0 direct (priorité absolue)
    if (currentFilms.has(film.title_normalized)) {
      const dbData = currentFilms.get(film.title_normalized);
      scoredFilms.push({
        title: film.title,
        year: film.year || dbData?.release_year,
        director: film.director || dbData?.director || dbData?.realisateur,
        poster_url: film.poster_url || dbData?.affiche,
        score: 1.0,
        sources: film.sources,
        source_count: film.source_count,
        is_playing: true
      });
      continue;
    }

    // Sinon, calcul du score (ÉTAPE 2 du plan)
    const avgRank = film.avg_rank || 250;
    const scoreRang = clamp(1.0 - (avgRank / 500), SCORING.minScore, 1.0);
    
    // Ancienneté
    const filmYear = film.year || 2000;
    const age = Math.max(0, 2025 - filmYear);
    const scoreAnciennete = clamp(Math.pow(0.5, age / SCORING.halfLifeYears), SCORING.minScore, 1.0);
    
    // Note Senscritique moy.
    const avgNote = film.avg_note || 7.0; 
    const scoreNote = clamp(avgNote / 10, SCORING.minScore, 1.0);
    
    // Réalisateur connu
    const isKnownDir = KNOWN_DIRECTORS.some(d => film.director && film.director.toLowerCase().includes(d.toLowerCase()));
    const scoreRealisateur = isKnownDir ? SCORING.knownDirectorScore : SCORING.unknownDirectorScore;

    // Multi-source (présent dans plusieurs listes cultes)
    const sourcesCount = film.source_count || 1;
    const scoreMultiSource = clamp(1.0 + ((sourcesCount - 1) * 0.1), 1.0, 1.5);

    // Score final multiplicatif
    const finalScore = scoreRang * scoreAnciennete * scoreNote * scoreRealisateur * scoreMultiSource;

    scoredFilms.push({
      title: film.title,
      year: film.year,
      director: film.director,
      poster_url: film.poster_url,
      score: finalScore,
      sources: film.sources,
      source_count: film.source_count,
      is_playing: false
    });
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
    // On garde les 20 premiers comme dicté par le plan
    if (topFilms.length >= 20) break;
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
