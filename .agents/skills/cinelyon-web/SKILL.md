---
name: cinelyon-web
description: >-
  Référentiel intégral d'architecture, design system et implémentation pour le site officiel CinéLyon Web (Next.js 15+, App Router, Tailwind CSS, TypeScript, Supabase, React Query, i18n).
  À activer systématiquement pour toute tâche UI/UX, refonte de page, ajout de composant ou modale afin de garantir la parité absolue avec l'application mobile et ses 17 captures d'écran de référence.
---

# CinéLyon Web — Guide de Référence UI/UX & Design System Absolu

Ce document contient l'ensemble des directives de design, dimensions, couleurs, typographies et règles d'implémentation pour le développement de **CinéLyon Web**.

---

## 🎨 1. Tokens de Design & Couleurs Officielles

| Token | Hex / Valeur | Usage |
| :--- | :--- | :--- |
| **`primary`** | `#444cf7` | Violet électrique CinéLyon (boutons actifs, badges cinémas, liens, FAB). |
| **`primary-hover`** | `#3339c4` | État hover des boutons primaires. |
| **`fav-active`** | `#ff6b6b` | Rouge cœur favori actif. |
| **`bg-light`** | `#f5f6f8` | Fond de page en mode clair (Défaut). |
| **`card-light`** | `#ffffff` | Cartes blanches mode clair (`border: 1px solid rgba(0,0,0,0.06)`). |
| **`bg-dark`** | `#121212` | Fond de page en mode sombre. |
| **`card-dark`** | `#1e1e1e` | Cartes mode sombre (`border: 1px solid rgba(255,255,255,0.1)`). |
| **`text-title`** | `#111111` / `#ffffff` | Titres principaux en mode clair / sombre. |
| **`text-meta`** | `#666666` / `#aaaaaa` | Métadonnées et sous-titres (11px à 13px). |
| **`emerald-badge`**| `#10b981` / `bg-emerald-50` | Badge *Tous publics*, temps de pause Double Programme. |
| **`amber-badge`**  | `#f59e0b` / `bg-amber-50`   | Badge Scènes Post-Générique, étoiles de notes. |
| **`blue-badge`**   | `#3b82f6` / `bg-blue-50`    | Badge Pauses Toilettes RunPee, TMDB score. |

---

## 📐 2. Règles Fondamentales de Mise en Page (Layout)

1. **Feed Centré Mobile-First** :
   - Conteneur d'accueil et de fiches : `max-w-2xl mx-auto px-3 sm:px-4`.
   - **INTERDICTION STRICTE** de générer des grilles étirées 2 colonnes sur toute la largeur de l'écran.
2. **Typographie** :
   - **`HealTheWebA`** : Police de marque officielle pour tout le corps de texte, les métadonnées, les synopsis et les boutons.
   - **`MontserratExtraBold`** : Titres majeurs (`CinéLyon`), logos et badges.
3. **Périmètre Web vs Mobile** :
   - Le site web n'a **PAS de barre de navigation basse flottante** (réservée à l'application mobile native).
   - Les fonctionnalités privées comme le scan de réservations de billets restent exclusives à l'application mobile.
   - Le site web propose un `Header.tsx` supérieur compact avec logo, sélecteur de langue (9 langues), bascule de thème clair/sombre et accès aux réglages.

---

## 🧩 3. Spécifications Exactes des Composants UI

### 1. En-tête & Barre de Recherche (`FilterBar.tsx`)
- **Titre & Sous-titre** :
  - `CinéLyon` (28px `MontserratExtraBold`).
  - *« Toutes les séances à Lyon, en un seul endroit ! »* (12px gris `#666666`).
- **Champ de Recherche** :
  - Fond blanc `#ffffff`, arrondi `rounded-[18px]`, bordure `1px solid rgba(0,0,0,0.08)`, loupe à gauche, placeholder *« Recherche »*.
- **3 Boutons Compagnons Carrés Arrondis** (`w-11 h-11 rounded-[16px] bg-white border border-black/10 shadow-sm`) :
  - 🎲 **Ciné-Roulette** (icône dés `Dices`).
  - 🔀 **Double Programme** (icône `Shuffle`).
  - 🎛️ **Filtres** (icône `SlidersHorizontal` avec badge compteur rouge si filtres actifs).
- **Compteur sous la barre** : `167 films` en gris discret `11px`.

### 2. Sélecteur de Jours Horizontal (`DaySelector.tsx`)
- Défilement horizontal fluide de pilules de `48px` de hauteur (`rounded-[24px]`) :
  - `Tous` : Fond plein `#444cf7`, texte blanc.
  - `Auj. 29 août` : Fond blanc, **bordure violette `#444cf7` de 2px**, texte sombre.
  - Autres jours (`Dim 30 août`, `Lun 31 août`...) : Fond blanc, bordure fine `1px solid rgba(0,0,0,0.08)`.

### 3. Carte Film (`FilmCard.tsx`)
- **Conteneur Supérieur** : Carte blanche `rounded-[18px] sm:rounded-[20px]`, ombre douce `0 2px 8px rgba(0,0,0,0.03)` / `hover:shadow-md`.
  - **Affiche à gauche** : Dimensions `100px × 144px`, `rounded-l-[18px] sm:rounded-l-[20px]`, badge *NOUVEAU* violet `#444cf7` en haut à gauche.
  - **Infos à droite** :
    - Titre `14px` (sm: `15px`) + Année `(2021)` grisée `12px` (`13px`).
    - Bouton cœur de favori en haut à droite (`size={20}`, rouge `#ff6b6b` si actif).
    - Métadonnées verticales `10.5px` (sm: `11px`) : *Réalisateur*, *Genre*, *Durée*, *Note*.
    - Résumé synopsis compact sur 2 lignes sur desktop (`hidden md:line-clamp-2 text-[11px]`).
    - Logos des plateformes de streaming (`Prime Video`, `Netflix`...).
    - Bouton « Détails › » en bas à droite.
- **Mini-calendrier du film** sous la carte : Pilules de dates (`Dim. 30 Août`, `Lun. 31 Août`...) `px-3.5 py-1.5 rounded-[18px] text-[12px]` avec fond gris `#f0f2f5` et point rouge d'avant-première.
- **Séances Dépliées (`DaySeances`)** :
  - **Badge cinéma à gauche** : Bloc violet `#444cf7` (`82px` de large fixe, `44px` de haut, `rounded-[14px]`), texte blanc centré `11px` sur 1 ou 2 lignes.
  - **Pilules d'horaires à droite** : Horaires horizontaux blancs (`minWidth: 66px` à `70px`, `height: 44px`, `rounded-[14px]`, bordure fine) :
    - Ligne supérieure (`9px` gris) : Format/langue (`VF`, `VO (EN)`, `VO (EN) IMAX`, `VF DOLBY`).
    - Ligne inférieure : Heure en `#444cf7` (`14h00`) + icône calendrier 📅 (`12px`) à droite.

---

## 🎬 4. Fiche Film Enrichie (`/film/[slug]/page.tsx`)

Structure et hiérarchie exactes respectant les 6 captures d'écran de l'application mobile :

1. **Hero Backdrop Banner** : Image paysage grand angle (`280px` à `320px` de haut) avec fondu progressif vers le fond, bouton `< Retour` translucide en haut à gauche, boutons ronds blancs Partage et Favori en haut à droite, et titre du film superposé en bas.
2. **Métadonnées & Genres** : Ligne synthétique `2021 · 2h 23min · Justin Lin` + capsules de genres blanches arrondies (`rounded-full`).
3. **Scorecard (3 Cartes Blanches)** :
   - ⭐ **Critiques Spectateurs** (`2.3/5`).
   - 🍅 **Rotten Tomatoes** (`59%`).
   - ⭐ **TMDB** (`7`).
4. **Liens Externes** : Pilule `... Letterboxd ↗` et Pilule `A AlloCiné ↗`.
5. **Synopsis** : Icône livre 📖 + texte complet en `HealTheWebA`.
6. **Classification & Sensibilité** : Bouclier 🛡️ + Badge vert `Tous publics`.
7. **Scènes Post-Générique** : Badge ambré `● 1 Scène milieu` avec texte explicatif.
8. **Pauses Toilettes RunPee** :
   - Badge horaire synthétique `54 min · 1h 37min` avec chevron `Masquer ⌃` / `Résumé 3 min ⌄`.
   - Encadré de pause : *Signal de départ* + boîte imbriquée *« ✨ Pendant les 3 min : ... »*.
9. **Casting & Distribution** : Défilement horizontal des avatars acteurs ronds (`64px` de diamètre), nom en gras et rôle en gris.
10. **Bande-Annonce Officielle** : Lecteur vidéo YouTube `rounded-[20px]`.
11. **Disponible sur** : Logos des diffuseurs streaming (`Amazon Prime`...).
12. **Critiques Spectateurs** : Carte d'avis avec initiales dans un cercle, étoiles jaunes et commentaire.
13. **Séances complètes** : Badges cinémas (`100px` violet `#444cf7`) + horaires avec format et logo calendrier 📅.
14. **Films similaires à l'affiche à Lyon** : Carrousel d'affiches avec note ⭐, étiquette `À L'AFFICHE` et cinéma associé.

---

## 🗂️ 5. Modales Interactives & CinéBot IA

- **Ciné-Roulette (`CineRouletteModal.tsx`)** : Pop-corn 🍿, filtres pilules (Ce soir > 19h, VOST, Film bien noté), carte de résultat avec durée, note, horaire bleu et bouton de relance `🎲 Relancer la roulette`.
- **Double Programme (`DoubleFeatureModal.tsx`)** : Sous-titre *« 2 séances consécutives · 10 à 30 min de pause »*, sélecteur de jours, recherche prioritaire, sélecteur `Midi | Soir | Tout`, cartes de duos avec les **2 affiches superposées** et détail des temps de pause.
- **Filtres Avancés (`FilterBar.tsx`)** : Cartes blanches par section (*Nouveaux films*, *Créneau horaire*, *Formats & Expériences*, *Cinémas*) et bouton inférieur `Afficher X films`.
- **CinéBot IA (`ChatBot.tsx`)** : Bouton FAB circulaire violet `#444cf7` (`w-14 h-14 rounded-full`) en bas à droite, statut `● Assistant IA • En direct`, 4 cartes de suggestions (2x2), prompts rapides et champ de saisie avec flèche d'envoi `↑`.
- **Réglages (`SettingsModal.tsx`)** : Profil avec avatar orange `AB`, sync code `a0cc4a`, langue, masquage des séances passées et sélection de thème.

---

## ⚡ 6. Règles d'Exécution & Non-Régression

- Toujours valider avec `npm run build` : **0 erreur TypeScript, 0 avertissement Turbopack**.
- Respecter scrupuleusement les 9 langues dans `src/i18n/`.
- Ne jamais modifier les composants en réintroduisant d'anciennes grilles larges.
