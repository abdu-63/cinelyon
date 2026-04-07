# 🎬 Plan d'Implémentation — Automatisation Instagram Ciné Lyon

---

## 1. Review Architecture & Stack Technique

### Validation du Workflow

Le plan .md est solide dans sa logique. Voici les corrections et ajouts critiques :

**❌ À abandonner : Plugin Figma** Figma nécessite une interaction manuelle et n'est pas scriptable dans un cron headless. Remplace-le par **Satori + Sharp** (génération d'images côté serveur en Node.js, 100% automatisable).

**✅ Stack Recommandée**

|Besoin|Outil|Raison|
|---|---|---|
|Scraping Senscritique|`Playwright` ou API non-officielle|Plus fiable que Puppeteer sur CI|
|Données séances|API CinéBel / Allocine scraper|Source de vérité pour horaires Lyon|
|Génération image|`Satori` + `Sharp`|JSX → PNG, headless, rapide|
|Génération caption|Claude API (`claude-sonnet-4-20250514`)|Génération intelligente des descriptions|
|Publication|Instagram Graph API (Meta)|Seule API officielle stable|
|Orchestration|GitHub Actions (cron)|Déjà sur GitHub, zéro coût|
|Stockage token Meta|GitHub Secrets + script refresh|Tokens longue durée (60j)|

### ⚠️ Pièges Anticipés

**Meta Graph API**

- Le token d'accès expire tous les **60 jours** → implémenter un script de refresh automatique avec `fb-messenger-sdk` ou appel direct `/oauth/access_token`
- L'upload de carrousel nécessite d'abord d'uploader chaque image sur un **serveur accessible publiquement** (pas localhost) → utiliser un bucket S3/Cloudflare R2 ou Vercel Blob comme stockage temporaire
- Limite : **25 posts par 24h**, **240 requêtes API par heure**

**Scoring des films**

- Senscritique bloque les scrapers agressifs → utiliser des délais et un User-Agent browser
- Le score doit être persisté (fichier JSON ou DB légère) pour éviter de re-scraper à chaque run

**Gestion d'erreur**

- Si 0 film trouvé pour le lendemain → ne pas poster, envoyer une alerte email/Slack

---

## 2. Plan d'Implémentation — Modules & Prompts Agent IA

### 📦 Module 00 — Seed Database

**Prompt à copier dans ton agent IA :**

```
Contexte : projet cinelyon (Next.js, TypeScript).
Crée le fichier `scripts/instagram/00_seed_database.ts`.

Ce script scrape UNE SEULE liste à la fois, choisie via un argument CLI.
Il est conçu pour être lancé manuellement autant de fois que nécessaire.

LISTE DES SOURCES (argument --source) :
- "letterboxd_rege"       → https://letterboxd.com/regelegorila/list/rege-cine-club/
- "letterboxd_bfi_dir"    → https://letterboxd.com/bfi/list/sight-and-sounds-directors-100-greatest-films/
- "letterboxd_bfi"        → https://letterboxd.com/bfi/list/sight-and-sounds-greatest-films-of-all-time/
- "letterboxd_anim250"    → https://letterboxd.com/official/list/top-250-animated-films/
- "letterboxd_top500"     → https://letterboxd.com/official/list/letterboxds-top-500-films/
- "letterboxd_fans250"    → https://letterboxd.com/official/list/top-250-films-with-the-most-fans/
- "letterboxd_boxoffice"  → https://letterboxd.com/matthew/list/all-time-worldwide-box-office-2025-archive/
- "letterboxd_directors"  → https://letterboxd.com/jasonli777/list/director/
- "senscritique_cultes"   → https://www.senscritique.com/liste/l_encyclopedie_des_films_cultes/27776
- "senscritique_top111"   → https://www.senscritique.com/films/tops/top111
- "senscritique_top100"   → https://www.senscritique.com/films/tops/top100-des-top10
- "senscritique_claques"  → https://www.senscritique.com/top/resultats/les_plus_belles_claques_esthetiques/253158

COMPORTEMENT :
1. Lire l'argument CLI : const source = process.argv.find(a => a.startsWith('--source='))?.split('=')[1]
2. Si --source manquant ou invalide → afficher la liste des sources disponibles et exit(1)
3. Vérifier dans reference_sources si cette source a déjà un last_scraped_at :
   → Si oui, demander confirmation : "⚠️ Cette source a déjà été scrapée le [date]. Continuer ? (y/n)"
   → Si non, continuer directement
4. Scraper uniquement cette liste avec Playwright headless
5. Paginer si nécessaire avec un délai aléatoire entre 1500ms et 3000ms entre chaque page
6. Pour chaque film : titre, année, réalisateur, rang, poster_url, url fiche

DÉDUPLICATION (identique à avant) :
- Normaliser : lowercase, sans accents, sans articles (le/la/les/the/a), sans caractères spéciaux
- Si title_normalized + année existe déjà dans reference_films :
  → Ajouter la source dans sources[]
  → Incrémenter source_count
  → Recalculer avg_rank
- Sinon → INSERT

FIN DE SCRIPT :
- Mettre à jour reference_sources : last_scraped_at = now(), film_count = X
- Logger le résumé :
  "✅ letterboxd_top500 terminé : 500 films traités, 123 nouveaux, 377 fusionnés avec existants"
- Sauvegarder un rapport dans scripts/instagram/output/seed_logs/[source]_[timestamp].json

Exporte une fonction principale seedSource(source: string): Promise<void>.
```

---

### 📦 Module 1 — Scoring & Sélection des Films

**Prompt à copier dans ton agent IA :**

```
Contexte : projet cinelyon (Next.js, TypeScript).
Crée le fichier `scripts/instagram/01_select_films.ts`.

Ce script sélectionne les meilleurs films depuis Supabase (tables reference_films 
et la table existante des films à l'affiche sur cinelyon).
Il ne scrape plus rien — toutes les données viennent de la DB.

ÉTAPE 1 — Récupérer les films à l'affiche à Lyon (depuis la DB cinelyon existante)
- Requêter les films actuellement en salle à Lyon
- Ces films ont un score_source = 1.0 (priorité maximale)

ÉTAPE 2 — Récupérer les films de reference_films
- Requêter tous les films de reference_films
- Pour chaque film, calculer un score :
  score = score_rang × score_ancienneté × score_note × score_realisateur × score_multi_source

  - score_rang : basé sur avg_rank. rang 1 → 1.0, rang 500 → 0.01
  - score_ancienneté : 0.5^((2025 - year) / 25), clamp entre 0.01 et 1.0
  - score_note : avg_note / 10 si disponible, sinon 0.7 par défaut
  - score_realisateur : 1.0 si director dans KNOWN_DIRECTORS (constants.ts), sinon 0.6
  - score_multi_source : 1.0 + (source_count - 1) × 0.1, clamped à 1.5
    → un film présent dans 5 listes aura un bonus de ×1.4

ÉTAPE 3 — Fusion et tri
- Fusionner les 2 listes en dédupliquant par title_normalized
- Si un film est à la fois à l'affiche ET dans reference_films → score_source = 1.0 (écrase le score calculé)
- Trier par score décroissant
- Garder les 20 premiers (le Module 2 va en éliminer une partie)

ÉTAPE 4 — Output
- Écrire le résultat dans scripts/instagram/output/selected_films.json
- Format : { title, year, director, poster_url, score, sources: string[], source_count }

Exporte une fonction principale selectFilms(): Promise<void>.
```

---

### 📦 Module 2 — Enrichissement des Données Séances

**Prompt à copier dans ton agent IA :**

```
Contexte : projet cinelyon (Next.js, TypeScript).
Crée le fichier `scripts/instagram/02_fetch_showtimes.ts`.

Ce script doit :
1. Lire `scripts/instagram/output/selected_films.json`
2. Pour chaque film, requêter l'API Allocine ou scraper cinelyon.fr/api 
   (qui existe déjà dans le projet) pour récupérer les séances du LENDEMAIN à Lyon.
   Format de la date cible : new Date(Date.now() + 86400000)
3. Pour chaque film, récupérer : 
   - Liste des cinémas avec adresse, séances (heures), pass acceptés (UGC Illimité, Pathé Ciné Passion)
4. Si un film n'a AUCUNE séance à Lyon le lendemain, le retirer de la sélection.
5. Écrire le résultat enrichi dans `scripts/instagram/output/enriched_films.json`
   Format : { title, director, year, poster_url, cinema: { name, address, showtimes: string[], passes: string[] }[] }[]

Gère le cas où enriched_films est vide : logger une erreur et throw une exception 
avec le message "NO_FILMS_AVAILABLE" pour que l'orchestrateur puisse l'intercepter.
```

---

### 📦 Module 3 — Génération des Images (Satori + Sharp)

**Prompt à copier dans ton agent IA :**

```
Contexte : projet cinelyon (Next.js, TypeScript). 
Installe les dépendances : satori, @resvg/resvg-js, sharp.
Crée le fichier `scripts/instagram/03_generate_images.ts`.

Ce script génère un carrousel Instagram (format carré 1080×1080px) :

IMAGE 1 - Slide couverture :
- Fond sombre avec une image de cinéma en background (floutée, opacité 0.4)
- Texte centré : "on regarde quoi à Lyon" (blanc, bold) + "MARDI 7 AVRIL" (rouge/orange, très bold, grande taille)
- Un calendrier du mois en bas à droite avec le jour du lendemain cerclé en rouge
- Logo cinelyon.fr en bas

IMAGES 2 à N - Une slide par film :
- Moitié gauche : affiche du film (poster_url) avec un overlay gradient sur le bas
- Sur l'overlay : titre du film en bold, réalisateur en italique
- En bas : nom du cinéma + heure de la première séance, sur fond rouge/orange

Pour chaque slide :
1. Générer le JSX avec `satori` (viewBox 1080x1080)
2. Convertir le SVG résultant en PNG avec `@resvg/resvg-js`
3. Optimiser avec `sharp`
4. Sauvegarder dans `scripts/instagram/output/slides/slide_XX.png`

Utilise les couleurs : fond #0D0D0D, accent #E8400C (rouge-orange), texte #FFFFFF.
La police principale est Inter (à télécharger via le package `@fontsource/inter`).
Exporte une fonction `generateCarousel(films: EnrichedFilm[]): Promise<string[]>` 
qui retourne la liste des chemins des fichiers PNG générés.
```

---

### 📦 Module 4 — Génération de la Caption (Claude API)

**Prompt à copier dans ton agent IA :**

```
Contexte : projet cinelyon (Next.js, TypeScript).
Crée le fichier `scripts/instagram/04_generate_caption.ts`.

Ce script génère la description Instagram via un système de template JS pur, sans API externe.

Il doit :
1. Lire `scripts/instagram/output/enriched_films.json`
2. Calculer la date du lendemain et la formater en français (ex: "mardi 7 avril")
3. Générer la caption en suivant cette structure exacte :
   - Ligne 1 : "🎬 Ton recap ciné à Lyon du [JOUR] [DATE]"
   - Ligne 2 : "Plus de séances sur cinelyon.fr"
   - Ligne vide
   - Pour chaque film : "* [TITRE] de [RÉALISATEUR]\n[CINÉMA] ([ADRESSE]) à [HEURE]\nAccepte les [PASSES]"
   - Ligne vide
   - Hashtags : un hashtag par cinéma (nom sans espaces en minuscules) + #cinelyon #cinemalyon #lyon #cinema
4. Sauvegarder la caption dans `scripts/instagram/output/caption.txt`
5. Retourner la caption en string.

Aucune dépendance externe, uniquement du TypeScript natif.
Exporte une fonction principale `generateCaption(films: EnrichedFilm[], date: Date): string`.
```

---

### 📦 Module 5 — Publication Instagram (Meta Graph API)

**Prompt à copier dans ton agent IA :**

```
Contexte : projet cinelyon (Next.js, TypeScript).
Crée le fichier `scripts/instagram/05_publish_instagram.ts`.

Ce script publie un carrousel sur Instagram via l'API Graph Meta.
Les images temporaires sont hébergées sur ImgBB (API gratuite, sans CB).

Prérequis dans les variables d'environnement :
INSTAGRAM_ACCOUNT_ID, INSTAGRAM_ACCESS_TOKEN, IMGBB_API_KEY

Étapes à implémenter :
1. Upload des images sur ImgBB :
   - Lire chaque PNG dans `scripts/instagram/output/slides/`
   - Les encoder en base64
   - POST sur https://api.imgbb.com/1/upload avec la clé IMGBB_API_KEY
   - Récupérer l'URL publique retournée (data.data.url)
2. Créer les media containers individuels :
   POST https://graph.facebook.com/v21.0/{account_id}/media
   avec { image_url, is_carousel_item: true, access_token }
   → récupérer chaque creation_id
3. Créer le container carrousel :
   POST .../media avec { media_type: "CAROUSEL", children: [ids...], caption, access_token }
4. Attendre 10 secondes (les containers doivent être prêts)
5. Publier :
   POST .../media_publish avec { creation_id, access_token }
6. Logger l'ID du post publié dans `scripts/instagram/output/publish_log.json`

Gère les erreurs HTTP Meta avec des messages clairs.
Si une étape échoue, tenter 2 retries avec backoff exponentiel (2s, 4s).
```

---

### 📦 Module 6 — Orchestrateur & GitHub Action

**Prompt à copier dans ton agent IA :**

```
Contexte : projet cinelyon (Next.js, TypeScript).

1. Crée `scripts/instagram/run.ts` — l'orchestrateur principal :
   - Importe et appelle séquentiellement : selectFilms() → fetchShowtimes() → 
     generateCarousel() → generateCaption() → publishInstagram()
   - Si une étape throw "NO_FILMS_AVAILABLE", logger et exit(0) sans erreur
   - Toute autre erreur : logger et exit(1)
   - Ajouter des console.log clairs entre chaque étape : "✅ Films sélectionnés", etc.

2. Crée `.github/workflows/instagram-daily.yml` :
   - Déclencheur : cron "0 18 * * *" (18h UTC = 20h Paris, pour poster le soir)
   - Runner : ubuntu-latest, Node 20
   - Steps : checkout → npm ci → npx ts-node scripts/instagram/run.ts
   - Secrets utilisés : INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_ACCOUNT_ID, IMGBB_API_KEY
   - Ajouter un déclencheur workflow_dispatch pour tester manuellement

3. Crée `scripts/instagram/refresh_token.ts` :
   - Script à lancer manuellement tous les 50 jours
   - Appelle GET https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token
   - Affiche le nouveau token dans la console avec sa date d'expiration
```

---

## 3. Arborescence des Fichiers

```
cinelyon/
├── scripts/
│   └── instagram/
│       ├── run.ts                    # Orchestrateur principal
│       ├── 01_select_films.ts        # Scoring + sélection Senscritique
│       ├── 02_fetch_showtimes.ts     # Enrichissement séances Lyon
│       ├── 03_generate_images.ts     # Génération carrousel PNG (Satori)
│       ├── 04_generate_caption.ts    # Caption via template JS
│       ├── 05_publish_instagram.ts   # Publication Meta Graph API
│       ├── refresh_token.ts          # Utilitaire renouvellement token Meta
│       ├── types.ts                  # Types TypeScript partagés
│       ├── constants.ts              # KNOWN_DIRECTORS, couleurs, config
│       └── output/                   # Gitignorée
│           ├── selected_films.json
│           ├── enriched_films.json
│           ├── caption.txt
│           ├── publish_log.json
│           └── slides/
│               ├── slide_00.png      # Couverture calendrier
│               ├── slide_01.png
│               └── ...
├── .github/
│   └── workflows/
│       └── instagram-daily.yml       # Cron GitHub Actions
└── .env.local                        # Secrets (jamais committé)
    # ANTHROPIC_API_KEY=
    # INSTAGRAM_ACCESS_TOKEN=
    # INSTAGRAM_ACCOUNT_ID=
    # BLOB_READ_WRITE_TOKEN=
```

---

## 4. Ordre de Développement Recommandé

```
Semaine 1  →  Module 1 (scoring) + Module 2 (séances)
              → Valider que le JSON de sortie est correct

Semaine 2  →  Module 3 (images Satori)
              → Tester visuellement sur quelques films hardcodés

Semaine 3  →  Module 4 (caption template JS) + Module 5 (publication Meta + ImgBB)
              → Créer l'app Meta Developer + obtenir les tokens

Semaine 4  →  Module 6 (orchestrateur + GitHub Action)
              → Test complet du pipeline de bout en bout
              → Premier post live 🎉
```

> **Conseil clé** : commence par tester chaque module de façon isolée avec des données mockées (`enriched_films.json` écrit à la main), avant de les chaîner. L'image Satori est le module le plus chronophage — alloue-lui le plus de temps.