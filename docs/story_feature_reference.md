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
            env=env
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

Les classes suivantes existent déjà dans `main.css` (ne pas les supprimer, elles sont préservées) :
- `.story-modal-overlay`
- `.story-modal`
- `.story-modal-close`
- `.story-modal-title`
- `.story-modal-img-container`
- `.story-modal-spinner`
- `.story-modal-img`
- `.story-modal-instructions`
- `.story-modal-actions`
- `.story-modal-btn`
- `.story-modal-btn-download`
- `.story-modal-btn-close`

### 5. Service Worker — `static/sw.js`

La règle suivante existe déjà dans `sw.js` et doit être conservée (ligne ~62) :
```javascript
// Ignorer les requêtes vers l'image de story dynamique (générée à la volée, non mise en cache)
if (url.pathname.endsWith('/story.png')) return;
```

---

## Script Node.js original (conservé dans le dépôt)

Le script complet est conservé à : `scripts/instagram/generate_single_story.tsx`

Ce script reçoit un JSON via `stdin` et écrit un PNG via `stdout`.

### Ce que fait le script

1. **Charge les fonts** depuis `static/font/` :
   - `HelveticaNeue_Helvetica Neue_Regular.ttf`
   - `HelveticaNeue_Helvetica Neue_Bold.ttf`
   - `HelveticaNeue_Helvetica Neue_Bold Italic.ttf`
   - `impact.ttf`

2. **Récupère les images du film** via :
   - [film-grab.com](https://film-grab.com) (scraping Cheerio) — images de scènes HD
   - TMDB API (backdrops textless) — fallback si film-grab ne trouve rien
   - Filtrage dHash pour éliminer les doublons et images trop blanches/noires

3. **Calcule la couleur dominante** du titre via `node-vibrant` sur l'image principale

4. **Génère le SVG** avec [Satori](https://github.com/vercel/satori) (JSX → SVG, dimensions 1080×1350px)

5. **Convertit en PNG** avec `@resvg/resvg-js`

### Design de l'image générée

- Fond : `#EFEBE6` (beige crème)
- Texte : `#2B2B2B` (gris anthracite)
- Dimensions : **1080 × 1350 px** (format 4:5 Instagram Story/Post)
- Layout : collage 3 images en 2 colonnes + synopsis uppercase + titre Impact + "DIRECTED BY X (YEAR)" + "CINELYON.FR"

```
┌─────────────────────────────┐
│  [Image 1 55%] [Image 3 45%]│
│  [Image 1 55%] [Synopsis   ]│  ← 920px de haut
│  [Image 2 55%] [           ]│
├─────────────────────────────┤
│         TITRE DU FILM       │  ← Police Impact, couleur dynamique
│   DIRECTED BY X (ANNÉE)     │  ← Impact, uppercase
│        CINELYON.FR          │  ← Petite police, opacité 50%
└─────────────────────────────┘
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
   
   # Retourner en PNG
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
