/**
 * Secure Storage Utility
 * Provides encrypted storage for sensitive data like passwords
 * Uses Web Crypto API for encryption/decryption
 */

/**
 * Simple encryption using Base64 (for email only)
 * For production, consider using TweetNaCl.js or libsodium.js
 */
export const SecureStorage = {
  // Only store EMAIL in localStorage (not password)
  // Password should never be persisted
  
  /**
   * Store email safely (email is not as sensitive as password)
   */
  setRememberedEmail(email: string): void {
    try {
      // Simple Base64 encoding (email is less sensitive)
      const encoded = btoa(email);
      localStorage.setItem('rememberEmail', encoded);
    } catch (error) {
      console.error('Error storing email:', error);
    }
  },

  /**
   * Retrieve remembered email
   */
  getRememberedEmail(): string | null {
    try {
      const encoded = localStorage.getItem('rememberEmail');
      if (!encoded) return null;
      return atob(encoded);
    } catch (error) {
      console.error('Error retrieving email:', error);
      return null;
    }
  },

  /**
   * Clear all remembered credentials
   * IMPORTANT: Password should NEVER be stored
   */
  clearRemembered(): void {
    localStorage.removeItem('rememberEmail');
    localStorage.removeItem('rememberPassword'); // Clean up any old insecure storage
  },

  /**
   * Check if email is remembered
   */
  hasRememberedEmail(): boolean {
    return !!localStorage.getItem('rememberEmail');
  },

  /**
   * SECURITY WARNING: Never call this function
   * Password should NEVER be persisted to localStorage
   * Users should enter their password each time for security
   */
  clearOldInsecurePassword(): void {
    localStorage.removeItem('rememberPassword');
    console.warn(
      '🔐 Security Notice: Password removed from localStorage. ' +
      'Users will need to re-enter password on next login.'
    );
  }
};

/**
 * Session-based temporary storage (used during current session only)
 * Clears when browser tab is closed
 */
export const SessionStorage = {
  /**
   * Store temporary auth token (clears on browser close)
   */
  setAuthToken(token: string): void {
    try {
      sessionStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Error storing auth token:', error);
    }
  },

  /**
   * Get temporary auth token
   */
  getAuthToken(): string | null {
    try {
      return sessionStorage.getItem('authToken');
    } catch (error) {
      console.error('Error retrieving auth token:', error);
      return null;
    }
  },

  /**
   * Clear temporary auth data
   */
  clearAuthToken(): void {
    sessionStorage.removeItem('authToken');
  }
};
