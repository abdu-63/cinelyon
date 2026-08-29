---
name: cinelyon-web
description: >-
  Directives d'architecture, design system et implémentation pour le site officiel CinéLyon Web (Next.js 15+, App Router, Tailwind CSS, TypeScript, Supabase, React Query, i18n).
  À activer pour toute modification, refonte, ajout de composant, page ou modale sur le projet cinelyon web afin de garantir la parité absolue avec l'application mobile.
---

# CinéLyon Web — Directives de Développement & Design System

Ce skill rassemble l'ensemble des règles architecturales, directives de design et spécifications fonctionnelles pour le développement de **CinéLyon Web**.

---

## 🏛️ 1. Architecture & Stack Technique

- **Framework** : Next.js 15+ (App Router), React 19, TypeScript strict.
- **Styling** : Tailwind CSS v4, Variables CSS (`--bg-main`, `--card-bg`, `--primary: #444cf7`).
- **Données & État** : TanStack React Query (`@tanstack/react-query`), Supabase (`@supabase/supabase-js`).
- **Typographie** : `HealTheWebA` (corps et métas), `MontserratExtraBold` (titres et logos).
- **Internationalisation (i18n)** : Support strict de 9 langues (`fr`, `en`, `es`, `it`, `de`, `pt`, `ja`, `ar`, `tr`) via `src/i18n/`.

---

## 🎨 2. Design System & Rendu Visuel (Fidélité Mobile 100%)

### Principes Fondamentaux :
1. **Feed Centré** : Le contenu principal de la page d'accueil doit TOUJOURS être contenu dans un conteneur vertical centré (`max-w-2xl mx-auto px-3 sm:px-4`). Ne JAMAIS générer de grille 2 colonnes étirée sur 1400px.
2. **Mode Clair (Défaut)** :
   - Fond de page : `#f5f6f8`.
   - Cartes : `#ffffff` avec `rounded-[20px]`, bordure `1px solid rgba(0,0,0,0.06)`, ombre douce `0 4px 16px rgba(0,0,0,0.03)`.
3. **Mode Sombre** :
   - Fond de page : `#121212`.
   - Cartes : `#1e1e1e` avec `border: 1px solid rgba(255,255,255,0.1)`.
4. **Couleur Primaire** : Violet électrique `#444cf7` (avec déclinaisons bleu `#0161a7`, blanc, noir).
5. **Périmètre Web vs Mobile** :
   - Le site web n'a **PAS de barre de navigation basse flottante** (réservée à l'application mobile).
   - Les fonctionnalités privées (scan de réservations natives) restent exclusives à l'application mobile.
   - Le site propose un Header supérieur compact (`Header.tsx`) avec logo, sélecteur de langue, bascule de thème et accès aux réglages.

---

## 📱 3. Anatomie des Composants Clés

### 1. En-tête & Recherche (`FilterBar.tsx`)
- **Titre** : `CinéLyon` en `MontserratExtraBold` / `HealTheWebA` + sous-titre officiel : *« Toutes les séances à Lyon, en un seul endroit ! »*.
- **Barre de Recherche Apple** : Champ blanc `rounded-[18px]` avec loupe et placeholder *« Recherche »*.
- **3 Boutons Compagnons Carrés Arrondis** (`w-11 h-11 rounded-[16px] bg-white border border-black/10 shadow-sm`) :
  - 🎲 **Ciné-Roulette** (icône dés).
  - 🔀 **Double Programme** (icône shuffle).
  - 🎛️ **Filtres** (icône sliders avec badge compteur si actif).
- **Compteur sous la barre** : Discret `167 films` en gris.

### 2. Sélecteur de Jours (`DaySelector.tsx`)
- Défilement horizontal de pilules `rounded-[24px]` de 48px de haut :
  - `Tous` : Fond plein `#444cf7`, texte blanc.
  - `Auj. 29 août` : Fond blanc avec bordure `#444cf7` de 2px.
  - Autres jours (`Dim 30 août`, `Lun 31 août`...) : Fond blanc, bordure légère.

### 3. Carte de Film (`FilmCard.tsx`)
- **Conteneur Supérieur** : Blanc `rounded-[20px]`, cliquable vers `/film/[slug]`.
  - **Affiche à gauche** : `100px × 144px`, `rounded-l-[20px]`, badge *NOUVEAU* `#444cf7` en haut à gauche.
  - **Informations à droite** :
    - Titre 14px gras + Année `(2026)` 13px grisée.
    - Cœur de favori en haut à droite (outline ou rouge `#ff6b6b` actif).
    - Métadonnées verticales en 11px : *Réalisateur : Nom*, *Genre : Genres*, *Durée : Xh XXmin*, *Note : X.X/5*.
    - Logos des plateformes de streaming (`Prime Video`, `Netflix`...).
    - Chevron `›` en bas à droite.
- **Mini-calendrier du film** sous la carte : Pilules de dates dépliables.
- **Séances dépliées** :
  - Badge cinéma à gauche : Bloc violet `#444cf7` (`100px` de large, `44px` de haut, texte blanc centré).
  - Horaires à droite : Pilules blanches `44px` avec format (`VF`/`VO`) en haut et heure en gras (`14h00`) + logo calendrier 📅 en bas.

### 4. Fiche Film Enrichie (`/film/[slug]/page.tsx`)
- **Hero Backdrop** : Image paysage 280-320px avec fondu sombre et boutons flottants (`< Retour`, `Partager`, `Favori`).
- **Scorecard (3 Cartes Blanches)** : Spectateurs (⭐ 2.3/5), Rotten Tomatoes (🍅 59%), TMDB (⭐ 7).
- **Liens Externes** : Pilules `... Letterboxd ↗` et `A AlloCiné ↗`.
- **Sections avec séparateurs** :
  - 📖 **Synopsis** avec texte `HealTheWebA`.
  - 🛡️ **Classification & Sensibilité** avec badge vert `Tous publics`.
  - 🎬 **Scènes Post-Générique** avec badge ambré `● 1 Scène milieu`.
  - ⏱️ **Pauses Toilettes (RunPee)** avec badge horaire et encadré dépliable *« ✨ Pendant les 3 min : ... »*.
  - 👥 **Casting** avec défilement des avatars ronds et rôles.
  - ▶️ **Bande-Annonce YouTube** officielle.
  - 📺 **Disponible sur** (Streaming).
  - 💬 **Critiques Spectateurs** avec étoiles.
  - 🕒 **Séances complètes** par date et cinéma.
  - ✨ **Films similaires à l'affiche à Lyon** avec badge `À L'AFFICHE`.

### 5. Modales & CinéBot IA
- **Ciné-Roulette** (`CineRouletteModal.tsx`) : Popcorn 🍿, filtres (Soirée, VOST, Top noté), résultat animé et relance.
- **Double Programme** (`DoubleFeatureModal.tsx`) : Duos avec affiches superposées et temps de pause.
- **Filtres Avancés** (`FilterBar.tsx`) : Sections groupées (Nouveaux films, Créneaux, Formats, Cinémas).
- **CinéBot IA** (`ChatBot.tsx`) : FAB circulaire violet `#444cf7` en bas à droite, grille 2x2 de suggestions, prompts rapides et conversation IA en temps réel.
- **Réglages** (`SettingsModal.tsx`) : Profil utilisateur, Sync Code, gestion de la langue, options d'apparence.

---

## ⚡ 4. Bonnes Pratiques & Performance

- **Server Components** pour `/` et `/film/[slug]` (SEO et performance de chargement initial).
- **Client Components** (`'use client'`) pour l'interactivité (`FilmCard`, `FilterBar`, `DaySelector`, `ChatBot`, `Modales`).
- Toujours vérifier la compilation avec `npm run build` (garantir **0 erreur TypeScript**).
