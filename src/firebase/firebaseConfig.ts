// src/firebase/firebaseConfig.ts
// Firebase config and initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
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

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable offline persistence
// This allows Firebase to cache data locally and sync when online
try {
  // Try multi-tab persistence first (better for apps with multiple tabs)
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'unimplemented') {
      // Fall back to single-tab persistence
      console.warn('[Firebase] Multi-tab persistence not supported, using single-tab');
      return enableIndexedDbPersistence(db);
    } else {
      throw err;
    }
  }).then(() => {
    console.log('✅ [Firebase] Offline persistence enabled');
  }).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('[Firebase] Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('[Firebase] Persistence not available in this browser');
    } else {
      console.error('[Firebase] Persistence error:', err);
    }
  });
} catch (err) {
  console.error('[Firebase] Failed to enable persistence:', err);
}

// Environment prefix for collections (empty for production, 'dev_' for development)
export const ENV_PREFIX = import.meta.env.VITE_ENV_PREFIX || '';

// Helper function to get collection name with environment prefix
export const getCollectionName = (collectionName: string): string => {
  return `${ENV_PREFIX}${collectionName}`;
};

export default app;
