import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

/**
 * React hook to get the current Firebase userId (uid) or null if not logged in.
 */
export function useCurrentUserId(): { userId: string | null, loading: boolean } {
  const [userId, setUserId] = useState<string | null>(() => {
    // Check localStorage for session
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
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        setUserId(user.uid);
        // Save to localStorage with 24h expiry
        localStorage.setItem('userIdSession', JSON.stringify({ userId: user.uid, expires: Date.now() + 24 * 60 * 60 * 1000 }));
      } else {
        setUserId(null);
        localStorage.removeItem('userIdSession');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { userId, loading };
}
