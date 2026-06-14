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

  let topFilms: any[] = [];

  // ÉTAPE 1 — Récupérer les films qui passent AUJOURD'HUI
  const todayObj = new Date();
  const targetDateStr = todayObj.toISOString().split('T')[0];

  console.log(`[Widget] Récupération des séances pour aujourd'hui (${targetDateStr})...`);
  const { data: showtimesData, error: showtimesError } = await supabase
    .from('showtimes')
    .select('movies')
    .eq('date', targetDateStr);

  const todayFilmsMap = new Map<string, any>();
  if (showtimesData && !showtimesError) {
    for (const row of showtimesData) {
      if (row.movies) {
        for (const m of row.movies) {
          if (m.title) todayFilmsMap.set(normalizeTitle(m.title), m);
        }
      }
    }
  }
  console.log(`[Widget] ${todayFilmsMap.size} films trouvés dans les séances d'aujourd'hui.`);

  // Calculate Paris midnight ISO string for the current date
  const now = new Date();
  let boundaryIsoString: string;
  try {
    const formatter = new Intl.DateTimeFormat('fr-CA', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const formattedStr = formatter.format(now);
    const [datePart, timePart] = formattedStr.split(' ');
    const [y, m, d] = datePart.split('-');
    const [h, min, s] = timePart.split(':');

    const currentParisHour = parseInt(h, 10);
    const currentParisMinute = parseInt(min, 10);
    const currentParisSecond = parseInt(s, 10);

    const msSinceParisMidnight = ((currentParisHour * 60 + currentParisMinute) * 60 + currentParisSecond) * 1000 + (now.getTime() % 1000);
    const parisMidnightDate = new Date(now.getTime() - msSinceParisMidnight);
    boundaryIsoString = parisMidnightDate.toISOString();
    console.log(`[Widget] Limite de date (minuit Paris) : ${boundaryIsoString}`);
  } catch (err) {
    const utcMidnight = new Date();
    utcMidnight.setUTCHours(0, 0, 0, 0);
    boundaryIsoString = utcMidnight.toISOString();
    console.warn(`[Widget] Échec du formatage Intl, utilisation de minuit UTC : ${boundaryIsoString}`);
  }

  // Tenter de récupérer les 4 films choisis par le post Instagram du jour (publiés la veille)
  try {
    console.log(`[Widget] Recherche du dernier post Instagram publié avant ${boundaryIsoString}...`);
    const { data: historyData, error: historyError } = await supabase
      .from('instagram_history')
      .select('*')
      .lt('published_at', boundaryIsoString)
      .order('published_at', { ascending: false })
      .limit(1);

    if (historyError) {
      console.error("[Widget] Erreur lors de la récupération de l'historique:", historyError);
    } else if (historyData && historyData.length > 0) {
      const latestPost = historyData[0];
      console.log(`[Widget] Dernier post trouvé (publié le ${latestPost.published_at}) contenant les films:`, latestPost.films);

      const filmTitlesToFetch = latestPost.films.slice(0, 4);
      if (filmTitlesToFetch.length > 0) {
        console.log(`[Widget] Récupération des détails pour les 4 premiers films de ce post...`);
        const currentYear = new Date().getFullYear();

        for (const normTitle of filmTitlesToFetch) {
          // 1. Tenter d'abord de récupérer depuis les showtimes du jour (très fiable car contient les poster_url et détails récents)
          if (todayFilmsMap.has(normTitle)) {
            const dbMovie = todayFilmsMap.get(normTitle);
            const filmYear = parseInt(dbMovie.release_year, 10) || 0;
            topFilms.push({
              title: dbMovie.title,
              year: filmYear,
              director: dbMovie.director || dbMovie.realisateur || 'Inconnu',
              poster_url: dbMovie.affiche,
              score: 7.0,
              is_playing: true,
              is_reprise: filmYear > 0 && filmYear < currentYear
            });
            console.log(`   ✓ Trouvé dans les showtimes du jour : "${dbMovie.title}"`);
          } else {
            // 2. Repli : Récupérer depuis reference_films
            const { data: refData, error: refError } = await supabase
              .from('reference_films')
              .select('*')
              .or(`title_normalized.eq.${normTitle},title_normalized.like.${normTitle} %`)
              .limit(1);

            if (refError) {
              console.error(`   ✗ Erreur repli reference_films pour "${normTitle}":`, refError);
            } else if (refData && refData.length > 0) {
              const matchedFilm = refData[0];
              topFilms.push({
                title: matchedFilm.title,
                year: matchedFilm.year,
                director: matchedFilm.director,
                poster_url: matchedFilm.poster_url,
                score: matchedFilm.avg_note || 7.0,
                sources: matchedFilm.sources,
                source_count: matchedFilm.source_count,
                is_playing: true,
                is_reprise: matchedFilm.year > 0 && matchedFilm.year < currentYear
              });
              console.log(`   ✓ Trouvé dans reference_films (repli) : "${matchedFilm.title}"`);
            } else {
              console.log(`   ✗ Impossible de trouver le film "${normTitle}"`);
            }
          }
        }
        console.log(`[Widget] ${topFilms.length} films récupérés depuis l'historique Instagram.`);
      }
    }
  } catch (err) {
    console.error("[Widget] Erreur inattendue lors de la récupération depuis l'historique:", err);
  }

  // Fallback aux calculs à la volée si l'historique n'a pas pu être lu ou est vide
  if (topFilms.length === 0) {
    console.log("[Widget] Fallback : calcul des scores à la volée pour les séances d'aujourd'hui...");
    if (showtimesError) {
      console.error("Erreur lors de la récupération des séances pour le widget", showtimesError);
      return;
    }

    const currentFilms = todayFilmsMap;
    console.log(`${currentFilms.size} films trouvés dans 'showtimes' pour aujourd'hui (${targetDateStr}).`);

    // Récupérer TOUS les films de reference_films
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

    // Tri et conservation
    scoredFilms.sort((a, b) => b.score - a.score);
    
    const seenTitles = new Set();
    
    for (const film of scoredFilms) {
      const norm = normalizeTitle(film.title);
      if (!seenTitles.has(norm)) {
        seenTitles.add(norm);
        topFilms.push(film);
      }
      if (topFilms.length >= 4) break;
    }
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
