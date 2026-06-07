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
      usesAppleSignIn: true,
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
    plugins: [
      'expo-router',
      'expo-font',
      'expo-web-browser',
      'expo-localization',
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      rapidApiKey: process.env.EXPO_PUBLIC_RAPIDAPI_KEY,
      // RevenueCat public SDK keys (NOT secrets — ship in bundle by design).
      rcIosKey: process.env.EXPO_PUBLIC_RC_IOS_KEY,
      rcAndroidKey: process.env.EXPO_PUBLIC_RC_ANDROID_KEY,
      // AdMob rewarded ad unit IDs (public — ship in the bundle). iOS is the
      // real Stovd unit (pub-5168576951873280); Android still uses Google's
      // test unit until the Android AdMob app is created.
      admobRewardedIos:
        process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS ||
        'ca-app-pub-5168576951873280/3035283486',
      admobRewardedAndroid:
        process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID ||
        'ca-app-pub-3940256099942544/5224354917',
    },
  },
  // react-native-google-mobile-ads reads app IDs from this root key (config
  // plugin). iOS = real Stovd App ID; Android = Google test ID until the
  // Android AdMob app exists.
  'react-native-google-mobile-ads': {
    androidAppId:
      process.env.EXPO_PUBLIC_ADMOB_APP_ID_ANDROID ||
      'ca-app-pub-3940256099942544~3347511713',
    iosAppId:
      process.env.EXPO_PUBLIC_ADMOB_APP_ID_IOS ||
      'ca-app-pub-5168576951873280~3346578594',
  },
};
