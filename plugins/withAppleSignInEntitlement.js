// plugins/withAppleSignInEntitlement.js
// Adds the "Sign in with Apple" entitlement to the iOS app.
//
// The built-in `ios.usesAppleSignIn` flag relies on `expo-apple-authentication`
// (not installed here — this project uses @invertase/react-native-apple-
// authentication, which ships no Expo config plugin), so the entitlement was
// generated empty. We inject it explicitly. Required for App Store Guideline
// 4.8 (Apple Sign-In offered alongside Google sign-in).
const { withEntitlementsPlist } = require('@expo/config-plugins');

module.exports = function withAppleSignInEntitlement(config) {
  return withEntitlementsPlist(config, (cfg) => {
    cfg.modResults['com.apple.developer.applesignin'] = ['Default'];
    return cfg;
  });
};
