import { chromium } from 'playwright';
import type { Page } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

const dirname = process.cwd();

// Charge le .env à la racine du projet
dotenv.config({ path: path.join(dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const SOURCES: Record<string, string> = {
  "letterboxd_rege": "https://letterboxd.com/regelegorila/list/rege-cine-club/",
  "letterboxd_bfi_dir": "https://letterboxd.com/bfi/list/sight-and-sounds-directors-100-greatest-films/",
  "letterboxd_bfi": "https://letterboxd.com/bfi/list/sight-and-sounds-greatest-films-of-all-time/",
  "letterboxd_anim250": "https://letterboxd.com/official/list/top-250-animated-films/",
  "letterboxd_top500": "https://letterboxd.com/official/list/letterboxds-top-500-films/",
  "letterboxd_fans250": "https://letterboxd.com/official/list/top-250-films-with-the-most-fans/",
  "letterboxd_boxoffice": "https://letterboxd.com/matthew/list/all-time-worldwide-box-office-2025-archive/",
  "letterboxd_directors": "https://letterboxd.com/jasonli777/list/director/",
  "senscritique_cultes": "https://www.senscritique.com/liste/l_encyclopedie_des_films_cultes/27776",
  "senscritique_top111": "https://www.senscritique.com/films/tops/top111",
  "senscritique_top100": "https://www.senscritique.com/films/tops/top100-des-top10",
  "senscritique_claques": "https://www.senscritique.com/top/resultats/les_plus_belles_claques_esthetiques/253158"
};

interface ScrapedFilm {
  title: string;
  year: number;
  director: string;
  rank: number;
  poster_url: string;
  url: string;
}

function normalizeTitle(title: string): string {
  if (!title) return '';
  return title.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/^(le |la |les |the |a |an |l')/i, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const delay = (min: number, max: number) => new Promise(res => setTimeout(res, Math.floor(Math.random() * (max - min + 1) + min)));

async function scrapeLetterboxdList(page: Page, url: string): Promise<ScrapedFilm[]> {
  const films: ScrapedFilm[] = [];
  let currentUrl = url;
  let pageNum = 1;

  while (currentUrl) {
    console.log(`Scraping Letterboxd page ${pageNum}...`);
    await page.goto(currentUrl, { waitUntil: 'domcontentloaded' });

    // Note: This is an approximation. Letterboxd lists often only load posters, 
    // real year and director might need more deep scraping, but we try to grab what's on the page.
    const items = await page.$$('.poster-list li');
    for (const item of items) {
      const container = await item.$('.react-component[data-component-class="LazyPoster"]');
      if (!container) continue;

      const itemName = await container.getAttribute('data-item-name') || '';
      const urlPath = await container.getAttribute('data-item-link') || '';

      // Extract title and year from "Harakiri (1962)"
      let title = itemName;
      let year = 0;
      const yearMatch = itemName.match(/\((\d{4})\)$/);
      if (yearMatch) {
        year = parseInt(yearMatch[1], 10);
        title = title.replace(yearMatch[0], '').trim();
      }

      if (title && urlPath) {
        films.push({
          title,
          year,
          director: '', // Non disponible sur la page liste
          rank: films.length + 1,
          poster_url: '', // Non préchargé 
          url: `https://letterboxd.com${urlPath}`
        });
      }
    }

    const nextBtn = await page.$('a.next');
    if (nextBtn) {
      const nextHref = await nextBtn.getAttribute('href');
      if (nextHref) {
        currentUrl = `https://letterboxd.com${nextHref}`;
        pageNum++;
        await delay(1500, 3000);
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return films;
}

async function scrapeSensCritiqueList(page: Page, url: string): Promise<ScrapedFilm[]> {
  const films: ScrapedFilm[] = [];
  let currentUrl = url;
  let pageNum = 1;

  while (currentUrl) {
    console.log(`Scraping SensCritique page ${pageNum}...`);
    await page.goto(currentUrl, { waitUntil: 'domcontentloaded' });

    const items = await page.$$('[data-testid="product-list-item"]');
    for (const item of items) {
      const titleEl = await item.$('[data-testid="product-title"]');
      const yearEl = await item.$('[data-testid="product-year"]');
      const directorEl = await item.$('[data-testid="product-creator"]');
      const imgEl = await item.$('img');

      const title = titleEl ? await titleEl.innerText() : '';
      const yearStr = yearEl ? await yearEl.innerText() : '';
      const year = yearStr ? parseInt(yearStr.replace(/[^0-9]/g, ''), 10) : 0;
      const director = directorEl ? await directorEl.innerText() : '';
      const poster_url = imgEl ? await imgEl.getAttribute('src') || '' : '';
      const urlEl = await item.$('a');
      const urlPath = urlEl ? await urlEl.getAttribute('href') || '' : '';

      if (title) {
        films.push({
          title,
          year,
          director,
          rank: films.length + 1,
          poster_url,
          url: `https://www.senscritique.com${urlPath}`
        });
      }
    }

    const nextBtn = await page.$('[data-testid="pagination-next"]');
    if (nextBtn && !(await nextBtn.isDisabled())) {
      const nextHref = await nextBtn.getAttribute('href');
      if (nextHref) {
        currentUrl = `https://www.senscritique.com${nextHref}`;
        pageNum++;
        await delay(1500, 3000);
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return films;
}

export async function seedSource(source: string): Promise<void> {
  const sourceUrl = SOURCES[source];
  if (!sourceUrl) {
    console.error(`Source invalide: ${source}`);
    console.log("Sources disponibles:", Object.keys(SOURCES).join(', '));
    process.exit(1);
  }

  // 3. Vérifier dans reference_sources
  const { data: sourceData } = await supabase
    .from('reference_sources')
    .select('last_scraped_at')
    .eq('id', source)
    .single();

  if (sourceData?.last_scraped_at) {
    console.log(`⚠️ Cette source a déjà été scrapée le ${sourceData.last_scraped_at}.`);
    const readlineInterface = (await import('readline')).createInterface({
      input: process.stdin,
      output: process.stdout
    });
    const answer = await new Promise<string>(resolve => {
      readlineInterface.question('Continuer ? (y/n) ', resolve);
    });
    readlineInterface.close();
    if (answer.toLowerCase() !== 'y') {
      console.log('Annulation.');
      process.exit(0);
    }
  }

  console.log(`Démarrage du scraping pour la source: ${source} (${sourceUrl})`);

  // 4 & 5. Scraper
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  let scrapedFilms: ScrapedFilm[] = [];
  try {
    if (source.startsWith('letterboxd')) {
      scrapedFilms = await scrapeLetterboxdList(page, sourceUrl);
    } else if (source.startsWith('senscritique')) {
      scrapedFilms = await scrapeSensCritiqueList(page, sourceUrl);
    }
  } catch (err) {
    console.error("Erreur durant le scraping:", err);
  } finally {
    await browser.close();
  }

  console.log(`${scrapedFilms.length} films extraits de la source.`);

  // 6. Déduplication & Insertion
  let inserted = 0;
  let merged = 0;

  for (const film of scrapedFilms) {
    const title_normalized = normalizeTitle(film.title);

    // Check exist
    const { data: existingFilms } = await supabase
      .from('reference_films')
      .select('*')
      .eq('title_normalized', title_normalized)
      .eq('year', film.year); // This might fail if year = 0, but respects instruction

    if (existingFilms && existingFilms.length > 0) {
      const existing = existingFilms[0];
      const newSources = Array.from(new Set([...(existing.sources || []), source]));
      const sourceCount = newSources.length;
      // Approximation for avg_rank
      const newAvgRank = ((existing.avg_rank * existing.source_count) + film.rank) / sourceCount;

      await supabase
        .from('reference_films')
        .update({
          sources: newSources,
          source_count: sourceCount,
          avg_rank: newAvgRank
        })
        .eq('id', existing.id);

      merged++;
    } else {
      const { error } = await supabase
        .from('reference_films')
        .insert({
          title: film.title,
          title_normalized,
          year: film.year,
          director: film.director,
          poster_url: film.poster_url,
          sources: [source],
          source_count: 1,
          avg_rank: film.rank,
          avg_note: 0 // Default
        });

      if (error) {
        // Affiche l'erreur exacte renvoyée par Supabase sans faire planter tout le script
        console.error(`❌ Erreur lors de l'insertion de "${film.title}" :`, error.message || error);
      } else {
        // On n'incrémente le compteur QUE si l'insertion a réellement réussi
        inserted++;
      }
    }
  }

  // Update source
  await supabase
    .from('reference_sources')
    .upsert({
      id: source,
      last_scraped_at: new Date().toISOString(),
      film_count: scrapedFilms.length
    });

  // Logger résumé
  console.log(`✅ ${source} terminé : ${scrapedFilms.length} films traités, ${inserted} nouveaux, ${merged} fusionnés avec existants`);

  // Sauvegarder rapport
  const outputDir = path.join(dirname, 'output', 'seed_logs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(outputDir, `${source}_${timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({
    source,
    timestamp,
    totalScraped: scrapedFilms.length,
    inserted,
    merged,
    films: scrapedFilms
  }, null, 2));
}

// 1 & 2. CLI
if (process.argv[1] && process.argv[1].includes('00_seed_database.ts')) {
  const sourceArg = process.argv.find(a => a.startsWith('--source='))?.split('=')[1];
  if (!sourceArg) {
    console.error("Argument --source manquant. Exemple: npx ts-node 00_seed_database.ts --source=letterboxd_top500");
    console.log("Sources disponibles:\n- " + Object.keys(SOURCES).join('\n- '));
    process.exit(1);
  }

  seedSource(sourceArg).catch(console.error);
}
