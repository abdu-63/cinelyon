import * as fs from 'fs';
import * as path from 'path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import React from 'react';
import * as dotenv from 'dotenv';
import { Vibrant } from 'node-vibrant/node';
import sharp from 'sharp';
import * as cheerio from 'cheerio';
import { EnrichedFilm } from './types';
import { INSTAGRAM } from './constants';

const dirname = process.cwd();
dotenv.config({ path: path.join(dirname, '../../.env') });

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG_COLOR = '#EFEBE6'; // Beige coquille d'œuf des inspirations
const TEXT_DARK = '#2B2B2B'; // Gris anthracite
const ACCENT_RED_COVER = '#B22222'; // Rouge fixe pour la couverture uniquement
const SLIDE = { width: 1080, height: 1350 } as const;

// Tokens de l'ancienne couverture
const ACCENT = '#444cf7';
const BG_DARK = '#121212';
const WHITE = '#FFFFFF';
const MUTED = 'rgba(255,255,255,0.55)';



// ─── Helpers : Dates & Calendrier ─────────────────────────────────────────────

async function loadHelveticaNeue(variant: string) {
  return fs.promises.readFile(path.join(dirname, `../../static/font/HelveticaNeue_Helvetica Neue_${variant}.ttf`));
}

async function loadImpact() {
  return fs.promises.readFile(path.join(dirname, '../../static/font/impact.ttf'));
}

interface DateLabel { dayName: string; dayNum: number; monthName: string }

function getDateLabel(date: Date): DateLabel {
  const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  return {
    dayName: dayNames[date.getDay()],
    dayNum: date.getDate(),
    monthName: monthNames[date.getMonth()],
  };
}

interface CalendarData { monthName: string; weeks: (number | null)[][]; targetDay: number }

function getCalendarData(date: Date): CalendarData {
  const year = date.getFullYear();
  const month = date.getMonth();
  const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const rawFirst = new Date(year, month, 1).getDay();
  const offset = rawFirst === 0 ? 6 : rawFirst - 1; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return { monthName: monthNames[month], weeks, targetDay: date.getDate() };
}

// ─── Helpers : Analyse & Filtrage d'images (Similarité & Qualité) ──────────────

async function getDHashAndStats(imageUrl: string): Promise<{ hash: string; whitePercent: number; blackPercent: number; satPercent: number } | null> {
  try {
    // Utilisation de la version w300 (miniature) pour TMDB pour optimiser le chargement et le calcul
    const downloadUrl = imageUrl.includes('image.tmdb.org/t/p/original/')
      ? imageUrl.replace('/t/p/original/', '/t/p/w300/')
      : imageUrl;

    const res = await fetch(downloadUrl);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());

    // 1. Calcul du dHash (difference hash sur 9x8 pixels en niveau de gris)
    const resizedRaw = await sharp(buffer)
      .grayscale()
      .resize(9, 8, { fit: 'fill' })
      .raw()
      .toBuffer();

    let hash = '';
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const left = resizedRaw[y * 9 + x];
        const right = resizedRaw[y * 9 + x + 1];
        hash += (left > right ? '1' : '0');
      }
    }

    // 2. Calcul du pourcentage de pixels blancs, noirs et très saturés (sur 100x100 pixels)
    const rgbRaw = await sharp(buffer)
      .resize(100, 100, { fit: 'fill' })
      .raw()
      .toBuffer();

    let whiteCount = 0;
    let blackCount = 0;
    let highSatCount = 0;
    const totalPixels = 10000;
    for (let i = 0; i < totalPixels; i++) {
      const r = rgbRaw[i * 3];
      const g = rgbRaw[i * 3 + 1];
      const b = rgbRaw[i * 3 + 2];
      const brightness = (r + g + b) / 3;
      if (brightness > 240) {
        whiteCount++;
      } else if (brightness < 15) {
        blackCount++;
      }
      // Saturation HSV : détecte les graphismes/key art aux couleurs vives et uniformes
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      if (sat > 0.7 && max > 100) {
        highSatCount++;
      }
    }

    const whitePercent = (whiteCount / totalPixels) * 100;
    const blackPercent = (blackCount / totalPixels) * 100;
    const satPercent = (highSatCount / totalPixels) * 100;

    return { hash, whitePercent, blackPercent, satPercent };
  } catch (e) {
    console.warn(`[getDHashAndStats] Erreur lors de l'analyse de l'image ${imageUrl}:`, e);
    return null;
  }
}

function getHammingDistance(h1: string, h2: string): number {
  let dist = 0;
  for (let i = 0; i < h1.length; i++) {
    if (h1[i] !== h2[i]) dist++;
  }
  return dist;
}

async function filterUniqueScenes(urls: string[]): Promise<string[]> {
  const accepted: { url: string; hash: string }[] = [];

  for (const url of urls) {
    const stats = await getDHashAndStats(url);
    if (!stats) continue;

    const { hash, whitePercent, blackPercent, satPercent } = stats;

    // Filtre dessins/key art sur fond blanc
    if (whitePercent > 40) {
      console.log(`   🚫 Image rejetée (trop claire/dessin) [${whitePercent.toFixed(1)}% blanc] : ${url}`);
      continue;
    }
    // Filtre cartons titre/crédits sombres
    if (blackPercent > 75) {
      console.log(`   🚫 Image rejetée (trop sombre/générique) [${blackPercent.toFixed(1)}% noir] : ${url}`);
      continue;
    }
    // Filtre key art graphique / affiches promotionnelles aux couleurs très saturées
    if (satPercent > 35) {
      console.log(`   🚫 Image rejetée (key art graphique) [${satPercent.toFixed(1)}% sat.] : ${url}`);
      continue;
    }

    // Filtrage des doublons visuels (distance Hamming < 15 pour capturer aussi les plans quasi-identiques d'une même scène)
    let isDuplicate = false;
    for (const acc of accepted) {
      const dist = getHammingDistance(hash, acc.hash);
      if (dist < 15) {
        isDuplicate = true;
        console.log(`   🚫 Image rejetée (similarité) [distance=${dist}] : ${url} (proche de ${acc.url})`);
        break;
      }
    }

    if (isDuplicate) continue;

    accepted.push({ url, hash });
    console.log(`   ✅ Image acceptée : ${url}`);

    if (accepted.length === 3) break;
  }

  return accepted.map(a => a.url);
}

// ─── Helpers : API TMDB (Point 3) ─────────────────────────────────────────────

// Récupère une scène de film populaire au hasard pour la couverture
async function getRandomMovieScene(): Promise<string> {
  const apiKey = process.env.TMDB_API_KEY;
  if (apiKey) {
    try {
      const randomPage = Math.floor(Math.random() * 20) + 1;
      const res = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&sort_by=popularity.desc&page=${randomPage}`);
      const data = await res.json();

      if (data.results && data.results.length > 0) {
        const randomMovie = data.results[Math.floor(Math.random() * data.results.length)];
        if (randomMovie.backdrop_path) {
          return `https://image.tmdb.org/t/p/original${randomMovie.backdrop_path}`;
        }
      }
    } catch (e) {
      console.warn("Erreur TMDB (scène aléatoire):", e);
    }
  }

  // Backup avec images Unsplash cinématographiques
  const fallbackImages = [
    '1489599849927-2ee91cede3ba',
    '1536440136628-849c177e76a1',
    '1517604931442-7e0c8ed2963c',
    '1440404653325-ab127d49abc1'
  ];
  const randomFallbackId = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
  return `https://images.unsplash.com/photo-${randomFallbackId}?q=100&w=2560&auto=format&fit=crop`;
}

async function getFilmGrabImages(title: string): Promise<string[]> {
  try {
    const url = `https://film-grab.com/?s=${encodeURIComponent(title)}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);

    const firstResult = $('.entry-title a').first().attr('href');
    if (!firstResult) return [];

    const postRes = await fetch(firstResult);
    if (!postRes.ok) return [];
    const postHtml = await postRes.text();
    const $post = cheerio.load(postHtml);

    const images: string[] = [];
    $post('.bwg-masonry-thumb, .bwg-item img, img.size-full, .gallery-item img, figure img').each((i, el) => {
      let src = $post(el).closest('a').attr('href') || $post(el).attr('src') || $post(el).attr('data-src') || $post(el).attr('data-lazy-src');
      if (src) {
        if (src.includes('/thumb/')) {
           src = src.replace('/thumb/', '/').split('?')[0];
        }
        images.push(src);
      }
    });

    if (images.length === 0) {
        $post('.entry-content img').each((i, el) => {
           let src = $post(el).closest('a').attr('href') || $post(el).attr('src');
           if (src) images.push(src);
        });
    }

    return images;
  } catch (e) {
    console.warn(`Erreur Film-Grab pour ${title}:`, e);
    return [];
  }
}

// Nettoie et raccourcit proprement le synopsis sous la limite maxLength
function getShortSynopsis(text: string, maxLength: number = 220): string {
  if (!text) return "";
  let clean = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;

  // Trouver toutes les fins de phrases
  const sentenceEndings = /([.!?])\s+/g;
  let match;
  const sentenceEnds: number[] = [];

  let lastIndex = 0;
  while ((match = sentenceEndings.exec(clean)) !== null) {
    const endIdx = match.index + match[1].length;
    sentenceEnds.push(endIdx);
    lastIndex = endIdx;
  }
  if (clean.length > lastIndex) {
    sentenceEnds.push(clean.length);
  }

  // Chercher la combinaison maximale de phrases sous maxLength
  let bestEnd = -1;
  for (const endIdx of sentenceEnds) {
    if (endIdx <= maxLength) {
      bestEnd = endIdx;
    } else {
      break;
    }
  }

  if (bestEnd > 0) {
    return clean.slice(0, bestEnd).trim();
  }

  // Si même la première phrase dépasse maxLength, mais qu'elle se termine avant un seuil de tolérance (ex: 260)
  const toleranceLimit = maxLength + 40;
  if (sentenceEnds.length > 0 && sentenceEnds[0] <= toleranceLimit) {
    return clean.slice(0, sentenceEnds[0]).trim();
  }

  // Si on doit vraiment couper au milieu de la phrase
  const lastSpace = clean.lastIndexOf(' ', maxLength - 3);
  if (lastSpace > 0) {
    return clean.slice(0, lastSpace).trim() + '...';
  }

  return clean.slice(0, maxLength - 3).trim() + '...';
}

async function getMovieBackdrops(film: EnrichedFilm): Promise<{ scenes: string[]; posterUrl: string | null; synopsis: string | null }> {
  const apiKey = process.env.TMDB_API_KEY;
  const posterUrl = film.poster_url || null;

  if (!apiKey) return { scenes: [], posterUrl, synopsis: null };

  try {
    let tmdbId: number | null = film.tmdb_id ? Number(film.tmdb_id) : (film as any).id ? Number((film as any).id) : null;
    let tmdbOverview: string | null = null;
    let originalTitle: string = film.title;
    let fallbackTmdbScenes: string[] = [];

    // Fetch TMDB details for ID, synopsis, and fallback backdrops
    if (!tmdbId) {
      const query = encodeURIComponent(film.title.trim());
      const yearParam = film.year ? `&year=${film.year}` : '';
      const searchRes = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}${yearParam}&language=fr-FR`);
      const searchData = await searchRes.json();
      if (searchData.results && searchData.results.length > 0) {
        tmdbId = searchData.results[0].id;
      }
    }

    if (tmdbId) {
      try {
        const movieDetailsRes = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}&language=fr-FR`);
        const movieDetails = await movieDetailsRes.json();
        tmdbOverview = movieDetails.overview || null;
        if (movieDetails.original_title) {
          originalTitle = movieDetails.original_title;
        }
        if (!tmdbOverview) {
          const enDetailsRes = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}&language=en-US`);
          const enDetails = await enDetailsRes.json();
          tmdbOverview = enDetails.overview || null;
        }

        // Fetch TMDB backdrops as fallback
        const imagesRes = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/images?api_key=${apiKey}`);
        const imagesData = await imagesRes.json();
        if (imagesData.backdrops && imagesData.backdrops.length > 0) {
          let textless = imagesData.backdrops.filter((b: any) => b.iso_639_1 === null && (b.aspect_ratio || 0) >= 1.3);
          fallbackTmdbScenes = textless.map((b: any) => `https://image.tmdb.org/t/p/original${b.file_path}`);
        }
      } catch (err) {
        console.warn(`Erreur TMDB pour ${film.title}:`, err);
      }
    }

    console.log(`🎬 Récupération des images Film-Grab pour "${film.title}" (Recherche avec "${originalTitle}")...`);
    let fgScenes = await getFilmGrabImages(originalTitle);
    
    // Si la recherche avec le titre original ne donne rien, on essaie avec le titre français
    if (fgScenes.length === 0 && originalTitle !== film.title) {
      console.log(`🎬 Film-Grab vide pour "${originalTitle}", tentative avec "${film.title}"...`);
      fgScenes = await getFilmGrabImages(film.title);
    }

    let backdrops: string[] = [];


    if (fgScenes.length > 0) {
      backdrops = await filterUniqueScenes(fgScenes);
    }

    if (backdrops.length < 3 && fallbackTmdbScenes.length > 0) {
      console.log(`🎬 Pas assez d'images Film-Grab, tentative TMDB fallback pour "${film.title}"...`);
      const tmdbFiltered = await filterUniqueScenes(fallbackTmdbScenes);
      if (tmdbFiltered.length >= 3 || tmdbFiltered.length > backdrops.length) {
        backdrops = tmdbFiltered;
      }
    }

    return { scenes: backdrops.slice(0, 3), posterUrl, synopsis: tmdbOverview };

  } catch (e) {
    console.warn(`Erreur lors de la récupération des scènes pour ${film.title}:`, e);
  }

  return { scenes: [], posterUrl, synopsis: null };
}

// ─── Helpers : Extraction de Couleur (Point 4) ────────────────────────────────

async function getDominantColor(imageUrl: string): Promise<string> {
  try {
    // Télécharge l'image en buffer pour que Node Vibrant puisse l'analyser
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    const palette = await Vibrant.from(Buffer.from(buffer)).getPalette();
    
    // On privilégie la couleur vibrante sombre pour garantir la lisibilité sur fond clair
    if (palette.DarkVibrant) return palette.DarkVibrant.hex;
    if (palette.Vibrant) return palette.Vibrant.hex;
    return ACCENT_RED_COVER; // Fallback
  } catch (error) {
    console.warn("Erreur d'extraction de couleur:", error);
    return ACCENT_RED_COVER;
  }
}

// ─── Export SVG to PNG ────────────────────────────────────────────────────────

function renderToFile(svg: string, outPath: string) {
  const buffer = new Resvg(svg, { fitTo: { mode: 'width', value: SLIDE.width } }).render().asPng();
  fs.writeFileSync(outPath, buffer);
}

// ─── Main Generation ──────────────────────────────────────────────────────────

export async function generateCarousel(): Promise<string[]> {
  const inputPath = path.join(dirname, 'output', 'enriched_films.json');
  if (!fs.existsSync(inputPath)) throw new Error(`Fichier introuvable: ${inputPath}.`);

  const films: EnrichedFilm[] = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  if (films.length === 0) throw new Error('NO_FILMS_AVAILABLE');

  const targetDate = new Date(Date.now() + 86400000); // Demain
  const { dayName, dayNum, monthName } = getDateLabel(targetDate);
  const cal = getCalendarData(targetDate);
  
  const [fontReg, fontBold, fontBoldItalic, fontImpact] = await Promise.all([
    loadHelveticaNeue('Regular'),
    loadHelveticaNeue('Bold'),
    loadHelveticaNeue('Bold Italic'),
    loadImpact()
  ]);

  const logoPath = path.join(dirname, '../../static/images/icon-192x192-rond.png');
  const logoBase64 = fs.existsSync(logoPath)
    ? `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
    : null;

  const outputDir = path.join(dirname, 'output', 'slides');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  } else {
    const existingFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.png'));
    for (const file of existingFiles) fs.unlinkSync(path.join(outputDir, file));
  }

  const FONTS = [
    { name: 'Helvetica Neue', data: fontReg, weight: 400 as const, style: 'normal' as const },
    { name: 'Helvetica Neue', data: fontBold, weight: 700 as const, style: 'normal' as const },
    { name: 'Helvetica Neue', data: fontBoldItalic, weight: 700 as const, style: 'italic' as const },
    { name: 'Impact', data: fontImpact, weight: 400 as const, style: 'normal' as const },
  ];

  const generatedPaths: string[] = [];
  const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  // ══════════════════════════════════════════════════════════════
  // SLIDE 0 — COUVERTURE
  // ══════════════════════════════════════════════════════════════
  const backdropUrl = await getRandomMovieScene();

  const coverSvg = await satori(
    <div style={{ display: 'flex', width: '100%', height: '100%', backgroundColor: '#000', position: 'relative', overflow: 'hidden' }}>

      {/* Backdrop */}
      <img src={backdropUrl} style={{ display: 'flex', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />

      {/* Gradient overlay — darker at top & bottom, transparent in middle */}
      <div style={{
        display: 'flex', position: 'absolute', top: 0, left: 0, right: 0, height: '52%',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.80), rgba(0,0,0,0.0))'
      }} />
      <div style={{
        display: 'flex', position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
        background: 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.0))'
      }} />

      {/* ── TOP TEXT ── */}
      <div style={{ display: 'flex', position: 'absolute', top: 250, left: 0, right: 0, flexDirection: 'column', alignItems: 'center' }}>

        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline' }}>
          <span style={{ display: 'flex', fontSize: 56, fontWeight: 400, color: WHITE }}>on</span>
          <span style={{ display: 'flex', fontSize: 56, fontWeight: 800, color: WHITE, marginLeft: '16px', marginRight: '16px' }}>regarde</span>
          <span style={{ display: 'flex', fontSize: 56, fontWeight: 400, color: WHITE }}>quoi à lyon</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
          <div style={{ display: 'flex', position: 'relative', paddingLeft: 10, paddingRight: 10 }}>
            {/* The half-highlight background */}
            <div style={{
              display: 'flex', position: 'absolute', bottom: '-4px', left: 0, right: 0, height: '45%', backgroundColor: ACCENT
            }} />
            <span style={{ display: 'flex', fontSize: 64, fontWeight: 800, color: WHITE }}>
              {dayName} {dayNum} {monthName}
            </span>
          </div>
          <span style={{ display: 'flex', fontSize: 64, fontWeight: 800, color: WHITE, marginLeft: 12 }}>?</span>
        </div>
      </div>

      {/* ── CALENDAR ── */}
      <div style={{ display: 'flex', position: 'absolute', bottom: 200, left: 0, right: 0, flexDirection: 'column', alignItems: 'center' }}>

        <div style={{ display: 'flex', width: 700, justifyContent: 'flex-end', marginBottom: 24 }}>
          <span style={{ display: 'flex', fontSize: 56, fontWeight: 800, color: WHITE, paddingRight: 25 }}>
            {cal.monthName}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 10 }}>
          {DAY_LETTERS.map((d, i) => (
            <div key={i} style={{ display: 'flex', width: 100, height: 50, alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ display: 'flex', fontSize: 36, fontWeight: 400, color: MUTED }}>{d}</span>
            </div>
          ))}
        </div>

        {/* Week rows avec le cercle fait main */}
        {cal.weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'row', marginBottom: 8 }}>
            {week.map((day, di) => {
              const isTarget = day === cal.targetDay;
              return (
                <div key={di} style={{
                  display: 'flex', width: 100, height: 100,
                  alignItems: 'center', justifyContent: 'center',
                  position: 'relative' // Requis pour positionner le SVG pardessus
                }}>
                  {isTarget && (
                    <svg width="120" height="120" viewBox="0 0 100 100" style={{ display: 'flex', position: 'absolute', top: '-10px', left: '-10px' }}>
                      <path
                        d="M50,15 C25,10 10,30 10,50 C10,75 25,90 50,85 C75,80 90,65 85,45 C80,25 65,15 50,20"
                        fill="none" stroke={ACCENT} strokeWidth="5" strokeLinecap="round" strokeDasharray="12,4"
                      />
                    </svg>
                  )}

                  <span style={{
                    display: 'flex', fontSize: 44,
                    fontWeight: isTarget ? 800 : 400,
                    color: day !== null ? WHITE : 'transparent',
                  }}>{day !== null ? String(day) : '0'}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── TOP BRANDING ── */}
      <div style={{
        display: 'flex', position: 'absolute', top: '60px', left: '60px',
      }}>
        <span style={{ display: 'flex', color: WHITE, fontSize: 28, fontWeight: 800, letterSpacing: '0.1em', opacity: 0.8 }}>
          CINELYON.FR
        </span>
      </div>

      {/* ── LOGO ROND ── */}
      {logoBase64 && (
        <img
          src={logoBase64}
          style={{ display: 'flex', position: 'absolute', bottom: '50px', right: '50px', width: 80, height: 80 }}
        />
      )}

    </div>,
    { width: SLIDE.width, height: SLIDE.height, fonts: FONTS }
  );

  const coverPath = path.join(outputDir, 'slide_00.png');
  renderToFile(coverSvg, coverPath);
  generatedPaths.push(coverPath);
  console.log('✅ Slide couverture générée');

  // ══════════════════════════════════════════════════════════════
  // PRÉ-FETCH DES SCÈNES — Tri des films par disponibilité d'images
  // ══════════════════════════════════════════════════════════════
  console.log(`\n🔎 Pré-fetch des images pour ${films.length} films (tri par qualité visuelle)...`);
  const filmsWithScenes = await Promise.all(
    films.map(async (film) => {
      const result = await getMovieBackdrops(film);
      return { film, ...result };
    })
  );

  // Filtre strict : on ne garde que les films avec exactement 3 scènes disponibles
  const filmsReady = filmsWithScenes.filter(f => f.scenes.length >= 3);
  const filmsExcluded = filmsWithScenes.filter(f => f.scenes.length < 3);

  const with3 = filmsReady.length;
  const with2 = filmsWithScenes.filter(f => f.scenes.length === 2).length;
  const with1 = filmsWithScenes.filter(f => f.scenes.length === 1).length;
  const with0 = filmsWithScenes.filter(f => f.scenes.length === 0).length;
  console.log(`📊 Après tri — 3 scènes: ${with3} | 2 scènes: ${with2} | 1 scène: ${with1} | 0 scène: ${with0}`);

  if (filmsExcluded.length > 0) {
    console.log(`🚫 Films exclus (images insuffisantes) : ${filmsExcluded.map(f => `"${f.film.title}" (${f.scenes.length} scène(s))`).join(', ')}`);
  }
  console.log();

  if (filmsReady.length === 0) throw new Error('NO_FILMS_AVAILABLE');

  // Limiter la liste finale des films à (INSTAGRAM.maxSlides - 1) pour respecter la limite du carrousel Instagram (maximum 9 films + 1 couverture)
  const finalFilmsReady = filmsReady.slice(0, INSTAGRAM.maxSlides - 1);

  const filteredFilmList = finalFilmsReady.map(f => {
    const rawSynopsis = f.synopsis || f.film.synopsis || "";
    f.film.synopsis = getShortSynopsis(rawSynopsis, 220);
    return f.film;
  });
  fs.writeFileSync(inputPath, JSON.stringify(filteredFilmList, null, 2), 'utf8');
  console.log(`💾 enriched_films.json mis à jour avec les synopses TMDB raccourcis : ${filteredFilmList.length} film(s) retenus (ordre slides)\n`);

  // ══════════════════════════════════════════════════════════════
  // SLIDES 1..N — FILMS
  // ══════════════════════════════════════════════════════════════
  const maxFilmSlides = finalFilmsReady.length;

  for (let i = 0; i < maxFilmSlides; i++) {
    const { film, scenes, posterUrl } = finalFilmsReady[i];
    const formattedTitle = film.title.toUpperCase();

    // Résolution des slots d'images (basée strictement sur scenes.length) :
    // 0 scène  : mainImage = affiche, secondImage = null,   thirdImage = null
    // 1 scène  : mainImage = scène1, secondImage = affiche, thirdImage = null
    // 2 scènes : mainImage = scène1, secondImage = scène2,  thirdImage = affiche
    // 3 scènes : mainImage = scène1, secondImage = scène2,  thirdImage = scène3
    const mainImage   = scenes[0] ?? posterUrl ?? '';
    const secondImage = scenes.length >= 2 ? scenes[1] : (scenes.length === 1 ? posterUrl : null);
    const thirdImage  = scenes.length >= 3 ? scenes[2] : (scenes.length === 2 ? posterUrl : null);

    console.log(`📸 Scènes pour "${film.title}": ${scenes.length} — 2e: ${secondImage ? '✓' : '✗'} — 3e: ${thirdImage ? '✓' : '✗'}`);

    // (Point 4) Extraction de la palette dominante à partir du photogramme principal
    const dynamicTitleColor = await getDominantColor(mainImage);
    
    // Données dynamiques
    const synopsis = film.synopsis || film.overview || film.description || "";
    const directorName = film.director || "INCONNU";
    const releaseYear = film.year ? film.year : new Date().getFullYear();

    // 4 layouts différents :
    // A1: Gauche (Grosse en haut, Petite en bas), Droite (Image + Texte)
    // A2: Gauche (Petite en haut, Grosse en bas), Droite (Image + Texte)
    // B1: Gauche (Image + Texte), Droite (Grosse en haut, Petite en bas)
    // B2: Gauche (Image + Texte), Droite (Petite en haut, Grosse en bas)
    const layouts = ['A1', 'B1', 'A2', 'B2'];
    const layoutType = layouts[i % layouts.length];

    const lineClamp = 10;

    // Style commun du synopsis
    const synopsisStyle = {
      display: '-webkit-box' as const, WebkitLineClamp: lineClamp, WebkitBoxOrient: 'vertical' as const,
      overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 38, fontWeight: 700,
      color: TEXT_DARK, lineHeight: 1.12, textTransform: 'uppercase' as const,
      fontFamily: 'Impact', letterSpacing: '-0.02em', transformOrigin: 'top left',
      paddingLeft: '5px', paddingRight: '5px' // Éviter le rognage des lettres sur les bords
    };
    const synopsisStyleRight = { 
      ...synopsisStyle, 
      textAlign: 'right' as const,
      transformOrigin: 'top right',
      paddingRight: '12px' // Plus de marge à droite pour le texte aligné à droite
    };
    
    let collageContent;
    if (layoutType === 'A1') {
      collageContent = (
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '920px' }}>
          <div style={{ display: 'flex', width: '55%', flexDirection: 'column', paddingRight: '15px' }}>
            <img src={mainImage} style={{ width: '100%', height: secondImage ? '600px' : '920px', objectFit: 'cover', marginBottom: secondImage ? '30px' : '0', border: '2px solid #2B2B2B', boxSizing: 'border-box' }} />
            {secondImage && <img src={secondImage} style={{ width: '100%', height: '290px', objectFit: 'cover', border: '2px solid #2B2B2B', boxSizing: 'border-box' }} />}
          </div>
          <div style={{ display: 'flex', width: '45%', flexDirection: 'column', paddingLeft: '15px' }}>
            {thirdImage
              ? <img src={thirdImage} style={{ width: '100%', height: '430px', objectFit: 'cover', marginBottom: '30px', border: '2px solid #2B2B2B', boxSizing: 'border-box' }} />
              : null
            }
            <div style={{ ...synopsisStyle, height: '460px' }}>
              {synopsis}
            </div>
          </div>
        </div>
      );
    } else if (layoutType === 'A2') {
      collageContent = (
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '920px' }}>
          <div style={{ display: 'flex', width: '55%', flexDirection: 'column', paddingRight: '15px' }}>
            <img src={mainImage} style={{ width: '100%', height: secondImage ? '290px' : '920px', objectFit: 'cover', marginBottom: secondImage ? '30px' : '0', border: '2px solid #2B2B2B', boxSizing: 'border-box' }} />
            {secondImage && <img src={secondImage} style={{ width: '100%', height: '600px', objectFit: 'cover', border: '2px solid #2B2B2B', boxSizing: 'border-box' }} />}
          </div>
          <div style={{ display: 'flex', width: '45%', flexDirection: 'column', paddingLeft: '15px' }}>
            {thirdImage
              ? <img src={thirdImage} style={{ width: '100%', height: '430px', objectFit: 'cover', marginBottom: '30px', border: '2px solid #2B2B2B', boxSizing: 'border-box' }} />
              : null
            }
            <div style={{ ...synopsisStyle, height: '460px' }}>
              {synopsis}
            </div>
          </div>
        </div>
      );
    } else if (layoutType === 'B1') {
      collageContent = (
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '920px' }}>
          <div style={{ display: 'flex', width: '45%', flexDirection: 'column', paddingRight: '15px' }}>
            <img src={mainImage} style={{ width: '100%', height: '450px', objectFit: 'cover', marginBottom: '30px', border: '2px solid #2B2B2B', boxSizing: 'border-box' }} />
            <div style={{ ...synopsisStyleRight, height: '440px' }}>
              {synopsis}
            </div>
          </div>
          <div style={{ display: 'flex', width: '55%', flexDirection: 'column', paddingLeft: '15px' }}>
            {secondImage && <img src={secondImage} style={{ width: '100%', height: thirdImage ? '630px' : '920px', objectFit: 'cover', marginBottom: thirdImage ? '30px' : '0', border: '2px solid #2B2B2B', boxSizing: 'border-box' }} />}
            {thirdImage && <img src={thirdImage} style={{ width: '100%', height: secondImage ? '260px' : '920px', objectFit: 'cover', border: '2px solid #2B2B2B', boxSizing: 'border-box' }} />}
          </div>
        </div>
      );
    } else { // B2
      collageContent = (
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '920px' }}>
          <div style={{ display: 'flex', width: '45%', flexDirection: 'column', paddingRight: '15px' }}>
            <img src={mainImage} style={{ width: '100%', height: '450px', objectFit: 'cover', marginBottom: '30px', border: '2px solid #2B2B2B', boxSizing: 'border-box' }} />
            <div style={{ ...synopsisStyleRight, height: '440px' }}>
              {synopsis}
            </div>
          </div>
          <div style={{ display: 'flex', width: '55%', flexDirection: 'column', paddingLeft: '15px' }}>
            {secondImage && <img src={secondImage} style={{ width: '100%', height: thirdImage ? '260px' : '920px', objectFit: 'cover', marginBottom: thirdImage ? '30px' : '0', border: '2px solid #2B2B2B', boxSizing: 'border-box' }} />}
            {thirdImage && <img src={thirdImage} style={{ width: '100%', height: secondImage ? '630px' : '920px', objectFit: 'cover', border: '2px solid #2B2B2B', boxSizing: 'border-box' }} />}
          </div>
        </div>
      );
    }

    const slideSvg = await satori(
      <div style={{
        display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
        backgroundColor: BG_COLOR, padding: '50px 50px 30px 50px', boxSizing: 'border-box'
      }}>
        
        {/* COLLAGE HAUT (Aléatoire 4 variations) */}
        {collageContent}

        {/* TITRE ET FOOTER */}
        <div style={{ 
          display: 'flex', flex: 1, flexDirection: 'column', 
          justifyContent: 'flex-end', alignItems: 'center',
          paddingBottom: '5px'
        }}>
          {/* Titre en Impact avec couleur dynamique et taille adaptative */}
          <h1 style={{ 
            display: 'flex',
            fontFamily: 'Impact',
            color: dynamicTitleColor, 
            fontSize: formattedTitle.length >= 20 ? 95 : (formattedTitle.length >= 14 ? 115 : (formattedTitle.length >= 10 ? 135 : 160)),
            fontWeight: 400,
            lineHeight: 0.9, 
            margin: 0,
            letterSpacing: '-0.03em',
            textAlign: 'center',
            transform: 'scaleY(1.4)'
          }}>
            {formattedTitle}
          </h1>
          
          {/* Réalisateur centré */}
          <span style={{ 
            display: 'flex',
            color: TEXT_DARK, 
            fontSize: 32, 
            fontWeight: 700, 
            marginTop: '40px',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            textAlign: 'center',
            fontFamily: 'Impact',
            transform: 'scaleY(1.4)'
          }}>
            DIRECTED BY {directorName} ({releaseYear})
          </span>

          {/* Branding CINELYON.FR */}
          <span style={{
            display: 'flex',
            color: TEXT_DARK,
            fontSize: 22,
            fontWeight: 400,
            marginTop: '20px',
            letterSpacing: '0.15em',
            opacity: 0.5,
            textTransform: 'uppercase',
            fontFamily: 'Helvetica Neue'
          }}>
            CINELYON.FR
          </span>
        </div>

      </div>,
      { width: SLIDE.width, height: SLIDE.height, fonts: FONTS }
    );

    const slidePath = path.join(outputDir, `slide_${String(i + 1).padStart(2, '0')}.png`);
    renderToFile(slideSvg, slidePath);
    generatedPaths.push(slidePath);
    console.log(`✅ Slide film : ${film.title} générée (Couleur: ${dynamicTitleColor})`);
  }

  return generatedPaths;
}

if (process.argv[1] && process.argv[1].includes('03_generate_images.tsx')) {
  generateCarousel()
    .then(paths => console.log(`🚀 Total slides générées : ${paths.length}`))
    .catch(console.error);
}