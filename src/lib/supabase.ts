// src/lib/supabase.ts
// Client Supabase pour le site web Next.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Variables Supabase manquantes. Vérifiez .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
