import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name || "CineLyon",
  slug: config.slug || "cinelyon",
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: {
        ...config.android?.config?.googleMaps,
        apiKey: process.env.GOOGLE_MAPS_API_KEY || config.android?.config?.googleMaps?.apiKey || "",
      }
    }
  }
});
