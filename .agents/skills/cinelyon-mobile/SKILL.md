---
name: cinelyon-mobile
description: >-
  Référentiel intégral d'architecture, design system et implémentation pour l'application mobile native CinéLyon App (React Native 0.76+, Expo SDK 52, Expo Router v4, iOS 15.1, MMKV Offline-First, Supabase, Swift Widget).
  À activer systématiquement pour toute tâche UI/UX, refonte de composant ou modale afin de garantir la parité absolue avec les standards visuels et fonctionnels du projet mobile.
---

# CinéLyon App — Guide de Référence UI/UX & Design System Mobile Absolu

Ce document contient l'ensemble des directives de design, dimensions, couleurs, typographies et règles d'implémentation pour le développement de l'application mobile native **CinéLyon App**.

---

## 🎨 1. Tokens de Design & Couleurs Officielles

| Token | Hex / Valeur | Usage |
| :--- | :--- | :--- |
| **`primary`** | `#444cf7` | Violet électrique CinéLyon (boutons actifs, badges cinémas, icônes actives, FAB). |
| **`primary-hover`** | `#3339c4` | État pressé des boutons primaires. |
| **`fav-active`** | `#ff6b6b` | Rouge cœur favori actif. |
| **`bg-light`** | `#f5f6f8` | Fond d'écran en mode clair. |
| **`card-light`** | `#ffffff` | Cartes blanches mode clair (`border: 1px solid rgba(0,0,0,0.06)`). |
| **`bg-dark`** | `#121212` | Fond d'écran en mode sombre. |
| **`card-dark`** | `#1e1e1e` / `rgba(30,30,30,0.65)` | Cartes mode sombre avec flou liquide (`backdrop-blur`). |
| **`text-title`** | `#111111` / `#ffffff` | Titres principaux. |
| **`text-meta`** | `#666666` / `#aaaaaa` | Métadonnées et sous-titres (10px à 13px). |
| **`emerald-badge`**| `#10b981` / `bg-emerald-50` | Badge *Tous publics*, temps de pause Double Programme. |
| **`amber-badge`**  | `#f59e0b` / `bg-amber-50`   | Badge Scènes Post-Générique, étoiles de notes. |
| **`blue-badge`**   | `#3b82f6` / `bg-blue-50`    | Badge Pauses Toilettes RunPee, score TMDB. |

---

## 📱 2. Architecture & Contraintes Techniques

- **Framework** : React Native `0.76.9`, Expo SDK 52, Expo Router v4 (Stack + Tabs).
- **Cache Offline-First** : TanStack React Query v5 avec persistance disque via **MMKV** (`react-native-mmkv`).
- **Base de données & Sync** : Supabase (`@supabase/supabase-js`) pour auth, favoris et synchronisation d'amis.
- **Stockage Sécurisé** : `expo-secure-store` (Keychain iOS / EncryptedSharedPreferences Android).
- **Extension Native Swift** : Widget iOS natif (`targets/widget/`) avec `@bacons/apple-targets` (App Group `group.fr.cinelyon.app`).

> [!IMPORTANT]
> **Compatibilité iOS 15.1 obligatoire** : L'application et son extension Widget doivent impérativement fonctionner sans crash sur **iOS 15.1** (iPhone 13 mini). Toujours encadrer les APIs récentes avec des conditions `@available(iOS 16.0, *)` en Swift et des fallbacks appropriés en TypeScript.

---

## 🧩 3. Spécifications Exactes des Composants UI Mobiles

### 1. En-tête & Recherche (`FilterBar.tsx`)
- **Titre** : `CinéLyon` en `MontserratExtraBold` + sous-titre officiel *« Toutes les séances à Lyon, en un seul endroit ! »*.
- **Champ de recherche Apple** : Détection avec debounce 250ms, icône loupe et bouton d'effacement.
- **3 Boutons Compagnons Carrés Arrondis** (`width: 44, height: 44, borderRadius: 16, backgroundColor: '#ffffff'`):
  - 🎲 **Ciné-Roulette** (icône dés).
  - 🔀 **Double Programme** (icône shuffle).
  - 🎛️ **Filtres** (icône sliders avec badge rouge compteur si actif).
- **Compteur sous la barre** : `167 films` en gris discret `11px`.

### 2. Sélecteur de Jours Horizontal (`DaySelector.tsx`)
- Défilement horizontal fluide de pilules de `48px` de hauteur (`borderRadius: 24`) :
  - `Tous` : Fond plein `#444cf7`, texte blanc.
  - `Auj. 29 août` : Fond blanc, **bordure violette `#444cf7` de 2px**, texte sombre.
  - Autres jours (`Dim 30 août`, `Lun 31 août`...) : Fond blanc, bordure fine `rgba(0,0,0,0.08)`.

### 3. Carte Film (`FilmCard.tsx`)
- **Conteneur Supérieur** : Carte blanche `borderRadius: 20`, ombre douce `cardShadow`.
  - **Affiche à gauche** : `POSTER_WIDTH = 100`, `POSTER_HEIGHT = 144`, `borderTopLeftRadius: 15`, `borderBottomLeftRadius: 15`, badge *NOUVEAU* violet `#444cf7`.
  - **Infos à droite (`infoFilm`)** :
    - Titre `14px` bold + Année `(2021)` grisée `13px`.
    - Cœur de favori animé (`#ff6b6b` actif avec vibration haptique `expo-haptics`).
    - Métadonnées verticales `10px` : *Réalisateur*, *Genre*, *Durée*, *Note*.
    - Logos des plateformes de streaming (`Prime Video`, `Netflix`...).
    - Chevron `›` en bas à droite.
- **Mini-calendrier du film** sous la carte : Pilules de dates avec point rouge d'avant-première.
- **Séances Dépliées (`DaySeances.tsx`)** :
  - **Badge cinéma à gauche** : `width: 100`, `height: 42`, fond `#444cf7`, `borderRadius: 5`, texte blanc centré `11px` bold.
  - **Pilules d'horaires à droite** : `minWidth: 72`, `height: 42`, `borderRadius: 10`, fond blanc, format en haut (`9px`), heure en gras (`14h00`) en `#444cf7` + logo calendrier 📅 en bas.

### 4. Fiche Film Enrichie (`app/film/[slug].tsx`)
- Hero backdrop 270px avec fondu sombre, scorecard (AlloCiné, Rotten Tomatoes, TMDB), liens Letterboxd/AlloCiné, synopsis dépliable, pauses RunPee, scènes post-générique, casting, bande-annonce, streaming et séances complètes.

### 5. Fonctionnalités Exclusives Mobiles
- **Barre Flottante Basse (`FloatingLiquidGlassTabBar.tsx`)** : Navigation fluide avec flou liquide et retours haptiques.
- **Réservations & Scans de Billets** : Stockage local et affichage des billets avec horaires et QR code.
- **Carte Interactive & TCL** : 19 cinémas avec stations et lignes TCL (`tclData.ts`).
- **Synchronisation Sociale** : Code de partage `syncCode` et suivi d'amis.
- **Widget iOS Natif** : Affichage en direct de la prochaine séance sur l'écran d'accueil.

---

## 🧪 4. Vérification & Tests

- TypeScript : `npx tsc --noEmit`.
- Tests unitaires : `npm test`.
