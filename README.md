<div align="center">

# CinéLyon
*Découvrez la scène cinématographique de Lyon instantanément et sans effort*

<p align="center">
  <a href="https://www.python.org/">
    <img alt="Python" src="https://img.shields.io/badge/Python-3.11+-blue?logo=python">
  </a>
  <a href="https://flask.palletsprojects.com/">
    <img alt="Flask" src="https://img.shields.io/badge/Flask-2.0+-lightgrey?logo=flask">
  </a>
  <a href="https://www.typescriptlang.org/">
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript">
  </a>
  <a href="https://vercel.com/">
    <img alt="Vercel" src="https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel">
  </a>
  <a href="https://github.com/features/actions">
    <img alt="GitHub Actions" src="https://img.shields.io/badge/GitHub%20Actions-Automated-2088FF?logo=github-actions">
  </a>
  <a href="https://supabase.com/">
    <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase">
  </a>
</p>
</div>

## Le projet

CinéLyon est une plateforme moderne conçue pour les cinéphiles lyonnais. Elle agrège les séances de 18 cinémas (indépendants et grands circuits) tout en mettant l'accent sur la richesse éditoriale : reprises cultes, films d'auteur et ressorties patrimoniales.

## Fonctionnalités clés

- **Calendrier Étendu** : Visualisez les séances jusqu'à 25 jours à l'avance pour les cinémas majeurs.
- **Données Enrichies** : Fusion intelligente des données Allociné (séances, synopsis FR) et TMDB (affiches haute résolution, bandes-annonces, titres originaux).
- **Disponibilité Streaming** : Affiche directement si un film est disponible sur vos plateformes préférées (Netflix, Disney+, etc.) avec liens directs.
- **Système de Favoris & Social** : Sauvegardez vos films et suivez la sélection de vos amis grâce à la synchronisation en temps réel via Supabase.
- **Recherche Intuitive** : Filtrez instantanément par titre, réalisateur, genre, format (IMAX, 4DX, VO/VF) ou cinéma.
- **PWA First** : Expérience fluide sur mobile, installable comme une application native avec support hors-ligne (Service Worker).
- **Automatisation Instagram** : Publication quotidienne d'un carrousel des meilleures séances via un pipeline intelligent.
- **Curation Patrimoniale** : Base de données de films de référence alimentée par les meilleures listes mondiales (Letterboxd Top 250, SensCritique, BFI, etc.).

---

## Pipeline Instagram (Carousel Daily)

Le dossier `scripts/instagram/` contient un orchestrateur TypeScript qui génère chaque jour un carrousel optimisé pour l'engagement.

### Algorithme de Sélection & Scoring
Le pipeline score les films selon plusieurs critères :
- **Priorité aux Reprises** : Les films classiques et ressorties reçoivent un bonus massif.
- **Prestige Réalisateur** : Bonus automatique pour les films de réalisateurs cultes (Kubrick, Scorsese, Varda, Miyazaki, etc.).
- **Scoring Multi-Source** : Agrégation des notes et classements (Letterboxd, IMDb, Rotten Tomatoes).
- **Diversité Éditoriale** : Limitation intelligente par cinéma pour garantir un carrousel varié.

### Design & Génération Visuelle
- **Moteur Satori & Resvg** : Génération de PNG 1080x1440 à partir de composants React/TSX.
- **Design Adaptatif** :
  - **Slide Couverture** : Scène de film aléatoire récupérée via TMDB.
  - **Calendrier Visuel** : Affichage stylisé de la date du jour.
  - **Slides Films** : Mise en avant du réalisateur et des cinémas indépendants.

---

## Architecture Technique

```mermaid
graph TD
    GA[GitHub Actions] -->|Scraping 2x/jour| S[scrape.py]
    S -->|Séances| AL[Allociné API]
    S -->|Metadata| TM[TMDB API]
    S -->|Storage| SUP[(Supabase DB)]
    
    GA -->|Daily 20h| INST[Instagram Pipeline]
    INST -->|Selection| SUP
    INST -->|Rendering| Satori[Satori/Resvg]
    INST -->|Publish| Meta[Meta Graph API]
    
    V[Vercel / PWA] -->|Read| SUP
    V -->|Real-time| Sync[Supabase Realtime]
```

### Stack Technologique
- **Backend** : Python 3.11, Flask.
- **Frontend** : Vanilla JS, CSS3, PWA.
- **Automation** : Node.js 18+, TypeScript, GitHub Actions.
- **Base de données** : PostgreSQL (via Supabase) avec Row Level Security (RLS).

---

## Installation & Développement

### 1. Configuration de la Base de données (Supabase)
Exécutez les scripts SQL suivants dans votre éditeur SQL Supabase pour créer les tables nécessaires :

```sql
-- Séances quotidiennes
CREATE TABLE showtimes (
  date DATE PRIMARY KEY,
  movies JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT now()
);

-- Cache métadonnées TMDB
CREATE TABLE tmdb_cache (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

-- Synchronisation sociale
CREATE TABLE friend_follows (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  follower_id TEXT NOT NULL,
  followed_id TEXT NOT NULL,
  followed_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Curation pour Instagram
CREATE TABLE reference_films (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  title_normalized TEXT NOT NULL,
  year INTEGER,
  director TEXT,
  poster_url TEXT,
  sources TEXT[],
  source_count INTEGER DEFAULT 1,
  avg_rank FLOAT,
  avg_note FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Suivi des sources de curation
CREATE TABLE reference_sources (
  id TEXT PRIMARY KEY,
  last_scraped_at TIMESTAMPTZ,
  film_count INTEGER
);

-- RLS : Autoriser la lecture publique sur les séances
ALTER TABLE showtimes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read" ON showtimes FOR SELECT USING (true);
```

### 2. Configuration de l'environnement
Créez un fichier `.env` à la racine du projet à partir du template :
```bash
cp .env.sample .env
```

#### Variables requises :
| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | URL de votre projet Supabase. |
| `SUPABASE_ANON_KEY` | Clé publique (pour l'application web). |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé admin (requise pour le scraping et le seed). |
| `TMDB_API_KEY` | Clé API TheMovieDB (pour les métadonnées). |
| `THEATERS` | JSON string listant les cinémas (ex: `[{"id":"P0017","name":"Pathé Bellecour","latitude":45.7578,"longitude":4.8320}]`). |
| `IMGBB_API_KEY` | Clé API ImgBB (pour l'hébergement temporaire des images Instagram). |
| `INSTAGRAM_ACCOUNT_ID` | ID du compte Instagram Business (Meta). |
| `INSTAGRAM_ACCESS_TOKEN` | Token d'accès Meta Graph API. |

### 3. Installation du Backend (Python)
```bash
# Installation
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Lancer le scraping initial
python scrape.py

# Lancer l'app web locale
python app.py
```

### 4. Installation du Pipeline Instagram (Node/TS)
```bash
cd scripts/instagram
npm install
npx playwright install # Requis pour le seeding automatique

# Remplir la base de données de référence (Seeding)
# Exemple pour importer le Top 500 Letterboxd :
npx ts-node 00_seed_database.ts --source=letterboxd_top500

# Tester la génération de carrousel (Dry-Run)
npx ts-node run.ts --dry-run
```

---

## Qualité & Tests
```bash
ruff check .   # Linting Python
pytest         # Tests unitaires
```

## Déploiement
- **Frontend/API** : Déploiement automatique sur Vercel à chaque push sur `main`.
- **Automatisation** : Les workflows GitHub Actions (`scrape.yml` et `instagram-daily.yml`) utilisent les secrets configurés dans les paramètres du dépôt.

---

<div align="center">

**CinéLyon** - Parce que le cinéma lyonnais mérite plus d'attention !

</div>
