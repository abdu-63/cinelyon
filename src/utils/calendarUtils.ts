// src/utils/calendarUtils.ts
// Utilitaires de génération d'événements de calendrier (.ics et Google Calendar)
// Portage de index.js

export interface CalendarEventData {
  title: string;
  releaseYear: string;
  cinema: string;
  duree: string;
  letterboxd: string;
  time: string;
  lang: string;
  dayLabel: string;
  ticketUrl?: string;
}

function parseDuration(dureeStr: string): { hours: number; minutes: number } {
  let hours = 2; // Valeur par défaut
  let minutes = 0;
  if (!dureeStr || dureeStr === 'Inconnue') return { hours, minutes };

  const hourMatch = dureeStr.match(/(\d+)\s*h/);
  const minMatch = dureeStr.match(/(\d+)\s*min/);
  if (hourMatch) hours = parseInt(hourMatch[1]);
  if (minMatch) minutes = parseInt(minMatch[1]);
  return { hours, minutes };
}

function parseDayLabel(dayLabel: string): Date {
  const monthAbbrevMap: Record<string, number> = {
    janv: 0, févr: 1, mars: 2, avr: 3,
    mai: 4, juin: 5, juil: 6, août: 7,
    sept: 8, oct: 9, nov: 10, déc: 11
  };

  // Format: "dim 18 janv"
  const parts = dayLabel.toLowerCase().split(' ');
  const dayNum = parseInt(parts[1], 10);
  const monthAbbrev = parts[2];

  const today = new Date();
  let year = today.getFullYear();
  const monthNum = monthAbbrevMap[monthAbbrev];

  if (monthNum !== undefined && monthNum < today.getMonth()) {
    year++;
  }

  const targetDate = new Date(year, monthNum !== undefined ? monthNum : today.getMonth(), dayNum);
  return targetDate;
}

function formatICSDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

function escapeICS(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function generateGoogleCalendarUrl(data: CalendarEventData): string {
  const duration = parseDuration(data.duree);
  const eventDate = parseDayLabel(data.dayLabel);
  const [hours, minutes] = data.time.split(':').map(Number);
  eventDate.setHours(hours, minutes, 0, 0);

  const endDate = new Date(eventDate);
  endDate.setHours(endDate.getHours() + duration.hours);
  endDate.setMinutes(endDate.getMinutes() + duration.minutes);

  const movieTitle = `${data.title} (${data.releaseYear}) - ${data.cinema}`;
  const location = `${data.cinema}, Lyon, France`;

  let description = `Film: ${data.title} (${data.releaseYear})\nLangue: ${data.lang}\nDurée: ${data.duree}`;
  if (data.ticketUrl) {
    description += `\n\nRéserver: ${data.ticketUrl}`;
  }
  description += `\n\nLetterboxd: ${data.letterboxd}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: movieTitle,
    dates: `${formatICSDate(eventDate)}/${formatICSDate(endDate)}`,
    details: description,
    location: location,
    sprop: `website:${data.letterboxd}`
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadICS(data: CalendarEventData) {
  const duration = parseDuration(data.duree);
  const eventDate = parseDayLabel(data.dayLabel);
  const [hours, minutes] = data.time.split(':').map(Number);
  eventDate.setHours(hours, minutes, 0, 0);

  const endDate = new Date(eventDate);
  endDate.setHours(endDate.getHours() + duration.hours);
  endDate.setMinutes(endDate.getMinutes() + duration.minutes);

  const movieTitle = `${data.title} (${data.releaseYear}) - ${data.cinema}`;
  const location = `${data.cinema}, Lyon, France`;

  let description = `Film: ${data.title} (${data.releaseYear})\nLangue: ${data.lang}\nDurée: ${data.duree}`;
  if (data.ticketUrl) {
    description += `\n\nRéserver: ${data.ticketUrl}`;
  }
  description += `\n\nLetterboxd: ${data.letterboxd}`;

  const uid = `cinelyon-${Date.now()}@cinelyon.fr`;
  const now = new Date();
  
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CineLyon//Calendar//FR
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatICSDate(now)}
DTSTART:${formatICSDate(eventDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:${escapeICS(movieTitle)}
LOCATION:${escapeICS(location)}
DESCRIPTION:${escapeICS(description)}
URL:${data.letterboxd}
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const filename = `${data.title.replace(/[^a-z0-9]/gi, '_')}_${data.time.replace(':', 'h')}.ics`;
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
