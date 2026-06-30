// src/utils/imageUtils.ts
// Portage de app.py::optimize_poster_url() — identique à cinelyon-app

export function optimizePosterUrl(url: string, width = 200): string {
  if (!url || url.startsWith('/static')) return '';

  if (url.includes('image.tmdb.org')) {
    const size = width <= 185 ? 'w185' : width <= 342 ? 'w342' : 'w500';
    return url.replace(/\/t\/p\/[^/]+\//, `/t/p/${size}/`);
  }

  if (url.includes('acsta.net')) return url;

  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&q=80&output=webp`;
}

export const PLACEHOLDER_POSTER = '/images/nocontent.png';

export function extractYoutubeId(url: string): string | null {
  const regex =
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export function toYoutubeEmbedUrl(url: string): string | null {
  const id = extractYoutubeId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}`;
}
