// src/app/cgu/page.tsx
// Conditions Générales d'Utilisation (CGU) — CinéLyon
import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ChevronLeft,
  FileText,
  Sparkles,
  Ticket,
  AlertCircle,
  Copyright,
  Shield,
  Mail,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — CinéLyon",
  description:
    "Consultez les Conditions Générales d'Utilisation (CGU) de CinéLyon : horaires des cinémas à Lyon, billetterie tierce, règles d'usage et responsabilités.",
  alternates: {
    canonical: 'https://cinelyon.fr/cgu',
  },
  openGraph: {
    title: "Conditions Générales d'Utilisation — CinéLyon",
    description:
      "Conditions d'utilisation du service CinéLyon, l'agrégateur cinématographique indépendant de la métropole de Lyon.",
    url: 'https://cinelyon.fr/cgu',
    siteName: 'CinéLyon',
    locale: 'fr_FR',
    type: 'website',
  },
};

export default function CGUPage() {
  return (
    <main className="pt-4 pb-10 sm:pb-14 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-8 text-neutral-800 dark:text-neutral-200">
        {/* Navigation retour */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-primary transition-colors py-1.5 px-3 rounded-full bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/10 shadow-xs"
          >
            <ChevronLeft size={14} />
            <span>Retour aux séances</span>
          </Link>
          <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium">
            Mise à jour : Mars 2026
          </span>
        </div>

        {/* ── En-tête principal épuré ── */}
        <header className="space-y-3 pt-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
            <FileText size={16} />
            <span>Cadre d&apos;utilisation du service</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-montserrat font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Conditions Générales d&apos;Utilisation
          </h1>

          <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            Bienvenue sur <strong className="text-neutral-900 dark:text-white font-medium">CinéLyon</strong>.
            {' '}En naviguant sur le site web (<strong className="text-neutral-900 dark:text-white font-medium">cinelyon.fr</strong>)
            {' '}ou en utilisant l&apos;application mobile (<strong className="text-neutral-900 dark:text-white font-medium">CinéLyon App</strong>),
            {' '}vous acceptez sans réserve les présentes conditions d&apos;utilisation.
          </p>
        </header>

        {/* ── 1. Objet du Service ── */}
        <section className="border-t border-black/[0.08] dark:border-white/10 pt-6 space-y-3">
          <h2 className="text-base font-montserrat font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
            <Sparkles size={18} className="text-primary shrink-0" />
            <span>1. Objet du Service</span>
          </h2>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            CinéLyon est un agrégateur culturel indépendant et non lucratif dédié au cinéma dans la métropole lyonnaise.
            Le service centralise et met à disposition du public les horaires, versions linguistiques (VOST/VF), formats technologiques (IMAX, Dolby Cinema, 4DX, ScreenX, 35mm, 3D), pauses toilettes RunPee, scènes post-génériques ainsi que des outils d&apos;aide au choix de séances (Ciné-Roulette, Double Programme et carte interactive avec arrêts TCL) pour les 19 cinémas de la métropole de Lyon.
          </p>
        </section>

        {/* ── 2. Gratuité et accès libre ── */}
        <section className="border-t border-black/[0.08] dark:border-white/10 pt-6 space-y-3">
          <h2 className="text-base font-montserrat font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 size={18} className="text-primary shrink-0" />
            <span>2. Gratuité et absence de compte obligatoire</span>
          </h2>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            L&apos;accès au service CinéLyon est entièrement gratuit. Aucune création de compte avec adresse e-mail ou mot de passe n&apos;est requise pour consulter les séances ou sauvegarder vos cinémas et films favoris.
          </p>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            La synchronisation multi-appareils optionnelle repose sur un Sync ID aléatoire et anonyme, garantissant une consultation fluide et respectueuse de la vie privée.
          </p>
        </section>

        {/* ── 3. Rôle d'intermédiaire et billetterie tierce ── */}
        <section className="border-t border-black/[0.08] dark:border-white/10 pt-6 space-y-3">
          <h2 className="text-base font-montserrat font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
            <Ticket size={18} className="text-primary shrink-0" />
            <span>3. Rôle d&apos;intermédiaire technique & Billetterie</span>
          </h2>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            CinéLyon n&apos;est pas un vendeur de billets de cinéma et n&apos;encaisse aucun paiement. Pour chaque séance, CinéLyon met à disposition un lien de redirection direct vers la billetterie officielle en ligne du cinéma concerné (Pathé, UGC, Comoedia, Cinémas Lumière, Ciné Mourguet, etc.).
          </p>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Le contrat de vente, la tarification, le choix des places, la délivrance des billets, les annulations ou remboursements relèvent exclusivement des conditions générales de vente de l&apos;exploitant de la salle. CinéLyon ne saurait être tenu responsable d&apos;un litige commercial intervenant entre l&apos;utilisateur et le cinéma.
          </p>
        </section>

        {/* ── 4. Exactitude des horaires et programmation ── */}
        <section className="border-t border-black/[0.08] dark:border-white/10 pt-6 space-y-3">
          <h2 className="text-base font-montserrat font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
            <AlertCircle size={18} className="text-primary shrink-0" />
            <span>4. Exactitude des horaires et de la programmation</span>
          </h2>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Les horaires et séances affichés sur CinéLyon sont synchronisés régulièrement avec les flux d&apos;information officiels des cinémas. Malgré les efforts déployés pour garantir l&apos;exactitude des données, des modifications de dernière minute, annulations de séances ou défaillances techniques peuvent survenir du fait des exploitants ou des flux tiers.
          </p>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            L&apos;utilisateur est invité à vérifier l&apos;horaire définitif sur la billetterie officielle avant tout déplacement en salle.
          </p>
        </section>

        {/* ── 5. Usage loyal et interdictions techniques ── */}
        <section className="border-t border-black/[0.08] dark:border-white/10 pt-6 space-y-3">
          <h2 className="text-base font-montserrat font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
            <Lock size={18} className="text-primary shrink-0" />
            <span>5. Usage loyal du service & Sécurité</span>
          </h2>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            L&apos;utilisateur s&apos;engage à utiliser la plateforme conformément à sa destination culturelle. Sont formellement interdits :
          </p>

          <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 pl-1">
            <li>Toute extraction massive, automatisée ou systématique de données (scraping agressif) de nature à dégrader les performances du service.</li>
            <li>Toute tentative d&apos;intrusion, d&apos;attaque par déni de service ou d&apos;altération du bon fonctionnement des serveurs.</li>
            <li>Toute réutilisation commerciale non autorisée des données agrégées par CinéLyon.</li>
          </ul>
        </section>

        {/* ── 6. Propriété intellectuelle ── */}
        <section className="border-t border-black/[0.08] dark:border-white/10 pt-6 space-y-3">
          <h2 className="text-base font-montserrat font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
            <Copyright size={18} className="text-primary shrink-0" />
            <span>6. Propriété intellectuelle et crédits</span>
          </h2>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            L&apos;architecture du site, le design system Liquid Glass, le code source, la marque et les logos CinéLyon sont protégés au titre de la propriété intellectuelle.
          </p>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Les affiches de films, bandes-annonces, résumés et métadonnées restent la propriété de leurs ayants droit respectifs et sont utilisés à titre illustratif via les API partenaires (TMDB, JustWatch, AlloCiné, RunPee). Les marques des cinémas lyonnais cités demeurent leur propriété exclusive.
          </p>
        </section>

        {/* ── 7. Disponibilité du service ── */}
        <section className="border-t border-black/[0.08] dark:border-white/10 pt-6 space-y-3">
          <h2 className="text-base font-montserrat font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
            <Shield size={18} className="text-primary shrink-0" />
            <span>7. Disponibilité et limitation de responsabilité</span>
          </h2>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            CinéLyon est soumis à une obligation de moyens pour assurer la disponibilité du service. Toutefois, l&apos;accès peut être temporairement interrompu pour des nécessités de maintenance, de mise à jour ou en cas d&apos;incident technique indépendant de notre contrôle, sans que cela n&apos;ouvre droit à indemnisation.
          </p>
        </section>

        {/* ── 8. Modification des conditions ── */}
        <section className="border-t border-black/[0.08] dark:border-white/10 pt-6 space-y-3">
          <h2 className="text-base font-montserrat font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
            <FileText size={18} className="text-primary shrink-0" />
            <span>8. Évolution des CGU</span>
          </h2>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            CinéLyon se réserve le droit d&apos;adapter ou de modifier à tout moment les présentes Conditions Générales d&apos;Utilisation. La version applicable est celle accessible en ligne à la date de votre consultation du service.
          </p>
        </section>

        {/* ── 9. Droit applicable et contact ── */}
        <section className="border-t border-black/[0.08] dark:border-white/10 pt-6 space-y-4">
          <h2 className="text-base font-montserrat font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
            <Mail size={18} className="text-primary shrink-0" />
            <span>9. Contact & Juridiction compétente</span>
          </h2>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Les présentes conditions d&apos;utilisation sont régies par le droit français. En cas de différend relatif à l&apos;interprétation ou à l&apos;exécution des présentes CGU non résolu à l&apos;amiable, compétence expresse est attribuée aux tribunaux compétents du ressort de la Cour d&apos;appel de Lyon.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <a
              href="mailto:cinelyon.fr@gmail.com?subject=[CGU%20CinéLyon]%20Contact"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:opacity-95 active:scale-95 transition-all"
            >
              <Mail size={14} />
              <span>Contacter l&apos;équipe (cinelyon.fr@gmail.com)</span>
            </a>
            <Link
              href="/suggestions"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 text-xs font-bold hover:bg-neutral-200 dark:hover:bg-white/15 active:scale-95 transition-all"
            >
              <Sparkles size={14} />
              <span>Page de Suggestions</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
