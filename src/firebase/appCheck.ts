// Firebase App Check for Rate Limiting & Bot Protection
// Protects backend resources from abuse and unauthorized access

import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import app from './firebaseConfig';

// IMPORTANT: Add VITE_FIREBASE_APP_CHECK_KEY to .env file
// Get reCAPTCHA v3 site key from: https://console.cloud.google.com/security/recaptcha
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_FIREBASE_APP_CHECK_KEY || '';

let appCheck: any = null;

/**
 * Initialize Firebase App Check
 * Provides automatic rate limiting and bot protection
 * 
 * Setup instructions:
 * 1. Enable App Check in Firebase Console: https://console.firebase.google.com/project/_/appcheck
 * 2. Register reCAPTCHA v3 site: https://www.google.com/recaptcha/admin
 * 3. Add site key to .env: VITE_FIREBASE_APP_CHECK_KEY=your_key
 * 4. Add domain to reCAPTCHA allowed domains
 */
export function initAppCheck() {
  // Skip in development if no key provided
  if (!RECAPTCHA_SITE_KEY) {
    console.warn(
      '⚠️ Firebase App Check not initialized - missing VITE_FIREBASE_APP_CHECK_KEY\n' +
      'Add to .env file for production rate limiting and bot protection.\n' +
      'Get key from: https://www.google.com/recaptcha/admin'
    );
    return null;
  }

  try {
    // Initialize with reCAPTCHA v3 (invisible, no user interaction)
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
      
      // isTokenAutoRefreshEnabled: true means App Check will automatically
      // refresh tokens before they expire (default: true)
      isTokenAutoRefreshEnabled: true,
    });

    console.log('✅ Firebase App Check initialized - Rate limiting active');
    return appCheck;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase App Check:', error);
    return null;
  }
}

/**
 * Get current App Check token (for debugging)
 */
export async function getAppCheckToken() {
  if (!appCheck) {
    console.warn('App Check not initialized');
    return null;
  }

  try {
    const { getToken } = await import('firebase/app-check');
    const { token } = await getToken(appCheck, /* forceRefresh */ false);
    return token;
  } catch (error) {
    console.error('Failed to get App Check token:', error);
    return null;
  }
}

/**
 * Force refresh App Check token
 */
export async function refreshAppCheckToken() {
  if (!appCheck) {
    console.warn('App Check not initialized');
    return null;
  }

  try {
    const { getToken } = await import('firebase/app-check');
    const { token } = await getToken(appCheck, /* forceRefresh */ true);
    console.log('✅ App Check token refreshed');
    return token;
  } catch (error) {
    console.error('Failed to refresh App Check token:', error);
    return null;
  }
}

export default appCheck;
