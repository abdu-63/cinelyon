# Instructions pour les Agents IA — Projet CinéLyon

> Ce document sert de guide de référence persistant, prioritaire et de constitution opérationnelle pour toute IA (Claude, Gemini, Antigravity, etc.) intervenant sur le codebase du projet **CinéLyon**.
> Il doit être consulté systématiquement au début de chaque session de travail afin d'appliquer avec rigueur les protocoles locaux et les règles d'architecture établis.

---

## 🚀 Mode Spec-Driven Development Autonome (Workflow End-to-End)

Dès que l'utilisateur demande une nouvelle fonctionnalité, une refonte, un refactoring ou la correction d'une anomalie complexe :

### 1. Cycle SDD Autonome (End-to-End)

Enchaîne automatiquement et sans interruption les étapes Spec-Kit suivantes :

1. **Spécification** : Invoque `@speckit.specify` (ou la compétence `speckit-specify`) pour analyser le besoin, formaliser les critères d'acceptation et créer/mettre à jour `spec.md`.
2. **Clarification (si nécessaire)** : Invoque `@speckit.clarify` (ou `speckit-clarify`) pour lever les zones d'ombre ou ambiguïtés critiques.
3. **Planification technique** : Enchaîne avec `@speckit.plan` (ou la compétence `speckit-plan`) pour concevoir l'architecture technique dans `plan.md` en inspectant le code existant de `cinelyon`.
4. **Découpage des tâches** : Invoque `@speckit.tasks` (ou la compétence `speckit-tasks`) pour générer la liste ordonnée des tâches atomiques dans `tasks.md`.
5. **Implémentation** : Exécute `@speckit.implement` (ou la compétence `speckit-implement`) pour coder les modifications tâche par tâche, en validant chaque étape terminée dans `tasks.md`.
6. **Convergence & Vérification** : Invoque `@speckit.converge` (ou la compétence `speckit-converge`) pour auditer le code produit face aux spécifications, s'assurer de la non-régression et finaliser le travail.

### 2. Règles d'Exécution SDD

- **Autonomie complète** : Ne t'arrête pas entre les étapes pour demander une validation intermédiaire à l'utilisateur, sauf en cas de blocage critique, de décision architecturale destructrice ou d'incohérence majeure.
- **Respect de l'existant** : Réutilise toujours au maximum les modules métier (`modules/Classes.py`), les routes Flask existantes, les styles CSS (`static/css/main.css`) et les scripts JS en place sans réinventer de patterns divergents.

---

## 🌐 1. Contexte & Architecture du Projet

**CinéLyon** est une plateforme moderne, multi-plateforme et haute performance dédiée aux cinéphiles lyonnais, agrégeant les séances de 19 cinémas de la métropole avec une forte dimension éditoriale (reprises cultes, patrimoine, festivals, cycles, classements mondiaux).

Le projet s'articule autour de trois composantes principales :
1. **PWA (Progressive Web App)** — Plateforme publique accessible sur [cinelyon.fr](https://cinelyon.fr) permettant aux Lyonnais de consulter toutes les séances de l'agglomération en un seul endroit, avec fonctionnement hors-ligne et mise en cache intelligente.
2. **Pipeline Scraping & Données** — Moteur automatisé en Python (`scrape.py`) extrayant les horaires, formats et métadonnées cinéma (Allociné, TMDB) et synchronisant la base Supabase.
3. **Orchestrateur Instagram** — Pipeline automatisé Node.js / TypeScript (`scripts/instagram/`) qui sélectionne les séances phares quotidiennes, génère des visuels graphiques (Satori / Resvg) et publie sur [@cinelyon.fr](https://www.instagram.com/_u/cinelyon.fr/).

*(Note : L'application mobile dédiée iOS / Android fait l'objet d'un dépôt séparé `cinelyon-app` en React Native / Expo 52).*

### Stack Technique

| Couche | Technologies |
|---|---|
| **Backend & API** | Python 3.11, Flask 3.1.1 (`app.py`), modules métier (`modules/Classes.py`), WSGI Serverless |
| **Frontend Web & PWA** | Vanilla JavaScript (`static/js/`), Vanilla CSS (`static/css/main.css`), Templates Jinja2 (`templates/`) |
| **PWA & Cache** | Service Worker (`static/sw.js`), Manifest (`static/manifest.json`), invalidation par paramètre de version `?v=X.X` |
| **Base de Données** | Supabase (PostgreSQL) avec Row Level Security (RLS) active |
| **Pipeline Scraping** | Python (`scrape.py`) vers Allociné et API The Movie Database (TMDB) |
| **Pipeline Instagram** | Node.js / TypeScript (`scripts/instagram/`), rendu Satori / Resvg / JSX, Meta Graph API |
| **Déploiement & CI/CD** | Vercel (`vercel.json`), GitHub Actions (scraping bi-quotidien et publication Instagram) |

### Arborescence Clé

```
cinelyon/
├── app.py                        # Serveur Flask principal + routes
├── scrape.py                     # Scraping des séances (Allociné, TMDB, etc.)
├── AGENTS.md                     # Instructions et cadrage des agents IA
├── .agents/
│   └── skills/                   # Compétences locales actives pour les agents
├── modules/
│   └── Classes.py                # Modèles et logique métier Python
├── static/
│   ├── css/main.css              # Feuille de style CSS unique
│   ├── js/
│   │   ├── index.js              # JS page d'accueil (filtres, calendrier, recherche)
│   │   ├── film.js               # JS page film
│   │   ├── settings.js           # JS panneau paramètres & préférences
│   │   └── chatbot.js            # JS assistant conversationnel CineBot
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
        ├── 00_seed_database.ts   # Enrichissement de la base
        ├── 01_select_films.ts    # Sélection algorithmique des films du jour
        ├── 02_fetch_showtimes.ts # Récupération des séances
        ├── 03_generate_images.tsx# Rendu JSX -> SVG -> PNG (Satori / Resvg)
        ├── 04_generate_caption.ts# Génération de la description et des hashtags
        ├── 05_publish_instagram.ts # Publication sur Meta Graph API
        └── run.ts                # Orchestrateur du pipeline
```

---

## 🧠 2. Compétences Locales Actives (`.agents/skills/`)

L'écosystème de compétences a été configuré spécifiquement pour ce projet afin d'optimiser le contexte, réduire la consommation de tokens et encadrer chaque étape de développement.

### Workflow Spec-Driven Development (Spec Kit)

| Compétence | Source | Moment d'invocation | Objectif |
| :--- | :--- | :--- | :--- |
| **`speckit-constitution`** | Locale (`.agents/skills`) | Définition ou mise à jour des principes | Établit ou actualise les principes constitutionnels du projet dans `.specify/memory/constitution.md`. |
| **`speckit-specify`** | Locale (`.agents/skills`) | Cadrage initial / nouvelle fonctionnalité | Crée ou met à jour la spécification technique et fonctionnelle détaillée (`spec.md`). |
| **`speckit-clarify`** | Locale (`.agents/skills`) | Avant planification (optionnel) | Pose des questions structurées pour dé-risquer et lever les zones d'ombre de la spec. |
| **`speckit-plan`** | Locale (`.agents/skills`) | Après spécification & clarification | Établit le plan d'architecture et de conception technique (`plan.md`). |
| **`speckit-checklist`** | Locale (`.agents/skills`) | Après planification (optionnel) | Génère des checklists de validation des exigences (complétude, clarté, cohérence). |
| **`speckit-tasks`** | Locale (`.agents/skills`) | Après le plan d'architecture | Découpe le plan en tâches atomiques, indépendantes et ordonnées (`tasks.md`). |
| **`speckit-analyze`** | Locale (`.agents/skills`) | Après génération des tâches (optionnel) | Analyse la consistance et cohérence croisée entre `spec.md`, `plan.md` et `tasks.md`. |
| **`speckit-implement`** | Locale (`.agents/skills`) | Phase d'exécution / développement | Exécute l'implémentation complète en suivant fidèlement les tâches définies dans `tasks.md`. |
| **`speckit-converge`** | Locale (`.agents/skills`) | Après implémentation | Évalue l'écart entre le codebase et les specs/plans, et ajoute les tâches restantes si nécessaire. |
| **`speckit-taskstoissues`** | Locale (`.agents/skills`) | Suivi de projet GitHub | Convertit les tâches du plan en issues GitHub ordonnées. |

### Ingénierie, Méthodologie & Qualité de Code

| Compétence | Source | Moment d'invocation | Objectif |
| :--- | :--- | :--- | :--- |
| **`to-spec`** | Locale (`.agents/skills`) | En amont du développement pour formaliser un besoin | Conversion des discussions et besoins en spécifications techniques complètes. |
| **`to-tickets`** | Locale (`.agents/skills`) | Après spécification, avant le découpage de tâches | Découpage en tranches verticales indépendantes (*tracer bullets*) avec dépendances bloquantes. |
| **`codebase-design`** | Locale (`.agents/skills`) | Conception ou refactoring de modules / adaptateurs | Conception de modules profonds (*deep modules* : interface simple, forte valeur métier, isolation des seams). |
| **`domain-modeling`** | Locale (`.agents/skills`) | Définition des termes métier et décisions d'architecture | Modélisation du domaine métier, mise à jour du glossaire (`CONTEXT.md`) et formalisation des ADRs. |
| **`brainstorming`** | Locale (`.agents/skills`) | Avant toute création majeure de fonctionnalité ou UI | Exploration des besoins utilisateurs, intentions et alternatives architecturales avant de coder. |
| **`tdd`** | Locale (`.agents/skills`) | Durant le développement de logique métier ou calculs | Développement piloté par les tests (Red-Green-Refactor, tests Pytest / JS). |
| **`diagnosing-bugs`** | Locale (`.agents/skills`) | En phase de diagnostic de bug, régression ou anomalie | Protocole systématique de diagnostic (boucle rouge/vert, minimal repro, hypothèses réfutables, test de non-régression). |
| **`code-review`** | Locale (`.agents/skills`) | Avant commit, ouverture de PR ou validation | Revue de code rigoureuse sur deux axes indépendants : Standards (conventions du repo) et Spécification (fidélité au besoin). |
| **`handoff`** | Locale (`.agents/skills`) | En fin de session ou passage de relais entre agents | Synthèse de passation propre pour reprise de contexte immédiate par un autre agent. |
| **`unlazy`** | Locale (`.agents/skills`) | Tâches d'envergure, audits complets ou refontes | Discipline de complétion stricte : définition de portes d'acceptation (`GATES.md`), Depth Tree et vérification d'oracles exécutables. |
| **`improve-codebase-architecture`** | Locale (`.agents/skills`) | Audit périodique et refactoring structurel | Analyse des opportunités de refactoring architectural et approfondissement (*deepening*) des modules superficiels. |
| **`prompt-master`** | Locale (`.agents/skills`) | Rédaction ou optimisation de prompts IA | Génération et calibration de prompts de haute performance pour LLMs, outils d'images, scripts de génération ou agents. |

### Design, Ergonomie & Animations

| Compétence | Source | Moment d'invocation | Objectif |
| :--- | :--- | :--- | :--- |
| **`ui-ux-pro-max`** | Locale (`.agents/skills`) | Dès la conception d'écrans, composants ou revues UX/a11y | Intelligence de design UI/UX (79 styles, 192 palettes, 74 typographies, 119 règles UX, accessibilité WCAG, ergonomie web). |
| **`frontend-design`** | Locale (`.agents/skills`) | Direction artistique et chartes graphiques | Création d'interfaces distinctives et cinématographiques non-génériques, hiérarchie visuelle sombre et élégante. |
| **`emil-design-eng`** | Locale (`.agents/skills`) | Peaufinage des composants interactifs et micro-animations | Craft des micro-interactions, rétroaction tactile/visuelle, courbes `ease-out`, vitesse perçue et finitions. |
| **`animate`** | Locale (`.agents/skills`) | Implémentation de transitions et mouvement | Cadre décisionnel et implémentation d'animations CSS/JS fluides et performantes (timing, courbes, transitions interrompables). |
| **`review-animations`** | Locale (`.agents/skills`) | Revue spécialisée de code d'animation | Audit qualité et fluidité du mouvement face aux contraintes de rendu et critères de craft. |
| **`apple-design`** | Locale (`.agents/skills`) | Conception d'interfaces épurées et interactions gestuelles | Directives d'interaction Apple/iOS (ressorts physiques, momentum, disposition des contrôles, matériaux translucides). |
| **`vercel-react-best-practices`** | Locale (`.agents/skills`) | Développement et optimisation de composants JS/React | Bonnes pratiques de performance (élimination des cascades asynchrones, mémoïsation, bundle footprint). |
| **`caveman`** | Globale (`~/.gemini/config/skills/`) / `/caveman` | À la demande explicite (`/caveman`) | Communication ultra-compressée pour économiser ~65% de tokens tout en conservant une rigueur technique absolue. |

---

## 🎯 3. Règles d'Exécution & Bonnes Pratiques

### Règles Générales d'Agents
1. **Priorité locale absolue :** Tu dois systématiquement consulter et exécuter les instructions présentes dans `.agents/skills/<nom-du-skill>/SKILL.md` pour chaque phase correspondante (spécification, TDD, reproduction de bug, revue, ergonomie, design).
2. **Communication concise et de qualité :** Privilégier des réponses claires, directes et sans bavardage inutile. Le skill `/caveman` n'est **jamais actif par défaut** et doit être utilisé **uniquement sur demande explicite** de l'utilisateur (via `/caveman`), afin de préserver la qualité de réflexion, de design et de code.
3. **Pas de dérive globale :** N'utilise aucune directive liée à des domaines non présents dans ce projet (ex. Shopify, Weaverse, Roblox, WordPress).
4. **Clarté & Modularité :** Écrire un code propre, lisible et modulaire. Préférer des fonctions courtes avec un rôle unique. Documenter le *pourquoi* des choix techniques dans les commentaires.
5. **Pas de dépendances inutiles :** Éviter d'introduire de nouvelles bibliothèques externes sans validation explicite.

### Supabase & RLS
- ⚠️ **Ne jamais casser la logique RLS**. Toute requête ou migration SQL doit être strictement compatible avec les politiques Row Level Security existantes.
- Les migrations sensibles (`ALTER TABLE`, `DROP`, etc.) doivent impérativement être validées avant exécution.
- Se référer à `fix_rls.sql` pour le contexte des politiques existantes.

### Frontend Web (PWA)
- **Performances :** Éviter les re-renders inutiles, minimiser les requêtes réseau, favoriser le lazy loading des images de posters (`loading="lazy"`).
- **Accessibilité (a11y) :** Tous les éléments interactifs doivent comporter un `aria-label` ou un texte descriptif clair. Respecter les contrastes WCAG AA minimum.
- **Stack Vanilla :** Le site web utilise du **Vanilla JS** et du **Vanilla CSS**. Ne pas introduire de frameworks JS (React, Vue, etc.) côté frontend PWA sans validation explicite.
- **CSS centralisé :** Tous les styles résident dans `static/css/main.css`. Ne pas insérer de styles inline sauf cas absolument exceptionnel.

### Backend Python & Scraping
- **Typage & Robustesse :** Coder avec typage Python 3.11 (`typing`) dans `modules/Classes.py` et `app.py`.
- **Gestion des erreurs de scraping :** Toujours prévoir des fallbacks en cas d'indisponibilité d'un cinéma, d'une page Allociné ou d'un quota TMDB.
- **Performances Serverless :** Minimiser le temps d'exécution au démarrage de Flask sur Vercel (chargement paresseux des modules lourds si nécessaire).

---

## ⚡ 4. Règle Stricte de Versioning et Gestion du Cache PWA

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

## 📸 5. Pipeline Instagram & Automatisation

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

## 🚀 6. Déploiement & CI/CD

- **Hébergement Web :** Vercel (`vercel.json`), backend Flask exposé via une Serverless Function.
- **Automatisation & Cron :** GitHub Actions gère le scraping bi-quotidien des séances et la publication Instagram quotidienne à 20h.
- **Vérification pré-déploiement :** Après toute modification statique, s'assurer que la version du cache PWA a bien été incrémentée (`bump_pwa_version.py`).
