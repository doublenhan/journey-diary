import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useLanguage } from './useLanguage';
import { useToastContext } from '../contexts/ToastContext';
import { logSecurityEvent } from '../utils/securityMonitoring';

/**
 * Real-time status guard hook
 * 
 * Monitors the current user's status in Firestore and automatically
 * logs them out if their account status changes to Suspended or Removed
 * during an active session.
 * 
 * Usage:
 * - Add to App.tsx or main layout component
 * - Will show error notification before logout
 * - Clears session and redirects to login page
 */
export const useStatusGuard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { error: showError } = useToastContext();
  const ENV_PREFIX = import.meta.env.VITE_ENV_PREFIX || '';

  useEffect(() => {
    const auth = getAuth();
    let unsubscribeSnapshot: (() => void) | null = null;

    // Monitor auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Clean up previous snapshot listener
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (user) {
        // User is signed in, start monitoring their status
        const userDocRef = doc(db, `${ENV_PREFIX}users`, user.uid);

        unsubscribeSnapshot = onSnapshot(
          userDocRef,
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              const userData = docSnapshot.data();
              const status = userData?.status;

              // If status is Suspended or Removed, logout immediately
              if (status === 'Suspended') {
                console.log('[useStatusGuard] Account suspended, logging out...');
                
                // Log security event
                logSecurityEvent({
                  type: 'SESSION_TERMINATED',
                  userId: user.uid,
                  details: { reason: 'Account suspended' }
                });

                // Sign out and show error
                signOut(auth).then(() => {
                  // Clear local storage
                  localStorage.clear();
                  sessionStorage.clear();
                  
                  // Show error notification
                  showError(t('notification.accountSuspended'));
                  
                  // Redirect to login
                  navigate('/');
                });
              } else if (status === 'Removed') {
                console.log('[useStatusGuard] Account removed, logging out...');
                
                // Log security event
                logSecurityEvent({
                  type: 'SESSION_TERMINATED',
                  userId: user.uid,
                  details: { reason: 'Account removed' }
                });

                // Sign out and show error
                signOut(auth).then(() => {
                  // Clear local storage
                  localStorage.clear();
                  sessionStorage.clear();
                  
                  // Show error notification
                  showError(t('notification.accountRemoved'));
                  
                  // Redirect to login
                  navigate('/');
                });
              }
            }
          },
          (error) => {
            console.error('[useStatusGuard] Error monitoring user status:', error);
            
            // Log security event for monitoring errors
            logSecurityEvent({
              type: 'STATUS_GUARD_ERROR',
              userId: user.uid,
              details: { error: error.message }
            });
          }
        );
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, [navigate, t, ENV_PREFIX]);
};
