// src/utils/imageUtils.ts
// Portage exact de app.py::optimize_poster_url()

/**
 * Portage de app.py::optimize_poster_url(url, width)
 * Sélectionne la taille TMDB optimale ou utilise wsrv.nl comme CDN de repli.
 */
export function optimizePosterUrl(url: string, width = 200): string {
  if (!url || url.startsWith('/static')) return '';

  // Images TMDB : utilise les tailles officielles du CDN
  if (url.includes('image.tmdb.org')) {
    const size = width <= 185 ? 'w185' : width <= 342 ? 'w342' : 'w500';
    return url.replace(/\/t\/p\/[^/]+\//, `/t/p/${size}/`);
  }

  // Images Allociné (CDN Akamai très rapide) : chargement direct
  if (url.includes('acsta.net')) return url;

  // Autres images : wsrv.nl comme proxy CDN avec conversion WebP
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&q=80&output=webp`;
}

/**
 * URL par défaut quand pas d'affiche disponible
 * (remplace /static/images/nocontent.png du site web)
 */
export const PLACEHOLDER_POSTER = 'https://via.placeholder.com/200x300/16161f/555566?text=CinéLyon';

/**
 * Extrait le videoId YouTube depuis n'importe quel format d'URL YouTube
 * Portage de la regex de app.py::film_detail() (lines 546–553) et index.js::openTrailer()
 */
export function extractYoutubeId(url: string): string | null {
  const regex =
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

/**
 * Convertit une URL YouTube watch en URL embed avec autoplay
 */
export function toYoutubeEmbedUrl(url: string, autoplay = false): string | null {
  const id = extractYoutubeId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}${autoplay ? '?autoplay=1' : ''}`;
}
