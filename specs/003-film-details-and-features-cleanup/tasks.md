# Liste des Tâches : Refonte Fiche Film & Feature Flags

- [x] **Tâche 1 : Mise en place des Feature Flags & Désactivation Ciné-Roulette / Double Programme / ChatBot** (Issue #133)
  - [x] Créer `src/lib/features.ts` avec la configuration centralisée
  - [x] Mettre à jour `src/components/ui/FilterBar.tsx` pour masquer les boutons désactivés
  - [x] Mettre à jour `src/components/ui/FilmsList.tsx` pour ne pas instancier les modales désactivées
  - [x] Mettre à jour `src/components/layout/GlobalModals.tsx` pour désactiver `ChatBot`

- [x] **Tâche 2 : Implémentation du titre stylisé (ClearLogo) & Réglage de langue** (Issue #115)
  - [x] Créer `src/hooks/useFilmLogo.ts` avec recherche TMDB et sélection de langue (VO / VF)
  - [x] Créer `src/components/ui/FilmLogo.tsx` pour l'affichage transparent sur le hero
  - [x] Ajouter l'option dans `src/components/ui/SettingsModal.tsx` ("Préférer les logos originaux (VO)")

- [x] **Tâche 3 : Bannière de scène de film format Letterboxd / Mobile Full-Width** (Issue #123)
  - [x] Mettre à jour le hero dans `src/components/ui/FilmDetailView.tsx` avec effet Letterboxd dégradé latéral sur desktop et pleine largeur immersive sur mobile
  - [x] Intégrer `FilmLogo` avec transition fluide au chargement

- [x] **Tâche 4 : Refonte du calendrier de séances dans la fiche film** (Issue #143)
  - [x] Implémenter le mini-calendrier horizontal interactif dans `src/components/ui/FilmDetailView.tsx`
  - [x] Ajouter la pastille rouge d'avant-première et l'état sélectionné par pilule
  - [x] Afficher les séances du jour actif avec `DaySeances` (`groupByBrand={true}`) et préservation intégrale des SVG

- [x] **Tâche 5 : Personnalisation et amélioration du Footer** (Issue #130)
  - [x] Améliorer `src/components/layout/Footer.tsx` (Liquid Glass, typographie, espacements et contrastes)

- [x] **Tâche 6 : Vérification, Build & Tests de Non-Régression**
  - [x] Tester `npm run build` et valider 0 erreur TypeScript
  - [x] Valider la conformité iOS 15.1 WebKit
