import * as fs from 'fs';
import * as path from 'path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import React from 'react';
import * as dotenv from 'dotenv';
import { Vibrant } from 'node-vibrant/node';
import sharp from 'sharp';
import * as cheerio from 'cheerio';

const dirname = process.cwd();
dotenv.config({ path: path.join(dirname, '.env'), quiet: true });

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG_COLOR = '#EFEBE6'; // Eggshell beige
const TEXT_DARK = '#2B2B2B'; // Anthracite gray
const ACCENT_RED_COVER = '#B22222'; // Dynamic color fallback
const SLIDE = { width: 1080, height: 1350 } as const;

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface EnrichedFilm {
  title: string;
  year?: number | string | null;
  director?: string | null;
  poster_url?: string | null;
  synopsis?: string | null;
  tmdb_id?: number | string | null;
  overview?: string | null;
  description?: string | null;
}

// ─── Helpers : Font loading ────────────────────────────────────────────────────
async function loadHelveticaNeue(variant: string) {
  return fs.promises.readFile(path.join(dirname, `static/font/HelveticaNeue_Helvetica Neue_${variant}.ttf`));
}

async function loadImpact() {
  return fs.promises.readFile(path.join(dirname, 'static/font/impact.ttf'));
}

// ─── Helpers : Image quality and hashing ──────────────────────────────────────
async function getDHashAndStats(imageUrl: string): Promise<{ hash: string; whitePercent: number; blackPercent: number; satPercent: number } | null> {
  try {
    const downloadUrl = imageUrl.includes('image.tmdb.org/t/p/original/')
      ? imageUrl.replace('/t/p/original/', '/t/p/w300/')
      : imageUrl;

    const res = await fetch(downloadUrl);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());

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

    if (whitePercent > 40) continue;
    if (blackPercent > 75) continue;
    if (satPercent > 35) continue;

    let isDuplicate = false;
    for (const acc of accepted) {
      const dist = getHammingDistance(hash, acc.hash);
      if (dist < 15) {
        isDuplicate = true;
        break;
      }
    }

    if (isDuplicate) continue;

    accepted.push({ url, hash });
    if (accepted.length === 3) break;
  }

  return accepted.map(a => a.url);
}

async function getFilmGrabImages(title: string, year?: number | null, director?: string | null): Promise<string[]> {
  try {
    const url = `https://film-grab.com/?s=${encodeURIComponent(title)}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);

    const results: { href: string; entryTitle: string }[] = [];
    $('.entry-title a').each((_, el) => {
      const href = $(el).attr('href');
      const entryTitle = $(el).text().trim();
      if (href) results.push({ href, entryTitle });
    });

    if (results.length === 0) return [];

    let bestResult = results[0];
    if (year || director) {
      const yearStr = year ? String(year) : null;
      const directorTokens = director
        ? director.toLowerCase().split(/\s+/).filter(t => t.length > 2)
        : [];

      let bestScore = -1;
      for (const r of results) {
        const haystack = (r.entryTitle + ' ' + r.href).toLowerCase();
        let score = 0;
        if (yearStr && haystack.includes(yearStr)) score += 2;
        if (directorTokens.length > 0 && directorTokens.some(t => haystack.includes(t))) score += 1;
        if (score > bestScore) {
          bestScore = score;
          bestResult = r;
        }
      }

      if (bestScore <= 0) {
        return [];
      }
    }

    const postRes = await fetch(bestResult.href);
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
    return [];
  }
}

function getShortSynopsis(text: string, maxLength: number = 220): string {
  if (!text) return "";
  let clean = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;

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

  const toleranceLimit = maxLength + 40;
  if (sentenceEnds.length > 0 && sentenceEnds[0] <= toleranceLimit) {
    return clean.slice(0, sentenceEnds[0]).trim();
  }

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
    let tmdbId: number | null = film.tmdb_id ? Number(film.tmdb_id) : null;
    let tmdbOverview: string | null = null;
    let originalTitle: string = film.title;
    let fallbackTmdbScenes: string[] = [];

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

        const imagesRes = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/images?api_key=${apiKey}`);
        const imagesData = await imagesRes.json();
        if (imagesData.backdrops && imagesData.backdrops.length > 0) {
          let textless = imagesData.backdrops.filter((b: any) => b.iso_639_1 === null && (b.aspect_ratio || 0) >= 1.3);
          fallbackTmdbScenes = textless.map((b: any) => `https://image.tmdb.org/t/p/original${b.file_path}`);
        }
      } catch (err) {
        // Silent error
      }
    }

    const filmYear = film.year ? Number(film.year) : null;
    const filmDirector = film.director || null;
    let fgScenes = await getFilmGrabImages(originalTitle, filmYear, filmDirector);
    
    if (fgScenes.length === 0 && originalTitle !== film.title) {
      fgScenes = await getFilmGrabImages(film.title, filmYear, filmDirector);
    }

    let backdrops: string[] = [];
    if (fgScenes.length > 0) {
      backdrops = await filterUniqueScenes(fgScenes);
    }

    if (backdrops.length < 3 && fallbackTmdbScenes.length > 0) {
      const tmdbFiltered = await filterUniqueScenes(fallbackTmdbScenes);
      if (tmdbFiltered.length >= 3 || tmdbFiltered.length > backdrops.length) {
        backdrops = tmdbFiltered;
      }
    }

    return { scenes: backdrops.slice(0, 3), posterUrl, synopsis: tmdbOverview || film.synopsis || null };

  } catch (e) {
    // Silent
  }

  return { scenes: [], posterUrl, synopsis: film.synopsis || null };
}

const TRANSPARENT_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

async function getBase64Image(imageUrl: string): Promise<string> {
  if (!imageUrl) return TRANSPARENT_PIXEL;
  try {
    const downloadUrl = imageUrl.includes('image.tmdb.org/t/p/original/')
      ? imageUrl.replace('/t/p/original/', '/t/p/w780/')
      : imageUrl;

    const res = await fetch(downloadUrl);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());

    const convertedBuffer = await sharp(buffer)
      .jpeg({ quality: 85 })
      .toBuffer();

    return `data:image/jpeg;base64,${convertedBuffer.toString('base64')}`;
  } catch (e) {
    return TRANSPARENT_PIXEL;
  }
}

async function getDominantColor(imageUrl: string): Promise<string> {
  try {
    const base64 = await getBase64Image(imageUrl);
    if (!base64 || base64 === TRANSPARENT_PIXEL) return ACCENT_RED_COVER;

    const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    const palette = await Vibrant.from(buffer).getPalette();
    
    if (palette.DarkVibrant) return palette.DarkVibrant.hex;
    if (palette.Vibrant) return palette.Vibrant.hex;
    return ACCENT_RED_COVER;
  } catch (error) {
    return ACCENT_RED_COVER;
  }
}

// ─── Main Generation Function ──────────────────────────────────────────────────
async function generateSingleStory(film: EnrichedFilm): Promise<Buffer> {
  const [fontReg, fontBold, fontBoldItalic, fontImpact] = await Promise.all([
    loadHelveticaNeue('Regular'),
    loadHelveticaNeue('Bold'),
    loadHelveticaNeue('Bold Italic'),
    loadImpact()
  ]);

  const FONTS = [
    { name: 'Helvetica Neue', data: fontReg, weight: 400 as const, style: 'normal' as const },
    { name: 'Helvetica Neue', data: fontBold, weight: 700 as const, style: 'normal' as const },
    { name: 'Helvetica Neue', data: fontBoldItalic, weight: 700 as const, style: 'italic' as const },
    { name: 'Impact', data: fontImpact, weight: 400 as const, style: 'normal' as const },
  ];

  // Fetch backdrop scenes (collage images)
  const { scenes, posterUrl, synopsis: fetchedSynopsis } = await getMovieBackdrops(film);
  const rawMainImage   = scenes[0] ?? posterUrl ?? '';
  const rawSecondImage = scenes.length >= 2 ? scenes[1] : (scenes.length === 1 ? posterUrl : null);
  const rawThirdImage  = scenes.length >= 3 ? scenes[2] : (scenes.length === 2 ? posterUrl : null);

  const dynamicTitleColor = await getDominantColor(rawMainImage);

  // Convert to base64
  const mainImage   = await getBase64Image(rawMainImage);
  const secondImage = rawSecondImage ? await getBase64Image(rawSecondImage) : null;
  const thirdImage  = rawThirdImage ? await getBase64Image(rawThirdImage) : null;
  
  const rawSynopsis = fetchedSynopsis || film.synopsis || film.overview || film.description || "";
  const synopsis = getShortSynopsis(rawSynopsis, 220);
  const directorName = film.director || "INCONNU";
  const releaseYear = film.year ? film.year : new Date().getFullYear();
  const formattedTitle = film.title.toUpperCase();

  // Layout A1 matching exactly the code of generate_images.tsx
  const lineClamp = 10;
  const synopsisStyle = {
    display: '-webkit-box' as const, WebkitLineClamp: lineClamp, WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 38, fontWeight: 700,
    color: TEXT_DARK, lineHeight: 1.12, textTransform: 'uppercase' as const,
    fontFamily: 'Impact', letterSpacing: '-0.02em', transformOrigin: 'top left',
    paddingLeft: '5px', paddingRight: '5px'
  };

  const collageContent = (
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

  const slideSvg = await satori(
    <div style={{
      display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
      backgroundColor: BG_COLOR, padding: '50px 50px 30px 50px', boxSizing: 'border-box'
    }}>
      
      {collageContent}

      <div style={{ 
        display: 'flex', flex: 1, flexDirection: 'column', 
        justifyContent: 'flex-end', alignItems: 'center',
        paddingBottom: '5px'
      }}>
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

  const buffer = new Resvg(slideSvg, { fitTo: { mode: 'width', value: SLIDE.width } }).render().asPng();
  return buffer;
}

// ─── Process Stdin ─────────────────────────────────────────────────────────────
let inputData = '';
process.stdin.on('data', chunk => {
  inputData += chunk;
});

process.stdin.on('end', async () => {
  try {
    const film = JSON.parse(inputData);
    const buffer = await generateSingleStory(film);
    process.stdout.write(buffer, () => {
      process.exit(0);
    });
  } catch (err) {
    console.error('Error generating single story:', err);
    process.exit(1);
  }
});
