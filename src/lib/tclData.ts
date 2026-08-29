import { TCLLine, TCLStop } from '@/types';

/**
 * Données officielles des lignes TCL (Sytral - Métropole de Lyon)
 * Couleurs officielles réseau TCL
 */
export const TCL_LINES: Record<string, TCLLine> = {
  // Métros
  MA: { id: 'MA', label: 'A', type: 'metro', color: '#E5007D' }, // Rose
  MB: { id: 'MB', label: 'B', type: 'metro', color: '#009EE0' }, // Bleu ciel
  MC: { id: 'MC', label: 'C', type: 'metro', color: '#F39200' }, // Orange
  MD: { id: 'MD', label: 'D', type: 'metro', color: '#78B82A' }, // Vert

  // Trams
  T1: { id: 'T1', label: 'T1', type: 'tram', color: '#8C2D88' }, // Violet / Magenta
  T2: { id: 'T2', label: 'T2', type: 'tram', color: '#FFCC00', textColor: '#111111' }, // Jaune
  T3: { id: 'T3', label: 'T3', type: 'tram', color: '#6A2B85' }, // Violet foncé
  T4: { id: 'T4', label: 'T4', type: 'tram', color: '#E2001A' }, // Rouge
  T5: { id: 'T5', label: 'T5', type: 'tram', color: '#9BBA14' }, // Vert olive
  T6: { id: 'T6', label: 'T6', type: 'tram', color: '#253684' }, // Indigo
  T7: { id: 'T7', label: 'T7', type: 'tram', color: '#00A3E0' }, // Cyan

  // Funiculaires
  F1: { id: 'F1', label: 'F1', type: 'funiculaire', color: '#00A3E0' },
  F2: { id: 'F2', label: 'F2', type: 'funiculaire', color: '#8C2D88' },

  // Bus majeurs (Lignes C)
  C3: { id: 'C3', label: 'C3', type: 'bus', color: '#0055A5' },
  C4: { id: 'C4', label: 'C4', type: 'bus', color: '#0055A5' },
  C5: { id: 'C5', label: 'C5', type: 'bus', color: '#0055A5' },
  C8: { id: 'C8', label: 'C8', type: 'bus', color: '#0055A5' },
  C26: { id: 'C26', label: 'C26', type: 'bus', color: '#0055A5' },
};

/**
 * Liste des lignes filtrables principales dans l'interface UI
 */
export const FILTERABLE_TCL_LINES: TCLLine[] = [
  TCL_LINES.MA,
  TCL_LINES.MB,
  TCL_LINES.MC,
  TCL_LINES.MD,
  TCL_LINES.T1,
  TCL_LINES.T2,
  TCL_LINES.T3,
  TCL_LINES.T4,
  TCL_LINES.T5,
  TCL_LINES.T6,
  TCL_LINES.T7,
];

/**
 * Mapping exact des arrêts TCL les plus proches pour chacun des 19 cinémas
 */
export const CINEMA_TCL_MAP: Record<string, TCLStop[]> = {
  'Pathé Bellecour': [{ stationName: 'Bellecour', lines: ['MA', 'MD'], walkTimeMinutes: 2 }],
  'Lumière Bellecour': [
    { stationName: 'Bellecour', lines: ['MA', 'MD'], walkTimeMinutes: 3 },
    { stationName: 'Jacobins', lines: ['C3'], walkTimeMinutes: 2 },
  ],
  'Le Comoedia': [
    { stationName: 'Centre Berthelot', lines: ['T2'], walkTimeMinutes: 1 },
    { stationName: 'Jean Macé', lines: ['MB', 'T2'], walkTimeMinutes: 5 },
  ],
  'Cinéma Comoedia': [
    { stationName: 'Centre Berthelot', lines: ['T2'], walkTimeMinutes: 1 },
    { stationName: 'Jean Macé', lines: ['MB', 'T2'], walkTimeMinutes: 5 },
  ],
  'UGC Part-Dieu': [
    {
      stationName: 'Gare Part-Dieu - Vivier Merle',
      lines: ['MB', 'T1', 'T3', 'T4', 'C3'],
      walkTimeMinutes: 3,
    },
  ],
  'UGC Confluence': [
    { stationName: 'Hôtel de Région - Montrochet', lines: ['T1', 'T2'], walkTimeMinutes: 2 },
  ],
  'Pathé Vaise': [
    { stationName: 'Gare de Vaise', lines: ['MD'], walkTimeMinutes: 6 },
    { stationName: 'Val de Saône', lines: ['MD'], walkTimeMinutes: 4 },
  ],
  'Institut Lumière': [{ stationName: 'Monplaisir - Lumière', lines: ['MD'], walkTimeMinutes: 2 }],
  'Lumière Terreaux': [
    { stationName: 'Hôtel de Ville - Louis Pradel', lines: ['MA', 'MC', 'C3'], walkTimeMinutes: 4 },
    { stationName: 'Cordeliers', lines: ['MA', 'C3'], walkTimeMinutes: 4 },
  ],
  'Cinéma-Opéra': [
    { stationName: 'Hôtel de Ville - Louis Pradel', lines: ['MA', 'MC', 'C3'], walkTimeMinutes: 2 },
  ],
  'Cinéma Opéra': [
    { stationName: 'Hôtel de Ville - Louis Pradel', lines: ['MA', 'MC', 'C3'], walkTimeMinutes: 2 },
  ],
  'Lumière Fourmi': [
    { stationName: 'Saxe - Gambetta', lines: ['MB', 'MD'], walkTimeMinutes: 4 },
    { stationName: 'Palais de Justice - Mairie 3e', lines: ['T1'], walkTimeMinutes: 3 },
  ],
  'Lumière La Fourmi': [
    { stationName: 'Saxe - Gambetta', lines: ['MB', 'MD'], walkTimeMinutes: 4 },
    { stationName: 'Palais de Justice - Mairie 3e', lines: ['T1'], walkTimeMinutes: 3 },
  ],
  'UGC Astoria': [{ stationName: 'Masséna', lines: ['MA'], walkTimeMinutes: 2 }],
  'UGC Internationale': [
    {
      stationName: 'Cité Internationale - Centre de Congrès',
      lines: ['C4', 'C5', 'C26'],
      walkTimeMinutes: 2,
    },
  ],
  'Pathé Carré de Soie': [
    { stationName: 'Vaulx-en-Velin La Soie', lines: ['MA', 'T3', 'T7'], walkTimeMinutes: 3 },
  ],
  'Cinéma Saint-Denis': [
    { stationName: 'Hénon', lines: ['MC'], walkTimeMinutes: 4 },
    { stationName: 'Croix-Rousse', lines: ['MC'], walkTimeMinutes: 6 },
  ],
  'Cinéma Les Amphis': [
    { stationName: 'Vaulx - Hôtel de Ville', lines: ['C3', 'C8'], walkTimeMinutes: 3 },
  ],
  'Les Amphis': [
    { stationName: 'Vaulx - Hôtel de Ville', lines: ['C3', 'C8'], walkTimeMinutes: 3 },
  ],
  'Cinéma Gerard-Philipe': [
    { stationName: 'Vénissieux Marcel Houël', lines: ['T4'], walkTimeMinutes: 3 },
  ],
  'Le Toboggan': [{ stationName: 'Décines Centre', lines: ['T3'], walkTimeMinutes: 4 }],
  'Ciné Toboggan': [{ stationName: 'Décines Centre', lines: ['T3'], walkTimeMinutes: 4 }],
  'Cinéma Meyzieu': [{ stationName: 'Meyzieu Gare', lines: ['T3'], walkTimeMinutes: 5 }],
  'Ciné Meyzieu': [{ stationName: 'Meyzieu Gare', lines: ['T3'], walkTimeMinutes: 5 }],
  'CGR Brignais': [{ stationName: 'Brignais Gare', lines: ['T1'], walkTimeMinutes: 10 }],
};

/**
 * Helper d'enrichissement des données d'un cinéma avec ses arrêts TCL
 */
export function getCinemaTCLStops(cinemaName: string): TCLStop[] {
  return CINEMA_TCL_MAP[cinemaName] || [];
}
