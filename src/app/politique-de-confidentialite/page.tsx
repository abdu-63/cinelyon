// src/app/politique-de-confidentialite/page.tsx
import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ChevronLeft,
  ShieldCheck,
  Lock,
  Database,
  Trash2,
  ExternalLink,
  Mail,
  UserCheck,
  EyeOff,
  Bell,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité — CinéLyon',
  description:
    'Politique de confidentialité et protection des données personnelles de CinéLyon. Conformité RGPD et Apple Guidelines.',
  alternates: {
    canonical: 'https://cinelyon.fr/politique-de-confidentialite',
  },
  openGraph: {
    title: 'Politique de Confidentialité — CinéLyon',
    description:
      'Découvrez comment CinéLyon protège vos données personnelles avec une approche 100% respectueuse de la vie privée (Privacy by Design).',
    url: 'https://cinelyon.fr/politique-de-confidentialite',
    siteName: 'CinéLyon',
    locale: 'fr_FR',
    type: 'website',
  },
};

export default function PrivacyPolicyPage() {
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
              <ShieldCheck size={14} />
              <span>Conformité RGPD & Apple Guidelines</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Politique de Confidentialité
            </h1>

            <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
              La présente Politique de Confidentialité décrit la manière dont l&apos;application et la plateforme web{' '}
              <strong className="text-neutral-900 dark:text-white font-semibold">CinéLyon</strong> (« nous », « notre »)
              traitent et protègent les données de ses utilisateurs (« vous »).
            </p>

            {/* Encadré Principe Fondamental */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#444cf7]/10 via-[#444cf7]/5 to-transparent border border-[#444cf7]/20 flex items-start gap-3 mt-4">
              <EyeOff size={20} className="text-[#444cf7] shrink-0 mt-0.5" />
              <div className="text-xs text-neutral-700 dark:text-neutral-300 space-y-1">
                <p className="font-bold text-neutral-900 dark:text-white">
                  Principe fondamental : Privacy by Design
                </p>
                <p className="leading-relaxed">
                  CinéLyon est conçue selon le principe de minimisation des données. Nous ne vendons aucune donnée personnelle,
                  n&apos;intégrons aucun traceur publicitaire tiers et ne collectons que le strict minimum nécessaire au fonctionnement du service.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 1. Données collectées et finalités ── */}
        <section className="rounded-[24px] p-6 bg-white/60 dark:bg-[#18181b]/60 border border-black/[0.06] dark:border-white/10 shadow-2xs backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <UserCheck size={16} />
            </div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              1. Données collectées et finalités
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            CinéLyon peut traiter les données suivantes uniquement pour assurer la bonne exécution des fonctionnalités proposées :
          </p>

          <ul className="space-y-2.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#444cf7] mt-1.5 shrink-0" />
              <span>
                <strong className="text-neutral-900 dark:text-white">Identifiant de Synchronisation (Sync ID) & Pseudo :</strong>{' '}
                Un code aléatoire anonyme (ex: 6 caractères) et un pseudonyme facultatif choisi par l&apos;utilisateur pour synchroniser vos films favoris, cinémas préférés et partager vos séances avec des amis sans nécessiter d&apos;email obligatoire.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#444cf7] mt-1.5 shrink-0" />
              <span>
                <strong className="text-neutral-900 dark:text-white">Favoris & Réservations :</strong>{' '}
                Vos cinémas et films favoris ainsi que vos séances programmées sont enregistrés localement sur votre appareil (cache persistant) et sauvegardés de façon sécurisée avec votre Sync ID.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#444cf7] mt-1.5 shrink-0" />
              <span>
                <strong className="text-neutral-900 dark:text-white">Avatar / Photo de profil :</strong>{' '}
                Si vous choisissez de personnaliser votre avatar, celui-ci est stocké localement ou associé à votre identifiant sécurisé sans aucune transmission à des tiers.
              </span>
            </li>
          </ul>
        </section>

        {/* ── 2. Permissions de l'appareil ── */}
        <section className="rounded-[24px] p-6 bg-white/60 dark:bg-[#18181b]/60 border border-black/[0.06] dark:border-white/10 shadow-2xs backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Calendar size={16} />
            </div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              2. Permissions & Accès
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Selon votre utilisation sur mobile ou sur le web, certaines fonctionnalités peuvent solliciter votre autorisation explicite :
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 dark:text-white">
                <Calendar size={14} className="text-[#444cf7]" />
                <span>Calendrier personnel</span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-normal">
                Permet d&apos;exporter un fichier ICS ou d&apos;ajouter une séance dans votre agenda. Aucune lecture de vos événements existants n&apos;est effectuée.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 dark:text-white">
                <Bell size={14} className="text-[#444cf7]" />
                <span>Notifications & Rappels</span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-normal">
                Utilisées uniquement pour vous avertir avant le début d&apos;une séance que vous avez vous-même programmée.
              </p>
            </div>
          </div>
        </section>

        {/* ── 3. Conservation et Sécurité ── */}
        <section className="rounded-[24px] p-6 bg-white/60 dark:bg-[#18181b]/60 border border-black/[0.06] dark:border-white/10 shadow-2xs backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Lock size={16} />
            </div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              3. Conservation des données et Sécurité
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Vos données sont protégées par les standards de sécurité les plus stricts de l&apos;industrie :
          </p>

          <ul className="space-y-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>Stockage local chiffré et sécurisé sur votre terminal (LocalStorage / MMKV / Keychain).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>Base de données Supabase protégée par des politiques de sécurité au niveau des lignes (Row-Level Security / RLS).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>Chiffrement SSL/TLS de bout en bout pour tous les échanges réseau.</span>
            </li>
          </ul>
        </section>

        {/* ── 4. Vos Droits et Suppression Définitive ── */}
        <section className="rounded-[24px] p-6 bg-white/60 dark:bg-[#18181b]/60 border border-black/[0.06] dark:border-white/10 shadow-2xs backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 size={16} />
            </div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              4. Vos Droits & Suppression Définitive (RGPD)
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Conformément au Règlement Général sur la Protection des Données (RGPD) et aux exigences Apple Guideline 5.1.1(v), vous disposez d&apos;un contrôle total et direct sur vos informations :
          </p>

          <div className="space-y-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/5 space-y-1">
              <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                Droit d&apos;accès et d&apos;exportation :
              </span>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Vous pouvez exporter l&apos;intégralité de vos données (favoris, amis, préférences) au format JSON directement depuis la modale des réglages du site ou de l&apos;application.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/5 space-y-1">
              <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                Droit à l&apos;effacement immédiat (Droit à l&apos;oubli) :
              </span>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Vous pouvez supprimer définitivement et instantanément toutes vos données locales et distantes en un seul clic depuis l&apos;option « Supprimer mes données » dans les réglages.
              </p>
            </div>
          </div>
        </section>

        {/* ── 5. Services Tiers et Liens Externes ── */}
        <section className="rounded-[24px] p-6 bg-white/60 dark:bg-[#18181b]/60 border border-black/[0.06] dark:border-white/10 shadow-2xs backdrop-blur-md space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ExternalLink size={16} />
            </div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              5. Services Tiers et Liens Externes
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            CinéLyon propose des liens vers les billetteries officielles des cinémas de la métropole lyonnaise (Pathé, UGC, Comoedia, Cinémas Lumière, etc.) ainsi que des sources de données d&apos;attribution cinématographique (TMDB, JustWatch, RunPee). Ces plateformes tierces disposent de leurs propres politiques de confidentialité que nous vous invitons à consulter.
          </p>
        </section>

        {/* ── 6. Contact & Support ── */}
        <section className="rounded-[28px] p-6 sm:p-8 bg-gradient-to-br from-[#444cf7]/10 via-transparent to-purple-500/10 border border-[#444cf7]/20 shadow-sm space-y-4 text-center">
          <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
            Une question ou une demande concernant vos données ?
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-lg mx-auto leading-relaxed">
            Notre équipe de développement est à votre disposition pour toute précision ou exercice de vos droits RGPD.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="mailto:cinelyon.fr@gmail.com?subject=[RGPD%20CinéLyon]%20Demande%20de%20renseignements"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#444cf7] text-white text-xs font-bold shadow-sm hover:opacity-95 active:scale-95 transition-all"
            >
              <Mail size={15} />
              <span>Contacter le DPO (cinelyon.fr@gmail.com)</span>
            </a>
            <Link
              href="/suggestions"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#242428] text-neutral-800 dark:text-neutral-200 border border-black/10 dark:border-white/10 text-xs font-bold hover:bg-neutral-50 active:scale-95 transition-all"
            >
              <Sparkles size={15} />
              <span>Suggestions & Retours</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
