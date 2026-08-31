// src/utils/letterboxdUtils.ts
// Gestion des Deep Links vers l'application native Letterboxd (iOS / Android)
// conforme à la spécification officielle Letterboxd x-callback-url (compatible iOS 15.1+).
// Privilégie systématiquement les titres de films en anglais pour correspondre à l'indexation Letterboxd.

export interface LetterboxdLinks {
  deepLink: string;
  webUrl: string;
}

/**
 * Extrait le terme de recherche en anglais ou le nom du film depuis une URL Letterboxd
 */
function extractQueryFromUrl(url: string): string | null {
  // Extraction depuis une URL de recherche : /search/[query]/
  const searchMatch = url.match(/letterboxd\.com\/search\/([^/?#]+)/i);
  if (searchMatch && searchMatch[1]) {
    try {
      return decodeURIComponent(searchMatch[1].replace(/\+/g, ' '));
    } catch {
      return searchMatch[1];
    }
  }

  // Extraction depuis une URL de film direct : /film/[slug]/
  const filmMatch = url.match(/letterboxd\.com\/film\/([^/?#]+)/i);
  if (filmMatch && filmMatch[1]) {
    return filmMatch[1].replace(/-/g, ' ');
  }

  return null;
}

/**
 * Convertit une URL web Letterboxd ou un titre de film en Deep Link natif x-callback-url :
 * "letterboxd://x-callback-url/search?query=[query]&type=film"
 * Privilégie le titre anglais (extrait de l'URL scrapée ou passé en argument) pour correspondre à l'indexation de Letterboxd.
 */
export function getLetterboxdDeepLink(
  webUrlOrSlug?: string | null,
  filmTitle?: string | null,
  englishTitle?: string | null
): LetterboxdLinks {
  const url = (webUrlOrSlug || '').trim();
  const title = (filmTitle || '').trim();
  const enTitle = (englishTitle || '').trim();

  // Extraction du titre anglais depuis l'URL Letterboxd (le scraper CinéLyon stocke la recherche avec le titre anglais/original)
  const queryFromUrl = url ? extractQueryFromUrl(url) : null;

  // Ordre de priorité :
  // 1. Terme anglais issu de l'URL Letterboxd
  // 2. Titre anglais explicite si fourni
  // 3. Titre par défaut du film
  const query = queryFromUrl || enTitle || title || '';

  // Cas 1 : Titre ou terme extrait disponible -> Deep link officiel x-callback-url
  if (query) {
    const encodedQuery = encodeURIComponent(query);
    const deepLink = `letterboxd://x-callback-url/search?query=${encodedQuery}&type=film`;
    const webUrl = url || `https://letterboxd.com/search/${encodedQuery}/`;
    return { deepLink, webUrl };
  }

  // Cas 2 : URL courte boxd.it ou autre URL
  if (url) {
    return {
      deepLink: 'letterboxd://',
      webUrl: url.startsWith('http') ? url : `https://${url}`,
    };
  }

  return {
    deepLink: 'letterboxd://',
    webUrl: 'https://letterboxd.com',
  };
}
