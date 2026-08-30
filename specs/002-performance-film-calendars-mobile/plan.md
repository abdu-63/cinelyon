# Plan Technique : Optimisation des Performances & Fiabilisation des Calendriers de Films sur Mobile

**Feature ID** : `002-performance-film-calendars-mobile`  
**Spec associée** : [spec.md](./spec.md)

---

## 1. Architecture & Stratégie Technique

### Problème 1 : Goulots d'étranglement CPU lors du premier chargement & filtrage
- **Constat** : `isPastSeance` et `hasVisibleSeances` exécutent des milliers d'opérations d'analyse de date, de recherche linéaire `Array.find` et d'instanciations `new Date()`.
- **Solution** :
  1. Dans `src/utils/dateUtils.ts` : Créer un pool singleton de formateurs `Intl.DateTimeFormat` et mémoïser les libellés de dates pour toutes les dates actives (14 jours × 9 langues) dans une table de hachage `Map<string, string>`.
  2. Dans `src/utils/showtimes.ts` : Remplacer les recherches linéaires par des index maps créées une seule fois dans `buildDateLabels` :
     - `isoDateToDateLabel: Map<string, DateLabel>`
     - `dayLabelToDateLabel: Map<string, DateLabel>`
     - `isoDateToDelta: Map<string, number>`
  3. Dans `isPastSeance` : Pré-calculer `nowMinutes` une seule fois par tick de rendu ou passer une référence temporelle commune pour éviter les milliers d'appels à `new Date()`.

### Problème 2 : Non-réponse et instabilité de l'ouverture des séances sur Mobile (`FilmCard.tsx`)
- **Constat** :
  - `userSelectedDayIdx: number | null` (index numérique) est fragile face aux recalculs de tableau `validDayLabels`.
  - Anti-pattern d'état avec `setPrevDelta` dans le rendu.
  - Absence de `touch-action: manipulation` entraînant des retards tactiles sous WebKit/Safari.
- **Solution** :
  1. Remplacer l'état par `selectedDayLabel: string | null` (ou `expandedDay: string | null`).
  2. Dériver l'état affiché de façon pure :
     - Si `selectedDelta !== null` : Le jour actif par défaut est le jour sélectionné globalement, avec possibilité de déplier/replier d'un simple tap.
     - Si `selectedDelta === null` : L'utilisateur peut ouvrir n'importe quel jour affiché. S'il clique sur le jour déjà ouvert, il se referme (`null`). S'il clique sur un autre jour, il bascule sur ce jour (`newDayLabel`).
  3. Ajouter `touch-action: manipulation` et `select-none` sur les boutons de calendrier pour garantir une réactivité immédiate sans délai sur mobile.
  4. Si un jour est ouvert mais que toutes ses séances sont passées, afficher un message d'information gracieux au lieu d'un espace vide.

### Problème 3 : Allègement du bundle et hydratation accélérée
- **Solution** :
  1. Dans `src/app/layout.tsx` : Charger `ChatBot` et `SettingsModal` via `next/dynamic` avec `ssr: false`.
  2. Dans `src/components/ui/FilmsList.tsx` : Charger `CineRouletteModal` et `DoubleFeatureModal` via `next/dynamic` avec `ssr: false`.

---

## 2. Découpage des Fichiers & Modifications

### A. Utilitaires de Date & Performance (`src/utils/dateUtils.ts`)
- Implémenter un cache de formateurs `Intl.DateTimeFormat` (`getDateTimeFormatter(locale, options)`).
- Pré-calculer et mettre en cache les résultats de `formatLocalizedWeekday`, `formatLocalizedDayMonth`, `formatLocalizedDayLabel`.

### B. Moteur de Séances & Filtrage (`src/utils/showtimes.ts`)
- Créer des structures d'indexation rapide `DateIndexMap` pour un accès `O(1)` instantané.
- Optimiser `hasVisibleSeances`, `isPastSeance` et `filterFilms` pour diviser par 10 le coût CPU.

### C. Composant Carte Film (`src/components/ui/FilmCard.tsx`)
- Refonte complète de la gestion d'ouverture/fermeture des séances (état `selectedDay: string | null`).
- Remplacer le `setPrevDelta` en rendu par une gestion d'état déterministe.
- Amélioration de l'ergonomie mobile : `touch-action: manipulation`, feedback visuel instantané `active:scale-95`.
- Message informatif si toutes les séances d'un jour sont passées.

### D. Optimisation du Rendu Global (`src/components/ui/FilmsList.tsx` & `src/app/layout.tsx`)
- Intégration de `next/dynamic` pour les modales lourdes (`CineRouletteModal`, `DoubleFeatureModal`, `ChatBot`, `SettingsModal`).
- Mémoïsation fine pour éviter les re-renders de cartes inactives.

---

## 3. Plan de Vérification & Non-Régression

1. **Vérification TypeScript & Linting** :
   - `npx tsc --noEmit` -> 0 erreur.
2. **Vérification Build Next.js** :
   - `npm run build` -> Bundle généré avec succès, Server Components et Client Components conformes.
3. **Audit de Performance & Ergonomie Mobile** :
   - Test de l'ouverture et fermeture rapide des calendriers sur plusieurs films consécutifs.
   - Test du filtrage par jour ("Tous", "Auj.", jours suivants) et vérification du déploiement des séances.
   - Validation de la compatibilité WebKit iOS 15.1 (aucun `crypto.randomUUID()`, `structuredClone()`, etc. non protégé).
