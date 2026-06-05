// src/utils/uuid.ts
// Polyfill sécurisé pour générer un UUID v4 dans un environnement React Native / Expo
// où crypto.randomUUID() n'est pas nativement disponible de base sans import spécifique.

export function generateUUID(): string {
  // Utilisation d'un algorithme Math.random() de secours robuste.
  // Semblable à celui utilisé côté web.
  let d = new Date().getTime(); // Timestamp
  let d2 =
    (typeof performance !== 'undefined' &&
      performance.now &&
      performance.now() * 1000) ||
    0; // Time in microseconds since page-load or 0 if unsupported
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    let r = Math.random() * 16; // random number between 0 and 16
    if (d > 0) {
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
