import * as fs from 'fs';
import * as path from 'path';
import { EnrichedFilm } from './types';
import { INSTAGRAM, CINEMA_ADDRESSES } from './constants';

const dirname = process.cwd();

function getDayString(date: Date): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.getDate() === tomorrow.getDate() && date.getMonth() === tomorrow.getMonth();

  if (isTomorrow) return "demain";

  const options: Intl.DateTimeFormatOptions = { weekday: 'long' };
  return `${date.toLocaleDateString('fr-FR', options)}`;
}

export function generateCaption(): void {
  const inputPath = path.join(dirname, 'output', 'enriched_films.json');
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Fichier introuvable: ${inputPath}. Lancez le Module 2 d'abord.`);
  }

  const films: EnrichedFilm[] = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

  if (films.length === 0) {
    throw new Error("NO_FILMS_AVAILABLE");
  }

  const dateArg = process.argv.find(a => a.startsWith('--date='))?.split('=')[1];
  const targetDateObj = dateArg ? new Date(dateArg) : new Date(Date.now() + 86400000);
  const dateStr = targetDateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  const dayName = getDayString(targetDateObj);

  let caption = `🍿 Qu'est-ce qu'on regarde à Lyon ${dayName} (${dateStr}) ?\n\n`;
  caption += `Horaires & séances sur cinelyon.fr\n\n`;

  const maxFilms = Math.min(films.length, INSTAGRAM.maxSlides - 1);
  for (let i = 0; i < maxFilms; i++) {
    const f = films[i];
    const cinema = f.cinema[0];
    const cinemaName = cinema?.name || "Cinéma Inconnu";
    const address = CINEMA_ADDRESSES[cinemaName] || cinema?.address || "Lyon";
    const showtimesFormatted = (cinema?.showtimes || []).map(t => t.replace(':', 'h')).join(', ');
    const directorPart = f.director && f.director !== 'Inconnu' ? ` de ${f.director}` : '';

    caption += `✦ ${f.title.toUpperCase()} (${f.year || ''})${directorPart}\n`;
    caption += `${cinemaName} à ${showtimesFormatted} (${address})\n\n`;
  }
  
  const hashtags = ['#Cinelyon', '#Lyon', '#CinemaLyon', '#SortirALyon', '#Cinephile', '#FilmCulte', '#Cinema', '#Ciné'];
  caption += hashtags.join(' ');

  // Tronquer proprement si jamais > 2200 caractères (limite Insta)
  if (caption.length > 2200) {
    caption = caption.substring(0, 2197) + '...';
  }

  const outputDir = path.join(dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outPath = path.join(outputDir, 'caption.txt');
  fs.writeFileSync(outPath, caption);

  console.log(`✅ Module 4 terminé : Légende sauvegardée dans ${outPath}\n`);
  console.log("--- APERÇU DE LA LÉGENDE ---");
  console.log(caption);
  console.log("----------------------------");
}

if (process.argv[1] && process.argv[1].includes('04_generate_caption.ts')) {
  try {
    generateCaption();
  } catch (err: any) {
    if (err.message === "NO_FILMS_AVAILABLE") {
      process.exit(0);
    } else {
      console.error(err);
      process.exit(1);
    }
  }
}
