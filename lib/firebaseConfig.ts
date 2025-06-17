// lib/firebaseConfig.ts - COMPLETE FIXED VERSION
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Import AsyncStorage with proper fallback handling
let AsyncStorage: any;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  // AsyncStorage not available on web, will use web fallback
  console.log('AsyncStorage not available, using web auth fallback');
}

// Firebase configuration with environment variables + FALLBACKS
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyBt0Sgzj0snCECqrHUg5izYlnJIRQmRTik",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "pantry-pal-production.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "pantry-pal-production",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "pantry-pal-production.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "48431961294",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:48431961294:web:9d576335caac93d886ec9f",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-LSCCLT1QYQ"
};

// Validate Firebase configuration
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error('❌ Missing Firebase environment variables');
  console.error('API Key:', firebaseConfig.apiKey ? 'Present' : 'Missing');
  console.error('Auth Domain:', firebaseConfig.authDomain ? 'Present' : 'Missing');
  console.error('Project ID:', firebaseConfig.projectId ? 'Present' : 'Missing');
  throw new Error('Missing Firebase environment variables. Please check your .env file.');
}

console.log('✅ Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'Missing',
  authDomain: firebaseConfig.authDomain || 'Missing',
  projectId: firebaseConfig.projectId || 'Missing',
});

// Initialize Firebase - Check if already exists
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// FIXED Platform-specific Auth initialization with proper AsyncStorage handling
let auth;
try {
  // Check if we're in React Native environment with AsyncStorage available
  if (typeof window === 'undefined' && AsyncStorage) {
    // React Native environment with AsyncStorage
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
    console.log('✅ Firebase Auth initialized for React Native with AsyncStorage');
  } else {
    // Web environment or React Native without AsyncStorage
    auth = getAuth(app);
    console.log('✅ Firebase Auth initialized for Web');
  }
} catch (error) {
  // Final fallback - always works
  console.warn('⚠️ Auth initialization fallback:', error);
  auth = getAuth(app);
}

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };
export default app;