// src/utils/languageUtils.ts
// Utilitaire pour le formatage des langues des séances

const LANGUAGE_SHORT_CODES: Record<string, string> = {
  en: 'EN',
  english: 'EN',
  anglais: 'EN',
  ja: 'JA',
  japanese: 'JA',
  japonais: 'JA',
  ko: 'KO',
  korean: 'KO',
  coreen: 'KO',
  'coréen': 'KO',
  es: 'ES',
  spanish: 'ES',
  espagnol: 'ES',
  it: 'IT',
  italian: 'IT',
  italien: 'IT',
  de: 'DE',
  german: 'DE',
  allemand: 'DE',
  zh: 'ZH',
  chinese: 'ZH',
  chinois: 'ZH',
  hi: 'HI',
  hindi: 'HI',
  pt: 'PT',
  portuguese: 'PT',
  portugais: 'PT',
  ru: 'RU',
  russian: 'RU',
  russe: 'RU',
  ar: 'AR',
  arabic: 'AR',
  arabe: 'AR',
  fr: 'FR',
  french: 'FR',
  francais: 'FR',
  'français': 'FR',
  sv: 'SV',
  da: 'DA',
  no: 'NO',
  nl: 'NL',
  pl: 'PL',
  tr: 'TR',
};

export function formatSeanceLang(
  seanceLang?: string | null,
  originalLang?: string | null
): string {
  if (!seanceLang || seanceLang === 'VF') {
    return 'VF';
  }

  // Si c'est déjà un libellé complexe comme 'VOST' ou 'VOSTFR' ou 'VO (EN)'
  if (seanceLang.includes('(')) {
    return seanceLang;
  }

  const langKey = (originalLang || 'en').toLowerCase().trim();
  const code = LANGUAGE_SHORT_CODES[langKey] || (langKey.length === 2 ? langKey.toUpperCase() : 'EN');

  return `VO (${code})`;
}
