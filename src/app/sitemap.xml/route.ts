// src/app/sitemap.xml/route.ts
// Sitemap dynamique généré côté serveur

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { buildFilmList } from '@/utils/showtimes';
import { FilmRaw } from '@/types';
import { getTodayIso } from '@/utils/dateUtils';

export async function GET() {
  const today = getTodayIso();
  const { data } = await supabase
    .from('showtimes')
    .select('date, movies')
    .gte('date', today)
    .order('date');

  const rows = (data ?? []) as { date: string; movies: FilmRaw[] }[];
  const { films } = buildFilmList(rows, null);

  const baseUrl = 'https://cinelyon.fr';

  const filmUrls = films
    .map(
      (f) => `
  <url>
    <loc>${baseUrl}/film/${f.slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/suggestions</loc>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  ${filmUrls}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}
