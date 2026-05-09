import * as dotenv from 'dotenv';
import * as path from 'path';

const dirname = process.cwd();
dotenv.config({ path: path.join(dirname, '../../.env') });

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

async function refreshToken() {
  if (!INSTAGRAM_ACCESS_TOKEN) {
    console.error("❌ Erreur: INSTAGRAM_ACCESS_TOKEN est introuvable dans le .env");
    process.exit(1);
  }

  console.log("🔄 Tentative de renouvellement du token Meta...");

  try {
    const url = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=VOTRE_APP_ID&client_secret=VOTRE_APP_SECRET&fb_exchange_token=${INSTAGRAM_ACCESS_TOKEN}`;
    
    console.log(`⚠️ Note : Pour que ce script fonctionne, il faut rajouter ton 'client_id' et 'client_secret' de l'App Meta dans l'URL ci-dessus.`);
    console.log(`Le token actuel expirant dans ~60 jours, tu as le temps de le configurer !`);
    
    // const res = await fetch(url);
    // const data = await res.json();
    // if (data.access_token) {
    //   console.log("✅ Nouveau Token (valide 60 jours supplémentaires) :");
    //   console.log(data.access_token);
    //   console.log("👉 Pense à mettre à jour INSTAGRAM_ACCESS_TOKEN dans les Secrets GitHub !");
    // }

  } catch (error) {
    console.error("❌ Échec lors du renouvellement :", error);
  }
}

if (process.argv[1] && process.argv[1].includes('refresh_token.ts')) {
  refreshToken();
}
