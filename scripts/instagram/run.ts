import { selectFilms } from './01_select_films';
import { fetchShowtimes } from './02_fetch_showtimes';
import { generateCarousel } from './03_generate_images';
import { generateCaption } from './04_generate_caption';
import { publishInstagram } from './05_publish_instagram';

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  if (isDryRun) {
    console.log("🧪 MODE DRY-RUN — Les images seront générées mais rien ne sera publié sur Instagram.\n");
  } else {
    console.log("🎬 Début du workflow Instagram Automatique\n");
  }

  try {
    // ÉTAPE 1: Sélection et scoring
    console.log("[1/5] Sélection et scoring des films...");
    await selectFilms();
    console.log("✅ Films sélectionnés.\n");

    // ÉTAPE 2: Fetch des séances de demain
    console.log("[2/5] Récupération des séances à Lyon pour demain...");
    await fetchShowtimes();
    console.log("✅ Séances récupérées.\n");

    // ÉTAPE 3: Génération des images
    console.log("[3/5] Génération du carrousel d'images (Satori/Resvg)...");
    await generateCarousel();
    console.log("✅ Images PNG générées.\n");

    // ÉTAPE 4: Génération de la description
    console.log("[4/5] Génération de la légende du post...");
    generateCaption();
    console.log("✅ Légende créée.\n");

    if (isDryRun) {
      console.log("🧪 DRY-RUN terminé ! Tes slides sont dans : scripts/instagram/output/slides/");
      console.log("   Lance sans --dry-run pour publier sur Instagram.");
      return;
    }

    // ÉTAPE 5: Publication Meta API
    console.log("[5/5] Publication sur Instagram...");
    await publishInstagram();
    console.log("✅ Publication terminée avec succès !");

  } catch (error: any) {
    if (error.message === "NO_FILMS_AVAILABLE") {
      console.log("\n⚠️ Fin du script : Aucun film pertinent ne passe au cinéma demain. Aucun post ne sera fait (exit 0).");
      process.exit(0);
    } else {
      console.error("\n❌ ERREUR CRITIQUE DANS L'ORCHESTRATEUR :");
      console.error(error);
      process.exit(1);
    }
  }
}

// On s'assure d'exécuter la fonction si le script est appelé directement
if (process.argv[1] && process.argv[1].includes('run.ts')) {
  main();
}
