// src/utils/uuid.ts
// Utilisation d'expo-crypto pour générer des UUID v4 cryptographiquement sûrs.
// C'est indispensable car le syncId sert de jeton d'authentification dans l'app.

import * as Crypto from 'expo-crypto';

export function generateUUID(): string {
  return Crypto.randomUUID();
}
