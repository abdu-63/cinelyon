import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

const dirname = process.cwd();
dotenv.config({ path: path.join(dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStats() {
  console.log("--- Statistiques de la base CinéLyon ---");

  // 1. Nombre total de films de référence
  const { count: filmCount, error: filmError } = await supabase
    .from('reference_films')
    .select('*', { count: 'exact', head: true });

  if (filmError) console.error("Erreur films:", filmError);
  else console.log(`🎬 Total de films en référence : ${filmCount}`);

  // 2. Détail par source
  console.log("\n--- Détail par source ---");
  const { data: sources, error: sourceError } = await supabase
    .from('reference_sources')
    .select('*')
    .order('last_scraped_at', { ascending: false });

  if (sourceError) console.error("Erreur sources:", sourceError);
  else {
    console.table(sources.map(s => ({
      Source: s.id,
      "Films trouvés": s.film_count,
      "Dernier scrap": s.last_scraped_at ? new Date(s.last_scraped_at).toLocaleString() : "Jamais"
    })));
  }
}

checkStats();
