<div align="center">

# 🎬 CinéLyon
*Découvrez la scène cinématographique de Lyon instantanément et sans effort*

<p align="center">
  <a href="https://www.python.org/">
    <img alt="Python" src="https://img.shields.io/badge/Python-3.10+-blue?logo=python">
  </a>
  <a href="https://flask.palletsprojects.com/">
    <img alt="Flask" src="https://img.shields.io/badge/Flask-2.0+-lightgrey?logo=flask">
  </a>
  <a href="https://vercel.com/">
    <img alt="Vercel" src="https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel">
  </a>
  <a href="https://github.com/features/actions">
    <img alt="GitHub Actions" src="https://img.shields.io/badge/GitHub%20Actions-Scraping-2088FF?logo=github-actions">
  </a>
  <a href="https://www.themoviedb.org/">
    <img alt="TMDB" src="https://img.shields.io/badge/TMDB-API-01d277?logo=themoviedb">
  </a>
  <a href="https://supabase.com/">
    <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase">
  </a>
  <a href="https://www.allocine.fr/">
    <img alt="Allociné" src="https://img.shields.io/badge/Allocin%C3%A9-Data-FECC00">
  </a>
</p>
</div>

## Crédit

Fork de [grainParisArt-Public](https://github.com/solene-drnx/grainParisArt-Public) réalisé par [Solène](https://github.com/solene-drnx)

## Liste des cinémas (18)

- Pathé Carré de Soie *(25 jours)*
- Pathé Bellecour *(25 jours)*
- Pathé Vaise *(25 jours)*
- UGC Part-Dieu *(25 jours)*
- UGC Confluence *(25 jours)*
- UGC Internationale *(25 jours)*
- UGC Astoria *(25 jours)*
- Ciné Meyzieu *(25 jours)*
- Ciné Toboggan *(25 jours)*
- Les Amphis *(25 jours)*
- Lumière Bellecour *(10 jours)*
- Lumière La Fourmi *(10 jours)*
- Lumière Terreaux *(10 jours)*
- Institut Lumière *(10 jours)*
- CGR Brignais *(10 jours)*
- Cinéma Comoedia *(10 jours)*
- Cinéma Gerard-Philipe *(10 jours)*
- Ciné Saint-Denis *(10 jours)*

## Fonctionnalités

- **Calendrier interactif** : Visualisez les horaires jusqu'à 25 jours à l'avance
- **Informations détaillées** : Métadonnées ultra-fiables (affiches, synopsis, années) basées sur Allociné, avec notes et trailers TMDB
- **Synchronisation multi-appareils** : Retrouvez vos favoris sur tous vos écrans via Supabase
- **Barre de recherche** : Filtrez par titre, genre, réalisateur, cinéma ou note
- **Système de favoris** : Sauvegardez vos films préférés
- **Bandes-annonces & Liens** : Visionnez le trailer directement ou accédez à la fiche Allociné du film
- **Badges Événements** : Distinction visuelle par code couleur des *Avant-premières* (rose) et événements *Live* (orange)
- **Badges Accessibilité** : Repérez facilement les séances accessibles aux Personnes à Mobilité Réduite (PMR)
- **Badges Formats & Langues** : Filtre et indication des séances spéciales (IMAX, 4DX, Dolby, ICE, 3D) et VO/VF
- **Scraping automatique** : Données mises à jour quotidiennement via GitHub Actions
- **PWA** : Installable sur mobile avec Service Worker
- **Design responsive** : Interface moderne adaptée à tous les écrans

## Optimisations

- **Compression Gzip** : Réponses HTTP compressées via Flask-Compress
- **Sécurité CSP** : Headers de sécurité avec Flask-Talisman
- **Cache TTL 5 min** : Données Supabase mises en cache mémoire côté serveur
- **Proxy d'images** : Affiches optimisées via wsrv.nl
- **Cache HTTP** : Headers de cache pour les fichiers statiques

## Architecture

```
cinelyon/
├── app.py                 # Application Flask (compression, sécurité, cache TTL)
├── scrape.py              # Script de scraping (GitHub Actions → Supabase)
├── tmdb_cache.json        # Cache local des données TMDB (persisté via Git)
├── vercel.json            # Configuration Vercel
├── pyproject.toml         # Configuration Python (Ruff, pytest)
├── requirements.txt       # Dépendances Python
├── .env.sample            # Template des variables d'environnement
├── .github/
│   └── workflows/
│       ├── scrape.yml     # Workflow quotidien de scraping
│       └── quality.yml    # CI: Ruff linting + Pytest
├── modules/
│   └── Classes.py         # Classes: Movie, Theater, Showtime
├── templates/
│   ├── base.html          # Template de base
│   └── index.html         # Page d'accueil
├── tests/
│   └── test_basic.py      # Tests unitaires (health, home)
└── static/
    ├── css/main.css       # Styles CSS
    ├── font/              # Police
    ├── images/            # Images et icônes
    ├── manifest.json      # PWA manifest
    └── sw.js              # Service Worker
```

### Flux de données

```
GitHub Actions (2× par jour)
       ↓
   scrape.py
       ↓
  Allociné API ──→ Supabase (table showtimes)
  TMDB API                   ↑
  (+ tmdb_cache.json)        │
                             │
   app.py (Flask) ──────────┘
   Cache TTL 5 min
       ↓
   Vercel / Navigateur (PWA)
```

### Table Supabase (`showtimes`)

```sql
CREATE TABLE showtimes (
  date         DATE PRIMARY KEY,
  movies       JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE showtimes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON showtimes FOR SELECT USING (true);
```

## Installation locale

### Prérequis

- Python 3.10+
- Compte [TMDB](https://www.themoviedb.org/settings/api) (gratuit)
- Compte [Supabase](https://supabase.com) (gratuit) avec la table `showtimes` créée

### Configuration

1. **Cloner le repository**
   ```bash
   git clone https://github.com/votre-username/cinelyon.git
   cd cinelyon
   ```

2. **Créer l'environnement virtuel et installer les dépendances**
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Configurer les variables d'environnement**
   ```bash
   cp .env.sample .env
   # Remplir .env avec vos clés
   ```

4. **Générer les données (scraping)**
   ```bash
   python scrape.py
   ```

5. **Lancer l'application**
   ```bash
   python app.py
   ```
   → Ouvrir `http://127.0.0.1:5000`

## Développement

### Qualité du code

```bash
ruff check .   # Linting
pytest         # Tests
```

### Tests disponibles

| Test | Description |
|------|-------------|
| `test_health_check` | Vérifie que `/health` répond OK |
| `test_home_page` | Vérifie que la page d'accueil charge (200) |

## Déploiement Vercel

1. **Importer sur [vercel.com/new](https://vercel.com/new)**
2. **Configurer les variables d'environnement** (Settings → Environment Variables) :

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | URL du projet Supabase |
| `SUPABASE_ANON_KEY` | Clé publique Supabase (lecture seule) |
| `WEBSITE_TITLE` | Titre du site |
| `THEATERS` | JSON des cinémas |

> ⚠️ **Ne pas ajouter `SUPABASE_SERVICE_ROLE_KEY` sur Vercel** — uniquement pour GitHub Actions.

3. **Déployer**

Les données sont dans Supabase — Vercel n'a pas besoin de redéploiement lors du scraping.

## GitHub Actions

### Workflows

| Workflow | Déclencheur | Actions |
|----------|-------------|---------|
| `scrape.yml` | Quotidien (2×) + manuel | Scraping Allociné + TMDB → Supabase |
| `quality.yml` | Push / Pull Request | Ruff linting + Pytest |

### Secrets requis

| Secret | Utilisé par | Description |
|--------|-------------|-------------|
| `TMDB_API_KEY` | `scrape.py` | Clé API TMDB |
| `THEATERS` | `scrape.py` | JSON des cinémas |
| `SUPABASE_URL` | `scrape.py` | URL du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | `scrape.py` | Clé admin Supabase (écriture) |

## Ajouter des cinémas

Dans `.env` ou les secrets GitHub, modifier `THEATERS` :

```json
[
  {"id": "P8507", "name": "Pathé Carré de Soie", "latitude": 45.7641, "longitude": 4.9212},
  {"id": "P0017", "name": "Pathé Bellecour", "latitude": 45.7578, "longitude": 4.8320}
]
```

**Trouver l'ID** : Dans l'URL Allociné `salle_gen_csalle=P8507.html` → ID = `P8507`

Pour scraper un cinéma sur **25 jours** au lieu de 10, ajouter son nom dans `EXTENDED_THEATERS` dans `scrape.py`.

## Liens utiles

- [TMDB API](https://www.themoviedb.org/settings/api) - Clé API pour les données films
- [Supabase](https://supabase.com) - Base de données PostgreSQL
- [Allociné](https://www.allocine.fr/) - Source des séances

---

<div align="center">

**CinéLyon** - Parce que le cinéma lyonnais mérite plus d'attention !

</div>
