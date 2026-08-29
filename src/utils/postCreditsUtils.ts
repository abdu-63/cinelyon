// src/utils/postCreditsUtils.ts
// Utilitaire d'analyse et de mise en forme des scènes post-génériques pour CinéLyon

import { PostCreditsInfo, PostCreditsStatus } from '@/types';

export interface TMDBKeyword {
  id: number;
  name: string;
}

// Identifiants & noms clés TMDB pour les stingers de générique
const TMDB_DURING_CREDITS_IDS = [179431];
const TMDB_AFTER_CREDITS_IDS = [179432];

const TMDB_DURING_PATTERNS = [/duringcreditsstinger/i, /during credits/i, /mid.credit/i];

const TMDB_AFTER_PATTERNS = [
  /aftercreditsstinger/i,
  /after credits/i,
  /post.credit/i,
  /end.credit/i,
];

const TMDB_NO_CREDITS_PATTERNS = [
  /no after credits/i,
  /no post credits/i,
  /no credits scene/i,
  /no stinger/i,
];

// Franchises avec habitudes connues de scènes post-générique
const MARVEL_PATTERNS = [
  /\bmarvel\b/i,
  /avengers/i,
  /spider-man/i,
  /deadpool/i,
  /guardians of the galaxy/i,
  /gardien(s)? de la galaxie/i,
  /thor\b/i,
  /iron man/i,
  /captain america/i,
  /doctor strange/i,
  /black panther/i,
  /ant-man/i,
  /eternals/i,
  /shang-chi/i,
  /venom/i,
  /morbius/i,
  /kraven/i,
  /x-men/i,
  /wolverine/i,
];

const DC_PATTERNS = [
  /\bdc\b/i,
  /aquaman/i,
  /black adam/i,
  /shazam/i,
  /suicide squad/i,
  /flash\b/i,
  /justice league/i,
];

const ANIMATION_STUDIO_PATTERNS = [
  /pixar/i,
  /disney/i,
  /illumination/i,
  /dreamworks/i,
  /moi, moche et méchant/i,
  /minions/i,
  /vice-versa/i,
  /inside out/i,
  /kung fu panda/i,
  /zootopie/i,
  /zootopia/i,
  /moana/i,
  /vaiana/i,
  /toy story/i,
  /shrek/i,
];

/**
 * Analyse les mots-clés TMDB pour détecter la présence de scènes post-générique
 */
export function parseTMDBKeywords(keywords: TMDBKeyword[]): {
  hasMidCredits: boolean;
  hasEndCredits: boolean;
  noPostCredits: boolean;
} {
  let hasMidCredits = false;
  let hasEndCredits = false;
  let noPostCredits = false;

  if (!keywords || !Array.isArray(keywords)) {
    return { hasMidCredits, hasEndCredits, noPostCredits };
  }

  for (const kw of keywords) {
    const kwName = kw.name || '';
    const kwId = kw.id;

    if (TMDB_NO_CREDITS_PATTERNS.some((p) => p.test(kwName))) {
      noPostCredits = true;
      continue;
    }

    if (
      TMDB_DURING_CREDITS_IDS.includes(kwId) ||
      TMDB_DURING_PATTERNS.some((p) => p.test(kwName))
    ) {
      hasMidCredits = true;
    }
    if (TMDB_AFTER_CREDITS_IDS.includes(kwId) || TMDB_AFTER_PATTERNS.some((p) => p.test(kwName))) {
      hasEndCredits = true;
    }
  }

  return { hasMidCredits, hasEndCredits, noPostCredits };
}

/**
 * Heuristique contextuelle basée sur le titre du film et son studio / franchise
 */
export function detectFranchisePostCredits(
  title: string,
  genres?: string
): { status: PostCreditsStatus; summaryKey: string } | null {
  if (!title) return null;

  if (MARVEL_PATTERNS.some((p) => p.test(title))) {
    return { status: 'both', summaryKey: 'postCredits.summaryMarvel' };
  }

  if (DC_PATTERNS.some((p) => p.test(title))) {
    return { status: 'mid_credits', summaryKey: 'postCredits.summaryDC' };
  }

  if (ANIMATION_STUDIO_PATTERNS.some((p) => p.test(title))) {
    return { status: 'mid_credits', summaryKey: 'postCredits.summaryAnimation' };
  }

  return null;
}

/**
 * Résout une clé i18n via t() ou retourne un fallback FR.
 */
function resolveKey(
  key: string,
  t?: (key: string, params?: Record<string, string>) => string,
  params?: Record<string, string>
): string {
  if (t) return t(key, params);
  // Fallback FR pour les contextes sans t() (tests)
  const fallbacks: Record<string, string> = {
    'postCredits.titleBoth': 'Scènes Post-Générique (2)',
    'postCredits.titleMid': 'Scène Mid-Credits',
    'postCredits.titleEnd': 'Scène Post-Générique',
    'postCredits.titleNone': 'Pas de Scène Post-Générique',
    'postCredits.badgeBoth': '2 Scènes (milieu + fin)',
    'postCredits.badgeBothShort': '2 Scènes fin',
    'postCredits.badgeMid': '1 Scène pendant le générique',
    'postCredits.badgeMidShort': '1 Scène milieu',
    'postCredits.badgeEnd': '1 Scène à la toute fin',
    'postCredits.badgeEndShort': '1 Scène fin',
    'postCredits.badgeNone': 'Aucune scène post-générique',
    'postCredits.badgeNoneShort': 'Pas de scène',
    'postCredits.badgeUnknown': 'Non confirmé',
    'postCredits.badgeUnknownShort': 'Inconnu',
    'postCredits.summaryBoth':
      'Restez bien assis ! Il y a une scène pendant le générique et une autre à la toute fin.',
    'postCredits.summaryMid':
      "Une scène bonus est diffusée au milieu du générique. Vous n'aurez pas besoin d'attendre la toute fin.",
    'postCredits.summaryEnd':
      "Restez jusqu'à la fin complète ! Une scène bonus vous attend après le défilement complet des crédits.",
    'postCredits.summaryNone':
      'Aucune scène bonus. Vous pouvez quitter la salle dès le début du générique en toute sérénité.',
    'postCredits.summaryNoneShort': 'Aucune scène post-générique répertoriée pour ce film.',
    'postCredits.summaryUnknown': 'Information de générique non confirmée.',
    'postCredits.summaryMarvel':
      'Restez assis ! Les films Marvel comportent presque toujours des scènes bonus pendant et à la toute fin du générique.',
    'postCredits.summaryDC':
      'Restez vigilant : les films DC incluent fréquemment une scène bonus pendant le générique.',
    'postCredits.summaryAnimation':
      'Un petit bonus ou animation comique est souvent proposé pendant la première partie du générique.',
  };
  return fallbacks[key] ?? key;
}

/**
 * Construit un objet `PostCreditsInfo` standardisé avec un design minimaliste et élégant (style Apple).
 * Accepte un callback `t` optionnel pour résoudre les chaînes dans la langue courante.
 */
export function buildPostCreditsInfo(
  keywords: TMDBKeyword[],
  title: string,
  genres?: string,
  overrideData?: Partial<PostCreditsInfo> | null,
  t?: (key: string, params?: Record<string, string>) => string
): PostCreditsInfo {
  const r = (key: string) => resolveKey(key, t);

  // 1. Si une surcharge personnalisée existe (ex. Supabase / scraping)
  if (overrideData && overrideData.status) {
    const status = overrideData.status;
    const count = overrideData.count ?? (status === 'both' ? 2 : status === 'unknown' ? 0 : 1);
    const hasMidCredits = status === 'both' || status === 'mid_credits';
    const hasEndCredits = status === 'both' || status === 'end_credits';
    const summaryKey = getSummaryKeyForStatus(status);

    return formatPostCreditsInfo({
      status,
      hasMidCredits,
      hasEndCredits,
      count,
      summaryKey,
      summary: overrideData.summary || r(summaryKey),
      source: overrideData.source || 'database',
      r,
    });
  }

  // 2. Détection via les mots-clés TMDB
  const parsed = parseTMDBKeywords(keywords);

  if (parsed.hasMidCredits && parsed.hasEndCredits) {
    return formatPostCreditsInfo({
      status: 'both',
      hasMidCredits: true,
      hasEndCredits: true,
      count: 2,
      summaryKey: 'postCredits.summaryBoth',
      summary: r('postCredits.summaryBoth'),
      source: 'tmdb',
      r,
    });
  }

  if (parsed.hasMidCredits) {
    return formatPostCreditsInfo({
      status: 'mid_credits',
      hasMidCredits: true,
      hasEndCredits: false,
      count: 1,
      summaryKey: 'postCredits.summaryMid',
      summary: r('postCredits.summaryMid'),
      source: 'tmdb',
      r,
    });
  }

  if (parsed.hasEndCredits) {
    return formatPostCreditsInfo({
      status: 'end_credits',
      hasMidCredits: false,
      hasEndCredits: true,
      count: 1,
      summaryKey: 'postCredits.summaryEnd',
      summary: r('postCredits.summaryEnd'),
      source: 'tmdb',
      r,
    });
  }

  if (parsed.noPostCredits) {
    return formatPostCreditsInfo({
      status: 'no_post_credits',
      hasMidCredits: false,
      hasEndCredits: false,
      count: 0,
      summaryKey: 'postCredits.summaryNone',
      summary: r('postCredits.summaryNone'),
      source: 'tmdb',
      r,
    });
  }

  // 3. Fallback Heuristique sur la franchise
  const heuristic = detectFranchisePostCredits(title, genres);
  if (heuristic) {
    const hasMidCredits = heuristic.status === 'both' || heuristic.status === 'mid_credits';
    const hasEndCredits = heuristic.status === 'both' || heuristic.status === 'end_credits';
    const count = heuristic.status === 'both' ? 2 : 1;

    return formatPostCreditsInfo({
      status: heuristic.status,
      hasMidCredits,
      hasEndCredits,
      count,
      summaryKey: heuristic.summaryKey,
      summary: r(heuristic.summaryKey),
      source: 'heuristic',
      r,
    });
  }

  // 4. Par défaut
  return formatPostCreditsInfo({
    status: 'no_post_credits',
    hasMidCredits: false,
    hasEndCredits: false,
    count: 0,
    summaryKey: 'postCredits.summaryNoneShort',
    summary: r('postCredits.summaryNoneShort'),
    source: 'tmdb',
    r,
  });
}

function getSummaryKeyForStatus(status: PostCreditsStatus): string {
  switch (status) {
    case 'both':
      return 'postCredits.summaryBoth';
    case 'mid_credits':
      return 'postCredits.summaryMid';
    case 'end_credits':
      return 'postCredits.summaryEnd';
    case 'no_post_credits':
      return 'postCredits.summaryNone';
    default:
      return 'postCredits.summaryUnknown';
  }
}

function formatPostCreditsInfo({
  status,
  hasMidCredits,
  hasEndCredits,
  count,
  summaryKey,
  summary,
  source,
  r,
}: {
  status: PostCreditsStatus;
  hasMidCredits: boolean;
  hasEndCredits: boolean;
  count: number;
  summaryKey: string;
  summary: string;
  source: 'tmdb' | 'heuristic' | 'database';
  r: (key: string) => string;
}): PostCreditsInfo {
  let title = r('postCredits.titleEnd');
  let badgeLabel = r('postCredits.badgeNone');
  let badgeShortLabel = r('postCredits.badgeNoneShort');
  let badgeColor = '#6B7280';
  let icon = 'checkmark-circle-outline';

  switch (status) {
    case 'both':
      title = r('postCredits.titleBoth');
      badgeLabel = r('postCredits.badgeBoth');
      badgeShortLabel = r('postCredits.badgeBothShort');
      badgeColor = '#10B981';
      icon = 'sparkles';
      break;

    case 'mid_credits':
      title = r('postCredits.titleMid');
      badgeLabel = r('postCredits.badgeMid');
      badgeShortLabel = r('postCredits.badgeMidShort');
      badgeColor = '#F59E0B';
      icon = 'time-outline';
      break;

    case 'end_credits':
      title = r('postCredits.titleEnd');
      badgeLabel = r('postCredits.badgeEnd');
      badgeShortLabel = r('postCredits.badgeEndShort');
      badgeColor = '#10B981';
      icon = 'sparkles';
      break;

    case 'no_post_credits':
      title = r('postCredits.titleNone');
      badgeLabel = r('postCredits.badgeNone');
      badgeShortLabel = r('postCredits.badgeNoneShort');
      badgeColor = '#6B7280';
      icon = 'log-out-outline';
      break;

    case 'unknown':
    default:
      title = r('postCredits.titleEnd');
      badgeLabel = r('postCredits.badgeUnknown');
      badgeShortLabel = r('postCredits.badgeUnknownShort');
      badgeColor = '#9CA3AF';
      icon = 'help-circle-outline';
      break;
  }

  return {
    status,
    hasMidCredits,
    hasEndCredits,
    count,
    title,
    badgeLabel,
    badgeShortLabel,
    badgeColor,
    icon,
    summary,
    source,
  };
}

/**
 * Résout dynamiquement et immédiatement les textes traduits pour PostCreditsInfo
 * en fonction de la fonction de traduction t() active.
 */
export function getLocalizedPostCredits(
  info: PostCreditsInfo | null | undefined,
  t: (key: string, params?: Record<string, string>) => string
): { title: string; badgeLabel: string; badgeShortLabel: string; summary: string } {
  if (!info) {
    return {
      title: t('postCredits.titleEnd'),
      badgeLabel: t('postCredits.badgeNone'),
      badgeShortLabel: t('postCredits.badgeNoneShort'),
      summary: t('postCredits.summaryNoneShort'),
    };
  }

  let title = t('postCredits.titleEnd');
  let badgeLabel = t('postCredits.badgeNone');
  let badgeShortLabel = t('postCredits.badgeNoneShort');
  let summary = t('postCredits.summaryNoneShort');

  switch (info.status) {
    case 'both':
      title = t('postCredits.titleBoth');
      badgeLabel = t('postCredits.badgeBoth');
      badgeShortLabel = t('postCredits.badgeBothShort');
      summary = t('postCredits.summaryBoth');
      break;

    case 'mid_credits':
      title = t('postCredits.titleMid');
      badgeLabel = t('postCredits.badgeMid');
      badgeShortLabel = t('postCredits.badgeMidShort');
      summary = t('postCredits.summaryMid');
      break;

    case 'end_credits':
      title = t('postCredits.titleEnd');
      badgeLabel = t('postCredits.badgeEnd');
      badgeShortLabel = t('postCredits.badgeEndShort');
      summary = t('postCredits.summaryEnd');
      break;

    case 'no_post_credits':
      title = t('postCredits.titleNone');
      badgeLabel = t('postCredits.badgeNone');
      badgeShortLabel = t('postCredits.badgeNoneShort');
      summary = t('postCredits.summaryNoneShort');
      break;

    case 'unknown':
    default:
      title = t('postCredits.titleEnd');
      badgeLabel = t('postCredits.badgeUnknown');
      badgeShortLabel = t('postCredits.badgeUnknownShort');
      summary = t('postCredits.summaryUnknown');
      break;
  }

  return { title, badgeLabel, badgeShortLabel, summary };
}
