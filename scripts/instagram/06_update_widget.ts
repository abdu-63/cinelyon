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

export async function updateWidgetData(): Promise<void> {
  console.log("Démarrage de la mise à jour des données du Widget iOS...");

  // ÉTAPE 1 — Récupérer les films qui passent AUJOURD'HUI
  const todayObj = new Date();
  const targetDateStr = todayObj.toISOString().split('T')[0];

  const { data: showtimesData, error: showtimesError } = await supabase
    .from('showtimes')
    .select('movies')
    .eq('date', targetDateStr);
  
  if (showtimesError) {
    console.error("Erreur lors de la récupération des séances pour le widget", showtimesError);
    return;
  }

  const todayFilmsMap = new Map<string, any>();
  if (showtimesData) {
    for (const row of showtimesData) {
      if (row.movies) {
        for (const m of row.movies) {
          if (m.title) todayFilmsMap.set(normalizeTitle(m.title), m);
        }
      }
    }
  }
  const currentFilms = todayFilmsMap;
  
  console.log(`${currentFilms.size} films trouvés dans 'showtimes' pour aujourd'hui (${targetDateStr}).`);

  // ÉTAPE 2 — Récupérer TOUS les films de reference_films
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

  const scoredFilms = [];

  for (const film of referenceFilms) {
    if (currentFilms.has(film.title_normalized)) {
      const dbData = currentFilms.get(film.title_normalized);
      const filmYear = film.year || parseInt(dbData?.release_year, 10) || 0;
      const currentYear = new Date().getFullYear();

      const isReprise = filmYear > 0 && filmYear < currentYear;
      let baseScore = isReprise ? 1.5 : 0.6; 

      const avgRank = film.avg_rank || 250;
      const scoreRang = clamp(1.0 - (avgRank / 500), SCORING.minScore, 1.0);
      
      const avgNote = film.avg_note || 7.0; 
      const scoreNote = clamp(avgNote / 10, SCORING.minScore, 1.0);
      
      const isKnownDir = KNOWN_DIRECTORS.some(d => film.director && film.director.toLowerCase().includes(d.toLowerCase()));
      const scoreRealisateur = isKnownDir ? 1.2 : 1.0;

      const sourcesCount = film.source_count || 1;
      const scoreMultiSource = clamp(1.0 + ((sourcesCount - 1) * 0.1), 1.0, 1.5);

      let playingScore = baseScore + (scoreRang * scoreNote * scoreRealisateur * scoreMultiSource);

      const dbMovieStr = JSON.stringify(dbData).toLowerCase();
      const titleLower = film.title.toLowerCase();
      const isAvantPremiere = 
        titleLower.includes('avant-première') || 
        titleLower.includes('avant première') || 
        titleLower.includes(' avp') || 
        dbMovieStr.includes('avant-première') || 
        dbMovieStr.includes('avant première') || 
        dbMovieStr.includes(' avp');

      if (isAvantPremiere) {
        playingScore += SCORING.avantPremiereBonus;
      }

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
    }
  }

  // ÉTAPE 3 — Tri et conservation
  scoredFilms.sort((a, b) => b.score - a.score);
  
  const seenTitles = new Set();
  const topFilms = [];
  
  for (const film of scoredFilms) {
    const norm = normalizeTitle(film.title);
    if (!seenTitles.has(norm)) {
      seenTitles.add(norm);
      topFilms.push(film);
    }
    // On prend les 4 premiers pour le widget
    if (topFilms.length >= 4) break;
  }

  // ÉTAPE 4 — Upload sur Supabase Storage
  const jsonString = JSON.stringify(topFilms, null, 2);
  let uploadResult = await supabase.storage
    .from('widgets')
    .upload('today.json', jsonString, {
      contentType: 'application/json',
      upsert: true
    });

  if (uploadResult.error && uploadResult.error.message.includes('Bucket not found')) {
    console.log("Bucket 'widgets' introuvable. Création automatique...");
    await supabase.storage.createBucket('widgets', { public: true });
    
    uploadResult = await supabase.storage
      .from('widgets')
      .upload('today.json', jsonString, {
        contentType: 'application/json',
        upsert: true
      });
  }

  if (uploadResult.error) {
    console.error("❌ Erreur lors de l'upload du JSON du widget:", uploadResult.error);
    console.log("⚠️ N'oubliez pas de configurer le bucket 'widgets' (Public) dans votre projet Supabase !");
  } else {
    console.log("✅ Données du widget mises à jour avec succès dans le bucket 'widgets/today.json'.");
  }
}

if (process.argv[1] && process.argv[1].includes('06_update_widget.ts')) {
  updateWidgetData().catch(console.error);
}
