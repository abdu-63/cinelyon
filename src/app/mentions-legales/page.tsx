// src/app/mentions-legales/page.tsx
// Mentions Légales — CinéLyon (Conformité Loi LCEN n° 2004-575 du 21 juin 2004)
import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ChevronLeft,
  Scale,
  Server,
  UserCheck,
  Copyright,
  ShieldCheck,
  Mail,
  Sparkles,
  ExternalLink,
  Bus,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Mentions Légales — CinéLyon',
  description:
    'Mentions légales et informations éditoriales de CinéLyon : éditeur, hébergeur Vercel, propriété intellectuelle, crédits culturels et contact.',
  alternates: {
    canonical: 'https://cinelyon.fr/mentions-legales',
  },
  openGraph: {
    title: 'Mentions Légales — CinéLyon',
    description:
      'Informations légales et éditoriales de la plateforme CinéLyon, l’agrégateur cinématographique indépendant de la métropole de Lyon.',
    url: 'https://cinelyon.fr/mentions-legales',
    siteName: 'CinéLyon',
    locale: 'fr_FR',
    type: 'website',
  },
};

export default function MentionsLegalesPage() {
  return (
    <main className="min-h-screen pt-4 pb-20 px-4 sm:px-6">
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
            <Scale size={16} />
            <span>Informations légales & Éditeur</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-montserrat font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Mentions Légales
          </h1>

          <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            Conformément aux dispositions de l&apos;article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie numérique (LCEN),
            les informations relatives à l&apos;éditeur et à l&apos;hébergeur de la plateforme{' '}
            <strong className="text-neutral-900 dark:text-white font-medium">cinelyon.fr</strong>
            {' '}sont mises à la disposition du public ci-après.
          </p>
        </header>

        {/* ── 1. Éditeur du site ── */}
        <section className="border-t border-black/[0.08] dark:border-white/10 pt-6 space-y-3">
          <h2 className="text-base font-montserrat font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
            <UserCheck size={18} className="text-primary shrink-0" />
            <span>1. Éditeur de la plateforme</span>
          </h2>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Le site web <strong className="text-neutral-900 dark:text-white font-medium">cinelyon.fr</strong>
            {' '}et l&apos;application mobile <strong className="text-neutral-900 dark:text-white font-medium">CinéLyon</strong>
            {' '}sont édités à titre non professionnel et bénévole pour les cinéphiles de la métropole lyonnaise.
          </p>

          <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 pl-1">
            <li>
              <strong className="text-neutral-900 dark:text-white font-medium">Dénomination :</strong> CinéLyon
            </li>
            <li>
              <strong className="text-neutral-900 dark:text-white font-medium">Nature du projet :</strong> Agrégateur d&apos;informations culturelles et cinématographiques non lucratif
            </li>
            <li>
              <strong className="text-neutral-900 dark:text-white font-medium">Directeur de la publication :</strong> L&apos;équipe éditoriale CinéLyon
            </li>
            <li>
              <strong className="text-neutral-900 dark:text-white font-medium">Contact électronique :</strong>{' '}
              <a href="mailto:cinelyon.fr@gmail.com" className="text-primary hover:underline">
                cinelyon.fr@gmail.com
              </a>
            </li>
          </ul>

          <p className="text-xs text-neutral-500 dark:text-neutral-400 italic pt-1 leading-relaxed">
            Conformément à l&apos;article 6, III, 2° de la loi n° 2004-575 du 21 juin 2004 (LCEN), l&apos;éditeur personne physique exerçant à titre non professionnel a choisi de préserver son anonymat. Ses éléments d&apos;identification personnelle ont été transmis et sont conservés par l&apos;hébergeur ci-après désigné.
          </p>
        </section>

        {/* ── 2. Hébergement ── */}
        <section className="border-t border-black/[0.08] dark:border-white/10 pt-6 space-y-3">
          <h2 className="text-base font-montserrat font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
            <Server size={18} className="text-primary shrink-0" />
            <span>2. Hébergement de la plateforme</span>
          </h2>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            La plateforme web CinéLyon est hébergée sur l&apos;infrastructure cloud de la société :
          </p>

          <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 space-y-1 pl-1">
            <p className="font-semibold text-neutral-900 dark:text-white">Vercel Inc.</p>
            <p>440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</p>
            <p>
              Site web officiel :{' '}
              <a
                href="https://vercel.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>vercel.com</span>
                <ExternalLink size={12} />
              </a>
            </p>
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-400 pt-1 leading-relaxed">
            La base de données et les services de synchronisation sont opérés par <strong className="font-medium text-neutral-700 dark:text-neutral-300">Supabase Inc.</strong> (Singapour / États-Unis) avec chiffrement TLS 1.3 de bout en bout.
          </p>
        </section>

        {/* ── 3. Propriété intellectuelle & Marques ── */}
        <section className="border-t border-black/[0.08] dark:border-white/10 pt-6 space-y-3">
          <h2 className="text-base font-montserrat font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
            <Copyright size={18} className="text-primary shrink-0" />
            <span>3. Propriété intellectuelle</span>
          </h2>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            L&apos;ensemble des éléments constitutifs de l&apos;interface (design system Liquid Glass, structure du code, éléments graphiques spécifiques CinéLyon, marque et logo) relèvent de la législation française et internationale sur le droit d&apos;auteur et la propriété intellectuelle (articles L.111-1 et suivants du Code de la Propriété Intellectuelle). Toute reproduction ou extraction intégrale non autorisée est prohibée.
          </p>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Les dénominations commerciales, logos et marques des salles de cinéma citées (Pathé, UGC, Comoedia, Cinémas Lumière, Ciné Mourguet, etc.) demeurent la propriété exclusive de leurs exploitants respectifs.
          </p>
        </section>

        {/* ── 4. Sources et crédits culturels ── */}
        <section className="border-t border-black/[0.08] dark:border-white/10 pt-6 space-y-3">
          <h2 className="text-base font-montserrat font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
            <Sparkles size={18} className="text-primary shrink-0" />
            <span>4. Données cinématographiques & Crédits</span>
          </h2>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Les affiches, résumés, bandes-annonces, scores et données culturelles proviennent d&apos;API tierces et de jeux de données publiques :
          </p>

          <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 pl-1">
            <li>
              <strong className="text-neutral-900 dark:text-white font-medium">The Movie Database (TMDB) :</strong> Métadonnées culturelles, affiches et visuels de films (ce produit utilise l&apos;API TMDB mais n&apos;est ni approuvé ni certifié par TMDB).
            </li>
            <li>
              <strong className="text-neutral-900 dark:text-white font-medium">JustWatch :</strong> Informations sur la disponibilité des œuvres sur les plateformes de streaming légales en France.
            </li>
            <li>
              <strong className="text-neutral-900 dark:text-white font-medium">RunPee :</strong> Indications informatives sur les créneaux de pauses et la présence de scènes post-génériques.
            </li>
            <li>
              <strong className="text-neutral-900 dark:text-white font-medium">AlloCiné :</strong> Notes spectateurs et presse à titre d&apos;index culturel.
            </li>
            <li>
              <strong className="text-neutral-900 dark:text-white font-medium">TCL / SYTRAL Mobilités :</strong> Données publiques en Open Data relatives aux lignes et arrêts de transports en commun de la métropole de Lyon.
            </li>
          </ul>
        </section>

        {/* ── 5. Données personnelles & RGPD ── */}
        <section className="border-t border-black/[0.08] dark:border-white/10 pt-6 space-y-3">
          <h2 className="text-base font-montserrat font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary shrink-0" />
            <span>5. Données personnelles & RGPD</span>
          </h2>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            CinéLyon applique une politique stricte de respect de la vie privée : aucun compte nominatif requis, zéro traceur publicitaire et chiffrement intégral. Pour connaître en détail les mécanismes de stockage local et exercer vos droits d&apos;accès, de rectification ou de suppression, veuillez consulter notre{' '}
            <Link
              href="/politique-de-confidentialite"
              className="text-primary font-semibold hover:underline"
            >
              Politique de Confidentialité
            </Link>.
          </p>
        </section>

        {/* ── 6. Contact ── */}
        <section className="border-t border-black/[0.08] dark:border-white/10 pt-6 space-y-4">
          <h2 className="text-base font-montserrat font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
            <Mail size={18} className="text-primary shrink-0" />
            <span>6. Contact et Assistance</span>
          </h2>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Pour toute demande d&apos;information, remarque relative au contenu ou signalement technique :
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <a
              href="mailto:cinelyon.fr@gmail.com?subject=[Mentions%20Légales%20CinéLyon]%20Contact"
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
              <span>Formulaire de contact & suggestions</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
