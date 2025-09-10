import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  User as FirebaseUser,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { logUserRegistered } from '../services/activityService';
import type { User } from '../types';

// Social providers
type SocialProvider = 'google' | 'github';

const socialProviders = {
  google: {
    provider: new GoogleAuthProvider(),
    scopes: ['profile', 'email']
  },
  github: {
    provider: new GithubAuthProvider(),
    scopes: ['user:email']
  }
} as const;

type AuthContextType = {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  login: (email: string, password: string) => Promise<{ user: FirebaseUser }>;
  loginWithGoogle: () => Promise<{ user: FirebaseUser }>;
  loginWithGithub: () => Promise<{ user: FirebaseUser }>;
  signup: (email: string, password: string, displayName?: string) => Promise<{ user: FirebaseUser }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<void>;
  loading: boolean;
  error: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper function to create user profile in Firestore
const createUserProfile = async (firebaseUser: FirebaseUser, displayName?: string) => {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    const userProfile: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: displayName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      photoURL: firebaseUser.photoURL || null,
      role: 'student', // Default role
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(userRef, userProfile);
    return userProfile;
  }
  
  return userDoc.data() as User;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const signup = async (email: string, password: string, displayName?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user } = userCredential;
      
      // Update Firebase auth profile
      if (displayName) {
        await updateProfile(user, { displayName });
      }
      
      // Create user profile in Firestore
      const userProfile = await createUserProfile(user, displayName);
      
      // Log the user registration activity
      if (user.uid && displayName) {
        await logUserRegistered(user.uid, displayName);
      }
      
      setCurrentUser(userProfile);
      setFirebaseUser(user);
      
      return { user };
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || 'Failed to create an account');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithSocial = async (providerName: SocialProvider) => {
    try {
      setLoading(true);
      setError(null);
      
      const { provider, scopes } = socialProviders[providerName];
      scopes.forEach(scope => provider.addScope(scope));
      
      const result = await signInWithPopup(auth, provider);
      const { user } = result;
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Create user profile if it doesn't exist
        await createUserProfile(user, user.displayName || undefined);
      }
      
      setFirebaseUser(user);
      return { user };
    } catch (error: any) {
      console.error(`${providerName} login error:`, error);
      
      // Handle specific error cases
      let errorMessage = `Failed to sign in with ${providerName}`;
      if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with the same email but different sign-in credentials.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const { user } = userCredential;
      
      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        setCurrentUser(userDoc.data() as User);
      } else {
        // Create user profile if it doesn't exist (legacy users)
        const userProfile = await createUserProfile(user);
        setCurrentUser(userProfile);
      }
      
      setFirebaseUser(user);
      return { user };
    } catch (error: any) {
      console.error('Login error:', error);
      setError('Invalid email or password');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      setCurrentUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to logout');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message || 'Failed to send password reset email');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates: { displayName?: string; photoURL?: string }) => {
    if (!firebaseUser) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Update Firebase auth profile
      await updateProfile(firebaseUser, updates);
      
      // Update Firestore user document
      const userRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(
        userRef,
        {
          ...updates,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      
      // Update local state
      setCurrentUser(prev => ({
        ...prev!,
        ...updates,
        updatedAt: new Date(),
      }));
      
      // Refresh the Firebase user
      setFirebaseUser({ ...firebaseUser });
    } catch (error: any) {
      console.error('Update profile error:', error);
      setError(error.message || 'Failed to update profile');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Initialize auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            setCurrentUser(userDoc.data() as User);
          } else {
            // Create user profile if it doesn't exist (legacy users)
            const userProfile = await createUserProfile(user);
            setCurrentUser(userProfile);
          }
          
          setFirebaseUser(user);
        } else {
          setCurrentUser(null);
          setFirebaseUser(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    firebaseUser,
    login,
    loginWithGoogle: () => loginWithSocial('google'),
    loginWithGithub: () => loginWithSocial('github'),
    signup,
    logout,
    resetPassword,
    updateUserProfile,
    loading,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
