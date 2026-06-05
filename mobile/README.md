# CinéLyon Mobile

Ce dossier contient l'application mobile de CinéLyon, développée avec **React Native** et **Expo** (SDK 52).

## Prérequis

- **Node.js 18+**
- Un simulateur iOS (macOS avec Xcode) ou un émulateur Android (Android Studio), ou l'application **Expo Go** installée sur votre smartphone.

---

## Installation

Positionnez-vous d'abord dans le dossier mobile et installez les dépendances :

```bash
cd mobile
npm install
```

---

## Commandes pour lancer l'application

### 1. Avec Expo Go
Pour démarrer le serveur de développement d'Expo et ouvrir l'application sur votre téléphone en scannant le QR code :

```bash
npm start
# ou
npx expo start
```

### 2. Avec un Build de Développement (Simulateurs/Émulateurs)
Puisque le projet intègre des modules natifs personnalisés et `expo-dev-client`, vous pouvez exécuter des builds de développement locaux :

#### iOS (macOS uniquement)
Pour compiler et lancer l'application sur le simulateur iOS :
```bash
npm run ios
# ou
npx expo run:ios
```

#### Android
Pour compiler et lancer l'application sur un émulateur ou appareil Android connecté :
```bash
npm run android
# ou
npx expo run:android
```
