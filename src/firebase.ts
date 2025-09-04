import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCU5jQjKRHRni2rqrTjhQY7ZNW91OkcH_s",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "zygreeen.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "zygreeen",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "zygreeen.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "501260037462",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:501260037462:web:2cc0d81dd61664c7a23af7",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DCRFKL21Y4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);
let analytics: any;

// Initialize analytics only in production and if supported
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// Use emulators in development - disabled for now
// To enable emulators, uncomment this block and make sure to run `firebase emulators:start`
/*
if (import.meta.env.DEV) {
  try {
    connectAuthEmulator(auth, "http://localhost:9099");
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('Connected to Firebase Emulators!');
  } catch (error) {
    console.warn('Error connecting to Firebase emulators. Using production environment.');
  }
}
*/

// Export the services
export { 
  app as default,
  auth,
  db,
  storage,
  functions,
  analytics 
};
