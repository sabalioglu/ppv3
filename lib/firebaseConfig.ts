// lib/firebaseConfig.ts - FIXED PLATFORM DETECTION
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// FIXED Platform-specific Auth initialization
let auth;
try {
  if (typeof window !== 'undefined') {
    // Web environment
    auth = getAuth(app);
  } else {
    // React Native environment
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  }
} catch (error) {
  // Fallback
  auth = getAuth(app);
}

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };
export default app;