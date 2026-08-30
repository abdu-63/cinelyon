# Découpage des Tâches : Optimisation des Performances & Fiabilisation des Calendriers de Films sur Mobile

**Feature ID** : `002-performance-film-calendars-mobile`  
**Plan associé** : [plan.md](./plan.md)

---

## 📋 Liste Ordonnée des Tâches

- [x] **Tâche 1 : Optimisation des Utilitaires de Date & Cache Intl (`src/utils/dateUtils.ts`)**
  - [x] 1.1 Créer un cache singleton d'instances `Intl.DateTimeFormat` (`getDateTimeFormatter`).
  - [x] 1.2 Mettre en cache les résultats de `formatLocalizedWeekday`, `formatLocalizedDayMonth` et `formatLocalizedDayLabel` par clé `(isoDate, locale)`.
  - [x] 1.3 Pré-calculer les deltas de date pour éviter les créations répétées de `new Date()` lors du calcul de `getDeltaForDate`.

- [x] **Tâche 2 : Accélération O(1) du Moteur de Séances & Filtrage (`src/utils/showtimes.ts`)**
  - [x] 2.1 Mettre en place un cache/index de lookup des `DateLabel` par `isoDate` et par `dayLabel` pour éliminer les boucles `dates.find(...)`.
  - [x] 2.2 Optimiser `isPastSeance` et `hasVisibleSeances` pour utiliser des comparaisons directes de minutes et de deltas pré-calculés.
  - [x] 2.3 Veiller à ce que `filterFilms` et `extractFilterOptions` bénéficient des accélérations O(1) pour réduire le temps de calcul sur le thread principal.

- [x] **Tâche 3 : Refonte & Fiabilisation du Mini-Calendrier dans `FilmCard.tsx`**
  - [x] 3.1 Remplacer `userSelectedDayIdx: number | null` par `expandedDayLabel: string | null` (clé directe du jour).
  - [x] 3.2 Supprimer l'anti-pattern de `setState` pendant la phase de rendu (`setPrevDelta`).
  - [x] 3.3 Structurer le toggle : un tap sur un jour fermé l'ouvre immédiatement ; un tap sur le jour ouvert le referme ; un tap sur un autre jour bascule immédiatement.
  - [x] 3.4 Ajouter `touch-action: manipulation` et classes d'optimisation tactile sur les boutons de jours.
  - [x] 3.5 Afficher un message élégant si toutes les séances d'un jour sont passées plutôt qu'un conteneur vide.

- [x] **Tâche 4 : Chargement Paresseux des Composants & Allègement du Bundle Initial**
  - [x] 4.1 Importer de manière dynamique (`next/dynamic` avec `ssr: false`) `ChatBot` et `SettingsModal` via `GlobalModals.tsx`.
  - [x] 4.2 Importer de manière dynamique `CineRouletteModal` et `DoubleFeatureModal` dans `src/components/ui/FilmsList.tsx`.

- [x] **Tâche 5 : Validation Globale, Tests de Non-Régression & Build**
  - [x] 5.1 Vérifier la compilation TypeScript (`npx tsc --noEmit`).
  - [x] 5.2 Valider le build de production Next.js (`npm run build`).
  - [x] 5.3 Valider la conformité iOS 15.1 (WebKit Legacy Support).
