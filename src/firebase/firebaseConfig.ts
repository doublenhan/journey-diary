// src/firebase/firebaseConfig.ts
// Firebase config and initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getPerformance } from 'firebase/performance';

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

// Initialize Performance Monitoring
// Automatically tracks page loads, network requests, and custom traces
let perf = null;
try {
  perf = getPerformance(app);
  console.log('✅ Firebase Performance Monitoring initialized');
} catch (error) {
  console.warn('⚠️ Performance Monitoring failed to initialize:', error);
}
export const performance = perf;

// Environment prefix for collections (empty for production, 'dev_' for development)
export const ENV_PREFIX = import.meta.env.VITE_ENV_PREFIX || '';

// Helper function to get collection name with environment prefix
export const getCollectionName = (collectionName: string): string => {
  return `${ENV_PREFIX}${collectionName}`;
};

export default app;
