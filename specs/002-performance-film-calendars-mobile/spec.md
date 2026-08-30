# Spécification Fonctionnelle : Optimisation des Performances & Fiabilisation des Calendriers de Films sur Mobile

**Feature ID** : `002-performance-film-calendars-mobile`  
**Date** : 30 Août 2026  
**Auteur** : Agent IA CinéLyon (Spec-Kit Autonomous Workflow)

---

## 1. Contexte & Problématique

### Constat Utilisateur
- Lors du premier chargement du site CinéLyon Web, l'affichage et l'ouverture des séances/calendriers de films sous chaque carte accusent une lenteur perceptible (gel de l'interface, temps de calcul élevé).
- Sur les appareils mobiles (particulièrement iOS Safari / WebKit 15.1 - 17.x et Android Chrome), le clic ou tapotement sur les boutons de dates (mini-calendrier sous la carte de film ou sélecteur de jours) ne répond parfois pas du tout (« n'ouvre pas du tout sur mobile ») ou subit un blocage.

### Causes Techniques Identifiées
1. **Saturation CPU & Calculs Inutiles au Rendu / Hydratation** :
   - Boucle de filtrage multidimensionnelle (`baseFilms`, `extractFilterOptions`, `filmsMatchingFilters`, `availableDates`, `filteredFilms`) effectuant des centaines de milliers d'appels `dates.find(...)`, `formatDayLabel(...)`, `getDeltaForDate(...)` et instanciant des dizaines de milliers d'objets `new Date()` sur le thread principal JS.
   - Instanciation répétée de `new Intl.DateTimeFormat(locale, ...)` à chaque frame et sur chaque bouton de date (jusqu'à 280 instanciations par rendu), causant des chutes d'IPS majeures et le rejet d'événements tactiles par WebKit.
   - Lookups `O(N)` répétés dans les tableaux de dates au lieu de tables de hachage `O(1)`.
2. **Fragilité de la Gestion d'État du Mini-Calendrier (`FilmCard.tsx`)** :
   - Sélection du jour actif basée sur un index numérique (`userSelectedDayIdx: number | null`) sujet aux désynchronisations et aux décalages d'ordre de tableau au lieu de la clé de date réelle (`dayLabel: string | null`).
   - Anti-pattern d'appel de `setState` pendant la phase de rendu React (`if (selectedDelta !== prevDelta) { setPrevDelta(...); ... }`), provoquant des rendus en cascade et des blocages d'état.
   - Absence de retour visuel explicite si un jour ne comporte que des séances passées (rendu silencieux de 0 séance).
   - Bundle initial alourdi par le chargement synchrone de toutes les modales secondaires (`ChatBot`, `SettingsModal`, `CineRouletteModal`, `DoubleFeatureModal`).

---

## 2. Objectifs & Bénéfices Attendus

1. **Ouverture Instantanée (< 16ms, 60fps)** : L'ouverture ou la fermeture du mini-calendrier de séances sous n'importe quel film doit être immédiate et fluide sur tous les appareils, sans aucun lag perceptible.
2. **Fiabilité Mobile Absolue (100% de Réponse au Tap)** : Tout appui tactile sur un jour de séance doit ouvrir de manière déterministe les séances associées, avec feedback immédiat `active:scale-95` et `touch-action: manipulation`.
3. **Chargement Initial Ultra-Rapide** : Réduire le temps de blocage du thread principal (TBT) au premier chargement à moins de 50ms grâce à la pré-indexation `O(1)`, au cache `Intl.DateTimeFormat` et au dynamic import des modales.
4. **Parité & Conformité iOS 15.1 (WebKit)** : Fonctionnement irréprochable sous Safari iOS 15.1 sans aucune API moderne interdite.

---

## 3. Exigences Fonctionnelles Détaillées

### A. Refonte & Stabilisation de l'État dans `FilmCard.tsx`
- **Gestion d'État Robuste par Clé de Jour** :
  - Remplacer l'état `userSelectedDayIdx` par `selectedDayKey: string | null` (contenant directement le `dayLabel` actif, ex: `"Dim 30 août"`).
  - Éliminer le `setPrevDelta` dans le corps du rendu. Le calcul de la date active doit dériver de manière pure et déterministe des props (`selectedDelta`, `dates`) et de l'état utilisateur local.
  - Lorsqu'un utilisateur clique sur un jour déjà ouvert, refermer le panneau proprement.
  - Lorsqu'un utilisateur clique sur un autre jour, basculer instantanément sur ce jour.
- **Support des Séances Passées & Feedback Visuel** :
  - Si un film a des séances enregistrées mais qu'elles sont toutes passées pour la journée sélectionnée, afficher un message discret et élégant : *« Toutes les séances de cette journée sont terminées. »*.
- **Touch Responsiveness & Micro-Interactions** :
  - Ajouter `touch-action: manipulation` et `select-none` sur les boutons de dates pour éliminer le délai de 300ms de Safari iOS et éviter tout conflit avec le scroll horizontal.

### B. Optimisation des Performances de Calcul & Dates (`showtimes.ts`, `dateUtils.ts`)
- **Cache Global des Formateurs `Intl.DateTimeFormat`** :
  - Créer un pool singleton de formatage de dates mémoïsé par clé `locale-options` pour réutiliser les instances sans allocation dynamique.
- **Lookup Maps O(1) pour les Dates** :
  - Pré-calculer des Maps indexées par `isoDate`, `dayLabel` et `index` lors de `buildDateLabels` pour transformer tous les `dates.find(...)` en accès direct `O(1)`.
- **Mémoïsation & Simplification de `isPastSeance` et `hasVisibleSeances`** :
  - Pré-calculer les minutes actuelles du jour `currentMinutes` et le delta du jour afin d'éviter la recréation répétée de `new Date()` lors de l'inspection des séances.

### C. Chargement Paresseux des Composants & Allègement du Bundle Initial
- **Dynamic Imports** :
  - Importer `CineRouletteModal` et `DoubleFeatureModal` dans `FilmsList.tsx` via `next/dynamic` (`ssr: false`).
  - Importer `ChatBot` et `SettingsModal` dans `layout.tsx` via `next/dynamic` (`ssr: false`).
- **Pagination & Priorité de Rendu** :
  - Conserver le batch de 20 films avec `React.memo` optimisé pour éviter les re-renders inutiles des cartes non modifiées.

---

## 4. Critères d'Acceptation & Validation

| ID | Critère d'Acceptation | Statut Cible |
| :--- | :--- | :--- |
| **AC-1** | Au premier chargement de la page d'accueil, le mini-calendrier de chaque film s'affiche sans délai. | Validé |
| **AC-2** | Taper sur un bouton de jour d'un film sur mobile (iOS / Android) ouvre immédiatement les horaires du cinéma correspondant. | Validé |
| **AC-3** | Taper sur un autre jour bascule instantanément les séances sans aucun crash ni état fantôme. | Validé |
| **AC-4** | Filtrer par jour via le `DaySelector` supérieur met à jour la liste des films et permet d'ouvrir/déplier les séances du jour sans friction. | Validé |
| **AC-5** | Les modales (`ChatBot`, `SettingsModal`, `CineRoulette`, `DoubleFeature`) ne bloquent pas le chargement initial. | Validé |
| **AC-6** | `npm run build` et tests TypeScript passent avec 0 erreur. Compatibilité iOS 15.1 garantie. | Validé |
