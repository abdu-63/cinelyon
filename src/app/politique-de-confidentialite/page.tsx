// src/app/politique-de-confidentialite/page.tsx
// Politique de Confidentialité CinéLyon — Conforme RGPD (UE 2016/679), Loi Informatique & Libertés et Apple Privacy Guidelines
import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ChevronLeft,
  ShieldCheck,
  ExternalLink,
  Mail,
  EyeOff,
  Bell,
  Calendar,
  Sparkles,
  Globe,
  MapPin,
  Trash2,
  Scale,
  Database,
  CheckCircle2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité — CinéLyon',
  description:
    'Politique de confidentialité et protection des données personnelles de CinéLyon. Conformité stricte RGPD, CNIL et Apple Privacy Guidelines.',
  alternates: {
    canonical: 'https://cinelyon.fr/politique-de-confidentialite',
  },
  openGraph: {
    title: 'Politique de Confidentialité — CinéLyon',
    description:
      'Découvrez comment CinéLyon protège votre vie privée : aucun compte nominatif, zéro traceur publicitaire, stockage local et chiffrement intégral.',
    url: 'https://cinelyon.fr/politique-de-confidentialite',
    siteName: 'CinéLyon',
    locale: 'fr_FR',
    type: 'website',
  },
};

export default function PrivacyPolicyPage() {
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
            <ShieldCheck size={16} />
            <span>Protection de votre vie privée</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-montserrat font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Politique de Confidentialité
          </h1>

          <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            CinéLyon est une initiative indépendante dédiée aux cinéphiles de la métropole de Lyon.
            La plateforme web (<strong className="text-neutral-900 dark:text-white font-medium">cinelyon.fr</strong>)
            {' '}et l&apos;application mobile (<strong className="text-neutral-900 dark:text-white font-medium">CinéLyon App</strong>)
            {' '}sont conçues selon le principe fondamental du <em>Privacy by Design</em> : nous ne collectons que le strict minimum utile,
            sans compte obligatoire, sans profilage publicitaire et sans revente de données.
          </p>
        </header>

        {/* ── 1. Les 3 engagements fondamentaux ── */}
        <section className="border-t border-black/[0.08] dark:border-white/10 pt-6 space-y-4">
          <h2 className="text-base font-montserrat font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
            <EyeOff size={18} className="text-primary shrink-0" />
            <span>1. Nos trois engagements fondamentaux</span>
          </h2>

          <div className="space-y-3.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div>
                <strong className="text-neutral-900 dark:text-white block font-semibold">
                  Aucune donnée nominative obligatoire
                </strong>
                <span>
                  Vous pouvez parcourir l&apos;intégralité des séances et sauvegarder vos films favoris sans renseigner de nom, prénom, numéro de téléphone, adresse e-mail ou mot de passe.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div>
                <strong className="text-neutral-900 dark:text-white block font-semibold">
                  Zéro traceur publicitaire ou cookie tiers
                </strong>
                <span>
                  Aucun cookie de ciblage marketing, aucun pixel Meta/Facebook, aucun tracker Google Ads ou régie publicitaire n&apos;est intégré. CinéLyon ne vend ni ne loue la moindre donnée.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div>
                <strong className="text-neutral-900 dark:text-white block font-semibold">
                  Synchronisation anonyme via Sync ID
                </strong>
                <span>
                  Pour synchroniser vos cinémas et films favoris entre votre ordinateur et votre smartphone, un identifiant aléatoire et anonyme à 6 caractères (ex.{' '}<code>a0cc4a</code>) vous est attribué, sans lien avec votre identité civile.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. Données et stockage local ── */}
        <section className="border-t border-black/[0.08] dark:border-white/10 pt-6 space-y-3">
          <h2 className="text-base font-montserrat font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
            <Globe size={18} className="text-primary shrink-0" />
            <span>2. Données traitées & Stockage local</span>
          </h2>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Vos préférences d&apos;utilisation (cinémas favoris, films likés, thème clair/sombre, masquage des séances passées) sont hébergées prioritairement sur votre propre appareil :
          </p>

          <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 pl-1">
            <li>
              <strong className="text-neutral-900 dark:text-white font-medium">Sur le Web (cinelyon.fr) :</strong> Sauvegarde directe dans le <code>localStorage</code> de votre navigateur.
            </li>
            <li>
              <strong className="text-neutral-900 dark:text-white font-medium">Sur l&apos;Application Mobile :</strong> Stockage local chiffré haute performance (MMKV) en mode <em>Offline-First</em>.
            </li>
            <li>
              <strong className="text-neutral-900 dark:text-white font-medium">Synchronisation distante :</strong> Lorsque vous activez la synchronisation, la liste de vos identifiants de films et cinémas favoris est associée de manière sécurisée à votre Sync ID sur notre base de données Supabase, avec chiffrement TLS 1.3 / HTTPS de bout en bout.
            </li>
          </ul>
        </section>

        {/* ── 3. Base légale du traitement ── */}
        <section className="border-t border-black/[0.08] dark:border-white/10 pt-6 space-y-3">
          <h2 className="text-base font-montserrat font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
            <Scale size={18} className="text-primary shrink-0" />
            <span>3. Base légale des traitements (RGPD Art. 6)</span>
          </h2>

          <div className="space-y-2.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
            <p>
              <strong className="text-neutral-900 dark:text-white font-medium">Intérêt légitime (Art. 6.1.f RGPD) :</strong> Le stockage local de vos préférences sur votre navigateur ou appareil mobile permet d&apos;assurer le fonctionnement ergonomique du service (conservation du thème d&apos;affichage, filtrage des séances, mise en cache hors-ligne).
            </p>
            <p>
              <strong className="text-neutral-900 dark:text-white font-medium">Consentement explicite (Art. 6.1.a RGPD) :</strong> La synchronisation distante de vos favoris via Sync ID, l&apos;activation des rappels de séance locaux et la géolocalisation reposent exclusivement sur votre démarche volontaire et peuvent être désactivées à tout moment.
            </p>
          </div>
        </section>

        {/* ── 4. Permissions de l'appareil ── */}
        <section className="border-t border-black/[0.08] dark:border-white/10 pt-6 space-y-3">
          <h2 className="text-base font-montserrat font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
            <Calendar size={18} className="text-primary shrink-0" />
            <span>4. Permissions de l&apos;appareil</span>
          </h2>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Certaines fonctionnalités interactives nécessitent votre autorisation explicite :
          </p>

          <div className="space-y-2.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
            <div className="flex items-start gap-2.5">
              <Calendar size={16} className="text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-900 dark:text-white font-medium">Calendrier :</strong> Permet d&apos;exporter un fichier standard <code>.ics</code> (sur le Web) ou d&apos;ajouter un rappel dans votre application d&apos;agenda natif (sur mobile). CinéLyon n&apos;accède à aucun de vos événements privés.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Bell size={16} className="text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-900 dark:text-white font-medium">Rappels de séances (Mobile) :</strong> Notifications programmées localement sur votre téléphone pour vous avertir avant le début d&apos;une séance choisie. Aucun serveur distant ne conserve d&apos;historique de vos rappels.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-900 dark:text-white font-medium">Géolocalisation (optionnelle) :</strong> Utilisée uniquement si vous demandez à centrer la carte des cinémas ou à afficher les cinémas et arrêts TCL les plus proches de vous. Votre localisation GPS n&apos;est jamais transmise à nos serveurs ni conservée dans un historique.
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. Billetteries officielles et partenaires ── */}
        <section className="border-t border-black/[0.08] dark:border-white/10 pt-6 space-y-3">
          <h2 className="text-base font-montserrat font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
            <ExternalLink size={18} className="text-primary shrink-0" />
            <span>5. Billetteries des exploitants & Services tiers</span>
          </h2>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            CinéLyon vous redirige vers les billetteries officielles des exploitants (Pathé, UGC, Comoedia, Cinémas Lumière, Ciné Mourguet...). Dès lors que vous quittez CinéLyon pour réserver une place, la politique de confidentialité de l&apos;exploitant de la salle s&apos;applique à vos opérations d&apos;achat.
          </p>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Les visuels, synopsis, bandes-annonces et métadonnées de films proviennent des API culturelles de TMDB, AlloCiné, RunPee et JustWatch. Les données cartographiques et d&apos;arrêts de transport proviennent des flux publics Open Data de la Métropole de Lyon (TCL / Sytral Mobilités).
          </p>
        </section>

        {/* ── 6. Conservation des données ── */}
        <section className="border-t border-black/[0.08] dark:border-white/10 pt-6 space-y-3">
          <h2 className="text-base font-montserrat font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
            <Database size={18} className="text-primary shrink-0" />
            <span>6. Durée de conservation des données</span>
          </h2>

          <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 pl-1">
            <li>
              <strong className="text-neutral-900 dark:text-white font-medium">Données stockées localement :</strong> Conservées jusqu&apos;à l&apos;effacement manuel des données du navigateur ou la réinitialisation de l&apos;application mobile.
            </li>
            <li>
              <strong className="text-neutral-900 dark:text-white font-medium">Données de synchronisation distante :</strong> Associées au Sync ID jusqu&apos;à ce que vous déclenchiez la suppression via le bouton dédié dans les réglages.
            </li>
          </ul>
        </section>

        {/* ── 7. Vos droits RGPD, suppression en 1 clic & CNIL ── */}
        <section className="border-t border-black/[0.08] dark:border-white/10 pt-6 space-y-4">
          <h2 className="text-base font-montserrat font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
            <Trash2 size={18} className="text-rose-500 shrink-0" />
            <span>7. Vos droits RGPD & Suppression en 1 clic</span>
          </h2>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Conformément aux articles 15 à 21 du Règlement Général sur la Protection des Données (RGPD), vous disposez à tout moment d&apos;un droit d&apos;accès, de rectification et d&apos;effacement de vos données.
          </p>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Vous pouvez réinitialiser votre Sync ID et effacer l&apos;intégralité de vos données locales et distantes en un seul clic depuis l&apos;interface dans :<br />
            <span className="font-semibold text-neutral-900 dark:text-white">Réglages › Données personnelles & Confidentialité › Supprimer mes données</span>.
          </p>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous disposez du droit d&apos;introduire une réclamation auprès de la Commission Nationale de l&apos;Informatique et des Libertés (CNIL) sur son site officiel{' '}
            <a
              href="https://www.cnil.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium hover:underline inline-flex items-center gap-0.5"
            >
              <span>cnil.fr</span>
              <ExternalLink size={11} />
            </a>.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <a
              href="mailto:cinelyon.fr@gmail.com?subject=[RGPD%20CinéLyon]%20Demande%20de%20renseignements"
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
              <span>Suggestions & Retours</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
