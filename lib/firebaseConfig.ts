// lib/firebaseConfig.ts - Simple Web-Compatible Version
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

console.log('✅ Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'Missing',
  authDomain: firebaseConfig.authDomain || 'Missing',
  projectId: firebaseConfig.projectId || 'Missing',
});

// Initialize Firebase - Check if already exists
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Web-compatible auth initialization
const auth = getAuth(app);
console.log('✅ Firebase Auth initialized for Web platform');

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };
export default app;