// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ads are deferred to v1.1: react-native-google-mobile-ads is not installed, but
// lib/ads.ts still references it (behind the ADS_ENABLED=false gate in
// lib/quota-recovery.ts). Alias it to a no-op stub so the production bundle
// resolves. Remove this block + `npx expo install react-native-google-mobile-ads`
// when re-enabling ads.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-google-mobile-ads': path.resolve(
    __dirname,
    'stubs/react-native-google-mobile-ads.js',
  ),
};

module.exports = config;
