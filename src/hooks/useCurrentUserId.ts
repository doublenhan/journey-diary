import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

/**
 * React hook to get the current Firebase userId (uid) or null if not logged in.
 * V3.0: Uses Firebase Auth directly with localStorage backup (no API server needed)
 */
export function useCurrentUserId(): { userId: string | null, loading: boolean } {
  const [userId, setUserId] = useState<string | null>(() => {
    // Check localStorage for initial state (before Firebase Auth loads)
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
    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        // User logged in
        setUserId(user.uid);
        
        // Store in localStorage as backup (24h expiry)
        localStorage.setItem('userIdSession', JSON.stringify({ 
          userId: user.uid, 
          expires: Date.now() + 24 * 60 * 60 * 1000 
        }));
        
        console.log('✅ User session set:', user.uid);
      } else {
        // User logged out
        setUserId(null);
        localStorage.removeItem('userIdSession');
        console.log('✅ User session cleared');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { userId, loading };
}
