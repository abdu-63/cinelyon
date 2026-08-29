---
name: cinelyon-mobile
description: >-
  Directives d'architecture, design system et implémentation pour l'application mobile native CinéLyon App (React Native 0.76+, Expo SDK 52, Expo Router v4, iOS 15.1, MMKV Offline-First, Supabase, Swift Widget).
  À activer pour toute modification, nouvelle fonctionnalité ou optimisation sur le codebase mobile cinelyon-app.
---

# CinéLyon App — Directives de Développement Mobile & Design System

Ce skill rassemble l'ensemble des règles architecturales, directives de design et spécifications fonctionnelles pour le développement de l'application mobile native **CinéLyon App**.

---

## 📱 1. Architecture & Stack Technique

- **Framework** : React Native `0.76.9`, Expo SDK 52, Expo Router v4 (File-based routing avec Stack et Tabs).
- **Langage** : TypeScript strict.
- **Accès Données & Base** : Supabase (`@supabase/supabase-js`) pour l'authentification, les favoris, et la synchronisation sociale.
- **Cache & Offline-First** : TanStack React Query (`@tanstack/react-query` v5) avec persistance disque via **MMKV** (`react-native-mmkv`).
- **Stockage Sécurisé** : `expo-secure-store` chiffré (AES-256 Keychain iOS / EncryptedSharedPreferences Android).
- **UI & Animations** : `react-native-reanimated` 3, `@gorhom/bottom-sheet`, `lottie-react-native`, `expo-image`, `expo-haptics`.
- **Extension Native Widget iOS** : Widget natif écrit en Swift (`targets/widget/`) avec `@bacons/apple-targets` (App Group `group.fr.cinelyon.app`).

> [!IMPORTANT]
> **Compatibilité iOS 15.1 obligatoire** : L'application et son extension Widget doivent rester 100% compatibles avec **iOS 15.1** (notamment pour iPhone 13 mini sous iOS 15). Ne pas utiliser d'APIs Swift ou React Native exclusives à iOS 16/17+ sans garde-fous `#available`.

---

## 🎨 2. Design System "Liquid Glass" & Micro-Interactions

### Palettes & Matériaux :
- **Mode Sombre (Défaut)** : Fond `#121212`, surfaces `rgba(30, 30, 30, 0.65)` avec `backdrop-blur`, bordures subtiles `rgba(255, 255, 255, 0.08)`.
- **Mode Clair** : Fond `#f5f6f8`, cartes `#ffffff` avec bordures `rgba(0, 0, 0, 0.06)`.
- **Accent Primaire** : Violet électrique `#444cf7` (variantes bleu `#0161a7`, blanc, noir).
- **Typographie** : `HealTheWebA` (corps et métadonnées), `MontserratExtraBold` (titres).

### Navigation & Ergonomie Mobile :
- **Barre Flottante Basse (`FloatingLiquidGlassTabBar.tsx`)** : Barre d'onglets flottante avec icônes Lucide actives lumineuses, support haptique (`expo-haptics`) et flou liquide.
- **Feuilles Inférieures (`BottomSheetModal`)** : Utilisées pour les filtres, la Ciné-Roulette, le Double Programme et les fiches d'options.

---

## 🧩 3. Composants Clés de l'Application

1. **Carte Film (`FilmCard.tsx`)** :
   - Affiche `POSTER_WIDTH = 100`, `POSTER_HEIGHT = 144`, coins arrondis `borderTopLeftRadius: 15`.
   - Titre `14px` bold, année `13px` grisée, bouton favori animé (`#ff6b6b`).
   - Métadonnées verticales `10px` (*De:*, *Genre:*, *Durée:*, *Note:*).
   - Séparateur `10px` puis mini-calendrier horizontal de séances.
2. **Séances par Cinéma (`DaySeances.tsx`)** :
   - Badge cinéma : `width: 100`, `height: 42`, fond `#444cf7`, `borderRadius: 5`, texte blanc centré `11px` bold.
   - Pilules d'horaires : `minWidth: 72`, `height: 42`, `borderRadius: 10`, format/langue en haut, heure `13px` bold + icône calendrier en bas.
3. **Barre de Recherche (`FilterBar.tsx`)** :
   - Champ de recherche Apple avec debounce 250ms, boutons Ciné-Roulette 🎲, Double Séance 🔀 et Filtres 🎛️ avec badge compteur.
4. **Fiche Film (`app/film/[slug].tsx`)** :
   - Hero backdrop 270px avec dégradé sombre, scorecard (AlloCiné, Rotten Tomatoes, TMDB), liens Letterboxd, RunPee pauses toilettes, scènes post-générique, casting, bande-annonce et séances complètes.
5. **Fonctionnalités Exclusives Mobiles** :
   - Réservations & scans de billets de cinéma (génération QR code / wallet).
   - Carte interactive des 19 cinémas avec stations et lignes TCL (`tclData.ts`).
   - Code de synchronisation de profil et amis (`syncCode`).
   - Widget d'écran d'accueil iOS en temps réel.

---

## 🧪 4. Vérification & Qualité

- Vérifier les types TypeScript avec `npx tsc --noEmit`.
- Lancer les tests unitaires avec `npm test`.
- S'assurer que le cache MMKV persiste correctement les données hors-ligne.
