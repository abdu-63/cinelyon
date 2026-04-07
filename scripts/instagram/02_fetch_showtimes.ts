import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { EnrichedFilm, Cinema } from './types';

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
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Le fichier ${inputPath} est introuvable. Lance le Module 1 d'abord.`);
  }

  const selectedFilms = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

  // Cible : demain
  const targetDateObj = new Date(Date.now() + 86400000);
  const targetDateStr = targetDateObj.toISOString().split('T')[0];

  console.log(`Recherche des séances pour demain : ${targetDateStr}`);

  // 1 & 2. Utilisation de la table "showtimes" de ton projet (au lieu de scraper Allociné)
  // C'est beaucoup plus sûr et ultra-rapide puisque les données sont déjà scrapées par ton backend Python !
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

  const showtimesMovies = data?.movies || [];
  const moviesDict = new Map();

  for (const m of showtimesMovies) {
    moviesDict.set(normalizeTitle(m.title), m);
  }

  const enrichedFilms: EnrichedFilm[] = [];

  for (const film of selectedFilms) {
    const normTitle = normalizeTitle(film.title);
    const dbMovie = moviesDict.get(normTitle);

    if (!dbMovie || !dbMovie.seances || Object.keys(dbMovie.seances).length === 0) {
      // Zéro séance demain pour ce film, on l'écarte (règle n°4 du plan)
      continue;
    }

    const cinemas: Cinema[] = [];

    // 3. Récupérer les séances et passes
    for (const [cinemaName, seancesRaw] of Object.entries(dbMovie.seances)) {
      const showtimes = (seancesRaw as any[]).map(s => {
        if (typeof s === 'string') return s;
        return s.time || s.heure || '?';
      }).filter(t => t !== '?');

      cinemas.push({
        name: cinemaName,
        address: 'Lyon', // Adresse exacte nécessiterait de charger le JSON THEATERS, restons simple pour Insta
        showtimes: showtimes,
        passes: getPassesForCinema(cinemaName)
      });
    }

    if (cinemas.length > 0) {
      // 💡 ASTUCE : C'est ici qu'on "soigne" les données incomplètes du Module 0 !
      // On utilise l'affiche HD (affiche) et le réalisateur récupérés par ton scraper Allociné de CinéLyon
      enrichedFilms.push({
        title: dbMovie.title || film.title,
        director: dbMovie.director || dbMovie.realisateur || film.director || 'Inconnu',
        year: dbMovie.release_year || film.year,
        poster_url: dbMovie.affiche || film.poster_url,
        cinema: cinemas
      });
    }
  }

  // 4. Gestion d'erreur critique
  if (enrichedFilms.length === 0) {
    console.error("⚠️ Aucun film de la sélection n'a de séances demain à Lyon !");
    throw new Error("NO_FILMS_AVAILABLE");
  }

  // 5. Sauvegarde
  const outputDir = path.join(dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outPath = path.join(outputDir, 'enriched_films.json');
  fs.writeFileSync(outPath, JSON.stringify(enrichedFilms, null, 2));

  console.log(`✅ Module 2 terminé : ${enrichedFilms.length} films avec séances sauvegardés dans ${outPath}`);
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
