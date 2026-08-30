# Spécification Fonctionnelle : Pages Légales & Badge JustWatch

**Feature ID** : `001-legal-pages-justwatch-badge`  
**Issues GitHub ciblées** :
- [Issue #88](https://github.com/abdu-63/cinelyon/issues/88) : Ajouter le badge de la source JustWatch dans les détails des films
- [Issue #90](https://github.com/abdu-63/cinelyon/issues/90) : Créer les pages Politique de confidentialité (`/politique-de-confidentialite`) et Conditions d'utilisation (`/cgu`), et ajouter les liens dans le footer
- [Issue #82](https://github.com/abdu-63/cinelyon/issues/82) : Lien vers la Politique de Confidentialité (`/privacy`)

---

## 1. Contexte & Objectifs

L'application web CinéLyon a besoin de se conformer aux exigences de transparence légale (RGPD, CGU, App Store Guidelines) et de créditer les sources de données tierces (attribution TMDB / JustWatch pour les fournisseurs de streaming).

Les objectifs principaux sont :
1. **Attribution JustWatch** : Afficher un badge officiel élégant et interactif indiquant que les données de streaming proviennent de JustWatch dans la fiche film (`/film/[slug]`), tout en rendant les logos des plateformes cliquables.
2. **Pages Légales Dédiées** :
   - Créer la page `/politique-de-confidentialite` (conforme RGPD, Apple Guidelines, gestion des favoris/Sync ID/cache).
   - Créer la page `/cgu` (Conditions Générales d'Utilisation : gratuité, billetterie tierce, propriété intellectuelle, absence de responsabilité sur les annulations cinémas).
   - Gérer les alias et redirections nécessaires : `/privacy` vers `/politique-de-confidentialite`, `/terms` vers `/cgu`.
3. **Points d'Accès Visibles** :
   - Ajouter les liens vers ces pages dans le `Footer` du site.
   - Ajouter les entrées correspondantes dans la modale des réglages (`SettingsModal`) sous une section dédiée « Confidentialité & Légal ».

---

## 2. Exigences Fonctionnelles & Critères d'Acceptation

### A. Badge Source JustWatch (Fiche Film)
- **Positionnement** : Dans la section "Disponible sur" de la fiche film (`/film/[slug]`).
- **Aspect Visuel** : Badge Liquid Glass avec logo JustWatch stylisé, couleur d'accent jaune/or `#FBC02D`, texte clair "Données fournies par JustWatch" ou "JustWatch".
- **Comportement** :
  - Clic sur le badge JustWatch : Ouvre la recherche du film sur JustWatch (`https://www.justwatch.com/fr/recherche?q=...`) dans un nouvel onglet avec `rel="noopener noreferrer"`.
  - Clic sur un logo de plateforme de streaming (ex: Netflix, Disney+, Prime Video, Canal+) : Ouvre directement la recherche du film sur ladite plateforme ou la recherche fallback JustWatch.
  - Micro-interactions soignées : Hover effect, léger lift, feedback tactile au clic.

### B. Page Politique de Confidentialité (`/politique-de-confidentialite` & `/privacy`)
- **Contenu** :
  - Reprise fidèle des mentions de l'application mobile CinéLyon (Protection des données, Sync ID anonyme, Pas de tracking tiers, Stockage local chiffré, RLS Supabase, Droits RGPD & Effacement immédiat, Contact email).
- **Design System** :
  - Responsive, Liquid Glass dark/light mode, typographie soignée, badges de statut, liens interactifs, bouton retour / navigation rapide.
- **SEO & Métadonnées** : Title `Politique de Confidentialité — CinéLyon`, meta description, OpenGraph tags.
- **Redirection / Alias** : L'accès à `/privacy` redirige ou affiche la Politique de Confidentialité de manière transparente.

### C. Page Conditions Générales d'Utilisation (`/cgu` & `/terms`)
- **Contenu** :
  - Objet du service (information culturelle, horaires cinémas Lyon).
  - Gratuité du service.
  - Billetterie & liens externes (indépendance vis-à-vis des cinémas Pathé, UGC, Comoedia, etc.).
  - Propriété intellectuelle.
  - Responsabilité & disponibilité.
- **Design System** : Identique à la page de confidentialité (cohérence visuelle Liquid Glass).
- **SEO & Métadonnées** : Title `Conditions Générales d'Utilisation — CinéLyon`, meta description.
- **Redirection / Alias** : L'accès à `/terms` redirige vers `/cgu`.

### D. Liens Footer & Settings Modal
- **Footer** : Intégrer les liens textuels discrets et élégants `Politique de confidentialité` et `Conditions d'utilisation` dans le footer.
- **SettingsModal** : Ajouter les lignes dans une section "Légal & Confidentialité" avec icônes Lucide (`ShieldCheck`, `FileText`), déclenchant la navigation vers les pages respectives.

---

## 3. Critères de Succès

1. Le badge JustWatch est visible dès que le film possède des `watch_providers`.
2. Les liens streaming redirigent vers les plateformes ou JustWatch.
3. Les pages `/politique-de-confidentialite`, `/cgu`, `/privacy`, `/terms` sont accessibles, sans erreur 404 ni régression Next.js.
4. Les tests et le build Next.js (`npm run build`) passent avec succès sans avertissement TypeScript ou d'accessibilité.
5. Les 3 issues GitHub (#88, #90, #82) peuvent être fermées.
