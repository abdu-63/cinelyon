# Instructions pour les Agents IA — Projet CinéLyon Web (Next.js v2)

> Ce document sert de guide de référence persistant, prioritaire et de constitution opérationnelle pour toute IA (Claude, Gemini, Antigravity, etc.) intervenant sur le codebase de **CinéLyon Web**.
> Il doit être consulté systématiquement au début de chaque session de travail afin d'appliquer avec rigueur les protocoles locaux et les règles d'architecture établis.

---

## 🚀 Mode Spec-Driven Development Autonome (Workflow End-to-End)

Dès que l'utilisateur demande une nouvelle fonctionnalité, une refonte, un refactoring ou la correction d'une anomalie complexe :

### 1. Cycle SDD Autonome (End-to-End)

Enchaîne automatiquement et sans interruption les étapes Spec-Kit suivantes :

1. **Spécification** : Invoque `@speckit.specify` (ou la compétence `speckit-specify`) pour analyser le besoin, formaliser les critères d'acceptation et créer/mettre à jour `spec.md`.
2. **Clarification (si nécessaire)** : Invoque `@speckit.clarify` (ou `speckit-clarify`) pour lever les zones d'ombre ou ambiguïtés critiques.
3. **Planification technique** : Enchaîne avec `@speckit.plan` (ou la compétence `speckit-plan`) pour concevoir l'architecture technique dans `plan.md` en inspectant le code de référence de `cinelyon-app`.
4. **Découpage des tâches** : Invoque `@speckit.tasks` (ou la compétence `speckit-tasks`) pour générer la liste ordonnée des tâches atomiques dans `tasks.md`.
5. **Implémentation** : Exécute `@speckit.implement` (ou la compétence `speckit-implement`) pour coder les modifications tâche par tâche, en validant chaque étape terminée dans `tasks.md`.
6. **Convergence & Vérification** : Invoque `@speckit.converge` (ou la compétence `speckit-converge`) pour auditer le code produit face aux spécifications, s'assurer de la non-régression et finaliser le travail.

### 2. Règles d'Exécution SDD

- **Autonomie complète** : Ne t'arrête pas entre les étapes pour demander une validation intermédiaire à l'utilisateur, sauf en cas de blocage critique, de décision architecturale destructrice ou d'incohérence majeure.
- **Référence esthétique absolue** : Le design, l'ergonomie et le comportement doivent reproduire avec exactitude l'application mobile `cinelyon-app` (Liquid Glass, micro-animations, palettes, typographies et hiérarchie visuelle).

---

## 🌐 1. Contexte & Architecture Technique

**CinéLyon Web** est la version web officielle de CinéLyon, conçue sous **Next.js 15+ (App Router)** pour offrir une expérience cinématographique ultra-fluide, haute performance, SEO-friendly et esthétiquement identique à l'application mobile iOS/Android.

### Stack Technique

| Couche | Technologies |
|---|---|
| **Framework Web** | Next.js 15+ / React 19 (App Router, Server Components & Client Components) |
| **Langage** | TypeScript strict |
| **Styles & Design System** | Tailwind CSS, Lucide Icons, Tokens "Liquid Glass" (Apple Design System) |
| **Animations & Mouvement** | Framer Motion (ressorts physiques, entrées/sorties, layout transitions) |
| **État & Données** | TanStack React Query (`@tanstack/react-query`), Supabase (`@supabase/supabase-js`) |
| **Pipelines Backend & Scraping** | Python 3.11 (`scrape.py`, `legacy-flask/`), Scripts Instagram Node/TS (`scripts/instagram/`) |
| **Déploiement & Hébergement** | Vercel (`vercel.json`) |

### Arborescence Clé

```
cinelyon/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Layout racine (Theme, Providers, Header, Mobile Floating Bar)
│   │   ├── page.tsx              # Page d'accueil (Hero, Mini-calendrier, Filtres, Cartes films)
│   │   ├── film/[slug]/page.tsx  # Fiche film enrichie (Hero, Séances, Cast, RunPee, Post-Credits)
│   │   ├── map/page.tsx          # Carte interactive des cinémas & arrêts TCL
│   │   ├── api/chat/route.ts     # Route API CineBot AI (Gemini)
│   │   └── suggestions/page.tsx  # Formulaire de suggestions & retours
│   ├── components/
│   │   ├── layout/               # Header Desktop, Floating Glass TabBar Mobile, Footer
│   │   ├── ui/                   # FilmCard, DaySelector, FilterBar, CineBot, Modales
│   │   └── map/                  # Composant cartographique et popups TCL
│   ├── context/                  # ThemeContext, CineBotContext, I18nContext
│   ├── hooks/                    # useShowtimes, useFavorites, useFilmCast, useTcl
│   ├── lib/                      # supabase.ts, queryClient.ts, theme.ts, constants.ts
│   ├── styles/                   # globals.css, theme tokens
│   ├── types/                    # index.ts (Film, Seance, Cinema, DateLabel, FilterState)
│   └── utils/                    # dateUtils, showtimes, calendarUtils, tclRouting, textUtils
├── scripts/
│   └── instagram/                # Pipeline de publication Instagram automatisé
├── legacy-flask/                 # Archive de l'ancienne version Flask & scraping Python
└── .agents/                      # Compétences et configuration de l'environnement IA
```

---

## 🎨 2. Charte Visuelle & Principes de Design (Qualité UI/UX Obligatoire)

> 💎 **Exigence de Craft & Finition Visuelle** :
> L'interface web ne doit en aucun cas ressembler à un template basique. Elle doit impressionner au premier coup d'œil par sa fluidité, son élégance sombre et ses textures de verre dépoli.

### Tokens de Design "Liquid Glass"
- **Mode Sombre Profond (Défaut)** :
  - Fond de page : `#121212` avec dégradé subtil radial violet (`rgba(130, 44, 247, 0.15)`).
  - Cartes & Surfaces : `rgba(30, 30, 30, 0.65)` avec `backdrop-blur-xl`, bordure subtile `rgba(255, 255, 255, 0.08)`.
  - Accent primaire : Violet électrique `#444cf7` (avec variantes bleu, blanc, noir).
  - Badges formats : IMAX (bleu/or), 3D (cyan), Dolby (magenta), VOST / VF (contrastés).
- **Mode Clair** :
  - Fond : `#f5f6f8`, Cartes : `rgba(255, 255, 255, 0.75)` avec `backdrop-blur-md` et bordure `#e5e7eb`.
- **Micro-interactions (Emil Kowalski / Apple Design)** :
  - Effets de clic avec léger amorti (`scale(0.97)`).
  - Transitions à ressort naturel (`type: "spring", stiffness: 400, damping: 30`).
  - Skeleton screens soignés avec animation de shimmer lors du chargement des données.

### Ergonomie Responsive Hybride
- **Mobile / Tablette (< 1024px)** :
  - Barre de navigation basse flottante (*Floating Liquid Glass Tab Bar*) avec icônes Lucide actives lumineuses.
  - Cartes films empilées avec poster vertical et déploiement fluide des séances.
- **Desktop (≥ 1024px)** :
  - Header supérieur en verre dépoli avec logo CinéLyon, barre de recherche rapide, sélecteur de jours et navigation principale.
  - Grille de films aérée et équilibrée avec accès direct aux détails au survol.

---

## 🧠 3. Compétences Locales Actives (`.agents/skills/`)

| Compétence | Moment d'invocation | Objectif |
| :--- | :--- | :--- |
| **`speckit-*`** | Cadrage, planification et découpage | Pipeline autonome Spec-Kit pour structurer les chantiers sans dérive. |
| **`ui-ux-pro-max`** | Conception d'écrans et composants | Référentiel complet de styles, palettes, typographies et règles ergonomiques. |
| **`frontend-design`** | Direction artistique web | Interfaces distinctives, identité cinématographique et typographie soignée. |
| **`emil-design-eng`** | Finitions et micro-interactions | Micro-animations, feedbacks tactiles/visuels, courbes d'accélération. |
| **`apple-design`** | Matériaux translucides et ergonomie | Translucidité, hiérarchie de l'information et contrôles segmentés. |
| **`animate`** | Implémentation du mouvement | Animations CSS / Framer Motion performantes sans blocage du thread UI. |
| **`vercel-react-best-practices`**| Code React / Next.js | Élimination des re-renders inutiles, Server vs Client Components, dynamic imports. |

---

## ⚡ 4. Bonnes Pratiques de Développement & Performance

1. **Server Components vs Client Components** :
   - Les pages racine (`page.tsx`, `film/[slug]/page.tsx`) sont des Server Components pour le pré-rendu SEO et le chargement direct depuis Supabase.
   - Les composants interactifs (`FilmCard`, `FilterBar`, `DaySelector`, `ChatBot`, `Map`) sont des Client Components (`'use client'`).
2. **Chargement Paresseux des Composants Lourds** :
   - Utiliser `next/dynamic` pour charger la carte interactive (`Leaflet`), la roulette et le chatbot uniquement lorsque nécessaire.
3. **Mémoïsation & Fluidité** :
   - Envelopper les composants de liste de films dans `React.memo` et mémoïser les calculs de filtrage lourds avec `useMemo`.
4. **Accessibilité (a11y)** :
   - Renseigner systématiquement des attributs `aria-label` sur tous les boutons d'action (favoris, filtres, modales) et respecter les contrastes WCAG AA.
