<div align="center">

# 🎬 CinéLyon
*Découvrez la scène cinématographique de Lyon instantanément et sans effort*

<p align="center">
  <a href="https://www.python.org/">
    <img alt="Python" src="https://img.shields.io/badge/Python-3.10-blue?logo=python">
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
  <a href="https://www.mapbox.com/">
    <img alt="Mapbox" src="https://img.shields.io/badge/Mapbox-API-007afc?logo=mapbox">
  </a>
  <a href="https://www.allocine.fr/">
    <img alt="Allociné" src="https://img.shields.io/badge/Allocin%C3%A9-Data-FECC00">
  </a>
</p>
</div>

## ✨ Fonctionnalités

- 📅 **Calendrier interactif** : Visualisez les horaires sur 7 jours
- 🎥 **Informations détaillées** : Synopsis, réalisateur, genres, durée, notes TMDB
- 🗺️ **Carte interactive** : Localisation de tous les cinémas avec Mapbox
- 🔍 **Barre de recherche** : Filtrez par titre, genre, réalisateur, cinéma ou note
- 🎬 **Badges VO/VF** : Langue de chaque séance clairement affichée
- 🎭 **Formats spéciaux** : Badges IMAX, 4DX, 3D pour les séances premium
- ⚡ **Scraping automatique** : Données mises à jour quotidiennement via GitHub Actions
- 📱 **Design responsive** : Interface moderne adaptée à tous les écrans

## 🏗️ Architecture

```
cinelyon/
├── app.py                 # Application Flask
├── scrape.py              # Script de scraping (GitHub Actions)
├── movies.json            # Données des films (généré automatiquement)
├── vercel.json            # Configuration Vercel
├── requirements.txt       # Dépendances Python
├── .env.sample            # Template des variables d'environnement
├── .github/
│   └── workflows/
│       └── scrape.yml     # Workflow quotidien (4h UTC)
├── modules/
│   └── Classes.py         # Classes: Movie, Theater, Showtime
├── templates/
│   ├── base.html
│   └── index.html
└── static/
    ├── css/main.css
    ├── font/
    └── images/
```

### Flux de données

```
GitHub Actions (4h UTC)
       ↓
   scrape.py
       ↓
  Allociné API → movies.json ← TMDB API
       ↓
   app.py (Flask)
       ↓
   Vercel / Navigateur
```

## 🚀 Installation locale

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
   → Ouvrir `http://localhost:5000`

## ☁️ Déploiement Vercel

1. **Importer sur [vercel.com/new](https://vercel.com/new)**
2. **Configurer les variables d'environnement** :
   - `MAPBOX_TOKEN`
   - `WEBSITE_TITLE`
   - `THEATERS`
3. **Déployer** ✅

Le scraping GitHub Actions met à jour `movies.json` → Vercel redéploie automatiquement.

## ⚙️ GitHub Actions

Le workflow s'exécute :
- **Automatiquement** : tous les jours à 4h UTC
- **Manuellement** : Actions → "Scrape Movies" → "Run workflow"

### Secrets requis

| Secret | Description |
|--------|-------------|
| `TMDB_API_KEY` | Clé API TMDB (v3 auth) |
| `THEATERS` | JSON des cinémas |

## 🎭 Ajouter des cinémas

Dans `.env` ou les secrets GitHub :

```json
[
  {"id":"P8507","name":"Pathé Carré de Soie","latitude":45.7641,"longitude":4.9212},
  {"id":"P0017","name":"Pathé Bellecour","latitude":45.7578,"longitude":4.8320}
]
```

**Trouver l'ID** : Dans l'URL Allociné `salle_gen_csalle=P8507.html` → ID = `P8507`

## 🔗 Liens utiles

- [TMDB API](https://www.themoviedb.org/settings/api) - Clé API pour les données films
- [Mapbox](https://console.mapbox.com/) - Token pour la carte
- [Allociné](https://www.allocine.fr/) - Source des séances

## 📄 Crédit

Fork de [grainParisArt-Public](https://github.com/solene-drnx/grainParisArt-Public)

---

<div align="center">

**CinéLyon** 🎬 *Quand ça va pas, y aura toujours le cinéma*

</div>
