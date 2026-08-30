# Découpage des Tâches (Tasks) : Pages Légales & Badge JustWatch

**Feature ID** : `001-legal-pages-justwatch-badge`

- [x] **Tâche 1 : Composant JustWatchBadge & Intégration Fiche Film**
  - [x] Créer `src/components/ui/JustWatchBadge.tsx` avec logo vectoriel JustWatch, style Liquid Glass et lien de recherche.
  - [x] Mettre à jour `src/app/film/[slug]/page.tsx` pour intégrer `JustWatchBadge` dans la section streaming et rendre les logos de plateformes cliquables.

- [x] **Tâche 2 : Création de la Page Politique de Confidentialité**
  - [x] Créer `src/app/politique-de-confidentialite/page.tsx` avec contenu complet conforme RGPD et design Liquid Glass.
  - [x] Configurer les métadonnées SEO pour la page de confidentialité.

- [x] **Tâche 3 : Création de la Page Conditions Générales d'Utilisation (CGU)**
  - [x] Créer `src/app/cgu/page.tsx` avec contenu complet et design Liquid Glass.
  - [x] Configurer les métadonnées SEO pour la page CGU.

- [x] **Tâche 4 : Configuration des Redirections Next.js**
  - [x] Mettre à jour `next.config.ts` pour rediriger `/privacy` vers `/politique-de-confidentialite`, `/terms` vers `/cgu` et `/support` vers `/suggestions`.
  - [x] Ajouter les routes de compatibilité Next.js `src/app/privacy/page.tsx` et `src/app/terms/page.tsx`.

- [x] **Tâche 5 : Mise à Jour du Footer et de la Modale des Réglages**
  - [x] Mettre à jour `src/components/layout/Footer.tsx` pour inclure les liens vers la Politique de Confidentialité et les CGU.
  - [x] Mettre à jour `src/components/ui/SettingsModal.tsx` pour inclure la section "Légal & Confidentialité" conforme au design mobile Apple.

- [x] **Tâche 6 : Vérification, Build & Clôture des Issues GitHub**
  - [x] Lancer `npm run build` et valider l'absence d'erreurs.
  - [x] Clôturer les issues GitHub #88, #90, #82 via `gh issue close`.
