// src/app/api/reload/route.ts
// Revalidation du cache Next.js — équivalent de /api/reload Flask

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-reload-secret');
  const expectedSecret = process.env.RELOAD_SECRET;

  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Invalide toutes les pages qui dépendent des données Supabase
    revalidatePath('/', 'layout');
    revalidatePath('/film/[slug]', 'page');

    return NextResponse.json({ revalidated: true, timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 });
  }
}

// Aussi exposé en GET pour simplicité (scraper peut appeler directement)
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  const expectedSecret = process.env.RELOAD_SECRET;

  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    revalidatePath('/', 'layout');
    revalidatePath('/film/[slug]', 'page');
    return NextResponse.json({ revalidated: true, timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 });
  }
}
