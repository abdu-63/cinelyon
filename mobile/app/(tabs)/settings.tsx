// app/(tabs)/settings.tsx
// Réglages : sync appareils, code de partage, amis

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useFavorites } from '../../src/hooks/useFavorites';
import { useFriends } from '../../src/hooks/useFriends';
import { COLORS } from '../../src/lib/constants';

export default function SettingsScreen() {
  const { syncCode, syncId, linkDevice, unlinkDevice } = useFavorites();
  const { follows, addFriend, removeFriend } = useFriends(syncId);

  const [linkCode, setLinkCode] = useState('');
  const [friendCode, setFriendCode] = useState('');
  const [friendNickname, setFriendNickname] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  const handleCopyCode = () => {
    // Clipboard.setStringAsync(syncCode); — sera ajouté en Phase 5
    Toast.show({ type: 'success', text1: `Code copié : ${syncCode}` });
  };

  const handleLinkDevice = async () => {
    if (linkCode.length !== 6) {
      Toast.show({ type: 'error', text1: 'Le code doit faire 6 caractères' });
      return;
    }
    setIsLinking(true);
    const result = await linkDevice(linkCode.toUpperCase());
    setIsLinking(false);

    if (result === 'success') {
      Toast.show({ type: 'success', text1: 'Appareils liés ! Favoris synchronisés ✨' });
      setLinkCode('');
    } else if (result === 'not_found') {
      Toast.show({ type: 'error', text1: 'Code introuvable. Vérifiez le code.' });
    } else {
      Toast.show({ type: 'error', text1: 'Erreur de liaison' });
    }
  };

  const handleUnlink = () => {
    Alert.alert(
      'Déconnecter cet appareil',
      'Vos favoris resteront, mais cet appareil ne sera plus synchronisé.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            await unlinkDevice();
            Toast.show({ type: 'success', text1: 'Appareil déconnecté 🔌' });
          },
        },
      ]
    );
  };

  const handleAddFriend = async () => {
    if (friendCode.length < 6) {
      Toast.show({ type: 'error', text1: 'Code ami trop court' });
      return;
    }
    try {
      await addFriend(friendCode.toUpperCase(), friendNickname || 'Ami');
      Toast.show({ type: 'success', text1: `Ami ajouté : ${friendNickname || 'Ami'} ✅` });
      setFriendCode('');
      setFriendNickname('');
    } catch (e: any) {
      if (e.message === 'not_found') {
        Toast.show({ type: 'error', text1: 'Code ami introuvable' });
      } else {
        Toast.show({ type: 'error', text1: 'Erreur lors de l\'ajout' });
      }
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Section Synchronisation */}
        <SectionHeader title="Synchronisation multi-appareils" />

        <View style={styles.card}>
          <Text style={styles.label}>Votre code de sync</Text>
          <View style={styles.codeRow}>
            <Text style={styles.syncCode}>{syncCode}</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopyCode}>
              <Text style={styles.copyBtnText}>Copier</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>
            Partagez ce code avec un autre appareil pour synchroniser vos favoris.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Lier un appareil</Text>
          <TextInput
            style={styles.input}
            placeholder="Code 6 caractères"
            placeholderTextColor={COLORS.textSubtle}
            value={linkCode}
            onChangeText={(t) => setLinkCode(t.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            maxLength={6}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={[styles.btn, isLinking && styles.btnDisabled]}
            onPress={handleLinkDevice}
            disabled={isLinking}
          >
            <Text style={styles.btnText}>{isLinking ? 'Liaison…' : 'Lier cet appareil'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.unlinkBtn} onPress={handleUnlink}>
          <Text style={styles.unlinkText}>Déconnecter cet appareil</Text>
        </TouchableOpacity>

        {/* Section Amis */}
        <SectionHeader title="Amis" />

        <View style={styles.card}>
          <Text style={styles.label}>Suivre un ami</Text>
          <TextInput
            style={styles.input}
            placeholder="Code sync de l'ami (6 car.)"
            placeholderTextColor={COLORS.textSubtle}
            value={friendCode}
            onChangeText={(t) => setFriendCode(t.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            maxLength={6}
            autoCapitalize="characters"
          />
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            placeholder="Surnom (optionnel)"
            placeholderTextColor={COLORS.textSubtle}
            value={friendNickname}
            onChangeText={setFriendNickname}
          />
          <TouchableOpacity style={styles.btn} onPress={handleAddFriend}>
            <Text style={styles.btnText}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        {follows.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.label}>Amis suivis</Text>
            {follows.map((f) => (
              <View key={f.followed_id} style={styles.friendRow}>
                <View style={styles.friendAvatar}>
                  <Text style={styles.friendInitials}>
                    {(f.nickname || 'A').substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.friendName}>{f.nickname}</Text>
                <TouchableOpacity onPress={() => removeFriend(f.followed_id)}>
                  <Text style={styles.removeText}>Retirer</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>CinéLyon Mobile · v1.0.0</Text>
          <Text style={styles.versionHint}>fr.cinelyon.app</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 40 },

  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  card: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textSubtle,
    marginTop: 8,
    lineHeight: 18,
  },

  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  syncCode: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 4,
  },
  copyBtn: {
    backgroundColor: COLORS.primary + '33',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  copyBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },

  input: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontSize: 15,
    padding: 12,
  },

  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  unlinkBtn: {
    marginHorizontal: 16,
    marginTop: 4,
    padding: 12,
    alignItems: 'center',
  },
  unlinkText: {
    color: COLORS.warning,
    fontSize: 13,
    fontWeight: '600',
  },

  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  friendAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendInitials: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  friendName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
  },
  removeText: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '600',
  },

  versionContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  versionText: {
    color: COLORS.textSubtle,
    fontSize: 13,
  },
  versionHint: {
    color: COLORS.textSubtle,
    fontSize: 11,
    marginTop: 2,
  },
});
