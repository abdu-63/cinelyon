import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Calendar from 'expo-calendar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../src/lib/constants';

export default function ReservationScreen() {
  const [events, setEvents] = useState<Calendar.Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const fetchEvents = async () => {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      setHasPermission(false);
      return;
    }
    setHasPermission(true);

    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const cineLyonCal = calendars.find(c => c.title === 'CinéLyon');
      
      if (cineLyonCal) {
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0); // À partir d'aujourd'hui
        
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1); // Jusqu'à l'année prochaine
        
        const foundEvents = await Calendar.getEventsAsync([cineLyonCal.id], startDate, endDate);
        // Trier par date la plus proche
        foundEvents.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        setEvents(foundEvents);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching calendar events', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  const handleOpenCalendar = (eventId: string) => {
    // Il n'y a pas d'API directe pour ouvrir un événement spécifique dans l'app calendrier
    // sur iOS, mais on peut ouvrir le calendrier en général.
    Linking.openURL('calshow://');
  };

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Réservations</Text>
      </View>
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {hasPermission === false && (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Permission refusée</Text>
            <Text style={styles.emptyText}>
              Autorisez l'accès au calendrier dans vos réglages pour voir vos réservations.
            </Text>
            <TouchableOpacity 
              style={styles.settingsBtn}
              onPress={() => Linking.openSettings()}
            >
              <Text style={styles.settingsBtnText}>Ouvrir les réglages</Text>
            </TouchableOpacity>
          </View>
        )}

        {hasPermission === true && events.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="ticket-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Aucune réservation</Text>
            <Text style={styles.emptyText}>
              Vos futures séances ajoutées au calendrier apparaîtront ici.
            </Text>
          </View>
        )}

        {events.map((event) => {
          const startDate = new Date(event.startDate);
          return (
            <TouchableOpacity 
              key={event.id} 
              style={styles.eventCard}
              onPress={() => handleOpenCalendar(event.id)}
            >
              <View style={styles.eventDateBox}>
                <Text style={styles.eventDay}>{startDate.getDate()}</Text>
                <Text style={styles.eventMonth}>{startDate.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}</Text>
              </View>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
                <View style={styles.eventRow}>
                  <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.eventMeta}>
                    {startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                {event.location ? (
                  <View style={styles.eventRow}>
                    <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.eventMeta} numberOfLines={1}>{event.location}</Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  settingsBtn: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  settingsBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eventDateBox: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventDay: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  eventMonth: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  eventInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 4,
  },
  eventMeta: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
});
