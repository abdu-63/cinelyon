// src/lib/features.ts
// Configuration centralisée des Feature Flags (activation / désactivation de fonctionnalités)
// Permet d'alléger le bundle, de réduire les re-renders et de gérer les exclusivités de l'app mobile.

export const FEATURES = {
  // Chatbot IA CineBot
  enableCineBot: false,

  // Mini-jeu Ciné-Roulette
  enableRoulette: false,

  // Fonctionnalité Double Programme
  enableDoubleFeature: false,

  // Carte interactive des cinémas & arrêts TCL
  enableMap: true,

  // Pauses Toilettes RunPee sur la fiche film
  enableRunPee: true,

  // Scènes Post-Générique sur la fiche film
  enablePostCredits: true,

  // Formulaire de suggestions & retours utilisateurs
  enableSuggestions: true,
} as const;

export type FeatureKey = keyof typeof FEATURES;
