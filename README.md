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
    <img alt="GitHub Actions" src="https://img.shields.io/badge/CI%2FCD-Passing-2088FF?logo=github-actions">
  </a>
  <a href="https://www.themoviedb.org/">
    <img alt="TMDB" src="https://img.shields.io/badge/TMDB-API-01d277?logo=themoviedb">
  </a>
  <a href="https://www.mapbox.com/">
    <img alt="Mapbox" src="https://img.shields.io/badge/Mapbox-API-007afc?logo=mapbox">
  </a>
  <a href="https://www.allocine.fr/">
    <img alt="Allociné" src="https://img.shields.io/badge/Allocin%C3%A9-Data-FECC00">
  </a>
</p>
</div>

## Crédit

Fork de [grainParisArt-Public](https://github.com/solene-drnx/grainParisArt-Public) réalisé par [Solène](https://github.com/solene-drnx)

## Liste des cinémas (17)

- Pathé Carré de Soie
- Pathé Bellecour
- Pathé Vaise
- UGC Part-Dieu
- UGC Confluence
- UGC Internationale
- UGC Astoria
- Lumière Bellecour
- Lumière La Fourmi
- Lumière Terreaux
- Institut Lumière
- CGR Brignais
- Ciné Meyzieu
- Ciné Toboggan
- Cinéma Comoedia
- Les Amphis
- Cinéma Gerard-Philipe

## Fonctionnalités

- **Calendrier interactif** : Visualisez les horaires sur 7 jours
- **Informations détaillées** : Synopsis, réalisateur, genres, durée, notes TMDB
- **Carte interactive** : Localisation de tous les cinémas avec Mapbox et liens GPS
- **Barre de recherche** : Filtrez par titre, genre, réalisateur, cinéma ou note
- **Système de favoris** : Sauvegardez vos films préférés (persistant via localStorage)
- **Badges VO/VF** : Langue de chaque séance clairement affichée
- **Formats spéciaux** : Badges IMAX, 4DX, 3D pour les séances premium
- **Scraping automatique** : Données mises à jour quotidiennement via GitHub Actions
- **PWA** : Installable sur mobile avec Service Worker
- **Design responsive** : Interface moderne adaptée à tous les écrans

## Optimisations

- **Compression Gzip** : Réponses HTTP compressées via Flask-Compress
- **Sécurité CSP** : Headers de sécurité avec Flask-Talisman
- **Cache intelligent** : Rechargement automatique des données si `movies.json` change
- **Proxy d'images** : Affiches optimisées via wsrv.nl
- **Cache HTTP** : Headers de cache pour les fichiers statiques

## Architecture

```
cinelyon/
├── app.py                 # Application Flask (compression, sécurité, cache)
├── scrape.py              # Script de scraping (GitHub Actions)
├── movies.json            # Données des films (généré automatiquement)
├── tmdb_cache.json        # Cache des données TMDB
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
GitHub Actions (4h UTC)
       ↓
   scrape.py
       ↓
  Allociné API → movies.json ← TMDB API (+ cache)
       ↓
   app.py (Flask + Gzip + Talisman)
       ↓
   Vercel / Navigateur (PWA)
```

## Installation locale

### Prérequis

- Python 3.10+
- Compte [TMDB](https://www.themoviedb.org/settings/api) (gratuit)
- Compte [Mapbox](https://console.mapbox.com/) (gratuit)

### Configuration

1. **Cloner le repository**
   ```bash
   git clone https://github.com/votre-username/cinelyon.git
   cd cinelyon
   ```

2. **Installer les dépendances**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configurer les variables d'environnement**
   ```bash
   cp .env.sample .env
   # Éditer .env avec vos clés API
   ```

4. **Générer les données**
   ```bash
   python scrape.py
   ```

5. **Lancer l'application**
   ```bash
   python app.py
   ```
   → Ouvrir `http://127.0.0.1:5000/` ou `http://localhost:5000`

## Développement

### Qualité du code

```bash
# Linting avec Ruff
ruff check .

# Tests avec Pytest
pytest

# Les deux à la fois (comme CI)
ruff check . && pytest
```

### Tests disponibles

| Test | Description |
|------|-------------|
| `test_health_check` | Vérifie que `/health` répond OK |
| `test_home_page` | Vérifie que la page d'accueil charge (200) |

## Déploiement Vercel

1. **Importer sur [vercel.com/new](https://vercel.com/new)** (Conseil : GitHub)
2. **Configurer les variables d'environnement** :
   - `MAPBOX_TOKEN`
   - `WEBSITE_TITLE`
   - `THEATERS`
3. **Déployer**

Le scraping GitHub Actions met à jour `movies.json` → Vercel redéploie automatiquement.

## GitHub Actions

### Workflows

| Workflow | Déclencheur | Actions |
|----------|-------------|---------|
| `scrape.yml` | Quotidien (4h UTC) + manuel | Scraping Allociné + TMDB |
| `quality.yml` | Push / Pull Request | Ruff linting + Pytest |

### Secrets requis

| Secret | Description |
|--------|-------------|
| `TMDB_API_KEY` | Clé API TMDB (v3 auth) |
| `THEATERS` | JSON des cinémas |
| `MAPBOX_TOKEN` | Token Mapbox |
| `WEBSITE_TITLE` | Titre du site |

## Ajouter des cinémas

Dans `.env` ou les secrets GitHub :

```json
[
  {"id":"P8507","name":"Pathé Carré de Soie","latitude":45.7641,"longitude":4.9212},
  {"id":"P0017","name":"Pathé Bellecour","latitude":45.7578,"longitude":4.8320}
]
```

**Trouver l'ID** : Dans l'URL Allociné `salle_gen_csalle=P8507.html` → ID = `P8507`

## Liens utiles

- [TMDB API](https://www.themoviedb.org/settings/api) - Clé API pour les données films
- [Mapbox](https://console.mapbox.com/) - Token pour la carte
- [Allociné](https://www.allocine.fr/) - Source des séances

---

<div align="center">

**CinéLyon** - Parce que le cinéma lyonnais mérite plus d'attention !

</div>
