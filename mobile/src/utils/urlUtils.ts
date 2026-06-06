// src/utils/urlUtils.ts
import { Linking, Alert } from 'react-native';

const ALLOWED_SCHEMES = ['http:', 'https:', 'mailto:', 'maps:'];

/**
 * Valide et ouvre une URL externe uniquement si elle utilise un schéma autorisé.
 * Prévient les attaques d'injection de liens (ex: javascript:, file:, ou schémas d'apps malveillantes).
 */
export const safeOpenURL = async (url: string) => {
  if (!url) return;

  try {
    const parsedUrl = new URL(url);
    if (!ALLOWED_SCHEMES.includes(parsedUrl.protocol)) {
      console.warn(`Tentative d'ouverture d'une URL bloquée (schéma non autorisé): ${url}`);
      Alert.alert('Erreur', 'Ce lien ne peut pas être ouvert pour des raisons de sécurité.');
      return;
    }
  } catch (e) {
    // Si l'URL n'est pas parsable (ex: "cinelyon://..."), on la rejette par précaution si elle vient de données externes
    console.warn(`URL invalide ou schéma non reconnu: ${url}`);
    Alert.alert('Erreur', 'Le lien semble invalide.');
    return;
  }

  const canOpen = await Linking.canOpenURL(url).catch(() => false);
  if (canOpen) {
    Linking.openURL(url);
  } else {
    Alert.alert('Erreur', 'Impossible d\'ouvrir ce lien sur votre appareil.');
  }
};
