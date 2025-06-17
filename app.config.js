// app.config.js - COMPLETE FIXED VERSION WITH SCHEME
export default {
  expo: {
    name: "Smart Pantry",
    slug: "smart-pantry",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "pantrypal", // ✅ ADDED SCHEME
    userInterfaceStyle: "light",
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.pantrypal.app"
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#ffffff"
      },
      package: "com.pantrypal.app"
    },
    web: {
      bundler: "metro",
      output: "static"
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      rapidApiKey: process.env.EXPO_PUBLIC_RAPIDAPI_KEY
    }
  }
};