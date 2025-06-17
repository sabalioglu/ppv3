import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

// Firebase configuration (temporary demo values)
const firebaseConfig = {
  apiKey: "AIzaSyDemo-Replace-With-Real-Firebase-Key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:demo-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Platform-specific Auth initialization
let auth;
if (Platform.OS === 'web') {
  // Web: Use simple getAuth (no AsyncStorage)
  auth = getAuth(app);
} else {
  // React Native: Would use AsyncStorage (not implemented yet)
  auth = getAuth(app);
}

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };
export default app;