// app.config.js - Tüm içeriği bununla değiştir:
export default {
  expo: {
    name: "Smart Pantry",
    slug: "smart-pantry",
    version: "1.0.0",
    orientation: "portrait",
    // icon: "./assets/icon.png",  // ❌ KALDIR
    userInterfaceStyle: "light",
    // splash: {  // ❌ KALDIR
    //   image: "./assets/splash.png",
    //   resizeMode: "contain",
    //   backgroundColor: "#ffffff"
    // },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        // foregroundImage: "./assets/adaptive-icon.png",  // ❌ KALDIR
        backgroundColor: "#ffffff"
      }
    },
    web: {
      // favicon: "./assets/favicon.png"  // ❌ KALDIR
    },
    extra: {
      rapidApiKey: process.env.EXPO_PUBLIC_RAPIDAPI_KEY
    }
  }
};
