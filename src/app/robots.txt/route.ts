// src/app/robots.txt/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const content = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://cinelyon.fr/sitemap.xml`;

  return new NextResponse(content, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
