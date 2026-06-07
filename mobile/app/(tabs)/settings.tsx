// app/(tabs)/settings.tsx
// Réglages : sync appareils, code de partage, amis, et options

import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { setAppIcon, getAppIcon } from '@howincodes/expo-dynamic-app-icon';
import { useFavorites } from '../../src/hooks/useFavorites';
import { useFriends } from '../../src/hooks/useFriends';
import { COLORS } from '../../src/lib/constants';
import { secureStore } from '../../src/lib/secureStore';
import { TwitterLogo, InstagramLogo, GithubLogo, LetterboxdLogo } from '../../src/components/ui/SocialIcons';

const APP_ICONS = [
  { id: 'DEFAULT', label: 'Défaut', source: require('../../assets/icon.png') },
  { id: 'bluegradiant', label: 'Bleu Dégradé', source: require('../../assets/icons/BlueGradiant.png') },
  { id: 'cleardark', label: 'Clair Sombre', source: require('../../assets/icons/ClearDark.png') },
  { id: 'darkblue', label: 'Bleu Sombre', source: require('../../assets/icons/DarkBlue.png') },
  { id: 'darkpurple', label: 'Violet Sombre', source: require('../../assets/icons/DarkPurple.png') },
  { id: 'puplebluegradiant', label: 'Violet Bleu', source: require('../../assets/icons/PupleBlueGradiant.png') },
  { id: 'puprplegradiant', label: 'Violet Dégradé', source: require('../../assets/icons/PuprpleGradiant.png') },
  { id: 'purple', label: 'Violet', source: require('../../assets/icons/Purple.png') },
  { id: 'tinteddark', label: 'Teinté', source: require('../../assets/icons/TintedDark.png') },
];

export default function SettingsScreen() {
  const { syncCode, syncId, pseudo, linkDevice, unlinkDevice, updatePseudo } = useFavorites();
  const { follows, addFriend, removeFriend, friendFavoritesCountMap } = useFriends(syncId);

  const [linkCode, setLinkCode] = useState('');
  const [friendCode, setFriendCode] = useState('');
  const [friendNickname, setFriendNickname] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [localPseudo, setLocalPseudo] = useState('');
  const [isCodeHidden, setIsCodeHidden] = useState(true);

  // Settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hidePastSessions, setHidePastSessions] = useState(true);

  // Hidden Friends (masquer les amis)
  const [hiddenFriends, setHiddenFriends] = useState<string[]>([]);

  // App Icon
  const [currentIcon, setCurrentIcon] = useState<string>('DEFAULT');

  useEffect(() => {
    if (pseudo) {
      setLocalPseudo(pseudo);
    }
  }, [pseudo]);

  useEffect(() => {
    // Load settings
    const loadSettings = async () => {
      const notifs = await secureStore.getItemAsync('notificationsEnabled');
      const hidePast = await secureStore.getItemAsync('hidePastSessions');
      const hiddenF = await secureStore.getItemAsync('hiddenFriends');
      if (notifs !== null) setNotificationsEnabled(notifs === 'true');
      if (hidePast !== null) setHidePastSessions(hidePast === 'true');
      if (hiddenF !== null) setHiddenFriends(JSON.parse(hiddenF));

      // load icon
      try {
        const icon = await getAppIcon();
        setCurrentIcon(icon || 'DEFAULT');
      } catch (e) {
        // ignore
      }
    };
    loadSettings();
  }, []);

  const toggleNotifications = async (val: boolean) => {
    setNotificationsEnabled(val);
    await secureStore.setItemAsync('notificationsEnabled', val ? 'true' : 'false');
  };

  const toggleHidePastSessions = async (val: boolean) => {
    setHidePastSessions(val);
    await secureStore.setItemAsync('hidePastSessions', val ? 'true' : 'false');
  };

  const handleCopyCode = () => {
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

  const handleRegenerateCode = () => {
    Alert.alert(
      'Changer de code',
      'Vos favoris resteront, mais votre code actuel sera supprimé. Les autres appareils ne pourront plus se lier avec l\'ancien code.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Changer',
          style: 'destructive',
          onPress: async () => {
            await unlinkDevice();
            Toast.show({ type: 'success', text1: 'Code mis à jour 🔄' });
          },
        },
      ]
    );
  };

  const handleUpdatePseudo = () => {
    updatePseudo(localPseudo);
    Toast.show({ type: 'success', text1: 'Pseudo mis à jour !' });
  };

  const handleAddFriend = async () => {
    if (friendCode.trim() === '') {
      Toast.show({ type: 'error', text1: 'Veuillez entrer un code ou pseudo' });
      return;
    }
    try {
      await addFriend(friendCode.trim(), friendNickname || 'Ami');
      Toast.show({ type: 'success', text1: `Ami ajouté ! ✅` });
      setFriendCode('');
      setFriendNickname('');
    } catch (e: any) {
      if (e.message === 'not_found') {
        Toast.show({ type: 'error', text1: 'Utilisateur introuvable' });
      } else {
        Toast.show({ type: 'error', text1: 'Erreur lors de l\'ajout' });
      }
    }
  };

  const handleChangeIcon = async (iconId: string) => {
    try {
      const result = await setAppIcon(iconId === 'DEFAULT' ? null : (iconId as any));
      if (result !== false) {
        setCurrentIcon(iconId);
        Toast.show({ type: 'success', text1: 'Icône mise à jour !' });
      } else {
        Toast.show({ type: 'error', text1: 'L\'icône n\'a pas pu être changée.' });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Erreur lors du changement d\'icône' });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Section Profil */}
        <SectionHeader title="Mon Profil (Amis & Sync)" />

        <View style={styles.card}>
          <Text style={styles.label}>Votre Nom / Pseudo</Text>
          <View style={styles.pseudoRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Ex: cinefan69"
              placeholderTextColor={COLORS.textSubtle}
              value={localPseudo}
              onChangeText={setLocalPseudo}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdatePseudo}>
              <Text style={styles.saveBtnText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>Vos amis pourront vous trouver via ce pseudo.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Votre code de sync</Text>
          <View style={styles.codeRow}>
            <Text style={styles.syncCode}>{isCodeHidden ? '••••••' : syncCode}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => setIsCodeHidden(!isCodeHidden)}>
                <Ionicons name={isCodeHidden ? "eye" : "eye-off"} size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={handleRegenerateCode}>
                <Ionicons name="refresh" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.copyBtn} onPress={handleCopyCode}>
                <Text style={styles.copyBtnText}>Copier</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.hint}>
            Partagez ce code avec un autre appareil pour synchroniser vos favoris.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Lier un appareil existant</Text>
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

        {/* Section Amis */}
        <SectionHeader title="Amis suivis" />

        <View style={styles.card}>
          <Text style={styles.label}>Ajouter un ami</Text>
          <TextInput
            style={styles.input}
            placeholder="Code sync ou pseudo de l'ami"
            placeholderTextColor={COLORS.textSubtle}
            value={friendCode}
            onChangeText={setFriendCode}
            autoCapitalize="none"
          />
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            placeholder="Surnom local (optionnel)"
            placeholderTextColor={COLORS.textSubtle}
            value={friendNickname}
            onChangeText={setFriendNickname}
          />
          <TouchableOpacity style={styles.btn} onPress={handleAddFriend}>
            <Text style={styles.btnText}>Ajouter l'ami</Text>
          </TouchableOpacity>
        </View>

        {follows.length > 0 ? (
          <View style={styles.card}>
            {follows.map((f, i) => (
              <FriendRowItem
                key={f.followed_id}
                friend={f}
                favoritesCount={friendFavoritesCountMap[f.followed_id] || 0}
                isLast={i === follows.length - 1}
                isHidden={hiddenFriends.includes(f.followed_id)}
                onToggleHidden={async () => {
                  let newHiddens = [...hiddenFriends];
                  if (newHiddens.includes(f.followed_id)) {
                    newHiddens = newHiddens.filter(id => id !== f.followed_id);
                  } else {
                    newHiddens.push(f.followed_id);
                  }
                  setHiddenFriends(newHiddens);
                  await secureStore.setItemAsync('hiddenFriends', JSON.stringify(newHiddens));
                }}
                onRemove={() => removeFriend(f.followed_id)}
                onUpdate={async (newCode, newName) => {
                  try {
                    await removeFriend(f.followed_id);
                    await addFriend(newCode, newName);
                    Toast.show({ type: 'success', text1: 'Ami mis à jour !' });
                  } catch (e) {
                    Toast.show({ type: 'error', text1: 'Erreur lors de la mise à jour' });
                  }
                }}
              />
            ))}
          </View>
        ) : null}

        {/* Section Apparence */}
        <SectionHeader title="Apparence" />
        
        <View style={styles.card}>
          <Text style={styles.label}>Icône de l'application</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingVertical: 8 }}>
            {APP_ICONS.map(icon => (
              <TouchableOpacity
                key={icon.id}
                style={[
                  styles.iconPickerBtn,
                  currentIcon === icon.id && styles.iconPickerBtnActive
                ]}
                onPress={() => handleChangeIcon(icon.id)}
              >
                <Image
                  source={icon.source}
                  style={[styles.iconPreviewImg, currentIcon === icon.id && styles.iconPreviewImgActive]}
                  contentFit="cover"
                />
                <Text style={[styles.iconPickerLabel, currentIcon === icon.id && styles.iconPickerLabelActive]}>{icon.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Section Options */}
        <SectionHeader title="Options" />
        
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={styles.switchLabel}>Afficher les notifications</Text>
              <Text style={[styles.hint, { marginTop: 4 }]}>Recevoir des rappels pour vos séances réservées dans votre calendrier.</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
            />
          </View>
          <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={styles.switchLabel}>Masquer les séances passées</Text>
              <Text style={[styles.hint, { marginTop: 4 }]}>Ne plus afficher les films dont l'horaire est déjà dépassé aujourd'hui.</Text>
            </View>
            <Switch
              value={hidePastSessions}
              onValueChange={toggleHidePastSessions}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
            />
          </View>
        </View>

        {/* Section Contact & Réseaux */}
        <SectionHeader title="À Propos" />

        <View style={styles.card}>
          <TouchableOpacity style={styles.contactRow} onPress={() => {
            Alert.alert(
              'Aidez-nous à améliorer CinéLyon !',
              'Choisissez une option :',
              [
                {
                  text: 'Signaler un bug',
                  onPress: () => Linking.openURL(`mailto:cinelyon.fr@gmail.com?subject=${encodeURIComponent('[Bug] Signalement sur CinéLyon')}&body=${encodeURIComponent('Description du bug :\n\nÉtapes pour reproduire :\n\nAppareil/Navigateur :')}`)
                },
                {
                  text: 'Suggérer un ajout',
                  onPress: () => Linking.openURL(`mailto:cinelyon.fr@gmail.com?subject=${encodeURIComponent('[Idée] Nouvelle fonctionnalité CinéLyon')}&body=${encodeURIComponent('Mon idée :\n\nPourquoi ce serait utile :')}`)
                },
                {
                  text: 'Annuler',
                  style: 'cancel'
                }
              ]
            );
          }}>
            <Ionicons name="bug-outline" size={20} color={COLORS.text} />
            <Text style={styles.contactText}>Signaler un bug / Suggérer un ajout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.socialsRow}>
          <TouchableOpacity style={styles.socialBtn} onPress={() => Linking.openURL('https://boxd.it/6GBU5')}>
            <LetterboxdLogo size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn} onPress={() => Linking.openURL('https://x.com/abduplt?s=21')}>
            <TwitterLogo size={24} color={COLORS.textSubtle} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn} onPress={async () => {
            const appUrl = 'instagram://user?username=cinelyon.fr';
            const webUrl = 'https://www.instagram.com/_u/cinelyon.fr/';
            try {
              await Linking.openURL(appUrl);
            } catch {
              Linking.openURL(webUrl);
            }
          }}>
            <InstagramLogo size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn} onPress={() => Linking.openURL('https://github.com/abdu-63')}>
            <GithubLogo size={24} color={COLORS.textSubtle} />
          </TouchableOpacity>
        </View>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>CinéLyon Mobile · v1.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FriendRowItem({ friend, isLast, isHidden, favoritesCount, onToggleHidden, onRemove, onUpdate }: {
  friend: any;
  isLast: boolean;
  isHidden: boolean;
  favoritesCount: number;
  onToggleHidden: () => void;
  onRemove: () => void;
  onUpdate: (newCode: string, newName: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(friend.followed_name);
  const [editCode, setEditCode] = useState(friend.followed_id.substring(0, 6).toUpperCase());

  if (isEditing) {
    return (
      <View style={[styles.friendRowEditing, isLast && { borderBottomWidth: 0 }]}>
        <TextInput
          style={[styles.input, { marginBottom: 8 }]}
          value={editName}
          onChangeText={setEditName}
          placeholder="Nouveau nom"
        />
        <TextInput
          style={[styles.input, { marginBottom: 8 }]}
          value={editCode}
          onChangeText={setEditCode}
          placeholder="Nouveau code ou pseudo"
          autoCapitalize="none"
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={[styles.btn, { flex: 1, backgroundColor: COLORS.border }]} onPress={() => setIsEditing(false)}>
            <Text style={[styles.btnText, { color: COLORS.text }]}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={() => { setIsEditing(false); onUpdate(editCode, editName); }}>
            <Text style={styles.btnText}>Sauvegarder</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.friendRow, isLast && { borderBottomWidth: 0 }]}>
      <View style={[styles.friendAvatar, isHidden && { opacity: 0.5 }]}>
        <Text style={styles.friendInitials}>
          {(friend.followed_name || 'A').substring(0, 2).toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.friendName, isHidden && { color: COLORS.textMuted }]}>
          {friend.followed_name} {isHidden && '(Masqué)'}
        </Text>
        <Text style={styles.friendCodeText}>
          Code : {friend.followed_id.substring(0, 6)} • {favoritesCount} favori{favoritesCount > 1 ? 's' : ''}
        </Text>
      </View>
      
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity onPress={onToggleHidden} hitSlop={8}>
          <Ionicons name={isHidden ? "eye-off" : "eye"} size={20} color={COLORS.textSubtle} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsEditing(true)} hitSlop={8}>
          <Ionicons name="pencil" size={18} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onRemove} hitSlop={8}>
          <Ionicons name="trash" size={18} color={COLORS.warning} />
        </TouchableOpacity>
      </View>
    </View>
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
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  syncCode: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 3,
  },
  iconBtn: {
    padding: 6,
    backgroundColor: COLORS.primary + '11',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBtn: {
    backgroundColor: COLORS.primary + '33',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
  },
  copyBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },

  pseudoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#FFF',
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

  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  friendRowEditing: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  friendCodeText: {
    color: COLORS.textSubtle,
    fontSize: 12,
  },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  switchLabel: {
    fontSize: 15,
    color: COLORS.text,
  },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactText: {
    fontSize: 15,
    color: COLORS.text,
  },

  socialsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  socialBtn: {
    padding: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  versionContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  versionText: {
    color: COLORS.textSubtle,
    fontSize: 13,
  },
  
  iconPickerBtn: {
    alignItems: 'center',
    gap: 8,
    opacity: 0.5,
  },
  iconPickerBtnActive: {
    opacity: 1,
  },
  iconPreviewImg: {
    width: 60,
    height: 60,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconPreviewImgActive: {
    borderColor: COLORS.primary,
  },
  iconPickerLabel: {
    fontSize: 12,
    color: COLORS.textSubtle,
  },
  iconPickerLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
