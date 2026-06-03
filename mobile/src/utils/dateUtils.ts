// src/utils/dateUtils.ts
// Portage de app.py::translateDay / translateMonth et des helpers JS index.js

import { DAYS_FR, MONTHS_FR } from '../lib/constants';
import { DateLabel } from '../types';

/** Portage de app.py::translateDay(weekday) — weekday au format getDay() (0=Dim) */
export function translateDay(dayOfWeek: number): string {
  return DAYS_FR[dayOfWeek] ?? '???';
}

/** Portage de app.py::translateMonth(num) — num de 1 à 12 */
export function translateMonth(monthNum: number): string {
  return MONTHS_FR[monthNum] ?? '???';
}

/**
 * Construit la liste des labels de dates à partir d'un tableau de dates ISO
 * Portage de la boucle dates[] dans app.py::home() (lines 357–369)
 */
export function buildDateLabels(isoDates: string[]): DateLabel[] {
  return isoDates.map((isoDate, index) => {
    // Parsing manuel pour éviter les problèmes de timezone (UTC vs local)
    const [year, month, day] = isoDate.split('-').map(Number);
    // Créer en heure locale Europe/Paris (pas de conversion UTC)
    const d = new Date(year, month - 1, day);

    return {
      jour: translateDay(d.getDay()),
      chiffre: d.getDate(),
      mois: translateMonth(d.getMonth() + 1),
      index,
      isoDate,
      fullDate: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`,
    };
  });
}

/**
 * Formate un label de date pour l'affichage dans les séances
 * ex: { jour: "Lun", chiffre: 3, mois: "juin" } → "Lun 3 juin"
 */
export function formatDayLabel(label: DateLabel): string {
  return `${label.jour} ${label.chiffre} ${label.mois}`;
}

/**
 * Portage de parseDuration() — index.js lines 697–704
 * ex: "2h 05min" → { hours: 2, minutes: 5 }
 */
export function parseDuration(dureeStr: string): { hours: number; minutes: number } {
  const hourMatch = dureeStr.match(/(\d+)\s*h/);
  const minMatch = dureeStr.match(/(\d+)\s*min/);
  return {
    hours: hourMatch ? parseInt(hourMatch[1], 10) : 0,
    minutes: minMatch ? parseInt(minMatch[1], 10) : 0,
  };
}

/**
 * Renvoie l'index "delta" pour une date ISO (0 = aujourd'hui, 1 = demain…)
 * Utile pour savoir si une séance est "aujourd'hui"
 */
export function getDeltaForDate(isoDate: string): number {
  const [year, month, day] = isoDate.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/** Formate une heure "HH:MM" en "HHhMM" (ex: "20:30" → "20h30") */
export function formatTime(timeStr: string): string {
  return timeStr.replace(':', 'h');
}
