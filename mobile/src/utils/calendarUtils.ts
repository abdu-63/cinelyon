// src/utils/calendarUtils.ts
// Génération d'événements calendrier — portage de index.js calendarUtils

import { parseDuration } from './dateUtils';

export interface CalendarEventData {
  movieTitle: string;
  cinema: string;
  date: string;     // "YYYY-MM-DD"
  time: string;     // "HH:MM"
  duree: string;    // "2h 05min"
  lang: string;     // "VF" | "VO"
  ticketUrl?: string | null;
  letterboxdUrl?: string;
  location?: string;
}

/**
 * Calcule les dates de début et fin d'un événement film
 */
export function computeEventDates(data: CalendarEventData): {
  startDate: Date;
  endDate: Date;
} {
  const [year, month, day] = data.date.split('-').map(Number);
  const [hours, minutes] = data.time.split(':').map(Number);

  const startDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

  const { hours: dh, minutes: dm } = parseDuration(data.duree);
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + dh);
  endDate.setMinutes(endDate.getMinutes() + dm);

  return { startDate, endDate };
}

/**
 * Construit le titre de l'événement calendrier
 * ex: "Oppenheimer (2023) - Pathé Bellecour"
 */
export function buildEventTitle(data: CalendarEventData): string {
  return `${data.movieTitle} — ${data.cinema}`;
}

/**
 * Construit la description de l'événement
 */
export function buildEventDescription(data: CalendarEventData): string {
  let desc = `Film : ${data.movieTitle}\nLangue : ${data.lang}\nDurée : ${data.duree}`;
  if (data.ticketUrl) desc += `\n\nRéserver : ${data.ticketUrl}`;
  if (data.letterboxdUrl) desc += `\n\nLetterboxd : ${data.letterboxdUrl}`;
  return desc;
}

/**
 * Génère un fichier ICS pour Apple Calendar (portage de generateICS() — index.js lines 787–810)
 */
export function generateICS(data: CalendarEventData): string {
  const { startDate, endDate } = computeEventDates(data);

  const formatICS = (d: Date): string => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  };

  const escapeICS = (s: string): string =>
    s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  const uid = `cinelyon-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@fr.cinelyon.app`;
  const title = escapeICS(buildEventTitle(data));
  const desc = escapeICS(buildEventDescription(data));
  const location = escapeICS(data.location ?? data.cinema);

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CineLyon//Calendar//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatICS(new Date())}`,
    `DTSTART:${formatICS(startDate)}`,
    `DTEND:${formatICS(endDate)}`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${desc}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Génère l'URL Google Calendar (portage de generateGoogleCalendarUrl() — index.js lines 812–822)
 */
export function generateGoogleCalendarUrl(data: CalendarEventData): string {
  const { startDate, endDate } = computeEventDates(data);

  const formatGoogle = (d: Date): string => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: buildEventTitle(data),
    dates: `${formatGoogle(startDate)}/${formatGoogle(endDate)}`,
    details: buildEventDescription(data),
    location: data.location ?? data.cinema,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
