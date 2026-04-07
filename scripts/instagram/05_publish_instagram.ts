import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

const dirname = process.cwd();
dotenv.config({ path: path.join(dirname, '../../.env') });

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

export async function publishInstagram(): Promise<void> {
  if (!IMGBB_API_KEY || !INSTAGRAM_ACCOUNT_ID || !INSTAGRAM_ACCESS_TOKEN) {
    throw new Error("⚠️ Variables d'environnement manquantes pour l'API Instagram ou ImgBB.");
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

  console.log(`📤 Préparation de la publication de ${files.length} images...`);

  // 1. Upload sur ImgBB
  const imageUrls: string[] = [];
  for (const file of files) {
    console.log(`- Upload de ${file} sur ImgBB...`);
    const url = await uploadToImgBB(path.join(slidesDir, file));
    imageUrls.push(url);
  }

  console.log(`✅ ${imageUrls.length} images uploadées sur ImgBB avec succès.`);

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
}

if (process.argv[1] && process.argv[1].includes('05_publish_instagram.ts')) {
  publishInstagram().catch(console.error);
}
