// app.config.js — single source of truth for Expo config (supersedes app.json).
// Brand: Stovd. Bundle/package: com.stovd.app. Scheme: stovd.
export default {
  expo: {
    name: 'Stovd',
    slug: 'stovd',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'stovd',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.stovd.app',
      infoPlist: {
        CFBundleURLTypes: [
          {
            CFBundleURLName: 'stovd',
            CFBundleURLSchemes: ['stovd'],
          },
        ],
      },
    },
    android: {
      package: 'com.stovd.app',
      adaptiveIcon: {
        backgroundColor: '#ffffff',
      },
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'stovd',
              host: 'auth',
              pathPrefix: '/callback',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: ['expo-router', 'expo-font', 'expo-web-browser'],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      rapidApiKey: process.env.EXPO_PUBLIC_RAPIDAPI_KEY,
    },
  },
};
