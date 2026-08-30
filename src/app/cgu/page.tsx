// src/app/cgu/page.tsx
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
} from 'lucide-react';

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — CinéLyon",
  description:
    "Consultez les Conditions Générales d'Utilisation (CGU) de CinéLyon : horaires des cinémas à Lyon, billetterie tierce, propriété intellectuelle et responsabilités.",
  alternates: {
    canonical: 'https://cinelyon.fr/cgu',
  },
  openGraph: {
    title: "Conditions Générales d'Utilisation — CinéLyon",
    description:
      "Conditions d'utilisation du service CinéLyon, l'agrégateur indépendant de séances de cinéma à Lyon.",
    url: 'https://cinelyon.fr/cgu',
    siteName: 'CinéLyon',
    locale: 'fr_FR',
    type: 'website',
  },
};

export default function CGUPage() {
  return (
    <main className="min-h-screen pt-4 pb-16 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation retour */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-[#444cf7] dark:hover:text-[#444cf7] transition-colors py-1 px-2.5 rounded-full bg-white/60 dark:bg-white/5 border border-black/[0.06] dark:border-white/10 backdrop-blur-md shadow-2xs"
          >
            <ChevronLeft size={14} />
            <span>Retour aux séances</span>
          </Link>
          <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium">
            Mise à jour : Août 2026
          </span>
        </div>

        {/* En-tête de la page */}
        <div className="rounded-[28px] p-6 sm:p-8 bg-white/70 dark:bg-[#18181b]/80 border border-black/[0.06] dark:border-white/10 shadow-sm backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#444cf7]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#444cf7]/10 dark:bg-[#444cf7]/20 text-[#444cf7] border border-[#444cf7]/20 text-xs font-bold">
              <FileText size={14} />
              <span>Conditions d&apos;Utilisation</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Conditions Générales d&apos;Utilisation
            </h1>

            <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
              Bienvenue sur <strong className="text-neutral-900 dark:text-white font-semibold">CinéLyon</strong>. En utilisant
              notre site web ou notre application mobile, vous acceptez d&apos;être lié par les présentes Conditions Générales d&apos;Utilisation (CGU).
            </p>
          </div>
        </div>

        {/* ── 1. Objet du Service ── */}
        <section className="rounded-[24px] p-6 bg-white/60 dark:bg-[#18181b]/60 border border-black/[0.06] dark:border-white/10 shadow-2xs backdrop-blur-md space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              1. Objet du Service
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            CinéLyon est une plateforme d&apos;information culturelle et cinématographique indépendante. Son objet est de permettre aux cinéphiles de consulter en temps réel les horaires, séances, versions linguistiques (VOST/VF), formats technologiques (IMAX, Dolby Cinema, 4DX, ScreenX, 3D), pauses RunPee et scènes post-génériques de tous les cinémas de la métropole lyonnaise.
          </p>
        </section>

        {/* ── 2. Gratuité et Accès ── */}
        <section className="rounded-[24px] p-6 bg-white/60 dark:bg-[#18181b]/60 border border-black/[0.06] dark:border-white/10 shadow-2xs backdrop-blur-md space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              2. Gratuité et Accès
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            L&apos;accès à CinéLyon et la consultation des programmes de cinéma sont entièrement gratuits. L&apos;utilisation du service ne requiert aucune souscription payante obligatoire ni création de compte obligatoire.
          </p>
        </section>

        {/* ── 3. Billetterie et Liens Externes ── */}
        <section className="rounded-[24px] p-6 bg-white/60 dark:bg-[#18181b]/60 border border-black/[0.06] dark:border-white/10 shadow-2xs backdrop-blur-md space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Ticket size={16} />
            </div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              3. Billetterie et Liens Partenaires
            </h2>
          </div>

          <div className="space-y-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            <p>
              CinéLyon est un agrégateur d&apos;information et n&apos;est en aucun cas vendeur de billets de cinéma ni intermédiaire de paiement.
            </p>
            <p>
              Lorsque vous cliquez sur un bouton de réservation ou de séance, vous êtes redirigé vers le site web officiel ou la billetterie de l&apos;exploitant concerné (Pathé, UGC, Comoedia, Cinémas Lumière, etc.). Les conditions générales de vente et politiques tarifaires de ces exploitants s&apos;appliquent alors exclusivement.
            </p>
          </div>
        </section>

        {/* ── 4. Propriété Intellectuelle ── */}
        <section className="rounded-[24px] p-6 bg-white/60 dark:bg-[#18181b]/60 border border-black/[0.06] dark:border-white/10 shadow-2xs backdrop-blur-md space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Copyright size={16} />
            </div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              4. Propriété Intellectuelle
            </h2>
          </div>

          <div className="space-y-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            <p>
              L&apos;interface utilisateur, le design Liquid Glass, le logo CinéLyon et le code source de l&apos;application sont la propriété exclusive de l&apos;éditeur de CinéLyon.
            </p>
            <p>
              Les affiches de films, synopsis, bandes-annonces, logos de distributeurs et marques de cinémas demeurent la propriété respective de leurs ayants droit légaux et sont affichés à des fins strictement informatives et d&apos;illustration culturelle.
            </p>
          </div>
        </section>

        {/* ── 5. Responsabilité et Disponibilité ── */}
        <section className="rounded-[24px] p-6 bg-white/60 dark:bg-[#18181b]/60 border border-black/[0.06] dark:border-white/10 shadow-2xs backdrop-blur-md space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertCircle size={16} />
            </div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              5. Responsabilité & Exactitude des Horaires
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Nous déployons nos meilleurs efforts pour garantir la fraîcheur et la conformité des horaires de séances. Néanmoins, CinéLyon ne saurait être tenue pour responsable d&apos;une modification d&apos;horaire, d&apos;un changement de salle ou d&apos;une annulation de séance survenue à l&apos;initiative d&apos;un cinéma partenaire.
          </p>
        </section>

        {/* ── 6. Contact ── */}
        <section className="rounded-[28px] p-6 sm:p-8 bg-gradient-to-br from-[#444cf7]/10 via-transparent to-blue-500/10 border border-[#444cf7]/20 shadow-sm space-y-4 text-center">
          <div className="w-10 h-10 rounded-2xl bg-[#444cf7]/20 text-[#444cf7] flex items-center justify-center mx-auto">
            <Shield size={20} />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
            Une question sur nos conditions d&apos;utilisation ?
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-lg mx-auto leading-relaxed">
            Pour toute demande juridique ou question technique, n&apos;hésitez pas à contacter notre équipe.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="mailto:cinelyon.fr@gmail.com?subject=[CGU%20CinéLyon]%20Question"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#444cf7] text-white text-xs font-bold shadow-sm hover:opacity-95 active:scale-95 transition-all"
            >
              <Mail size={15} />
              <span>Écrire à l&apos;équipe (cinelyon.fr@gmail.com)</span>
            </a>
            <Link
              href="/politique-de-confidentialite"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#242428] text-neutral-800 dark:text-neutral-200 border border-black/10 dark:border-white/10 text-xs font-bold hover:bg-neutral-50 active:scale-95 transition-all"
            >
              <Shield size={15} />
              <span>Politique de Confidentialité</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
