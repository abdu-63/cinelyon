# Spécification Fonctionnelle : Refonte Fiche Film & Feature Flags (Issues #143, #123, #115, #130, #133)

**Branche / ID :** `003-film-details-and-features-cleanup`  
**Date :** 31 août 2026  
**Statut :** Validé / En cours d'implémentation  

---

## 1. Contexte & Objectifs

L'objectif de cette évolution est d'aligner l'expérience web de CinéLyon sur l'application mobile `cinelyon-app` en traitant 5 issues prioritaires :
1. **Issue #143** : Remplacer l'affichage empilé de tous les jours sur la fiche film (`/film/[slug]`) par un sélecteur de jour horizontal interactif (mini-calendrier avec pilules de dates, pastilles d'avant-première et état actif), qui affiche les séances du jour sélectionné avec les logos officiels SVG de chaque enseigne de cinéma sans casser les composants enfants.
2. **Issue #123** : Afficher la bannière de scène de film (backdrop) sur la fiche film dans un format cinématique Letterboxd (flou dégradé latéral doux sur desktop, et pleine largeur immersive sur mobile comme sur l'application).
3. **Issue #115** : Intégrer l'affichage du titre stylisé sous forme de logo officiel transparent TMDB (ClearLogo) sur la bannière de la fiche film, avec une option dédiée dans les réglages permettant de basculer la préférence de langue des logos (VO / VF), à l'identique de `cinelyon-app`.
4. **Issue #130** : Améliorer et personnaliser le footer avec les tokens Liquid Glass, les liens vers les réseaux sociaux cinéphiles (Letterboxd, Serializd, X, Instagram) et les pages légales.
5. **Issue #133** : Mettre en place un système de Feature Flags dans `src/lib/features.ts` et désactiver Ciné-Roulette, Double Programme et Chatbot IA afin d'alléger le bundle et d'éliminer les lenteurs sur mobile.

---

## 2. Scénarios Utilisateurs

### Scénario 1 : Consultation des séances d'un film (Issue #143)
- L'utilisateur ouvre la page d'un film (ex: `/film/interstellar-2014`).
- Il voit un mini-calendrier horizontal avec les jours disponibles (`Auj. 31 août`, `Mar 1 sept`, etc.) avec une pastille rouge en cas d'avant-première.
- Le premier jour avec des séances valides est sélectionné par défaut.
- En cliquant sur un jour, les séances de ce jour s'affichent instantanément sous le sélecteur, regroupées par enseigne avec leurs logos vectoriels SVG officiels (`Pathé`, `UGC`, `Lumière`, `CGR`, `Comœdia`, etc.), les horaires cliquables et le bouton d'ajout au calendrier.

### Scénario 2 : Esthétique de la bannière cinématographique (Issue #123)
- Sur grand écran (Desktop), la bannière de scène s'affiche avec un fondu dégradé latéral doux (effet Letterboxd) et un dégradé inférieur vers le fond sombre/clair.
- Sur smartphone (Mobile), la bannière s'étend sur toute la largeur de l'écran pour une immersion totale identique à `cinelyon-app`.

### Scénario 3 : Titre stylisé & Préférence Logo VO/VF (Issue #115)
- Si un logo officiel transparent est disponible pour le film sur TMDB, il est affiché avec son ratio d'aspect sur la bannière à la place du titre texte brut.
- Dans la modale Réglages, une option "Préférer les logos originaux (VO)" permet à l'utilisateur de choisir entre le logo en langue originale (ex: *Toy Story*) et le logo traduit.

### Scénario 4 : Allègement et fluidité mobile via Feature Flags (Issue #133)
- Les fonctionnalités réservées à l'app mobile (Ciné-Roulette, Double Programme, Chatbot IA) sont désactivées proprement sans erreur JavaScript ni re-renders superflus.
- La barre de recherche affiche uniquement le bouton Filtres, allégeant l'interface mobile et supprimant les saccades.

### Scénario 5 : Footer personnalisé & enrichi (Issue #130)
- Le pied de page affiche un design soigné en verre dépoli avec le logo CinéLyon, la description, les accès rapides aux réseaux (Letterboxd, Serializd, Instagram, X) et les mentions légales.

---

## 3. Critères d'Acceptation & Non-Régression

- [x] **iOS 15.1 WebKit** : Aucun usage de syntaxe ou API incompatible (`crypto.randomUUID` sans fallback, `:has()`, `@container`, etc.).
- [x] **Logos SVG & Rendu** : Tous les logos des cinémas et marques s'affichent sans déformation.
- [x] **Performance** : 0ms de freeze lors du changement de jour sur la fiche film.
- [x] **Build Next.js** : `npm run build` passe avec 0 erreur TypeScript ni warning bloquant.
