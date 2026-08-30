# Plan Technique d'Implémentation : Pages Légales & Badge JustWatch

**Feature ID** : `001-legal-pages-justwatch-badge`

---

## 1. Architecture Technique

### 1.1 Badge & Composant JustWatch
- **Fichier** : `src/components/ui/JustWatchBadge.tsx`
  - Composant client affichant le logo JustWatch + label ("Données JustWatch" ou "Fourni par JustWatch").
  - Lien sortant avec `target="_blank"` et `rel="noopener noreferrer"` vers la recherche JustWatch pour le film.
  - Styles Apple / Liquid Glass avec accent `#FBC02D` (or JustWatch) et fond translucide `rgba(251, 192, 45, 0.1)`.
- **Intégration** : `src/app/film/[slug]/page.tsx`
  - Intégrer `JustWatchBadge` à côté de l'en-tête "Disponible sur" ou au pied de la rangée des plateformes de streaming.
  - Transformer les vignettes de fournisseurs (`p.logo_path`) en boutons interactifs avec `onClick={() => openStreamingProvider(p.name, film.title)}` et animations Framer Motion / CSS hover.

### 1.2 Pages Légales (Next.js App Router)
- **`src/app/politique-de-confidentialite/page.tsx`** :
  - Server Component avec SEO metadata complet (`title`, `description`, `openGraph`, `canonical`).
  - Layout propre avec header dégradé violet / Liquid Glass, fil d'ariane (Accueil > Confidentialité), cartes de sections claires avec icônes (Données collectées, Permissions, Sécurité Supabase, Droits RGPD & Suppression, Contact).
  - Badge "Conformité RGPD & Apple Guidelines".
- **`src/app/cgu/page.tsx`** :
  - Server Component avec SEO metadata (`title`, `description`).
  - Sections : Objet du service, Gratuité, Billetterie cinémas partenaires, Propriété intellectuelle, Responsabilité, Contact.
- **Redirections Next.js** (`next.config.ts`) :
  - `/privacy` -> `/politique-de-confidentialite` (permanent: true)
  - `/terms` -> `/cgu` (permanent: true)
  - `/support` -> `/suggestions` (permanent: true) si non existant

### 1.3 Intégrations UI (Navigation & Points d'Entrée)
- **`src/components/layout/Footer.tsx`** :
  - Ajouter les liens vers `Politique de confidentialité` et `Conditions d'utilisation`.
- **`src/components/ui/SettingsModal.tsx`** :
  - Ajouter un bloc "Légal & Confidentialité" reprenant le style de l'application mobile (`cinelyon-app`) avec :
    - Politique de confidentialité -> Lien direct vers `/politique-de-confidentialite`
    - Conditions d'utilisation -> Lien direct vers `/cgu`

---

## 2. Dépendances & Compatibilité
- Aucun nouveau package requis.
- Utilisation de Lucide Icons existant (`ShieldCheck`, `FileText`, `ExternalLink`, `ChevronLeft`, `Lock`, `Trash2`, `Download`).
- Compatible Next.js 15+ App Router et TypeScript strict.

---

## 3. Plan de Validation & Tests
- Vérification manuelle des pages `/politique-de-confidentialite`, `/cgu`, `/privacy` et `/terms`.
- Vérification du badge JustWatch et des liens streaming sur la fiche film `/film/[slug]`.
- Build Next.js (`npm run build`) pour vérifier le typage et l'absence d'erreurs SSR.
- Clôture des issues GitHub #88, #90, #82 via `gh issue close`.
