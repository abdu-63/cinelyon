# CinéLyon Mobile

Ce dossier contient l'application mobile de CinéLyon, développée avec **React Native** et **Expo** (SDK 52).

---

## 📋 Prérequis

- **Node.js 18+**
- Un simulateur iOS (macOS avec Xcode) ou un émulateur Android (Android Studio), ou l'application **Expo Go** installée sur votre smartphone.

---

## ⚙️ Installation

Positionnez-vous dans le dossier mobile et installez les dépendances :

```bash
cd mobile
npm install
```

---

## 🚀 Commandes pour lancer l'application

### 1. Avec Expo Go
Pour démarrer le serveur de développement d'Expo et ouvrir l'application sur votre téléphone en scannant le QR code :

```bash
npx expo start
```

### 2. Avec un Build de Développement (Simulateurs/Émulateurs)
Puisque le projet intègre des modules natifs personnalisés et `expo-dev-client`, vous pouvez exécuter des builds de développement locaux :

#### iOS (macOS uniquement)
Pour compiler et lancer l'application sur le simulateur iOS :
```bash
npx expo run:ios
```

Pour compiler et installer directement sur un **iPhone physique** connecté en USB :
```bash
npx expo run:ios --device
```

#### Android
Pour compiler et lancer l'application sur un émulateur ou appareil Android connecté :
```bash
npx expo run:android
```

---

## 📦 Génération d'un fichier `.ipa` (Sideloading & Test sur iPhone)

Si vous compilez localement avec un compte Apple Developer gratuit, vous pouvez générer un fichier `.ipa` et l'installer sur votre iPhone via des outils de sideloading comme **AltStore**, **Sideloadly** ou **TrollStore**.

### Option A : Version de Test (Debug)
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
   Le fichier **`CineLyon-Debug.ipa`** sera généré à la racine du dossier `mobile/`.

### Option B : Version Autonome (Release)
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
   Le fichier autonome **`CineLyon.ipa`** sera généré à la racine du dossier `mobile/`.

---

## 🛠️ Astuces & Dépannage iOS

### 1. Erreur de Provisioning Profile / Push Notifications (`aps-environment`)
**Symptôme :** Xcode échoue lors du build (`Error code 65`) avec une erreur indiquant que votre profil de provisioning ne supporte pas la capacité "Push Notifications" ou que `aps-environment` n'est pas enregistré pour le profil.
**Cause :** Vous utilisez un compte Apple Developer gratuit qui ne supporte pas les notifications Push natives, mais les configurations natives du projet les requièrent.
**Résolution :** 
Ouvrez le fichier [CineLyon.entitlements](ios/CineLyon/CineLyon.entitlements) et retirez la clé `aps-environment` pour n'avoir qu'un dictionnaire vide :
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <!-- Supprimer les lignes aps-environment -->
  </dict>
</plist>
```

### 2. Blocage ou ralentissement à l'étape `hermes-engine`
Le système de sécurité de macOS (Gatekeeper) peut saturer le CPU à 100% en vérifiant les scripts de compilation hermes. Pour débloquer la situation, ouvrez un autre terminal et forcez son redémarrage :
```bash
sudo killall -9 syspolicyd
```
