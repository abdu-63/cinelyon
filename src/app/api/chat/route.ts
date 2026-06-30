// src/app/api/chat/route.ts
// API Route pour le chatbot CinéBot
// Portage de app.py::chat_with_bot()

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { buildFilmList } from '@/utils/showtimes';
import { FilmRaw } from '@/types';
import { getTodayIso } from '@/utils/dateUtils';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== 'string' || message.length > 1200) {
      return NextResponse.json({ error: 'Message invalide' }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json(
        { reply: 'Le chatbot n\'est pas configuré pour le moment.' },
        { status: 200 }
      );
    }

    // Récupérer les films du jour pour le contexte
    const today = getTodayIso();
    const { data } = await supabase
      .from('showtimes')
      .select('date, movies')
      .gte('date', today)
      .order('date')
      .limit(3);

    const rows = (data ?? []) as { date: string; movies: FilmRaw[] }[];
    const { films } = buildFilmList(rows, null);

    const filmContext = films
      .slice(0, 15)
      .map(
        (f) =>
          `- ${f.title} (${f.release_year}) | ${f.genres} | ${f.director} | ${Object.keys(f.seancesByDay).join(', ')}`
      )
      .join('\n');

    const systemPrompt = `Tu es CinéBot, un assistant spécialisé dans les séances de cinéma à Lyon. 
Tu aides les utilisateurs à trouver des films à voir dans les cinémas lyonnais.
Voici les films actuellement à l'affiche :

${filmContext}

Réponds en français, de manière concise et utile. Si la question ne concerne pas le cinéma, redirige poliment vers les séances.`;

    const groqResponse = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!groqResponse.ok) {
      throw new Error(`Groq API error: ${groqResponse.status}`);
    }

    const groqData = await groqResponse.json();
    const reply = groqData.choices?.[0]?.message?.content ?? 'Désolé, je n\'ai pas pu générer de réponse.';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { reply: 'Une erreur est survenue. Réessaie dans quelques instants.' },
      { status: 200 }
    );
  }
}
