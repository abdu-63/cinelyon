import * as fs from 'fs';
import * as path from 'path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import React from 'react';
import * as dotenv from 'dotenv';
import { Vibrant } from 'node-vibrant/node';
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

// Récupère des scènes de secours via l'API IMDb (RapidAPI)
async function getIMDbBackdrops(imdbId: string, topCast: string[] = [], director: string = ''): Promise<string[]> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey || !imdbId) return [];

  try {
    const res = await fetch(`https://imdb8.p.rapidapi.com/title/get-images?tconst=${imdbId}&limit=25`, {
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': 'imdb8.p.rapidapi.com'
      }
    });
    
    const data = await res.json();
    
    if (data.images && data.images.length > 0) {
      // 1. Filtrer les images de mauvaise qualité, de mauvais type ou mauvais format (portrait)
      const filteredImages = data.images.filter((img: any) => {
        if (!img.url) return false;

        const type = (img.type || '').toLowerCase();
        // Exclure les posters, événements (tapis rouges, etc.) et les coulisses (behind the scenes)
        if (type === 'poster' || type === 'event' || type === 'behind_the_scenes') {
          return false;
        }

        // Exclure si ce n'est pas un format paysage (largeur > hauteur)
        const w = Number(img.width) || 0;
        const h = Number(img.height) || 0;
        if (w <= h || (w / h) < 1.2) {
          return false;
        }

        // Exclure si la légende contient des mots-clés indésirables (affiches, promo, etc.)
        const caption = (img.caption || '').toLowerCase();
        const blacklistedKeywords = [
          'poster', 'affiche', 'dvd', 'blu-ray', 'behind the scenes', 
          'sur le tournage', 'tournage', 'photocall', 'premiere', 'avant-première',
          'key art', 'promotional event', 'press conference', 'publicity photo'
        ];
        if (blacklistedKeywords.some(keyword => caption.includes(keyword))) {
          return false;
        }

        return true;
      });

      // 2. Noter/Scorer les images pour faire remonter les plus emblématiques (acteurs principaux, réalisateur)
      const scoredImages = filteredImages.map((img: any, index: number) => {
        let score = 0;
        const caption = (img.caption || '').toLowerCase();

        // Bonus pour la présence des acteurs principaux dans la légende
        topCast.forEach(actor => {
          if (actor && caption.includes(actor.toLowerCase())) {
            score += 10;
          }
        });

        // Bonus pour la présence du réalisateur dans la légende
        if (director && caption.includes(director.toLowerCase())) {
          score += 5;
        }

        // Pénalité légère pour l'index d'origine afin de conserver l'ordre de pertinence d'IMDb
        score -= index * 0.05;

        return { url: img.url, score };
      });

      // Trier par score décroissant
      scoredImages.sort((a: any, b: any) => b.score - a.score);

      // Retourner les URLs triées
      return scoredImages.map((img: any) => img.url);
    }
  } catch (e) {
    console.warn(`Erreur lors de la récupération IMDb pour ${imdbId}:`, e);
  }
  
  return [];
}

// Récupère 3 scènes (backdrops) différentes et originales pour un film précis
async function getMovieBackdrops(film: EnrichedFilm): Promise<string[]> {
  const apiKey = process.env.TMDB_API_KEY;
  const fallbackImagesBase = [
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=100&w=2560&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=100&w=2560&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=100&w=2560&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=100&w=2560&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1585647347384-2593bc35786b?q=100&w=2560&auto=format&fit=crop'
  ];
  // On mélange la base de fallbacks pour avoir 3 images génériques différentes
  const shuffledFallbacks = [...fallbackImagesBase].sort(() => 0.5 - Math.random()).slice(0, 3);

  if (!apiKey) return shuffledFallbacks;

  try {
    // 1. Résolution de l'ID TMDB : champ direct ou recherche par titre
    let tmdbId: number | null = film.tmdb_id ? Number(film.tmdb_id) : (film as any).id ? Number((film as any).id) : null;

    if (!tmdbId) {
      // Recherche par titre (+ année si dispo) pour résoudre l'ID
      const query = encodeURIComponent(film.title.trim());
      const yearParam = film.year ? `&year=${film.year}` : '';
      const searchRes = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}${yearParam}&language=fr-FR`
      );
      const searchData = await searchRes.json();

      if (searchData.results && searchData.results.length > 0) {
        tmdbId = searchData.results[0].id;
        console.log(`🔍 ID TMDB résolu pour "${film.title}" → ${tmdbId}`);
      } else {
        console.warn(`⚠️ Aucun résultat TMDB pour : ${film.title}`);
        return shuffledFallbacks;
      }
    }

    let backdrops: string[] = [];

    // 2. Récupération de l'ID IMDb et des crédits (cast/director) via l'API TMDB
    let imdbId: string | null = null;
    let topCast: string[] = [];
    let directorName: string = film.director || '';

    try {
      const movieDetailsRes = await fetch(
        `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}&append_to_response=credits`
      );
      const movieDetails = await movieDetailsRes.json();
      imdbId = movieDetails.imdb_id;

      if (movieDetails.credits && movieDetails.credits.cast) {
        topCast = movieDetails.credits.cast.slice(0, 5).map((c: any) => c.name);
      }
      if (movieDetails.credits && movieDetails.credits.crew) {
        const directorObj = movieDetails.credits.crew.find((c: any) => c.job === 'Director');
        if (directorObj) {
          directorName = directorObj.name;
        }
      }
    } catch (err) {
      console.warn(`Erreur lors de la récupération des détails TMDB pour ${film.title}:`, err);
    }

    // 3. Récupération des backdrops IMDb si l'ID IMDb est disponible
    if (imdbId) {
      console.log(`🎬 Récupération des images IMDb pour "${film.title}" (${imdbId})...`);
      backdrops = await getIMDbBackdrops(imdbId, topCast, directorName);
    }

    // 4. Fallback TMDB s'il manque des images IMDb (moins de 3)
    if (backdrops.length < 3) {
      console.log(`🔄 Fallback TMDB déclenché pour "${film.title}" (images IMDb valides trouvées : ${backdrops.length})`);
      try {
        const imagesRes = await fetch(
          `https://api.themoviedb.org/3/movie/${tmdbId}/images?api_key=${apiKey}`
        );
        const imagesData = await imagesRes.json();

        let tmdbBackdrops: string[] = [];
        if (imagesData.backdrops && imagesData.backdrops.length > 0) {
          tmdbBackdrops = imagesData.backdrops.map(
            (b: any) => `https://image.tmdb.org/t/p/original${b.file_path}`
          );
          
          // On retire les 2 premières images si possible, car ce sont souvent des déclinaisons de l'affiche
          if (tmdbBackdrops.length > 5) {
            tmdbBackdrops = tmdbBackdrops.slice(2);
          }

          // Mélange de Fisher-Yates
          for (let i = tmdbBackdrops.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tmdbBackdrops[i], tmdbBackdrops[j]] = [tmdbBackdrops[j], tmdbBackdrops[i]];
          }
        }
        backdrops = [...backdrops, ...tmdbBackdrops];
      } catch (e) {
        console.warn(`Erreur lors du fallback TMDB pour ${film.title}:`, e);
      }
    }

    // 5. On comble avec des images génériques si on n'a toujours pas 3 backdrops
    if (backdrops.length >= 3) return backdrops.slice(0, 3);
    if (backdrops.length === 2) return [backdrops[0], backdrops[1], shuffledFallbacks[0]];
    if (backdrops.length === 1) return [backdrops[0], shuffledFallbacks[0], shuffledFallbacks[1]];

  } catch (e) {
    console.warn(`Erreur lors de la récupération des scènes pour ${film.title}:`, e);
  }

  return shuffledFallbacks;
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
  
  const [fontReg, fontBold, fontBoldItalic] = await Promise.all([
    loadHelveticaNeue('Regular'),
    loadHelveticaNeue('Bold'),
    loadHelveticaNeue('Bold Italic')
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
  // SLIDES 1..N — FILMS
  // ══════════════════════════════════════════════════════════════
  const maxFilmSlides = Math.min(films.length, INSTAGRAM.maxSlides - 1);

  for (let i = 0; i < maxFilmSlides; i++) {
    const film = films[i];
    const formattedTitle = film.title.toUpperCase();
    
    // (Point 3) Récupération des photogrammes via TMDB
    const backdrops = await getMovieBackdrops(film);
    const mainImage = backdrops[0];
    const secondaryImage = backdrops[1];
    const tertiaryImage = backdrops[2];

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
    
    let collageContent;
    if (layoutType === 'A1') {
      collageContent = (
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '920px' }}>
          <div style={{ display: 'flex', width: '55%', flexDirection: 'column', paddingRight: '15px' }}>
            <img src={mainImage} style={{ width: '100%', height: '600px', objectFit: 'cover', marginBottom: '30px' }} />
            <img src={secondaryImage} style={{ width: '100%', height: '290px', objectFit: 'cover' }} />
          </div>
          <div style={{ display: 'flex', width: '45%', flexDirection: 'column', paddingLeft: '15px' }}>
            <img src={tertiaryImage} style={{ width: '100%', height: '430px', objectFit: 'cover', marginBottom: '30px' }} />
            <div style={{ 
              display: '-webkit-box', WebkitLineClamp: 12, WebkitBoxOrient: 'vertical',
              overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 26, fontWeight: 700, 
              color: TEXT_DARK, lineHeight: 1.25, textTransform: 'uppercase'
            }}>
              {synopsis}
            </div>
          </div>
        </div>
      );
    } else if (layoutType === 'A2') {
      collageContent = (
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '920px' }}>
          <div style={{ display: 'flex', width: '55%', flexDirection: 'column', paddingRight: '15px' }}>
            <img src={mainImage} style={{ width: '100%', height: '290px', objectFit: 'cover', marginBottom: '30px' }} />
            <img src={secondaryImage} style={{ width: '100%', height: '600px', objectFit: 'cover' }} />
          </div>
          <div style={{ display: 'flex', width: '45%', flexDirection: 'column', paddingLeft: '15px' }}>
            <img src={tertiaryImage} style={{ width: '100%', height: '430px', objectFit: 'cover', marginBottom: '30px' }} />
            <div style={{ 
              display: '-webkit-box', WebkitLineClamp: 12, WebkitBoxOrient: 'vertical',
              overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 26, fontWeight: 700, 
              color: TEXT_DARK, lineHeight: 1.25, textTransform: 'uppercase'
            }}>
              {synopsis}
            </div>
          </div>
        </div>
      );
    } else if (layoutType === 'B1') {
      collageContent = (
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '920px' }}>
          <div style={{ display: 'flex', width: '45%', flexDirection: 'column', paddingRight: '15px' }}>
            <img src={mainImage} style={{ width: '100%', height: '500px', objectFit: 'cover', marginBottom: '30px' }} />
            <div style={{ 
              display: '-webkit-box', WebkitLineClamp: 11, WebkitBoxOrient: 'vertical',
              overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 26, fontWeight: 700, 
              color: TEXT_DARK, lineHeight: 1.25, textTransform: 'uppercase', textAlign: 'right'
            }}>
              {synopsis}
            </div>
          </div>
          <div style={{ display: 'flex', width: '55%', flexDirection: 'column', paddingLeft: '15px' }}>
            <img src={secondaryImage} style={{ width: '100%', height: '630px', objectFit: 'cover', marginBottom: '30px' }} />
            <img src={tertiaryImage} style={{ width: '100%', height: '260px', objectFit: 'cover' }} />
          </div>
        </div>
      );
    } else { // B2
      collageContent = (
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '920px' }}>
          <div style={{ display: 'flex', width: '45%', flexDirection: 'column', paddingRight: '15px' }}>
            <img src={mainImage} style={{ width: '100%', height: '500px', objectFit: 'cover', marginBottom: '30px' }} />
            <div style={{ 
              display: '-webkit-box', WebkitLineClamp: 11, WebkitBoxOrient: 'vertical',
              overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 26, fontWeight: 700, 
              color: TEXT_DARK, lineHeight: 1.25, textTransform: 'uppercase', textAlign: 'right'
            }}>
              {synopsis}
            </div>
          </div>
          <div style={{ display: 'flex', width: '55%', flexDirection: 'column', paddingLeft: '15px' }}>
            <img src={secondaryImage} style={{ width: '100%', height: '260px', objectFit: 'cover', marginBottom: '30px' }} />
            <img src={tertiaryImage} style={{ width: '100%', height: '630px', objectFit: 'cover' }} />
          </div>
        </div>
      );
    }

    const slideSvg = await satori(
      <div style={{
        display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
        backgroundColor: BG_COLOR, padding: '50px', boxSizing: 'border-box'
      }}>
        
        {/* COLLAGE HAUT (Aléatoire 4 variations) */}
        {collageContent}

        {/* TITRE ET FOOTER */}
        <div style={{ 
          display: 'flex', flex: 1, flexDirection: 'column', 
          justifyContent: 'flex-end', alignItems: 'center',
          paddingBottom: '20px'
        }}>
          {/* (Point 4) Couleur Dynamique et (Taille adaptative) */}
          <h1 style={{ 
            display: 'flex',
            color: dynamicTitleColor, 
            fontSize: formattedTitle.length >= 20 ? 95 : (formattedTitle.length >= 14 ? 115 : (formattedTitle.length >= 10 ? 135 : 160)),
            fontWeight: 800, 
            lineHeight: 0.9, 
            margin: 0,
            letterSpacing: '-0.04em',
            textAlign: 'center'
          }}>
            {formattedTitle}
          </h1>
          
          {/* (Point 5) Réalisateur dynamique */}
          <span style={{ 
            display: 'flex',
            color: TEXT_DARK, 
            fontSize: 34, 
            fontWeight: 700, 
            marginTop: '30px',
            letterSpacing: '0.02em',
            textTransform: 'uppercase'
          }}>
            DIRECTED BY {directorName} ({releaseYear})
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