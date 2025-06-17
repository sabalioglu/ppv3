import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithRedirect, // ✅ ADD THIS
  getRedirectResult,  // ✅ ADD THIS
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
      console.log('🔐 Signing in with email:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await this.updateUserProfile(userCredential.user, 'email');
      console.log('✅ Email sign in successful');
      return userCredential.user;
    } catch (error: any) {
      console.error('❌ Email sign in failed:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  static async signUpWithEmail(email: string, password: string, displayName?: string): Promise<User> {
    try {
      console.log('📝 Creating account with email:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      
      await this.createUserProfile(userCredential.user, 'email');
      console.log('✅ Email sign up successful');
      return userCredential.user;
    } catch (error: any) {
      console.error('❌ Email sign up failed:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Google Authentication with Redirect (Web Compatible)
  static async signInWithGoogle(): Promise<User> {
    try {
      console.log('🔍 Starting Google sign in...');
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        
        // Use redirect instead of popup to avoid popup-blocked errors
        await signInWithRedirect(auth, provider);
        
        // The user will be redirected, so return a promise that will resolve after redirect
        return new Promise((resolve, reject) => {
          const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
              unsubscribe();
              await this.updateUserProfile(user, 'google');
              console.log('✅ Google redirect sign in successful');
              resolve(user);
            }
          });
          
          // Timeout after 30 seconds
          setTimeout(() => {
            unsubscribe();
            reject(new Error('Google sign in timeout'));
          }, 30000);
        });
      } else {
        // React Native Google Sign In would require additional setup
        throw new Error('Google Sign In requires additional native configuration');
      }
    } catch (error: any) {
      console.error('❌ Google sign in failed:', error);
      throw new Error('Google sign in failed: ' + error.message);
    }
  }

  // Handle Google redirect result on app startup
  static async handleGoogleRedirectResult(): Promise<User | null> {
    try {
      const result = await getRedirectResult(auth);
      if (result) {
        await this.updateUserProfile(result.user, 'google');
        console.log('✅ Google redirect result processed');
        return result.user;
      }
      return null;
    } catch (error: any) {
      console.error('❌ Google redirect result error:', error);
      throw new Error('Google redirect failed: ' + error.message);
    }
  }

  // Apple Authentication (placeholder - requires iOS setup)
  static async signInWithApple(): Promise<User> {
    try {
      console.log('🍎 Apple Sign In not implemented yet');
      throw new Error('Apple Sign In not implemented yet');
    } catch (error: any) {
      throw new Error('Apple sign in failed: ' + error.message);
    }
  }

  // Amazon Authentication (placeholder - requires Amazon setup)
  static async signInWithAmazon(): Promise<User> {
    try {
      console.log('📦 Amazon Sign In not implemented yet');
      throw new Error('Amazon Sign In not implemented yet');
    } catch (error: any) {
      throw new Error('Amazon sign in failed: ' + error.message);
    }
  }

  // Sign Out
  static async signOut(): Promise<void> {
    try {
      console.log('👋 Signing out...');
      await signOut(auth);
      console.log('✅ Sign out successful');
    } catch (error: any) {
      console.error('❌ Sign out failed:', error);
      throw new Error('Sign out failed: ' + error.message);
    }
  }

  // Get Current User
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Auth State Listener
  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, (user) => {
      console.log('🔄 Auth state changed:', user ? `User: ${user.email}` : 'No user');
      callback(user);
    });
  }

  // Create User Profile in Firestore
  private static async createUserProfile(user: User, provider: UserProfile['provider']): Promise<void> {
    try {
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
      console.log('✅ User profile created in Firestore');
    } catch (error) {
      console.error('❌ Failed to create user profile:', error);
      // Don't throw error here as auth was successful
    }
  }

  // Update User Profile
  private static async updateUserProfile(user: User, provider: UserProfile['provider']): Promise<void> {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        // Update last login
        await setDoc(doc(db, 'users', user.uid), {
          lastLoginAt: new Date()
        }, { merge: true });
        console.log('✅ User profile updated in Firestore');
      } else {
        // Create new profile
        await this.createUserProfile(user, provider);
      }
    } catch (error) {
      console.error('❌ Failed to update user profile:', error);
      // Don't throw error here as auth was successful
    }
  }

  // Error Message Helper
  private static getAuthErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No user found with this email address';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/email-already-in-use':
        return 'This email address is already in use';
      case 'auth/weak-password':
        return 'Password is too weak. Must be at least 6 characters';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/network-request-failed':
        return 'Network connection error';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/user-disabled':
        return 'This account has been disabled';
      case 'auth/invalid-credential':
        return 'Invalid email or password';
      default:
        console.log('Unknown auth error code:', errorCode);
        return 'Authentication error occurred';
    }
  }
}