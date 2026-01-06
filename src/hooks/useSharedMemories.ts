/**
 * useSharedMemories Hook
 * 
 * React hook for managing shared memories with partner
 * Provides real-time updates and combined timeline view
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import type { SharedMemory } from '../types/couple';

// Determine collection names based on environment
const ENV_PREFIX = import.meta.env.VITE_ENV_PREFIX || '';

interface UseSharedMemoriesReturn {
  // Shared memories data
  sharedWithMe: SharedMemory[];
  sharedByMe: SharedMemory[];
  
  // Combined memories (own + shared)
  allMemories: any[];
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Helper functions
  isMemoryShared: (memoryId: string) => boolean;
  getMemoryOwner: (memoryId: string) => string | null;
}

export function useSharedMemories(
  userId?: string,
  coupleId?: string
): UseSharedMemoriesReturn {
  const [sharedWithMe, setSharedWithMe] = useState<SharedMemory[]>([]);
  const [sharedByMe, setSharedByMe] = useState<SharedMemory[]>([]);
  const [allMemories, setAllMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // LISTEN TO SHARED MEMORIES
  // ============================================================================

  // Listen to memories shared WITH current user
  useEffect(() => {
    if (!userId || !coupleId) {
      setSharedWithMe([]);
      return;
    }

    const q = query(
      collection(db, `${ENV_PREFIX}sharedMemories`),
      where('sharedWithId', '==', userId),
      orderBy('sharedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const shared = snapshot.docs.map(doc => ({
          sharedId: doc.id,
          ...doc.data()
        })) as SharedMemory[];
        
        setSharedWithMe(shared);
        
        // Fetch actual memory data
        if (shared.length > 0) {
          await fetchMemoriesData(shared);
        }
      },
      (err) => {
        console.error('Error listening to shared memories:', err);
        setError('Failed to load shared memories');
      }
    );

    return () => unsubscribe();
  }, [userId, coupleId]);

  // Listen to memories shared BY current user
  useEffect(() => {
    if (!userId || !coupleId) {
      setSharedByMe([]);
      return;
    }

    const q = query(
      collection(db, `${ENV_PREFIX}sharedMemories`),
      where('ownerId', '==', userId),
      orderBy('sharedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const shared = snapshot.docs.map(doc => ({
          sharedId: doc.id,
          ...doc.data()
        })) as SharedMemory[];
        
        setSharedByMe(shared);
      },
      (err) => {
        console.error('Error listening to shared by me:', err);
      }
    );

    return () => unsubscribe();
  }, [userId, coupleId]);

  // ============================================================================
  // FETCH MEMORY DATA
  // ============================================================================

  const fetchMemoriesData = useCallback(async (sharedMemories: SharedMemory[]) => {
    if (sharedMemories.length === 0) {
      setAllMemories([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Extract memory data directly from sharedMemories documents
      const memories = sharedMemories
        .filter(sm => !!sm.memoryData)
        .map(sm => ({
          ...(sm.memoryData as any),
          sharedInfo: {
            sharedId: sm.sharedId,
            canView: sm.canView,
            sharedAt: sm.sharedAt,
            sharedBy: sm.sharedBy,
            ownerId: sm.ownerId
          }
        }));
      

      // Sort by creation date
      memories.sort((a, b) => {
        const aTime = a.created_at?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
        const bTime = b.created_at?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      
      setAllMemories(memories);
      setError(null);
    } catch (err) {
      console.error('Error processing shared memories:', err);
      setError('Failed to load shared memory details');
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch when sharedWithMe changes
  useEffect(() => {
    fetchMemoriesData(sharedWithMe);
  }, [sharedWithMe, fetchMemoriesData]);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const isMemoryShared = useCallback((memoryId: string): boolean => {
    return sharedByMe.some(sm => sm.memoryId === memoryId) ||
           sharedWithMe.some(sm => sm.memoryId === memoryId);
  }, [sharedByMe, sharedWithMe]);

  const getMemoryOwner = useCallback((memoryId: string): string | null => {
    const sharedWith = sharedWithMe.find(sm => sm.memoryId === memoryId);
    if (sharedWith) return sharedWith.ownerId;
    
    const sharedBy = sharedByMe.find(sm => sm.memoryId === memoryId);
    if (sharedBy) return sharedBy.ownerId;
    
    return null;
  }, [sharedWithMe, sharedByMe]);

  // ============================================================================
  // MEMOIZED VALUES
  // ============================================================================

  const stats = useMemo(() => ({
    totalShared: sharedByMe.length + sharedWithMe.length,
    sharedByMeCount: sharedByMe.length,
    sharedWithMeCount: sharedWithMe.length
  }), [sharedByMe, sharedWithMe]);

  return {
    // Data
    sharedWithMe,
    sharedByMe,
    allMemories,
    
    // States
    loading,
    error,
    
    // Helpers
    isMemoryShared,
    getMemoryOwner,
    
    // Stats (for UI display)
    ...stats
  };
}
