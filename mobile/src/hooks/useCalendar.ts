// src/hooks/useCalendar.ts
// Hook pour ajouter une séance au calendrier iOS/Android via expo-calendar

import { useCallback } from 'react';
import * as Calendar from 'expo-calendar';
import { Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Seance } from '../types';
import { parseDuration } from '../utils/dateUtils';

/**
 * Demande les permissions et ajoute un événement au calendrier natif.
 * Utilisé dans ShowtimeRow pour le bouton "Ajouter au calendrier".
 */
export function useCalendar() {
  const router = useRouter();

  const addToCalendar = useCallback(
    async (
      filmTitle: string,
      cinemaName: string,
      seance: Seance,
      isoDate: string,
      duree?: string
    ) => {
      try {
        // 1. Demander les permissions
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission refusée',
            'Autorisez CinéLyon à accéder à votre calendrier dans les Réglages.'
          );
          return;
        }

        // 2. Trouver ou créer le calendrier CinéLyon
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        let calendarId: string | undefined;

        // Chercher un calendrier existant "CinéLyon"
        const existingCal = calendars.find((c) => c.title === 'CinéLyon');
        if (existingCal) {
          calendarId = existingCal.id;
        } else {
          // Trouver le calendrier par défaut de l'appareil
          const defaultCal =
            Platform.OS === 'ios'
              ? calendars.find((c) => c.allowsModifications && c.source?.name === 'iCloud')
              : calendars.find((c) => c.allowsModifications);

          // Créer le calendrier CinéLyon
          calendarId = await Calendar.createCalendarAsync({
            title: 'CinéLyon',
            color: '#444cf7',
            entityType: Calendar.EntityTypes.EVENT,
            sourceId: defaultCal?.source?.id,
            source: defaultCal?.source ?? { isLocalAccount: true, name: 'CinéLyon', type: '' },
            name: 'CinéLyon',
            ownerAccount: 'CinéLyon',
            accessLevel: Calendar.CalendarAccessLevel.OWNER,
          });
        }

        // 3. Calculer les dates de début et fin
        const [year, month, day] = isoDate.split('-').map(Number);
        const [hours, minutes] = seance.time.split(':').map(Number);

        const startDate = new Date(year, month - 1, day, hours, minutes, 0);

        // Durée du film (défaut 2h si inconnue)
        let endDate: Date;
        if (duree) {
          const { hours: h, minutes: m } = parseDuration(duree);
          endDate = new Date(startDate.getTime() + (h * 60 + m) * 60 * 1000);
        } else {
          endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
        }

        // 4. Construire le titre et les notes de l'événement
        const langLabel = seance.lang === 'VO' ? ' (VO)' : ' (VF)';
        const formatLabel = seance.format ? ` · ${seance.format}` : '';
        const eventTitle = `🎬 ${filmTitle}${langLabel}${formatLabel}`;

        const notes = [
          `🎭 ${cinemaName}`,
          `🕐 ${seance.time} → ${formatEndTime(endDate)}`,
          seance.ticketing_url ? `🎟 Réservation : ${seance.ticketing_url}` : '',
        ]
          .filter(Boolean)
          .join('\n');

        // 5. Créer l'événement
        const eventId = await Calendar.createEventAsync(calendarId, {
          title: eventTitle,
          startDate,
          endDate,
          location: cinemaName,
          notes,
          url: seance.ticketing_url ?? undefined,
          alarms: [
            { relativeOffset: -60 }, // Rappel 1h avant
            { relativeOffset: -30 }, // Rappel 30min avant
          ],
        });

        if (eventId) {
          Alert.alert(
            '✅ Ajouté au calendrier',
            `"${filmTitle}" le ${formatDisplayDate(isoDate)} à ${seance.time} a été ajouté à votre calendrier CinéLyon.`,
            [
              { text: 'Mes réservations', onPress: () => router.push('/reservation') },
              { text: 'Fermer', style: 'cancel' }
            ]
          );
        }
      } catch (error) {
        console.error('Erreur calendrier:', error);
        Alert.alert('Erreur', 'Impossible d\'ajouter au calendrier. Réessayez.');
      }
    },
    []
  );

  return { addToCalendar };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatEndTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}h${m}`;
}

function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}
