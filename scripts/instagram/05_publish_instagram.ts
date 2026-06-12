import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const dirname = process.cwd();
dotenv.config({ path: path.join(dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeTitle(title: string): string {
  if (!title) return '';
  return title.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/^(le |la |les |the |a |an |l')/i, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

const RETRY_DELAYS = [2000, 4000]; // Backoff exponentiel (2s, 4s)

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fonction de retry générique
async function fetchWithRetry(url: string, options: any, retries = 2): Promise<any> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, options);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(`Erreur API: ${JSON.stringify(data)}`);
      }
      return data;
    } catch (e: any) {
      if (i === retries) throw e;
      console.warn(`[Retry ${i + 1}/${retries}] Échec: ${e.message}. Nouvelle tentative dans ${RETRY_DELAYS[i]}ms...`);
      await delay(RETRY_DELAYS[i]);
    }
  }
}

async function uploadToImgBB(filePath: string): Promise<string> {
  const imageBase64 = fs.readFileSync(filePath, { encoding: 'base64' });
  
  const body = new URLSearchParams();
  body.append('image', imageBase64);

  const data = await fetchWithRetry(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body
  });

  return data.data.url;
}

async function ensureBucketExists(bucketName: string): Promise<void> {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      console.warn("⚠️ Impossible de lister les buckets Supabase:", error.message);
      return;
    }
    const exists = buckets.some(b => b.name === bucketName);
    if (!exists) {
      console.log(`- Création du bucket Supabase public '${bucketName}'...`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg'],
        fileSizeLimit: 10485760
      });
      if (createError) {
        console.error(`⚠️ Erreur lors de la création du bucket '${bucketName}':`, createError.message);
      } else {
        console.log(`✅ Bucket '${bucketName}' créé avec succès.`);
      }
    }
  } catch (err: any) {
    console.error("⚠️ Exception lors de la vérification/création du bucket:", err.message);
  }
}

async function uploadToSupabase(filePath: string): Promise<string> {
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const dateStr = new Date().toISOString().split('T')[0];
  const storagePath = `${dateStr}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('instagram')
    .upload(storagePath, fileBuffer, {
      contentType: 'image/png',
      upsert: true
    });

  if (error) {
    throw new Error(`Erreur d'upload Supabase: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('instagram')
    .getPublicUrl(storagePath);

  return publicUrl;
}

export async function publishInstagram(): Promise<void> {
  if (!INSTAGRAM_ACCOUNT_ID || !INSTAGRAM_ACCESS_TOKEN) {
    throw new Error("⚠️ Variables d'environnement manquantes pour l'API Instagram.");
  }
  if (!supabaseUrl || !supabaseKey) {
    if (!IMGBB_API_KEY) {
      throw new Error("⚠️ Variables d'environnement manquantes : Supabase ou ImgBB doit être configuré.");
    }
  }

  const slidesDir = path.join(dirname, 'output', 'slides');
  const captionPath = path.join(dirname, 'output', 'caption.txt');

  if (!fs.existsSync(slidesDir) || !fs.existsSync(captionPath)) {
    throw new Error("⚠️ Dossier slides/ ou fichier caption.txt introuvables. Lancer le Module 3 et 4.");
  }

  const caption = fs.readFileSync(captionPath, 'utf8');
  
  // Trier les slides par ordre alphabétique pour s'assurer que slide_00.png est bien la première
  const files = fs.readdirSync(slidesDir)
    .filter(f => f.endsWith('.png'))
    .sort();

  if (files.length === 0) {
    throw new Error("⚠️ Aucune image trouvée dans le dossier slides.");
  }

  if (files.length > 10) {
    console.warn(`⚠️ Trop de slides détectées (${files.length}). Instagram limite les carrousels à 10 items. Seules les 10 premières seront publiées.`);
    files.splice(10);
  }

  console.log(`📤 Préparation de la publication de ${files.length} images...`);

  // 1. Upload des images
  const imageUrls: string[] = [];
  const useSupabase = !!(supabaseUrl && supabaseKey);
  
  if (useSupabase) {
    await ensureBucketExists('instagram');
  }

  for (const file of files) {
    const fullPath = path.join(slidesDir, file);
    let url = '';
    
    if (useSupabase) {
      try {
        console.log(`- Upload de ${file} sur Supabase Storage...`);
        url = await uploadToSupabase(fullPath);
        console.log(`  URL Supabase: ${url}`);
      } catch (err: any) {
        console.warn(`⚠️ Échec de l'upload Supabase pour ${file}: ${err.message}. Repli sur ImgBB...`);
        if (IMGBB_API_KEY) {
          url = await uploadToImgBB(fullPath);
          console.log(`  URL ImgBB (repli): ${url}`);
        } else {
          throw err;
        }
      }
    } else if (IMGBB_API_KEY) {
      console.log(`- Upload de ${file} sur ImgBB...`);
      url = await uploadToImgBB(fullPath);
      console.log(`  URL ImgBB: ${url}`);
    } else {
      throw new Error("⚠️ Aucun moyen d'hébergement d'images (Supabase ou ImgBB) n'est configuré.");
    }
    
    imageUrls.push(url);
  }

  console.log(`✅ ${imageUrls.length} images hébergées avec succès.`);

  // 2. Créer les media containers individuels
  const childrenIds: string[] = [];
  for (const url of imageUrls) {
    console.log(`- Création du container Meta pour ${url}...`);
    const containerParams = new URLSearchParams({
      image_url: url,
      is_carousel_item: 'true',
      access_token: INSTAGRAM_ACCESS_TOKEN
    });

    const data = await fetchWithRetry(`https://graph.facebook.com/v21.0/${INSTAGRAM_ACCOUNT_ID}/media`, {
      method: 'POST',
      body: containerParams
    });

    childrenIds.push(data.id);
  }

  console.log(`✅ ${childrenIds.length} containers enfants créés.`);

  // 3. Créer le container carrousel avec la caption
  console.log(`- Création du container Carrousel Parent...`);
  const carouselParams = new URLSearchParams({
    media_type: 'CAROUSEL',
    children: childrenIds.join(','),
    caption: caption,
    access_token: INSTAGRAM_ACCESS_TOKEN
  });

  const carouselData = await fetchWithRetry(`https://graph.facebook.com/v21.0/${INSTAGRAM_ACCOUNT_ID}/media`, {
    method: 'POST',
    body: carouselParams
  });

  const creationId = carouselData.id;
  console.log(`✅ Container carrousel parent créé (ID: ${creationId}). En attente de 10 secondes...`);

  // 4. Attente (Meta prend un peu de temps pour traiter)
  await delay(10000);

  // 5. Publier
  console.log(`🚀 Publication finale sur Instagram...`);
  const publishParams = new URLSearchParams({
    creation_id: creationId,
    access_token: INSTAGRAM_ACCESS_TOKEN
  });

  const publishData = await fetchWithRetry(`https://graph.facebook.com/v21.0/${INSTAGRAM_ACCOUNT_ID}/media_publish`, {
    method: 'POST',
    body: publishParams
  });

  console.log(`🎉 SUCCÈS ! Carrousel publié sur Instagram. Post ID: ${publishData.id}`);

  // 6. Sauvegarder les logs
  const logPath = path.join(dirname, 'output', 'publish_log.json');
  fs.writeFileSync(logPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    post_id: publishData.id,
    images: imageUrls
  }, null, 2));

  // 7. Enregistrer dans l'historique Supabase
  const enrichedFilmsPath = path.join(dirname, 'output', 'enriched_films.json');
  if (fs.existsSync(enrichedFilmsPath)) {
    try {
      const enrichedFilms = JSON.parse(fs.readFileSync(enrichedFilmsPath, 'utf8'));
      const filmTitles = enrichedFilms.map((f: any) => normalizeTitle(f.title));
      
      if (filmTitles.length > 0) {
        console.log(`- Sauvegarde de l'historique dans Supabase...`);
        const { error: dbError } = await supabase
          .from('instagram_history')
          .insert([{ films: filmTitles }]);
          
        if (dbError) {
          console.error("⚠️ Erreur lors de la sauvegarde dans l'historique:", dbError.message);
        } else {
          console.log(`✅ Historique sauvegardé (${filmTitles.length} films).`);
        }
      }
    } catch (err) {
      console.error("⚠️ Impossible de lire enriched_films.json pour l'historique:", err);
    }
  }
}

if (process.argv[1] && process.argv[1].includes('05_publish_instagram.ts')) {
  publishInstagram().catch(console.error);
}
