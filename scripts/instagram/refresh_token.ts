import * as dotenv from 'dotenv';
import * as path from 'path';

const dirname = process.cwd();
dotenv.config({ path: path.join(dirname, '../../.env') });

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;

async function refreshToken() {
  if (!INSTAGRAM_ACCESS_TOKEN) {
    console.error("❌ Erreur: INSTAGRAM_ACCESS_TOKEN est introuvable dans le .env");
    process.exit(1);
  }

  if (!META_APP_ID || !META_APP_SECRET) {
    console.error("❌ Erreur: META_APP_ID ou META_APP_SECRET manquant dans le .env");
    console.log("👉 Ajoute META_APP_ID et META_APP_SECRET dans ton fichier .env à la racine du projet.");
    process.exit(1);
  }

  console.log("🔄 Tentative de renouvellement du token Meta...");

  try {
    const url = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${INSTAGRAM_ACCESS_TOKEN}`;
    
    const res = await fetch(url);
    const data = await res.json();
    
    if (res.ok && data.access_token) {
      console.log("✅ Nouveau Token généré (valide 60 jours supplémentaires) :");
      console.log(data.access_token);
      console.log("\n👉 Pense à mettre à jour INSTAGRAM_ACCESS_TOKEN dans les Secrets GitHub !");
    } else {
      console.error("❌ Erreur de l'API Meta :", data);
    }
  } catch (error) {
    console.error("❌ Échec lors du renouvellement :", error);
  }
}

if (process.argv[1] && process.argv[1].includes('refresh_token.ts')) {
  refreshToken();
}
