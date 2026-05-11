import * as fs from 'fs';
import * as path from 'path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import React from 'react';
import * as dotenv from 'dotenv';
import { EnrichedFilm } from './types';
import { INSTAGRAM } from './constants';

const dirname = process.cwd();
dotenv.config({ path: path.join(dirname, '../../.env') });

// ─── Design tokens ────────────────────────────────────────────────────────────
const ACCENT = '#444cf7';
const BG_DARK = '#121212';
const WHITE = '#FFFFFF';
const MUTED = 'rgba(255,255,255,0.55)';
const SLIDE = { width: 1080, height: 1440 } as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loadInterRegular() {
  const url = 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf';
  const res = await fetch(url);
  return res.arrayBuffer();
}

async function loadInterBold() {
  const url = 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf';
  const res = await fetch(url);
  return res.arrayBuffer();
}

async function loadInterExtraBold() {
  const url = 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuDyYMZg.ttf';
  const res = await fetch(url);
  return res.arrayBuffer();
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
  const offset = rawFirst === 0 ? 6 : rawFirst - 1; // Monday-first grid
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

function renderToFile(svg: string, outPath: string) {
  const buffer = new Resvg(svg, { fitTo: { mode: 'width', value: SLIDE.width } }).render().asPng();
  fs.writeFileSync(outPath, buffer);
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateCarousel(): Promise<string[]> {
  const inputPath = path.join(dirname, 'output', 'enriched_films.json');
  if (!fs.existsSync(inputPath)) throw new Error(`Fichier introuvable: ${inputPath}.`);

  const films: EnrichedFilm[] = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  if (films.length === 0) throw new Error('NO_FILMS_AVAILABLE');

  const targetDate = new Date(Date.now() + 86400000);
  const { dayName, dayNum, monthName } = getDateLabel(targetDate);
  const cal = getCalendarData(targetDate);
  const [fontReg, fontBold, fontExtra] = await Promise.all([
    loadInterRegular(),
    loadInterBold(),
    loadInterExtraBold()
  ]);

  const logoPath = path.join(dirname, '../../static/images/icon-192x192-rond.png');
  const logoBase64 = fs.existsSync(logoPath)
    ? `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
    : null;

  const outputDir = path.join(dirname, 'output', 'slides');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const FONTS = [
    { name: 'Inter', data: fontReg, weight: 400 as const, style: 'normal' as const },
    { name: 'Inter', data: fontBold, weight: 700 as const, style: 'normal' as const },
    { name: 'Inter', data: fontExtra, weight: 800 as const, style: 'normal' as const },
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
  console.log('✅ Slide couverture générée (Scène aléatoire)');

  // ══════════════════════════════════════════════════════════════
  // SLIDES 1..N — FILMS  
  // ══════════════════════════════════════════════════════════════
  const maxFilmSlides = Math.min(films.length, INSTAGRAM.maxSlides - 1);

  for (let i = 0; i < maxFilmSlides; i++) {
    const film = films[i];
    const showtimeLabel = film.cinema[0]?.name + ' • ' + (film.cinema[0]?.showtimes[0] || '?');

    // Le filtre pour retirer Pathé/UGC est bien là !
    const passesList = film.cinema[0]?.passes?.filter((p: string) => !p.toLowerCase().includes('pathé') && !p.toLowerCase().includes('ugc')) || [];
    const passesLabel = passesList.length > 0 ? passesList.join(', ') : '';

    const slideSvg = await satori(
      <div style={{
        display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
        backgroundColor: '#0a0a0a', position: 'relative'
      }}>
        <img
          src={film.poster_url}
          style={{
            display: 'flex', position: 'absolute', top: 0, left: 0,
            width: '100%', height: '100%', objectFit: 'cover'
          }}
        />

        <div style={{
          display: 'flex', position: 'absolute', bottom: 0, left: 0,
          width: '100%', height: '70%',
          backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.95))'
        }} />

        <div style={{
          display: 'flex', position: 'absolute', top: '60px', left: '60px',
        }}>
          <span style={{ display: 'flex', color: WHITE, fontSize: 28, fontWeight: 800, letterSpacing: '0.1em', opacity: 0.8 }}>
            CINELYON.FR
          </span>
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          width: '100%', height: '100%', padding: '80px 60px', position: 'absolute',
        }}>

          <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '10px' }}>
            {film.title.toUpperCase().split(' ').map((word, idx, arr) => {
              const isLast = idx === arr.length - 1;
              const content = word + (isLast ? '' : '\u00A0');
              return (
                <div key={idx} style={{ display: 'flex', position: 'relative', marginBottom: '5px' }}>
                  <div style={{
                    display: 'flex', position: 'absolute', bottom: '-4px', left: 0, right: 0, height: '45%', backgroundColor: ACCENT
                  }} />
                  <h1 style={{ display: 'flex', color: WHITE, fontSize: 60, fontWeight: 800, lineHeight: 1.1, position: 'relative', margin: 0 }}>
                    {content}
                  </h1>
                </div>
              );
            })}
          </div>
          <span style={{ display: 'flex', color: '#CCCCCC', fontSize: 30, marginBottom: '40px' }}>
            de {film.director || 'Inconnu'} ({film.year})
          </span>



          <span style={{ display: 'flex', color: WHITE, fontSize: 50, fontWeight: 800, lineHeight: 1, marginBottom: passesLabel ? '30px' : '0px' }}>
            {showtimeLabel}
          </span>

          {passesLabel && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{
                display: 'flex', color: '#E0E0E0', fontSize: 26, fontWeight: 400,
                backgroundColor: 'rgba(255, 255, 255, 0.15)', padding: '12px 24px',
                borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                {passesLabel}
              </span>
            </div>
          )}
          {logoBase64 && (
            <img
              src={logoBase64}
              style={{ display: 'flex', position: 'absolute', bottom: '50px', right: '50px', width: 80, height: 80 }}
            />
          )}

        </div>
      </div>,
      { width: SLIDE.width, height: SLIDE.height, fonts: FONTS }
    );

    const slidePath = path.join(outputDir, `slide_${String(i + 1).padStart(2, '0')}.png`);
    renderToFile(slideSvg, slidePath);
    generatedPaths.push(slidePath);
    console.log(`✅ Slide film : ${film.title} générée`);
  }

  return generatedPaths;
}

if (process.argv[1] && process.argv[1].includes('03_generate_images.tsx')) {
  generateCarousel()
    .then(paths => console.log(`🚀 Total slides générées : ${paths.length}`))
    .catch(console.error);
}
