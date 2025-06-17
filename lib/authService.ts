import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { Platform, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

// Complete WebBrowser session for OAuth
WebBrowser.maybeCompleteAuthSession();

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt: Date;
  provider: 'email' | 'google' | 'apple' | 'amazon';
}

export class AuthService {
  // Email/Password Authentication
  static async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await this.updateUserProfile(userCredential.user, 'email');
      return userCredential.user;
    } catch (error: any) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  static async signUpWithEmail(email: string, password: string, displayName?: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      
      await this.createUserProfile(userCredential.user, 'email');
      return userCredential.user;
    } catch (error: any) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Google Authentication
  static async signInWithGoogle(): Promise<User> {
    try {
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        await this.updateUserProfile(result.user, 'google');
        return result.user;
      } else {
        // React Native Google Sign In
        const [request, response, promptAsync] = Google.useAuthRequest({
          expoClientId: 'YOUR_EXPO_CLIENT_ID',
          iosClientId: 'YOUR_IOS_CLIENT_ID',
          androidClientId: 'YOUR_ANDROID_CLIENT_ID',
          webClientId: 'YOUR_WEB_CLIENT_ID',
        });

        if (response?.type === 'success') {
          const { id_token, access_token } = response.params;
          const credential = GoogleAuthProvider.credential(id_token, access_token);
          const result = await signInWithCredential(auth, credential);
          await this.updateUserProfile(result.user, 'google');
          return result.user;
        }
        throw new Error('Google sign in was cancelled');
      }
    } catch (error: any) {
      throw new Error('Google sign in failed: ' + error.message);
    }
  }

  // Apple Authentication (placeholder - requires iOS setup)
  static async signInWithApple(): Promise<User> {
    try {
      // Apple Sign In implementation would go here
      // Requires @invertase/react-native-apple-authentication setup
      throw new Error('Apple Sign In not implemented yet');
    } catch (error: any) {
      throw new Error('Apple sign in failed: ' + error.message);
    }
  }

  // Amazon Authentication (placeholder - requires Amazon setup)
  static async signInWithAmazon(): Promise<User> {
    try {
      // Amazon Login implementation would go here
      throw new Error('Amazon Sign In not implemented yet');
    } catch (error: any) {
      throw new Error('Amazon sign in failed: ' + error.message);
    }
  }

  // Sign Out
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error('Sign out failed: ' + error.message);
    }
  }

  // Get Current User
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Auth State Listener
  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  // Create User Profile in Firestore
  private static async createUserProfile(user: User, provider: UserProfile['provider']): Promise<void> {
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      provider
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);
  }

  // Update User Profile
  private static async updateUserProfile(user: User, provider: UserProfile['provider']): Promise<void> {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      // Update last login
      await setDoc(doc(db, 'users', user.uid), {
        lastLoginAt: new Date()
      }, { merge: true });
    } else {
      // Create new profile
      await this.createUserProfile(user, provider);
    }
  }

  // Error Message Helper
  private static getAuthErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Bu email adresi ile kayıtlı kullanıcı bulunamadı';
      case 'auth/wrong-password':
        return 'Hatalı şifre';
      case 'auth/email-already-in-use':
        return 'Bu email adresi zaten kullanımda';
      case 'auth/weak-password':
        return 'Şifre çok zayıf. En az 6 karakter olmalı';
      case 'auth/invalid-email':
        return 'Geçersiz email adresi';
      case 'auth/network-request-failed':
        return 'İnternet bağlantısı hatası';
      default:
        return 'Giriş hatası oluştu';
    }
  }
}
