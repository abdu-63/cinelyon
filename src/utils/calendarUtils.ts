// src/utils/calendarUtils.ts
// Génération d'événements calendrier — Apple Calendar (.ics) et Google Calendar

import { parseDuration } from './dateUtils';

export interface CalendarEventData {
  movieTitle?: string;
  title?: string;
  cinema: string;
  date?: string; // "YYYY-MM-DD"
  dayLabel?: string;
  time: string; // "HH:MM"
  duree?: string; // "2h 05min"
  lang?: string; // "VF" | "VO"
  ticketUrl?: string;
  letterboxdUrl?: string;
  location?: string;
}

export function computeEventDates(data: CalendarEventData): {
  startDate: Date;
  endDate: Date;
} {
  const dateStr = data.date || new Date().toISOString().split('T')[0];
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = data.time.split(':').map(Number);

  const startDate = new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0, 0, 0);

  const { hours: dh, minutes: dm } = parseDuration(data.duree || '2h 00min');
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + (dh || 2));
  endDate.setMinutes(endDate.getMinutes() + (dm || 0));

  return { startDate, endDate };
}

export function buildEventTitle(data: CalendarEventData): string {
  const filmTitle = data.movieTitle || data.title || 'Séance Cinéma';
  return `${filmTitle} — ${data.cinema}`;
}

export function buildEventDescription(data: CalendarEventData): string {
  const filmTitle = data.movieTitle || data.title || 'Film';
  let desc = `Film : ${filmTitle}\nLangue : ${data.lang || 'VF'}\nDurée : ${data.duree || 'Inconnue'}`;
  if (data.ticketUrl) desc += `\n\nRéserver : ${data.ticketUrl}`;
  if (data.letterboxdUrl) desc += `\n\nLetterboxd : ${data.letterboxdUrl}`;
  return desc;
}

export function generateICS(data: CalendarEventData): string {
  const { startDate, endDate } = computeEventDates(data);

  const formatICS = (d: Date): string => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  };

  const escapeICS = (s: string): string =>
    s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  const uid = `cinelyon-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@cinelyon.fr`;
  const title = escapeICS(buildEventTitle(data));
  const desc = escapeICS(buildEventDescription(data));
  const location = escapeICS(data.location || data.cinema);

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CineLyon//Web//FR',
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

export function generateGoogleCalendarUrl(data: CalendarEventData): string {
  const { startDate, endDate } = computeEventDates(data);

  const formatGoogle = (d: Date): string => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  };

  const title = encodeURIComponent(buildEventTitle(data));
  const details = encodeURIComponent(buildEventDescription(data));
  const location = encodeURIComponent(data.location || data.cinema);
  const dates = `${formatGoogle(startDate)}/${formatGoogle(endDate)}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

export function downloadICS(data: CalendarEventData): void {
  const icsContent = generateICS(data);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const filmTitle = (data.movieTitle || data.title || 'seance').replace(/[^a-zA-Z0-9]/g, '_');
  a.download = `cinelyon_${filmTitle}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
