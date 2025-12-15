// src/firebase/firebaseConfig.ts
// Firebase config and initialization
// Build version: 2025-12-15-fix-persistence
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Replace with your own Firebase project config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

console.log('🔥 Firebase initialized - NO PERSISTENCE (build: 2025-12-15)');

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// NOTE: Offline persistence DISABLED to prevent INTERNAL_ASSERTION_FAILED errors
// Firebase Firestore will still cache queries in memory
// If you need offline persistence, enable it carefully in a useEffect after app mount

// Environment prefix for collections (empty for production, 'dev_' for development)
export const ENV_PREFIX = import.meta.env.VITE_ENV_PREFIX || '';

// Helper function to get collection name with environment prefix
export const getCollectionName = (collectionName: string): string => {
  return `${ENV_PREFIX}${collectionName}`;
};

export default app;
