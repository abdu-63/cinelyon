# Guide de configuration : Support Web (PWA) pour CinéLyon

Ce guide documente les étapes exactes requises pour compiler et exécuter l'application Expo sur le web (navigateur / PWA), en contournant les limitations liées aux dépendances strictement natives.

## 1. Problème avec `@supabase/supabase-js`

Le SDK Supabase inclut une dépendance optionnelle liée à OpenTelemetry (`@opentelemetry/api`). Bien que non utilisée, le bundler Web d'Expo (Metro) tente de la résoudre statiquement et échoue, empêchant la compilation.

**Solution :**
Installer manuellement la dépendance pour satisfaire le bundler web.
```bash
npm install @opentelemetry/api
```

---

## 2. Problème avec `react-native-maps`

La librairie `react-native-maps` repose entièrement sur du code natif iOS (Apple Maps) et Android (Google Maps). Elle n'est pas compatible avec le web et provoque l'erreur `Importing native-only module "react-native/Libraries/Utilities/codegenNativeCommands" on web`.

Pour que l'application web fonctionne, nous devons isoler cette librairie et empêcher le bundler web de la scanner.

### Étape 2.1 : Isoler la logique de la carte

Expo Router impose une structure de fichiers stricte. Vous ne pouvez pas utiliser `map.tsx` avec du code natif pur s'il est aussi scanné pour le web.

1. Créez un dossier `src/components/map/`.
2. Déplacez le code natif de votre page de carte (contenant les imports `react-native-maps`) dans `src/components/map/MapScreen.tsx`.
3. Créez une version 100% compatible web dans `src/components/map/MapScreen.web.tsx` (ex: une vue affichant uniquement une liste d'adresses).
4. Mettez à jour le fichier `app/(tabs)/map.tsx` pour qu'il ne fasse que réexporter le composant sans code natif :
```tsx
import MapScreen from '../../src/components/map/MapScreen';

export default function MapRoute() {
  return <MapScreen />;
}
```

### Étape 2.2 : Mocker `react-native-maps` via Babel

Même avec des fichiers spécifiques `.web.tsx`, l'analyseur statique de Metro peut explorer l'ensemble de l'arbre et crasher s'il détecte `react-native-maps`.
La solution la plus robuste consiste à configurer **Babel** pour intercepter l'import dynamique.

1. Créez un fichier bouchon (mock) `src/lib/react-native-maps-mock.tsx` :
```tsx
import React from 'react';
import { View } from 'react-native';

export default function MapView(props: any) { return <View {...props} />; }
export function Marker(props: any) { return <View {...props} />; }
export function Callout(props: any) { return <View {...props} />; }
```

2. Modifiez `babel.config.js` pour rediriger tous les imports de `react-native-maps` vers ce bouchon **uniquement** quand la plateforme cible est `web` :
```javascript
module.exports = function (api) {
  // api.cache(true) doit être retiré car api.caller gère déjà son propre cache dynamique !
  const isWeb = api.caller((caller) => caller && caller.platform === 'web');

  const alias = {
    '@': './src',
  };

  if (isWeb) {
    alias['react-native-maps'] = './src/lib/react-native-maps-mock.tsx';
  }

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: alias,
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
```

### Étape 2.3 : Vider les caches et compiler

Une fois la configuration Babel modifiée, il est indispensable de vider tous les caches pour que la nouvelle résolution de modules soit prise en compte :

```bash
npx expo start -c
```

L'application web compilera alors sans aucune erreur et affichera la version de repli construite dans `MapScreen.web.tsx`.
