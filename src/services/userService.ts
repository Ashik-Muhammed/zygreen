import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { User } from '../types';

const USERS_COLLECTION = 'users';

export const createUserProfile = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { uid: string }) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userData.uid);
    const userProfile: User = {
      uid: userData.uid,
      email: userData.email,
      displayName: userData.displayName || userData.email?.split('@')[0] || 'User',
      photoURL: userData.photoURL || null,
      role: userData.role || 'student',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(userRef, userProfile);
    return userProfile;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (uid: string): Promise<User | null> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};
