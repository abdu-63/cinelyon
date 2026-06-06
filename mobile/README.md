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

Pour compiler et installer directement sur un **iPhone physique** connecté en USB (avec affichage détaillé de la compilation) :
```bash
npx expo run:ios --device --verbose
```


#### Android
Pour compiler et lancer l'application sur un émulateur ou appareil Android connecté :
```bash
npm run android
# ou
npx expo run:android
```

---

## Génération d'un fichier `.ipa` pour installer sur iPhone

La génération d'un fichier `.ipa` dépend de votre type de compte Apple Developer.

### Méthode 1 : Sans compte développeur payant (Compte gratuit + Sideloading)
Si vous n'avez pas de compte Apple Developer payant, vous pouvez générer un fichier `.ipa` localement et l'installer sur votre iPhone via des outils de sideloading comme **AltStore**, **Sideloadly** ou **TrollStore**.

#### Option A : Version de Test (Debug)
*Utile pour tester l'application en développement avec le rechargement en direct (Hot Reloading). Cette version nécessite que votre Mac soit allumé et que le serveur Metro tourne sur le même réseau Wi-Fi.*

1. Lancez la compilation en mode Debug :
   ```bash
   npx expo run:ios --device
   ```
   *(Sélectionnez votre iPhone branché. Le build va générer le fichier `CineLyon.app` dans le dossier de cache Xcode).*

2. Convertissez le `.app` en `.ipa` :
   ```bash
   mkdir -p Payload
   cp -r ~/Library/Developer/Xcode/DerivedData/CineLyon-*/Build/Products/Debug-iphoneos/CineLyon.app Payload/
   zip -r CineLyon-Debug.ipa Payload
   rm -rf Payload
   ```
   Le fichier **`CineLyon-Debug.ipa`** sera généré directement à la racine du dossier `mobile/`.

#### Option B : Version Autonome (Release)
*Utile pour avoir une application complètement indépendante qui fonctionne n'importe où sans serveur Metro et sans être connecté au Mac.*

1. Mettez à jour les fichiers de configuration natifs :
   ```bash
   npx expo prebuild
   ```

2. Lancez la compilation en mode Release :
   ```bash
   npx expo run:ios --configuration Release --device
   ```

3. Convertissez le `.app` en `.ipa` :
   ```bash
   mkdir -p Payload
   cp -r ~/Library/Developer/Xcode/DerivedData/CineLyon-*/Build/Products/Release-iphoneos/CineLyon.app Payload/
   zip -r CineLyon.ipa Payload
   rm -rf Payload
   ```
   Le fichier autonome **`CineLyon.ipa`** sera généré directement à la racine du dossier `mobile/`.

---

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

---

### Astuces & Dépannage iOS

* **Que faire si le build semble figé à l'étape `hermes-engine` ?**
  Le système de sécurité de macOS (Gatekeeper) peut saturer le CPU à 100% lors de la vérification des scripts de compilation. Pour débloquer la situation, ouvrez un autre terminal et forcez son redémarrage :
  ```bash
  sudo killall -9 syspolicyd
  ```
* **iPhone non détecté ou erreur d'installation** : Lors de la phase finale de déploiement de l'application, assurez-vous que votre iPhone est **allumé**, **déverrouillé** et **bien connecté en USB** à votre Mac.
