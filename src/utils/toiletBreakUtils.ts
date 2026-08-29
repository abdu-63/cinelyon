// src/utils/toiletBreakUtils.ts
// Utilitaires de calcul et de génération des pauses toilettes (RunPee-style) pour Tous les films dans CinéLyon

import { Film, ToiletBreak, ToiletBreaksInfo } from '@/types';

/**
 * Extrait la durée d'un film en minutes à partir de chaînes comme "2h 15min", "2h05", "135 min", etc.
 */
export function parseDurationMinutes(dureeStr?: string | null): number {
  if (!dureeStr) return 0;

  const str = dureeStr.toLowerCase().trim();

  // Pattern "Xh Ymin" ou "XhYY" ou "Xh"
  const matchHoursMins = str.match(/(?:(\d+)\s*h\s*(\d+)?)|(?:(\d+)\s*h)/);
  if (matchHoursMins) {
    const hours = parseInt(matchHoursMins[1] || matchHoursMins[3] || '0', 10);
    const mins = parseInt(matchHoursMins[2] || '0', 10);
    return hours * 60 + mins;
  }

  // Pattern "XXX min"
  const matchMinsOnly = str.match(/(\d+)\s*min/);
  if (matchMinsOnly) {
    return parseInt(matchMinsOnly[1], 10);
  }

  // Fallback nombre brut
  const matchDigits = str.match(/(\d+)/);
  if (matchDigits) {
    return parseInt(matchDigits[1], 10);
  }

  return 0;
}

/**
 * Formate un nombre de minutes en horodateur lisible (ex: 78 -> "1h 18min")
 */
export function formatMinutesToTimestamp(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  if (hours === 0) {
    return `${mins} min`;
  }
  return `${hours}h ${mins < 10 ? '0' : ''}${mins}min`;
}

/**
 * Recommandations personnalisées selon le genre principal du film
 */
function getGenreSpecificBreakTemplates(genreStr?: string | null): {
  scene1: { title: string; desc: string; cue: string; summary: string };
  scene2: { title: string; desc: string; cue: string; summary: string };
  scene3: { title: string; desc: string; cue: string; summary: string };
} {
  const g = (genreStr || '').toLowerCase();

  if (
    g.includes('action') ||
    g.includes('aventure') ||
    g.includes('sf') ||
    g.includes('science-fiction')
  ) {
    return {
      scene1: {
        title: 'Dialogue de préparation tactique',
        desc: 'Phase d’exposition et de briefing stratégique entre les membres de l’équipe.',
        cue: 'Dès que le commandant déplie la carte ou la carte holographique.',
        summary:
          'Pendant votre absence, l’équipe a passé en revue les plans d’attaque. Aucun combat ou mort de personnage majeur n’a eu lieu.',
      },
      scene2: {
        title: 'Trajet & Repos intermédiaire',
        desc: 'Voyage des personnages vers la seconde destination et conversations de fond.',
        cue: 'Lorsque le véhicule/vaisseau démarre son long trajet nocturne.',
        summary:
          'Les héros ont discuté de leur passé pendant le trajet. Ils sont bien arrivés à destination sans embuscade.',
      },
      scene3: {
        title: 'Négociation préalable au climax',
        desc: 'Échange verbal et mises en place tactiques juste avant le grand affrontement final.',
        cue: 'Dès que le chef de faction envoie son messager parlementer.',
        summary:
          'Les négociations ont échoué comme prévu. Tout le monde a regagné sa position pour la bataille finale.',
      },
    };
  }

  if (g.includes('drame') || g.includes('romance') || g.includes('historique')) {
    return {
      scene1: {
        title: 'Scène de transition sentimentale',
        desc: 'Passage contemplatif avec musique d’ambiance et vues du décor.',
        cue: 'Lorsque la musique douce s’élève pendant les plans de la ville/paysage.',
        summary:
          'Une ellipse temporelle a montré les personnages vaquer à leurs occupations quotidiennes. La situation reste inchangée.',
      },
      scene2: {
        title: 'Réception ou repas secondaire',
        desc: 'Discussion de courtoisie entre personnages secondaires au cours d’un événement.',
        cue: 'Au moment où les invités trinquent au début du dîner.',
        summary:
          'Quelques potins secondaires ont été échangés entre figurants. La tension dramatique principale reprend juste à votre retour.',
      },
      scene3: {
        title: 'Réflexion en solitaire',
        desc: 'Séquence introspective d’écriture de lettre ou de marche contemplative.',
        cue: 'Lorsque le personnage principal s’assoit seul à son bureau ou à la fenêtre.',
        summary:
          'Le protagoniste a pris du temps pour réfléchir à ses choix. Aucun nouveau secret n’a été révélé.',
      },
    };
  }

  // Par défaut (Comédie, Thriller, Animation, Autres)
  return {
    scene1: {
      title: 'Scène d’exposition secondaire',
      desc: 'Présentation du lieu secondaire et dialogues de remplissage humoristiques/descriptifs.',
      cue: 'Lorsque le groupe entre dans le nouvel établissement ou le café.',
      summary:
        'Les personnages ont commandé à boire et discuté brièvement de la météo. L’intrigue principale n’a pas progressé.',
    },
    scene2: {
      title: 'Transition de mi-parcours',
      desc: 'Moment de répit entre deux péripéties où la tension retombe temporairement.',
      cue: 'Dès que la musique de fond se calme après la scène précédente.',
      summary:
        'L’équipe fait le point sur ses indices actuels. Vous n’avez manqué aucun rebondissement.',
    },
    scene3: {
      title: 'Préparation avant la conclusion',
      desc: 'Dernière mise en place tranquille avant la résolution finale.',
      cue: 'Quand les personnages bouclent leurs affaires et préparent leur départ.',
      summary:
        'Rien de marquant à signaler, les personnages se sont rassemblés pour se préparer à la scène finale.',
    },
  };
}

/**
 * Calcule et construit l'objet ToiletBreaksInfo pour TOUT film (quelle que soit sa durée).
 */
export function buildToiletBreaksInfo(film: Film | null): ToiletBreaksInfo {
  if (!film) {
    return {
      eligible: false,
      movieDurationMinutes: 0,
      badgeLabel: 'Non disponible',
      badgeColor: '#6B7280',
      summary: 'Informations non disponibles.',
      breaks: [],
    };
  }

  // 1. Si déjà défini en base
  if (film.toilet_breaks) {
    return film.toilet_breaks;
  }

  let durationMin = parseDurationMinutes(film.duree);
  // Fallback si la durée est inconnue : 90 min par défaut
  if (durationMin <= 0) {
    durationMin = 90;
  }

  const templates = getGenreSpecificBreakTemplates(film.genres);
  const breaks: ToiletBreak[] = [];

  if (durationMin < 100) {
    // 1 pause idéale pour les films de moins de 1h40 (< 100 min)
    const break1Min = Math.round(durationMin * 0.45); // ex: 40 min pour un film de 90 min

    breaks.push({
      id: `${film.filmId || film.slug || 'f'}-tb1`,
      timestamp: formatMinutesToTimestamp(break1Min),
      timestampMinutes: break1Min,
      durationMinutes: 3,
      quality: 'best',
      title: templates.scene1.title,
      sceneDescription: templates.scene1.desc,
      cue: templates.scene1.cue,
      catchUpSummary: templates.scene1.summary,
    });
  } else if (durationMin >= 100 && durationMin < 145) {
    // 2 pauses pour un film de 1h40 à 2h25 (100 à 145 min)
    const break1Min = Math.round(durationMin * 0.38); // ex: 45 min
    const break2Min = Math.round(durationMin * 0.68); // ex: 82 min

    breaks.push({
      id: `${film.filmId || film.slug || 'f'}-tb1`,
      timestamp: formatMinutesToTimestamp(break1Min),
      timestampMinutes: break1Min,
      durationMinutes: 3.5,
      quality: 'best',
      title: templates.scene1.title,
      sceneDescription: templates.scene1.desc,
      cue: templates.scene1.cue,
      catchUpSummary: templates.scene1.summary,
    });

    breaks.push({
      id: `${film.filmId || film.slug || 'f'}-tb2`,
      timestamp: formatMinutesToTimestamp(break2Min),
      timestampMinutes: break2Min,
      durationMinutes: 3,
      quality: 'good',
      title: templates.scene2.title,
      sceneDescription: templates.scene2.desc,
      cue: templates.scene2.cue,
      catchUpSummary: templates.scene2.summary,
    });
  } else {
    // 3 pauses pour un film très long (≥ 2h25 / 145 min)
    const break1Min = Math.round(durationMin * 0.32);
    const break2Min = Math.round(durationMin * 0.55);
    const break3Min = Math.round(durationMin * 0.78);

    breaks.push({
      id: `${film.filmId || film.slug || 'f'}-tb1`,
      timestamp: formatMinutesToTimestamp(break1Min),
      timestampMinutes: break1Min,
      durationMinutes: 3.5,
      quality: 'best',
      title: templates.scene1.title,
      sceneDescription: templates.scene1.desc,
      cue: templates.scene1.cue,
      catchUpSummary: templates.scene1.summary,
    });

    breaks.push({
      id: `${film.filmId || film.slug || 'f'}-tb2`,
      timestamp: formatMinutesToTimestamp(break2Min),
      timestampMinutes: break2Min,
      durationMinutes: 4,
      quality: 'best',
      title: templates.scene2.title,
      sceneDescription: templates.scene2.desc,
      cue: templates.scene2.cue,
      catchUpSummary: templates.scene2.summary,
    });

    breaks.push({
      id: `${film.filmId || film.slug || 'f'}-tb3`,
      timestamp: formatMinutesToTimestamp(break3Min),
      timestampMinutes: break3Min,
      durationMinutes: 3,
      quality: 'good',
      title: templates.scene3.title,
      sceneDescription: templates.scene3.desc,
      cue: templates.scene3.cue,
      catchUpSummary: templates.scene3.summary,
    });
  }

  const hoursDisplay = Math.floor(durationMin / 60);
  const minsDisplay = durationMin % 60;
  const dureeFormatted =
    hoursDisplay > 0
      ? `${hoursDisplay}h ${minsDisplay < 10 ? '0' : ''}${minsDisplay}min`
      : `${minsDisplay}min`;

  return {
    eligible: true,
    movieDurationMinutes: durationMin,
    badgeLabel: `${breaks.length} ${breaks.length > 1 ? 'pauses' : 'pause'}`,
    badgeColor: '#3B82F6',
    summary: `Ce film de ${dureeFormatted} comporte ${breaks.length} moment${breaks.length > 1 ? 's' : ''} propice${breaks.length > 1 ? 's' : ''} pour s'absenter 3 min sans rater d'élément majeur.`,
    breaks,
  };
}
