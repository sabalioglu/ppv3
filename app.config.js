// app.config.js — single source of truth for Expo config (supersedes app.json).
// Brand: Stovd. Bundle/package: com.stovd.app. Scheme: stovd.
export default {
  expo: {
    name: 'Stovd',
    slug: 'stovd',
    owner: 'sabalioglu',
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
      usesAppleSignIn: true,
      infoPlist: {
        // Standard HTTPS/TLS only — no non-exempt encryption. Avoids the
        // export-compliance prompt on every TestFlight upload.
        ITSAppUsesNonExemptEncryption: false,
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
    plugins: [
      'expo-router',
      'expo-font',
      'expo-web-browser',
      'expo-localization',
      './plugins/withAppleSignInEntitlement',
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      eas: {
        projectId: '652f6d3d-3bdc-42a7-b810-785ae0963b71',
      },
      rapidApiKey: process.env.EXPO_PUBLIC_RAPIDAPI_KEY,
      // RevenueCat public SDK keys (NOT secrets — ship in bundle by design).
      rcIosKey: process.env.EXPO_PUBLIC_RC_IOS_KEY,
      rcAndroidKey: process.env.EXPO_PUBLIC_RC_ANDROID_KEY,
      // AdMob rewarded-ad config is deferred to v1.1 (ad-free v1.0 launch).
      // To re-enable: restore `admobRewardedIos`/`admobRewardedAndroid` here +
      // a root-level 'react-native-google-mobile-ads': { iosAppId, androidAppId }
      // block, then `npx expo install react-native-google-mobile-ads
      // expo-tracking-transparency`. Real iOS IDs are in project memory
      // (pub-5168576951873280 / app ~3346578594 / unit /3035283486).
    },
  },
};
