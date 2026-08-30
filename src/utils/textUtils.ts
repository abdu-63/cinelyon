// src/utils/textUtils.ts
// Utilitaires texte — portage de cinelyon-app

export function decodeHtmlEntities(str: string | null | undefined): string {
  if (!str) return '';
  let prev = '';
  let current = str;
  let iterations = 0;

  while (current !== prev && iterations < 5) {
    prev = current;
    current = current
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
      .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    iterations++;
  }

  return current;
}

/**
 * Génère un identifiant UUID v4 compatible avec tous les navigateurs y compris iOS 15.1 (WebKit legacy)
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

