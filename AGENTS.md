# Instructions pour les Agents IA — Projet CinéLyon

> Ce fichier sert de référence persistante et prioritaire pour toute IA (Claude, Gemini, Antigravity, etc.) intervenant sur ce projet.
> Il doit être consulté systématiquement au début de chaque session de travail.

---

## 1. Contexte & Architecture du Projet

**CinéLyon** est une plateforme moderne et multi-plateforme dédiée aux cinéphiles lyonnais, agrégeant les séances de 19 cinémas de la métropole avec une forte dimension éditoriale (reprises cultes, patrimoine, festivals, classements mondiaux).

Le projet comprend trois composantes principales :
1. **PWA (Progressive Web App)** — Plateforme publique accessible sur [cinelyon.fr](https://cinelyon.fr) permettant aux Lyonnais de consulter toutes les séances de l'agglomération en un seul endroit.
2. **Application Mobile** — Application mobile cross-platform (iOS/Android) développée en React Native / Expo pour une consultation optimisée en déplacement.
3. **Orchestrateur Instagram** — Pipeline automatisé qui sélectionne les séances phares, génère des visuels graphiques et publie quotidiennement sur le compte [@cinelyon.fr](https://www.instagram.com/_u/cinelyon.fr/).

### Stack Technique

| Couche | Technologies |
|---|---|
| **Backend & API** | Python 3.11, Flask 3.1.1 (`app.py`), modules métier (`modules/Classes.py`) |
| **Frontend Web** | Vanilla JavaScript (`static/js/`), Vanilla CSS (`static/css/main.css`), Jinja2 templates (`templates/`) |
| **PWA & Cache** | Service Worker (`static/sw.js`), Manifest (`static/manifest.json`), invalidation par paramètre de version `?v=X.X` |
| **App Mobile** | React Native, Expo 52 (SDK 52), Expo Router, TypeScript, `StyleSheet` natif |
| **Base de Données** | Supabase (PostgreSQL) avec Row Level Security (RLS) active |
| **Pipeline Scraping** | Python (`scrape.py`) vers Allociné et TMDB |
| **Pipeline Instagram** | Node.js / TypeScript (`scripts/instagram/`), rendu Satori / Resvg / JSX, Meta Graph API |
| **Déploiement & CI/CD** | Vercel (`vercel.json`), GitHub Actions (scraping bi-quotidien et publication Instagram) |

### Arborescence Clé

```
cinelyon/
├── app.py                        # Serveur Flask principal + routes
├── scrape.py                     # Scraping des séances (Allociné, TMDB, etc.)
├── AGENTS.md                     # Instructions et cadrage des agents IA
├── skills/                       # Compétences locales actives pour les agents
├── mobile/                       # Application mobile Expo (React Native)
│   ├── app/                      # Routes et écrans de l'application (Expo Router)
│   ├── src/
│   │   └── components/
│   │       └── ui/               # Composants de l'interface (FilmCard, FilterBar, etc.)
│   ├── app.json                  # Configuration Expo (dont versions & plugins)
│   └── package.json              # Dépendances de l'application mobile
├── modules/
│   └── Classes.py                # Modèles et logique métier Python
├── static/
│   ├── css/main.css              # Feuille de style CSS unique
│   ├── js/
│   │   ├── index.js              # JS page d'accueil
│   │   ├── film.js               # JS page film
│   │   ├── settings.js           # JS panneau paramètres
│   │   └── chatbot.js            # JS assistant conversationnel
│   ├── sw.js                     # Service Worker PWA
│   └── manifest.json             # Manifest PWA
├── templates/
│   ├── base.html                 # Template de base (header, footer, SW, settings modal)
│   ├── index.html                # Page d'accueil (liste des films/séances)
│   ├── film.html                 # Page de détail d'un film
│   └── suggestions.html          # Page de suggestions/bugs
├── tests/
│   └── test_basic.py             # Tests unitaires Pytest
└── scripts/
    ├── bump_pwa_version.py       # Script d'invalidation automatique du cache PWA
    └── instagram/                # Pipeline Instagram (TypeScript)
        ├── 00_seed_database.ts
        ├── 01_select_films.ts
        ├── 02_fetch_showtimes.ts
        ├── 03_generate_images.tsx
        ├── 04_generate_caption.ts
        ├── 05_publish_instagram.ts
        └── run.ts                # Orchestrateur du pipeline
```

---

## 2. Compétences Locales Actives (`./skills/`)

L'écosystème de compétences a été configuré spécifiquement pour ce projet afin d'optimiser le contexte, réduire la consommation de tokens et éviter les interférences d'outils tiers.

| Compétence | Source | Moment d'invocation | Objectif |
| :--- | :--- | :--- | :--- |
| `to-spec` | Global (`.agents`) | Phase de cadrage / Nouvelle fonctionnalité | Transformer une discussion ou un besoin en spécification formelle actionnable. |
| `to-tickets` | Global (`.agents`) | Après spécification / Planification | Découper un plan ou une spec en tickets verticaux (tracer-bullets) avec dépendances bloquantes. |
| `codebase-design` | Global (`.agents`) | Conception & Restructuration de code | Concevoir des modules profonds (*deep modules*) avec interfaces restreintes et forte testabilité. |
| `domain-modeling` | Global (`.agents`) | Définition métier / Terminologie | Structurer et maintenir le modèle de domaine, le glossaire et les décisions d'architecture (ADR). |
| `tdd` | Global (`.agents`) | Avant & pendant le développement | Appliquer le cycle Red-Green-Refactor et concevoir des tests unitaires/intégration fiables. |
| `diagnosing-bugs` | Global (`.agents`) | En phase de debug / Régression | Diagnostic méthodique et reproduction systématique de bugs complexes ou de lenteurs. |
| `code-review` | Global (`.agents`) | Avant fusion / Fin d'implémentation | Revue à double axe (Standards du repo & Conformité avec la spécification). |
| `handoff` | Global (`.agents`) | Fin de session / Transition d'agent | Synthétiser le contexte, l'état d'avancement et les étapes suivantes pour une reprise fluide. |
| `ui-ux-pro-max` | Global (`.agents`) | Conception & Révision UI/UX / a11y | Guide d'intelligence design pour l'ergonomie, accessibilité WCAG, typographie, couleurs et UX web. |
| `frontend-design` | Global / Antigravity | Création ou refonte d'interface | Assurer une identité visuelle forte, cinématographique et distinctive, évitant les designs génériques. |
| `emil-design-eng` | Global / Antigravity | Implémentation & Finition UI | Philosophie d'ingénierie design : micro-détails, interactions soignées et polish d'interface. |
| `animate` | Global / Antigravity | Ajout de transitions / Micro-animations | Concevoir et implémenter des animations fluides et performantes adaptées à l'expérience. |
| `review-animations` | Global / Antigravity | Revue de code de mouvement | Auditer et évaluer la qualité, la fluidité et la pertinence des animations selon un haut niveau d'exigence. |

---

## 3. Règles d'Exécution & Bonnes Pratiques

### Règles Générales d'Agents
1. **Priorité locale :** Tu dois systématiquement consulter et exécuter les instructions présentes dans `./skills/<nom-du-skill>/SKILL.md` pour chaque phase correspondante (spécification, TDD, reproduction de bug, revue, ergonomie, design).
2. **Pas de dérive globale :** N'utilise aucune directive liée à des domaines non présents dans ce dossier local (ex. Roblox, Shopify/Hydrogen/Weaverse, frameworks React/Next lourds non adaptés à la stack Vanilla JS/CSS/Flask du site web).
3. **Clarté & Modularité :** Écrire un code propre, lisible et modulaire. Préférer des fonctions courtes avec un seul rôle. Expliquer le *pourquoi* des choix techniques dans les commentaires.
4. **Pas de dépendances inutiles :** Éviter d'introduire de nouvelles dépendances ou bibliothèques externes sans validation explicite.

### Supabase & RLS
- ⚠️ **Ne jamais casser la logique RLS**. Toute requête ou migration SQL doit être strictement compatible avec les politiques Row Level Security existantes.
- Les migrations sensibles (`ALTER TABLE`, `DROP`, etc.) doivent impérativement être validées avant exécution.
- Se référer à `fix_rls.sql` pour le contexte des politiques existantes.

### Frontend Web (PWA)
- **Performances :** Éviter les re-renders inutiles, minimiser les requêtes réseau, favoriser le lazy loading des images de posters.
- **Accessibilité (a11y) :** Tous les éléments interactifs doivent avoir un `aria-label` ou un texte descriptif clair. Respecter les contrastes WCAG AA minimum.
- **Stack Vanilla :** Le site web utilise du **Vanilla JS** et du **Vanilla CSS**. Ne pas introduire de frameworks JS (React, Vue, etc.) côté web sans validation explicite.
- **CSS centralisé :** Tous les styles résident dans `static/css/main.css`. Ne pas insérer de styles inline sauf cas absolument exceptionnel.

### Application Mobile (React Native / Expo)
- ⚠️ **Compatibilité iOS :** L'application mobile doit impérativement rester compatible avec **iOS 15.1** au minimum (défini via `deploymentTarget` dans `app.json`). Éviter toute API non supportée sur cette version d'iOS ou par Expo SDK 52.
- **Styles et Design :** Utiliser le système `StyleSheet` natif de React Native. Respecter la charte graphique sombre (fond sombre `#0d0d14`, typographie Outfit, etc.).
- **Cycle de vie & Performances :** Optimiser le rendu des listes et cartes de films/séances pour garantir un défilement à 60 FPS constant.
- **Permissions :** Gérer proprement les autorisations natives (`expo-calendar`, notifications) avec message d'information utilisateur.

---

## 4. Règle Stricte de Versioning et Gestion du Cache PWA

> ⚠️ **OBLIGATION ABSOLUTE** — Cette procédure doit être appliquée **à chaque fin de tâche** impliquant une modification des fichiers statiques (CSS ou JS). Sans cette étape, les utilisateurs continueront à voir l'ancienne version depuis le cache du Service Worker ou du navigateur.

### Contexte Technique
Le projet utilise un Service Worker (`static/sw.js`) avec une stratégie **Network First** pour les fichiers JS/CSS.
- L'invalidation côté Service Worker se fait via la constante `CACHE_VERSION`.
- L'invalidation côté navigateur (HTTP cache) se fait via le paramètre de query `?v=X.X` dans les balises `<link>` et `<script>` des templates HTML.

### Automatisation du Versioning (Méthode Recommandée)

Pour incrémenter de manière cohérente l'ensemble des fichiers en une seule commande :

1. **En local :**
   ```bash
   python3 scripts/bump_pwa_version.py
   ```
2. **Via GitHub Actions (Workflow manuel) :**
   ```bash
   gh workflow run "Bump PWA Version"
   ```
   *(Ce workflow exécute le script Python et commite automatiquement les changements).*

---

### Checklist Manuelle d'Invalidation (Si nécessaire)

#### Étape 1 — `static/sw.js` : incrémenter `CACHE_VERSION`
```js
// Avant
const CACHE_VERSION = "v39";

// Après (exemple)
const CACHE_VERSION = "v40";
```

#### Étape 2 — `templates/base.html` : mettre à jour `?v=X.X`
```html
<!-- CSS principal -->
<link rel="stylesheet" href="{{url_for('static', filename='css/main.css')}}?v=1.23">

<!-- Script settings -->
<script src="{{ url_for('static', filename='js/settings.js') }}?v=1.21" defer></script>

<!-- Script chatbot -->
<script src="{{ url_for('static', filename='js/chatbot.js') }}?v=1.21" defer></script>
```

#### Étape 3 — `templates/index.html` : mettre à jour `?v=X.X` de `index.js`
```html
<script src="{{ url_for('static', filename='js/index.js') }}?v=1.21" defer></script>
```

#### Étape 4 — `templates/film.html` : mettre à jour `?v=X.X` de `film.js`
```html
<script src="{{ url_for('static', filename='js/film.js') }}?v=1.21" defer></script>
```

#### Étape 5 — `templates/base.html` : mettre à jour l'affichage de la version
Dans la modale Paramètres (`.version-info`) :
```html
<div class="version-info" ...>Version 1.21</div>
```
*(Le numéro affiché doit correspondre à la version utilisateur de `settings.js`).*

---

## 5. Pipeline Instagram & Automatisation

- Le pipeline s'exécute via `scripts/instagram/run.ts` (orchestrateur TypeScript).
- Les étapes sont séquentielles et numérotées (`00_` à `05_`), ne pas modifier leur ordre d'exécution :
  - `00_seed_database.ts` : Initialisation et enrichissement de la base de référence.
  - `01_select_films.ts` : Sélection algorithmique des films du jour (prestige, curation, diversité).
  - `02_fetch_showtimes.ts` : Récupération des horaires précis.
  - `03_generate_images.tsx` : Génération des slides PNG via Satori / Resvg.
  - `04_generate_caption.ts` : Rédaction du texte et des hashtags.
  - `05_publish_instagram.ts` : Publication automatisée via l'API Graph Meta.
- **Sécurité :** Les secrets Instagram et Supabase sont dans `.env` / `.env.local` et ne doivent **jamais** être commités.
- Les images générées sont stockées dans `scripts/instagram/output/` (ignoré par Git).

---

## 6. Déploiement & CI/CD

- **Hébergement Web :** Vercel (`vercel.json`), backend Flask exposé via une Serverless Function.
- **Automatisation & Cron :** GitHub Actions gère le scraping bi-quotidien des séances et la publication Instagram quotidienne à 20h.
- **Vérification pré-déploiement :** Après toute modification statique, s'assurer que la version du cache PWA a bien été incrémentée (`bump_pwa_version.py`).
