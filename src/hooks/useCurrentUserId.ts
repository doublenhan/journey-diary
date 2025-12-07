import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

/**
 * React hook to get the current Firebase userId (uid) or null if not logged in.
 * Now uses httpOnly cookies for session storage (more secure than localStorage)
 */
export function useCurrentUserId(): { userId: string | null, loading: boolean } {
  const [userId, setUserId] = useState<string | null>(() => {
    // Check localStorage for backward compatibility (will be replaced by cookie)
    const session = localStorage.getItem('userIdSession');
    if (session) {
      try {
        const { userId, expires } = JSON.parse(session);
        if (userId && expires && Date.now() < expires) {
          return userId;
        }
      } catch {}
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        setUserId(user.uid);
        
        // Set session cookie via API (httpOnly)
        try {
          const response = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', userId: user.uid }),
            credentials: 'include' // Important: send cookies
          });
          
          if (response.ok) {
            console.log('✅ Session cookie set');
            // Keep localStorage as fallback for now
            localStorage.setItem('userIdSession', JSON.stringify({ 
              userId: user.uid, 
              expires: Date.now() + 24 * 60 * 60 * 1000 
            }));
          }
        } catch (error) {
          console.error('Failed to set session cookie:', error);
          // Fallback to localStorage only
          localStorage.setItem('userIdSession', JSON.stringify({ 
            userId: user.uid, 
            expires: Date.now() + 24 * 60 * 60 * 1000 
          }));
        }
      } else {
        setUserId(null);
        
        // Clear session cookie via API
        try {
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'logout' }),
            credentials: 'include'
          });
          console.log('✅ Session cookie cleared');
        } catch (error) {
          console.error('Failed to clear session cookie:', error);
        }
        
        localStorage.removeItem('userIdSession');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { userId, loading };
}
