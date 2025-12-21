<div align="center">

# 🎬 CinéLyon

<i>Découvrez la scène cinématographique de Lyon instantanément et sans effort</i>

<br/>

<!-- Badges de statut -->
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-Yes-brightgreen.svg?style=for-the-badge)](https://github.com/votre-username/cinelyon/graphs/commit-activity)
[![Made with Love](https://img.shields.io/badge/Made%20with-❤️-red.svg?style=for-the-badge)](https://github.com/votre-username/cinelyon)

<!-- Badges techniques -->
<p>
  <a href="https://www.python.org/">
    <img alt="Python" src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white">
  </a>
  <a href="https://flask.palletsprojects.com/">
    <img alt="Flask" src="https://img.shields.io/badge/Flask-2.0+-000000?style=for-the-badge&logo=flask&logoColor=white">
  </a>
  <a href="https://gunicorn.org/">
    <img alt="Gunicorn" src="https://img.shields.io/badge/Gunicorn-Server-499848?style=for-the-badge&logo=gunicorn&logoColor=white">
  </a>
</p>

<!-- Badges Frontend -->
<p>
  <a href="https://html.spec.whatwg.org/">
    <img alt="HTML5" src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white">
  </a>
  <a href="https://www.w3.org/Style/CSS/">
    <img alt="CSS3" src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white">
  </a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript">
    <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black">
  </a>
</p>

<!-- Badges APIs -->
<p>
  <a href="https://www.allocine.fr/">
    <img alt="Allociné" src="https://img.shields.io/badge/Allociné-Data-FECC00?style=for-the-badge&logoColor=black">
  </a>
  <a href="https://www.themoviedb.org/">
    <img alt="TMDB" src="https://img.shields.io/badge/TMDB-API-01d277?style=for-the-badge&logo=themoviedb&logoColor=white">
  </a>
  <a href="https://www.mapbox.com/">
    <img alt="Mapbox" src="https://img.shields.io/badge/Mapbox-Maps-000000?style=for-the-badge&logo=mapbox&logoColor=white">
  </a>
</p>

<br/>

<img src="static/images/preview.png" alt="CinéLyon Preview" width="80%"/>

</div>

<br/>

## 📋 Table des matières

- [✨ Fonctionnalités](#-fonctionnalités)
- [🎬 Cinémas supportés](#-cinémas-supportés)
- [🚀 Installation](#-installation)
- [🏗️ Architecture](#️-architecture)
- [⚙️ Configuration avancée](#️-configuration-avancée)
- [🌐 Déploiement](#-déploiement)
- [🤝 Contribution](#-contribution)
- [⚠️ Problèmes connus](#️-problèmes-connus)
- [📝 Crédit](#-crédit)

---

## ✨ Fonctionnalités

<table>
  <tr>
    <td>📅 <b>Calendrier interactif</b></td>
    <td>Visualisez les horaires sur 7 jours</td>
  </tr>
  <tr>
    <td>📖 <b>Informations détaillées</b></td>
    <td>Synopsis, réalisateur, genres, durée, notes</td>
  </tr>
  <tr>
    <td>🗺️ <b>Carte interactive</b></td>
    <td>Localisation de tous les cinémas de Lyon avec Mapbox</td>
  </tr>
  <tr>
    <td>🎨 <b>Interface moderne</b></td>
    <td>Design responsive et élégant</td>
  </tr>
  <tr>
    <td>🔄 <b>Données en temps réel</b></td>
    <td>Horaires mis à jour depuis Allociné</td>
  </tr>
  <tr>
    <td>⭐ <b>Notes et critiques</b></td>
    <td>Intégration avec TMDB pour les évaluations</td>
  </tr>
</table>

---

## 🎬 Cinémas supportés

| Cinéma | Type |
|--------|------|
| 🎥 Pathé Carré de Soie | Multiplex |
| 🎥 Pathé Bellecour | Multiplex |
| 🎥 UGC Part-Dieu | Multiplex |
| 🎥 UGC Confluence | Multiplex |
| 🎥 UGC Internationale | Multiplex |
| 🎬 Ciné Meyzieu | Indépendant |
| 🎬 Ciné Toboggan | Indépendant |

---

## 🚀 Installation

### Prérequis

| Outil | Version | Description |
|-------|---------|-------------|
| Python | 3.10+ | Langage principal |
| pip | dernière | Gestionnaire de paquets |
| TMDB API | - | Pour les métadonnées des films |
| Mapbox API | - | Pour la carte interactive |

### Installation rapide

```bash
# 1. Cloner le repository
git clone https://github.com/votre-username/cinelyon.git
cd cinelyon

# 2. Installer les dépendances
pip install -r requirements.txt

# 3. Configurer les variables d'environnement
cp .env.example .env  # puis éditer le fichier .env

# 4. Lancer l'application
python app.py
```

> 💡 L'application sera accessible sur `http://localhost:5000`

### Configuration du fichier `.env`

```env
# Clé API TMDB (obligatoire)
TMDB_API_KEY=votre_clé_tmdb_ici

# Clé API Mapbox (pour afficher la carte)
MAPBOX_TOKEN=votre_clé_mapbox_ici

# Liste des cinémas (JSON)
THEATERS=[{"id":"P8507","name":"Pathé Carré de Soie","latitude":45.7641958,"longitude":4.9212527}]
```

### Obtenir les clés API

| Service | Lien | Description |
|---------|------|-------------|
| 🎬 TMDB | [themoviedb.org](https://www.themoviedb.org/settings/api) | Métadonnées des films |
| 🗺️ Mapbox | [mapbox.com](https://console.mapbox.com/account/access-tokens/) | Carte interactive |

---

## 🏗️ Architecture

### Structure du projet

```
cinelyon/
├── 📄 app.py                 # Application Flask principale
├── 📄 requirements.txt       # Dépendances Python
├── 📄 .env                   # Variables d'environnement
├── 📁 modules/
│   └── 📄 Classes.py         # Classes métier (Movie, Theater, Showtime)
├── 📁 templates/
│   ├── 📄 base.html          # Template de base
│   └── 📄 index.html         # Page principale
└── 📁 static/
    ├── 📁 css/
    │   └── 📄 main.css       # Styles CSS
    ├── 📁 font/              # Polices personnalisées
    └── 📁 images/            # Images et icônes
```

### Stack technique

```mermaid
graph TD
    A[🌐 Frontend] --> B[Flask Backend]
    B --> C[Allociné API]
    B --> D[TMDB API]
    B --> E[Mapbox API]
    
    A --> |HTML/CSS/JS| F[Interface utilisateur]
    B --> |Python 3.10| G[Serveur Gunicorn]
```

---

## ⚙️ Configuration avancée

### Ajouter de nouveaux cinémas

> ⚠️ Plus il y a de cinémas, plus le temps de chargement sera long

Modifiez la variable `THEATERS` dans votre fichier `.env` :

```json
[
  {"id":"P8507","name":"Pathé Carré de Soie","latitude":45.7641958,"longitude":4.9212527},
  {"id":"NOUVEAU_ID","name":"Nouveau Cinéma","latitude":XX.XXXXX,"longitude":X.XXXXX}
]
```

#### Trouver l'ID d'un cinéma

Consultez l'URL Allociné du cinéma :
- **URL** : `https://www.allocine.fr/seance/salle_gen_csalle=P8507.html`
- **ID** : `P8507`

### Personnalisation

| Élément | Fichier | Description |
|---------|---------|-------------|
| Titre du site | `app.py` | Modifier `WEBSITE_TITLE` |
| Styles | `static/css/main.css` | Design de l'interface |
| Couleurs | `static/css/main.css` | Variables CSS |

---

## 🌐 Déploiement

### Heroku

1. **Créez un `Procfile`** :
   ```
   web: gunicorn app:app
   ```

2. **Déployez** :
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

### Docker

```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
```

```bash
# Build et run
docker build -t cinelyon .
docker run -p 5000:5000 cinelyon
```

---

## 🤝 Contribution

Les contributions sont les bienvenues ! 🎉

```bash
# 1. Fork le projet
# 2. Créer une branche
git checkout -b feature/AmazingFeature

# 3. Commiter vos changements
git commit -m 'Add some AmazingFeature'

# 4. Pousser vers la branche
git push origin feature/AmazingFeature

# 5. Ouvrir une Pull Request
```

---

## ⚠️ Problèmes connus

| Problème | Description |
|----------|-------------|
| 🔄 Données Allociné | Peuvent être temporairement indisponibles |
| 📖 Synopsis manquants | Certains films non trouvés sur TMDB |
| 📅 Dates de sortie | Parfois incorrectes ou inexistantes |

---

## 📝 Crédit

> Ce projet est un fork de [grainParisArt-Public](https://github.com/solene-drnx/grainParisArt-Public).

---

<div align="center">

**🎬 CinéLyon** — *Parce que le cinéma lyonnais mérite plus d'attention !*

<br/>

[![GitHub stars](https://img.shields.io/github/stars/votre-username/cinelyon?style=social)](https://github.com/votre-username/cinelyon)
[![GitHub forks](https://img.shields.io/github/forks/votre-username/cinelyon?style=social)](https://github.com/votre-username/cinelyon/fork)

</div>
