import * as fs from 'fs';
import * as path from 'path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import React from 'react';
import * as dotenv from 'dotenv';
import { EnrichedFilm } from './types';
import { COLORS } from './constants';

const dirname = process.cwd();
dotenv.config({ path: path.join(dirname, '../../.env') });

async function loadFont() {
  const fontUrl = 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff';
  const res = await fetch(fontUrl);
  return await res.arrayBuffer();
}

function formatDateFr(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
  return date.toLocaleDateString('fr-FR', options).toUpperCase();
}

async function getTmdbBackdrop(title: string, year: number): Promise<string> {
  const apiKey = process.env.TMDB_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(title)}&year=${year}`);
      const data = await res.json();
      if (data.results && data.results.length > 0 && data.results[0].backdrop_path) {
        return `https://image.tmdb.org/t/p/w1280${data.results[0].backdrop_path}`;
      }
    } catch (e) {
      console.warn("Erreur TMDB:", e);
    }
  }
  // Fallback si TMDB échoue
  return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1280&auto=format&fit=crop';
}

export async function generateCarousel(): Promise<string[]> {
  const inputPath = path.join(dirname, 'output', 'enriched_films.json');
  if (!fs.existsSync(inputPath)) throw new Error(`Fichier introuvable: ${inputPath}.`);

  const films: EnrichedFilm[] = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  if (films.length === 0) throw new Error("NO_FILMS_AVAILABLE");

  const targetDateObj = new Date(Date.now() + 86400000);
  const formattedDate = formatDateFr(targetDateObj);
  const fontData = await loadFont();

  const outputDir = path.join(dirname, 'output', 'slides');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const generatedPaths: string[] = [];

  // ==========================================
  // IMAGE 1 : COUVERTURE
  // ==========================================
  const firstFilm = films[0];
  const backdropUrl = await getTmdbBackdrop(firstFilm.title, firstFilm.year);

  const coverSvg = await satori(
    <div style={{
      display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
      backgroundColor: COLORS.background, color: COLORS.text,
      justifyContent: 'center', alignItems: 'center', padding: '40px',
      position: 'relative', overflow: 'hidden'
    }}>
      <img 
        src={backdropUrl}
        style={{
          display: 'flex', position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%', 
          objectFit: 'cover', opacity: 0.6
        }} 
      />
      {/* Overlay gradient pour lisibilité */}
      <div style={{
        display: 'flex', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)'
      }}></div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
        <span style={{ display: 'flex', fontSize: 50, fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>
          On regarde quoi à Lyon ?
        </span>
        <span style={{ display: 'flex', fontSize: 100, fontWeight: 800, color: COLORS.accent, marginBottom: '20px' }}>
          {formattedDate}
        </span>
      </div>

      <div style={{
        display: 'flex', position: 'absolute', bottom: '60px', flexDirection: 'column', alignItems: 'center'
      }}>
        <span style={{ display: 'flex', fontSize: 36, fontWeight: 800, letterSpacing: '4px' }}>CINELYON.FR</span>
      </div>
    </div>,
    {
      width: 1080, height: 1440, // Format 3:4 Instagram
      fonts: [
        { name: 'Inter', data: fontData, weight: 400, style: 'normal' },
        { name: 'Inter', data: fontData, weight: 800, style: 'normal' }
      ]
    }
  );

  const resvgCover = new Resvg(coverSvg, { fitTo: { mode: 'width', value: 1080 } });
  const coverBuffer = resvgCover.render().asPng();
  const coverPath = path.join(outputDir, 'slide_00.png');
  fs.writeFileSync(coverPath, coverBuffer);
  generatedPaths.push(coverPath);
  console.log('✅ Slide couverture générée');

  // ==========================================
  // IMAGES 2 A N : FILMS
  // ==========================================
  let index = 1;
  const maxInteractions = Math.min(films.length, 9);

  for (let i = 0; i < maxInteractions; i++) {
    const film = films[i];
    const showtimeLabel = film.cinema[0]?.name + ' • ' + (film.cinema[0]?.showtimes[0] || '?');
    const passesLabel = film.cinema[0]?.passes.length ? film.cinema[0].passes.join(', ') : '';

    const slideSvg = await satori(
      <div style={{
        display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
        backgroundColor: COLORS.background, color: COLORS.text, position: 'relative'
      }}>
        {/* Poster en haut (qui prend plus de place en 3:4) */}
        <div style={{ display: 'flex', width: '100%', height: '65%' }}>
          <img src={film.poster_url} style={{ display: 'flex', width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        {/* Détails en bas */}
        <div style={{ 
          display: 'flex', flexDirection: 'column', width: '100%', height: '35%', 
          padding: '50px 60px', justifyContent: 'center' 
        }}>
          <h1 style={{ display: 'flex', fontSize: 70, fontWeight: 800, lineHeight: 1.1, marginBottom: '15px' }}>
            {film.title.toUpperCase()}
          </h1>
          <p style={{ display: 'flex', fontSize: 35, color: COLORS.textSecondary, marginBottom: 'auto' }}>
            de {film.director || 'Inconnu'} ({film.year})
          </p>

          <div style={{ 
            display: 'flex', flexDirection: 'column', backgroundColor: '#1A1A1A',
            padding: '30px', borderRadius: '20px', borderLeft: `8px solid ${COLORS.accent}`
          }}>
            <span style={{ display: 'flex', fontSize: 30, color: COLORS.textSecondary, marginBottom: '10px' }}>PREMIÈRE SÉANCE :</span>
            <span style={{ display: 'flex', fontSize: 45, fontWeight: 800, color: '#FFFFFF' }}>{showtimeLabel}</span>
            {passesLabel && (
              <span style={{ display: 'flex', fontSize: 25, color: COLORS.accent, marginTop: '20px' }}>{passesLabel}</span>
            )}
          </div>
        </div>

        <div style={{
          display: 'flex', position: 'absolute', bottom: '30px', right: '40px', opacity: 0.5
        }}>
          <span style={{ display: 'flex', fontSize: 24, fontWeight: 800 }}>CINELYON.FR</span>
        </div>
      </div>,
      {
        width: 1080, height: 1440, // Format 3:4 Instagram
        fonts: [
          { name: 'Inter', data: fontData, weight: 400, style: 'normal' },
          { name: 'Inter', data: fontData, weight: 800, style: 'normal' }
        ]
      }
    );

    const resvgSlide = new Resvg(slideSvg, { fitTo: { mode: 'width', value: 1080 } });
    const slideBuffer = resvgSlide.render().asPng();
    const slidePath = path.join(outputDir, `slide_0${index}.png`);
    fs.writeFileSync(slidePath, slideBuffer);
    generatedPaths.push(slidePath);
    console.log(`✅ Slide film : ${film.title} générée`);
    index++;
  }

  return generatedPaths;
}

if (process.argv[1] && process.argv[1].includes('03_generate_images.tsx')) {
  generateCarousel()
    .then((paths) => console.log(`🚀 Total slides générées : ${paths.length}`))
    .catch(console.error);
}
