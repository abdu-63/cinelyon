# Fonctionnalité : Génération d'image Story Instagram

> **Statut** : Désactivée temporairement (non compatible Vercel/serverless Python)
> 
> **Raison de la désactivation** : La génération utilise un subprocess `npx ts-node` qui n'est pas disponible dans l'environnement d'exécution Python de Vercel.
>
> **Objectif futur** : Réécrire en Python pur (Pillow) pour que ça fonctionne en production Vercel.

---

## Architecture originale (ce qui a été supprimé)

### Flux complet

```
iPhone clique "Story"
  → film.js : loadStoryImage() → fetch("/film/<slug>/story.png")
    → app.py : route film_story_image()
      → subprocess.Popen("npx ts-node scripts/instagram/generate_single_story.tsx")
        → stdin: JSON du film
        → stdout: buffer PNG binaire
      → Flask retourne le PNG (Content-Type: image/png)
    → blob URL créé depuis le PNG reçu
  → navigator.share({ files: [pngFile] })  [iOS natif]
  → OU modal "Partager la Story" avec téléchargement [desktop/fallback]
```

### Pourquoi ça marchait en local et pas en prod

Le serveur de dev local (`python app.py`) a accès à `npx` car Node.js est installé sur le Mac.
Sur Vercel (serverless), l'environnement Python ne dispose pas de Node.js — `subprocess.Popen` lève `FileNotFoundError: [Errno 2] No such file or directory: 'npx'` et retourne une erreur HTTP 500.

---

## Code supprimé à réimplémenter

### 1. Route Flask — `app.py`

Emplacement original : **ligne 631** de `app.py`, juste avant la route `/suggestions`.

```python
@app.route("/film/<slug>/story.png")
def film_story_image(slug):
    """Génère l'image de story Instagram pour un film en appelant le script Satori Node."""
    import subprocess
    import json

    data = load_movies_data()
    showtimes = data["showtimes"]
    num_days = data["num_days"]

    # Trouver le film correspondant au slug
    film_data = None
    for day_index in range(num_days):
        if day_index >= len(showtimes):
            continue
        for film in showtimes[day_index]:
            film_slug = slugify(film["title"], film.get("release_year", ""))
            if film_slug == slug:
                film_data = {
                    "title": film["title"],
                    "year": film.get("release_year") or film.get("year"),
                    "director": film.get("director") or film.get("realisateur") or "INCONNU",
                    "poster_url": film.get("affiche"),
                    "synopsis": film.get("synopsis") or "",
                    "tmdb_id": film.get("tmdb_id"),
                }
                break
        if film_data:
            break

    if not film_data:
        abort(404)

    try:
        env = os.environ.copy()
        proc = subprocess.Popen(
            ["npx", "ts-node", "scripts/instagram/generate_single_story.tsx"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
        )

        input_json = json.dumps(film_data).encode("utf-8")
        stdout_data, stderr_data = proc.communicate(input=input_json)

        if proc.returncode != 0:
            app.logger.error(f"Satori story generator error: {stderr_data.decode('utf-8')}")
            abort(500)

        response = make_response(stdout_data)
        response.headers.set("Content-Type", "image/png")
        response.headers.set("Cache-Control", "public, max-age=86400")
        return response
    except Exception as e:
        app.logger.error(f"Exception during single story generation: {str(e)}")
        abort(500)
```

### 2. Bouton HTML — `templates/film.html`

Emplacement original : **ligne 91** de `film.html`, dans la section des boutons du héros film.

```html
<button type="button" class="film-link-btn film-share-img-btn" id="shareImgBtn" title="Partager une image">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" class="film-link-logo">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
    <span id="shareImgText">Story</span>
</button>
```

### 3. JavaScript côté client — `static/js/film.js`

Emplacement original : **lignes 288–454** de `film.js`, dans le bloc `DOMContentLoaded` de `// ── Share features ──`.

```javascript
let preloadedFile = null;
let preloadPromise = null;  // Shared promise — prevents duplicate fetches

const getStoryUrl = () => window.location.pathname.endsWith('/') 
    ? window.location.pathname + 'story.png' 
    : window.location.pathname + '/story.png';

const loadStoryImage = () => {
    if (preloadedFile) return Promise.resolve(preloadedFile);
    if (preloadPromise) return preloadPromise;

    preloadPromise = (async () => {
        try {
            const response = await fetch(getStoryUrl());
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const blob = await response.blob();
            preloadedFile = new File([blob], 'cinelyon_share.png', { type: 'image/png' });
            return preloadedFile;
        } catch (e) {
            console.warn('Error loading story image:', e);
            preloadPromise = null; // Allow retry on next click
            return null;
        }
    })();

    return preloadPromise;
};

// Start preloading immediately in the background (non-blocking)
loadStoryImage();

// Modal HTML (créé dynamiquement)
let storyModalOverlay = document.getElementById('storyModalOverlay');
if (!storyModalOverlay) {
    storyModalOverlay = document.createElement('div');
    storyModalOverlay.id = 'storyModalOverlay';
    storyModalOverlay.className = 'story-modal-overlay';
    storyModalOverlay.innerHTML = `
        <div class="story-modal">
            <button class="story-modal-close" aria-label="Fermer">&times;</button>
            <h3 class="story-modal-title">Partager la Story</h3>
            <div class="story-modal-img-container">
                <div class="story-modal-spinner"></div>
                <img class="story-modal-img" alt="Aperçu Story" style="display: none;" />
            </div>
            <p class="story-modal-instructions">
                Appuyez longuement sur l'image pour <strong>l'enregistrer</strong> ou la <strong>copier</strong>, puis partagez-la sur Instagram.
            </p>
            <div class="story-modal-actions">
                <a class="story-modal-btn story-modal-btn-download" download="cinelyon_story.png" href="#">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16" style="display: inline-block; vertical-align: middle;">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                    </svg>
                    Télécharger
                </a>
                <button class="story-modal-btn story-modal-btn-close">Fermer</button>
            </div>
        </div>
    `;
    document.body.appendChild(storyModalOverlay);

    const closeBtn = storyModalOverlay.querySelector('.story-modal-close');
    const actionCloseBtn = storyModalOverlay.querySelector('.story-modal-btn-close');
    const closeStoryModal = () => storyModalOverlay.classList.remove('show');
    closeBtn.addEventListener('click', closeStoryModal);
    actionCloseBtn.addEventListener('click', closeStoryModal);
    storyModalOverlay.addEventListener('click', (e) => {
        if (e.target === storyModalOverlay) closeStoryModal();
    });
}

const showStoryModal = (imageSrcOrBlobUrl) => {
    const img = storyModalOverlay.querySelector('.story-modal-img');
    const spinner = storyModalOverlay.querySelector('.story-modal-spinner');
    const downloadBtn = storyModalOverlay.querySelector('.story-modal-btn-download');
    const container = storyModalOverlay.querySelector('.story-modal-img-container');

    // Reset previous state
    img.onload = null;
    img.onerror = null;
    img.src = '';
    img.style.display = 'none';
    spinner.style.display = 'block';
    downloadBtn.href = '#';
    container.querySelectorAll('.story-error-msg').forEach(el => el.remove());
    storyModalOverlay.classList.add('show');

    const displayImage = (src) => {
        img.onload = () => { img.style.display = 'block'; spinner.style.display = 'none'; };
        img.onerror = () => {
            spinner.style.display = 'none';
            const errMsg = document.createElement('p');
            errMsg.className = 'story-error-msg';
            errMsg.textContent = "Impossible d'afficher l'image. Veuillez réessayer.";
            errMsg.style.cssText = 'color:#ff6b81; font-size:0.9rem; text-align:center; padding:16px;';
            container.appendChild(errMsg);
        };
        img.src = src;
        downloadBtn.href = src;
    };

    if (imageSrcOrBlobUrl) {
        displayImage(imageSrcOrBlobUrl);
    } else {
        loadStoryImage().then(file => {
            if (!file) {
                spinner.style.display = 'none';
                const errMsg = document.createElement('p');
                errMsg.className = 'story-error-msg';
                errMsg.textContent = "Impossible de générer l'image de story. Veuillez réessayer.";
                errMsg.style.cssText = 'color:#ff6b81; font-size:0.9rem; text-align:center; padding:16px;';
                container.appendChild(errMsg);
                return;
            }
            const blobUrl = URL.createObjectURL(file);
            displayImage(blobUrl);
        });
    }
};

// Click handler — CRITICAL: must be synchronous for iOS 15 navigator.share
if (shareImgBtn) {
    shareImgBtn.addEventListener('click', () => {
        if (preloadedFile) {
            const shareData = { files: [preloadedFile] };
            if (navigator.canShare && navigator.canShare(shareData)) {
                navigator.share(shareData)
                    .then(() => { /* shared */ })
                    .catch(err => {
                        if (err.name === 'AbortError') return;
                        console.warn('Native share failed, showing modal:', err);
                        const blobUrl = URL.createObjectURL(preloadedFile);
                        showStoryModal(blobUrl);
                    });
                return;
            }
            const blobUrl = URL.createObjectURL(preloadedFile);
            showStoryModal(blobUrl);
        } else {
            showStoryModal(null);
        }
    });
}
```

### 4. Styles CSS — `static/css/main.css`

Les classes suivantes **existent toujours** dans `main.css` (L3289–3462) et n'ont pas été supprimées car elles seront réutilisées telles quelles lors de la réimplémentation :

```css
/* --- Story Share Fallback Modal --- */
.story-modal-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    z-index: 10100;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.story-modal-overlay.show {
    display: flex;
    opacity: 1;
}

.story-modal {
    background: var(--card-solid);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    padding: 24px;
    max-width: 440px;
    width: 90%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
    transform: translateY(30px) scale(0.95);
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-sizing: border-box;
}

.story-modal-overlay.show .story-modal {
    transform: translateY(0) scale(1);
}

.story-modal-close {
    position: absolute;
    top: 16px;
    right: 16px;
    background: rgba(120, 120, 120, 0.15);
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-main);
    font-size: 20px;
    cursor: pointer;
    z-index: 10;
    transition: background 0.2s, transform 0.2s;
}

.story-modal-close:hover {
    background: rgba(120, 120, 120, 0.3);
    transform: scale(1.08);
}

.story-modal-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-main);
    margin: 0 0 12px 0;
    text-align: center;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}

.story-modal-img-container {
    width: 100%;
    aspect-ratio: 4 / 5;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    border: 1px solid var(--border-light);
}

.story-modal-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    user-select: none;
    -webkit-user-drag: none;
}

.story-modal-spinner {
    position: absolute;
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.1);
    border-top: 4px solid var(--primary);
    border-radius: 50%;
    animation: storySpin 1s linear infinite;
    z-index: 2;
}

@keyframes storySpin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.story-modal-instructions {
    margin-top: 16px;
    text-align: center;
    font-size: 0.9rem;
    line-height: 1.4;
    color: var(--text-muted);
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    padding: 0 8px;
}

.story-modal-instructions strong {
    color: var(--primary);
}

.story-modal-actions {
    display: flex;
    gap: 12px;
    width: 100%;
    margin-top: 20px;
}

.story-modal-btn {
    flex: 1;
    padding: 12px 16px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.95rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}

.story-modal-btn-download {
    background: var(--primary);
    color: white;
    border: none;
}

.story-modal-btn-download:hover {
    background: var(--primary-hover);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(68, 76, 247, 0.2);
}

.story-modal-btn-close {
    background: var(--border-light);
    color: var(--text-main);
    border: 1px solid var(--border-color);
}

.story-modal-btn-close:hover {
    background: var(--border-color);
}
```

### 5. Service Worker — `static/sw.js`

La règle suivante **existe toujours** dans `sw.js` (~L62) et doit être conservée :
```javascript
// Ignorer les requêtes vers l'image de story dynamique (générée à la volée, non mise en cache)
if (url.pathname.endsWith('/story.png')) return;
```

---

## Script Node.js original — `scripts/instagram/generate_single_story.tsx`

> **Ce fichier est conservé dans le dépôt.** Il n'a pas été supprimé car il sert de référence pour la réimplémentation Python. Il est dans `scripts/instagram/` avec ses `node_modules` et son `package.json`.

### Configuration Node.js — `scripts/instagram/package.json`

```json
{
  "dependencies": {
    "@resvg/resvg-js": "^2.6.2",
    "@supabase/supabase-js": "^2.101.1",
    "@types/react": "^19.2.14",
    "cheerio": "^1.2.0",
    "dotenv": "^17.4.1",
    "node-vibrant": "^4.0.4",
    "playwright": "^1.59.1",
    "react": "^19.2.4",
    "satori": "^0.26.0",
    "sharp": "^0.34.5",
    "ts-node": "^10.9.2",
    "typescript": "^6.0.2"
  },
  "devDependencies": {
    "@types/node": "^25.5.2"
  }
}
```

### `scripts/instagram/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "commonjs",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": false,
    "skipLibCheck": true,
    "jsx": "react",
    "types": ["node"]
  }
}
```

### Code complet — `generate_single_story.tsx`

```tsx
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
      if (brightness > 240) whiteCount++;
      else if (brightness < 15) blackCount++;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      if (sat > 0.7 && max > 100) highSatCount++;
    }

    return {
      hash,
      whitePercent: (whiteCount / totalPixels) * 100,
      blackPercent: (blackCount / totalPixels) * 100,
      satPercent: (highSatCount / totalPixels) * 100
    };
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
      if (getHammingDistance(hash, acc.hash) < 15) { isDuplicate = true; break; }
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
    const res = await fetchWithRetry(url);
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
    let bestScore = -1;
    if (year || director) {
      const yearStr = year ? String(year) : null;
      const directorTokens = director
        ? director.toLowerCase().split(/\s+/).filter(t => t.length > 2)
        : [];
      for (const r of results) {
        const haystack = (r.entryTitle + ' ' + r.href).toLowerCase();
        let score = 0;
        if (yearStr && haystack.includes(yearStr)) score += 2;
        if (directorTokens.some(t => haystack.includes(t))) score += 1;
        if (score > bestScore) { bestScore = score; bestResult = r; }
      }
    }

    const postRes = await fetchWithRetry(bestResult.href);
    if (!postRes.ok) return [];
    const $post = cheerio.load(await postRes.text());

    // Si on a des critères (year ou director) mais que le score de la recherche était <= 0,
    // on valide l'identité du film par le contenu textuel de la page.
    if ((year || director) && bestScore <= 0) {
      const pageText = $post('body').text().toLowerCase();
      const yearStr = year ? String(year) : null;
      const directorTokens = director
        ? director.toLowerCase().split(/\s+/).filter(t => t.length > 2)
        : [];

      let confirmed = false;
      if (yearStr && pageText.includes(yearStr)) confirmed = true;
      if (directorTokens.length > 0 && directorTokens.some(t => pageText.includes(t))) confirmed = true;

      if (!confirmed) {
        console.warn(`   ⚠️  Film-Grab : Page trouvée pour "${bestResult.entryTitle}" mais le contenu ne correspond pas à l'année/réalisateur (${year ?? '?'} / ${director ?? '?'}). Rejet.`);
        return [];
      }
    }
    const images: string[] = [];
    $post('.bwg-masonry-thumb, .bwg-item img, img.size-full, .gallery-item img, figure img').each((i, el) => {
      let src = $post(el).closest('a').attr('href') || $post(el).attr('src') || $post(el).attr('data-src');
      if (src) {
        if (src.includes('/thumb/')) src = src.replace('/thumb/', '/').split('?')[0];
        images.push(src);
      }
    });
    if (images.length === 0) {
      $post('.entry-content img').each((i, el) => {
        const src = $post(el).closest('a').attr('href') || $post(el).attr('src');
        if (src) images.push(src);
      });
    }
    return images;
  } catch (e) {
    return [];
  }
}

function getShortSynopsis(text: string, maxLength = 220): string {
  if (!text) return '';
  let clean = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  const sentenceEndings = /([.!?])\s+/g;
  let match;
  const sentenceEnds: number[] = [];
  while ((match = sentenceEndings.exec(clean)) !== null) sentenceEnds.push(match.index + match[1].length);
  if (clean.length > (sentenceEnds[sentenceEnds.length - 1] ?? 0)) sentenceEnds.push(clean.length);
  let bestEnd = -1;
  for (const endIdx of sentenceEnds) {
    if (endIdx <= maxLength) bestEnd = endIdx; else break;
  }
  if (bestEnd > 0) return clean.slice(0, bestEnd).trim();
  if (sentenceEnds.length > 0 && sentenceEnds[0] <= maxLength + 40) return clean.slice(0, sentenceEnds[0]).trim();
  const lastSpace = clean.lastIndexOf(' ', maxLength - 3);
  return lastSpace > 0 ? clean.slice(0, lastSpace).trim() + '...' : clean.slice(0, maxLength - 3) + '...';
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
      const searchRes = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(film.title.trim())}${film.year ? `&year=${film.year}` : ''}&language=fr-FR`);
      const searchData = await searchRes.json();
      if (searchData.results?.length > 0) tmdbId = searchData.results[0].id;
    }

    if (tmdbId) {
      const movieDetails = await (await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}&language=fr-FR`)).json();
      tmdbOverview = movieDetails.overview || null;
      if (movieDetails.original_title) originalTitle = movieDetails.original_title;
      if (!tmdbOverview) {
        const enDetails = await (await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}&language=en-US`)).json();
        tmdbOverview = enDetails.overview || null;
      }
      const imagesData = await (await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/images?api_key=${apiKey}`)).json();
      if (imagesData.backdrops?.length > 0) {
        fallbackTmdbScenes = imagesData.backdrops
          .filter((b: any) => b.iso_639_1 === null && (b.aspect_ratio || 0) >= 1.3)
          .map((b: any) => `https://image.tmdb.org/t/p/original${b.file_path}`);
      }
    }

    let fgScenes = await getFilmGrabImages(originalTitle, film.year ? Number(film.year) : null, film.director || null);
    if (fgScenes.length === 0 && originalTitle !== film.title)
      fgScenes = await getFilmGrabImages(film.title, film.year ? Number(film.year) : null, film.director || null);

    let backdrops: string[] = fgScenes.length > 0 ? await filterUniqueScenes(fgScenes) : [];
    if (backdrops.length < 3 && fallbackTmdbScenes.length > 0) {
      const tmdbFiltered = await filterUniqueScenes(fallbackTmdbScenes);
      if (tmdbFiltered.length >= 3 || tmdbFiltered.length > backdrops.length) backdrops = tmdbFiltered;
    }

    return { scenes: backdrops.slice(0, 3), posterUrl, synopsis: tmdbOverview || film.synopsis || null };
  } catch (e) {}

  return { scenes: [], posterUrl, synopsis: film.synopsis || null };
}

const TRANSPARENT_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

async function getBase64Image(imageUrl: string): Promise<string> {
  if (!imageUrl) return TRANSPARENT_PIXEL;
  try {
    const downloadUrl = imageUrl.includes('image.tmdb.org/t/p/original/')
      ? imageUrl.replace('/t/p/original/', '/t/p/w780/')
      : imageUrl;
    const buffer = Buffer.from(await (await fetch(downloadUrl)).arrayBuffer());
    return `data:image/jpeg;base64,${(await sharp(buffer).jpeg({ quality: 85 }).toBuffer()).toString('base64')}`;
  } catch (e) {
    return TRANSPARENT_PIXEL;
  }
}

async function getDominantColor(imageUrl: string): Promise<string> {
  try {
    const base64 = await getBase64Image(imageUrl);
    if (!base64 || base64 === TRANSPARENT_PIXEL) return ACCENT_RED_COVER;
    const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    const palette = await Vibrant.from(buffer).getPalette();
    return palette.DarkVibrant?.hex || palette.Vibrant?.hex || ACCENT_RED_COVER;
  } catch {
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

  const { scenes, posterUrl, synopsis: fetchedSynopsis } = await getMovieBackdrops(film);
  const rawMainImage   = scenes[0] ?? posterUrl ?? '';
  const rawSecondImage = scenes.length >= 2 ? scenes[1] : (scenes.length === 1 ? posterUrl : null);
  const rawThirdImage  = scenes.length >= 3 ? scenes[2] : (scenes.length === 2 ? posterUrl : null);

  const dynamicTitleColor = await getDominantColor(rawMainImage);
  const mainImage   = await getBase64Image(rawMainImage);
  const secondImage = rawSecondImage ? await getBase64Image(rawSecondImage) : null;
  const thirdImage  = rawThirdImage ? await getBase64Image(rawThirdImage) : null;

  const synopsis = getShortSynopsis(fetchedSynopsis || film.synopsis || film.overview || film.description || '', 220);
  const formattedTitle = film.title.toUpperCase();
  const directorName = film.director || 'INCONNU';
  const releaseYear = film.year ?? new Date().getFullYear();

  const synopsisStyle = {
    display: '-webkit-box' as const, WebkitLineClamp: 10, WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 38, fontWeight: 700,
    color: TEXT_DARK, lineHeight: 1.12, textTransform: 'uppercase' as const,
    fontFamily: 'Impact', letterSpacing: '-0.02em', transformOrigin: 'top left',
    paddingLeft: '5px', paddingRight: '5px'
  };

  const slideSvg = await satori(
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: BG_COLOR, padding: '50px 50px 30px 50px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '920px' }}>
        <div style={{ display: 'flex', width: '55%', flexDirection: 'column', paddingRight: '15px' }}>
          <img src={mainImage} style={{ width: '100%', height: secondImage ? '600px' : '920px', objectFit: 'cover', marginBottom: secondImage ? '30px' : '0', border: '2px solid #2B2B2B', boxSizing: 'border-box' }} />
          {secondImage && <img src={secondImage} style={{ width: '100%', height: '290px', objectFit: 'cover', border: '2px solid #2B2B2B', boxSizing: 'border-box' }} />}
        </div>
        <div style={{ display: 'flex', width: '45%', flexDirection: 'column', paddingLeft: '15px' }}>
          {thirdImage ? <img src={thirdImage} style={{ width: '100%', height: '430px', objectFit: 'cover', marginBottom: '30px', border: '2px solid #2B2B2B', boxSizing: 'border-box' }} /> : null}
          <div style={{ ...synopsisStyle, height: '460px' }}>{synopsis}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: '5px' }}>
        <h1 style={{ display: 'flex', fontFamily: 'Impact', color: dynamicTitleColor, fontSize: formattedTitle.length >= 20 ? 95 : formattedTitle.length >= 14 ? 115 : formattedTitle.length >= 10 ? 135 : 160, fontWeight: 400, lineHeight: 0.9, margin: 0, letterSpacing: '-0.03em', textAlign: 'center', transform: 'scaleY(1.4)' }}>
          {formattedTitle}
        </h1>
        <span style={{ display: 'flex', color: TEXT_DARK, fontSize: 32, fontWeight: 700, marginTop: '40px', letterSpacing: '0.02em', textTransform: 'uppercase', textAlign: 'center', fontFamily: 'Impact', transform: 'scaleY(1.4)' }}>
          DIRECTED BY {directorName} ({releaseYear})
        </span>
        <span style={{ display: 'flex', color: TEXT_DARK, fontSize: 22, fontWeight: 400, marginTop: '20px', letterSpacing: '0.15em', opacity: 0.5, textTransform: 'uppercase', fontFamily: 'Helvetica Neue' }}>
          CINELYON.FR
        </span>
      </div>
    </div>,
    { width: SLIDE.width, height: SLIDE.height, fonts: FONTS }
  );

  return new Resvg(slideSvg, { fitTo: { mode: 'width', value: SLIDE.width } }).render().asPng();
}

// ─── Process Stdin ─────────────────────────────────────────────────────────────
let inputData = '';
process.stdin.on('data', chunk => { inputData += chunk; });
process.stdin.on('end', async () => {
  try {
    const film = JSON.parse(inputData);
    const buffer = await generateSingleStory(film);
    process.stdout.write(buffer, () => process.exit(0));
  } catch (err) {
    console.error('Error generating single story:', err);
    process.exit(1);
  }
});
```

---

## Plan de réimplémentation en Python (Pillow)

### Dépendances à ajouter dans `requirements.txt`

```
Pillow>=10.0.0
requests>=2.32.0   # déjà présent
```

Optionnel pour la couleur dominante du titre :
```
colorthief>=0.2.1
```

### Étapes à implémenter

1. **Charger les fonts TTF** avec `ImageFont.truetype()` depuis `static/font/`

2. **Récupérer les images de scènes** :
   - Appel TMDB API pour les backdrops (déjà dans le code Python en partie)
   - Scraping film-grab.com via `requests` + `BeautifulSoup`
   - Filtre anti-doublons dHash en Python (imagehash ou implémentation custom)

3. **Couleur dominante** : via `colorthief` ou `Pillow` en calculant le pixel le plus fréquent

4. **Composer l'image** :
   ```python
   from PIL import Image, ImageDraw, ImageFont

   SLIDE_W, SLIDE_H = 1080, 1350
   BG_COLOR = "#EFEBE6"
   TEXT_DARK = "#2B2B2B"

   canvas = Image.new("RGB", (SLIDE_W, SLIDE_H), BG_COLOR)
   draw = ImageDraw.Draw(canvas)

   # Coller les 3 images de scènes (collage)
   # Dessiner le synopsis en uppercase (gestion wrapping manuel)
   # Dessiner le titre avec Impact (grande taille)
   # Dessiner "DIRECTED BY X (YEAR)" + "CINELYON.FR"

   import io

   buf = io.BytesIO()
   canvas.save(buf, format="PNG")
   return buf.getvalue()
   ```

5. **Route Flask** : même signature que celle supprimée, remplacer l'appel subprocess par la fonction Python.

### Ressources utiles

- [Pillow docs — ImageFont](https://pillow.readthedocs.io/en/stable/reference/ImageFont.html)
- [Pillow docs — ImageDraw](https://pillow.readthedocs.io/en/stable/reference/ImageDraw.html)
- [colorthief-py](https://github.com/fengsp/color-thief-py) pour la couleur dominante
- [imagehash](https://github.com/JohannesBuchner/imagehash) pour le filtre de doublons dHash

---

## Données JSON envoyées au script (interface)

```json
{
  "title": "Interstellar",
  "year": 2014,
  "director": "Christopher Nolan",
  "poster_url": "https://image.tmdb.org/t/p/original/...",
  "synopsis": "Dans un futur proche...",
  "tmdb_id": 157336
}
```

Ces données sont disponibles dans `app.py` via `load_movies_data()` et la recherche par `slug`.

