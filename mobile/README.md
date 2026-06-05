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

---

## Génération d'un fichier `.ipa` pour iOS

La génération d'un fichier `.ipa` dépend de votre type de compte Apple Developer.

### Méthode 1 : Sans compte développeur payant (Compte gratuit + Sideloading)
Pour générer un fichier `.ipa` autonome (qui fonctionne sans serveur Metro sur l'ordinateur) afin de l'installer via des outils comme **AltStore**, **Sideloadly**, **TrollStore**, etc. :

1. Mettez à jour les fichiers natifs :
   ```bash
   npx expo prebuild
   ```

2. Compilez l'application en mode **Release** :
   ```bash
   npx expo run:ios --configuration Release --device
   ```
   *(Sélectionnez votre iPhone branché. Le build va générer un fichier `CinLyon.app` dans le dossier temporaire d'Xcode).*

3. Packagez le `.app` en `.ipa` :
   ```bash
   mkdir -p Payload
   cp -r ~/Library/Developer/Xcode/DerivedData/CinLyon-*/Build/Products/Release-iphoneos/CinLyon.app Payload/
   zip -r CinLyon.ipa Payload
   rm -rf Payload
   ```
   Le fichier **`CinLyon.ipa`** sera généré directement à la racine du dossier `mobile/`.

### Méthode 2 : Avec un compte développeur payant (EAS Build)
Si vous avez un compte Apple Developer actif ($99/an), vous pouvez utiliser le service cloud EAS Build d'Expo pour générer et distribuer le `.ipa` :

1. Installez le CLI d'EAS :
   ```bash
   npm install -g eas-cli
   ```

2. Connectez-vous à votre compte Expo :
   ```bash
   eas login
   ```

3. Lancez la compilation du build :
   ```bash
   eas build --platform ios --profile preview
   ```
   EAS gère la signature Ad-Hoc en enregistrant l'UDID de votre iPhone connecté. À la fin du build, un QR code sera disponible pour télécharger et installer le `.ipa` directement.
