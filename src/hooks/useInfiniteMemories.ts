import { useState, useEffect, useRef, useCallback } from 'react';
import { MemoriesByYear, Memory } from './useMemoriesCache';
import { fetchMemories } from '../services/firebaseMemoriesService';
import type { Memory as FirebaseMemory } from '../services/firebaseMemoriesService';

const YEARS_PER_PAGE = 2; // Load 2 years at a time

export function useInfiniteMemories(userId: string | null, loading: boolean) {
  const [memoriesByYear, setMemoriesByYear] = useState<MemoriesByYear>({});
  const [allYears, setAllYears] = useState<string[]>([]);
  const [visibleYears, setVisibleYears] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const loadedYearsRef = useRef(0);

  // Listen for memory cache invalidation events
  useEffect(() => {
    const handleCacheInvalidated = (e: Event) => {
      const customEvent = e as CustomEvent;
      const eventUserId = customEvent.detail?.userId;
      
      if (!eventUserId || eventUserId === userId) {
        console.log('[DEBUG] Memory cache invalidated, triggering refresh');
        // Clear cache to force fresh fetch
        const cacheKey = `memoriesCache_${userId}`;
        localStorage.removeItem(cacheKey);
        // Reset pagination
        loadedYearsRef.current = 0;
        setVisibleYears([]);
        setRefreshTrigger(t => t + 1);
      }
    };

    window.addEventListener('memoryCacheInvalidated', handleCacheInvalidated);
    return () => window.removeEventListener('memoryCacheInvalidated', handleCacheInvalidated);
  }, [userId]);

  // Initial load - fetch all memories and setup pagination
  useEffect(() => {
    if (loading || !userId) return;
    
    setIsLoading(true);
    setError(null);
    const cacheKey = `memoriesCache_${userId}`;
    const cache = localStorage.getItem(cacheKey);
    let cacheValid = false;

    // Try to load from cache first (only if not triggered by refresh)
    if (cache && refreshTrigger === 0) {
      try {
        const { memories, timestamp } = JSON.parse(cache);
        if (memories && Array.isArray(memories) && timestamp && Date.now() - timestamp < 5 * 60 * 1000) {
          processMemories(memories, true);
          cacheValid = true;
        }
      } catch (e) {
        console.debug('Cache parse error:', e);
      }
    }

    // If no valid cache or forced refresh, fetch from Firebase
    if (!cacheValid) {
      (async () => {
        try {
          // Fetch memories directly from Firestore
          const firebaseMemories = await fetchMemories({ userId: userId || undefined });
          
          // Transform Firebase memories to app format
          const memories: Memory[] = firebaseMemories.map((m: FirebaseMemory) => {
            // Handle both old format (cloudinaryPublicIds) and new format (photos)
            const rawData = m as any;
            let images = [];
            
            if (m.photos && Array.isArray(m.photos)) {
              images = m.photos.map(photo => {
                if (typeof photo === 'string') {
                  // Check if it's a URL or publicId
                  if (photo.startsWith('http://') || photo.startsWith('https://')) {
                    // Already a URL
                    return {
                      public_id: photo,
                      secure_url: photo,
                      url: photo,
                      width: 0,
                      height: 0,
                      format: 'jpg',
                      resource_type: 'image' as const,
                      created_at: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
                      bytes: 0,
                    };
                  } else {
                    // It's a publicId, build Cloudinary URL
                    return {
                      public_id: photo,
                      secure_url: `https://res.cloudinary.com/dhelefhv1/image/upload/${photo}`,
                      url: `https://res.cloudinary.com/dhelefhv1/image/upload/${photo}`,
                      width: 0,
                      height: 0,
                      format: 'jpg',
                      resource_type: 'image' as const,
                      created_at: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
                      bytes: 0,
                    };
                  }
                } else {
                  // Photo is object with publicId, url, etc
                  return {
                    public_id: photo.publicId || photo.public_id,
                    secure_url: photo.url || photo.secure_url,
                    url: photo.url,
                    width: photo.width || 0,
                    height: photo.height || 0,
                    format: photo.format || 'jpg',
                    resource_type: 'image' as const,
                    created_at: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
                    bytes: 0,
                  };
                }
              });
            }
            
            return {
              id: m.id,
              title: m.title,
              date: m.date instanceof Date ? m.date.toISOString().split('T')[0] : (rawData.date || ''),
              text: m.description || rawData.text || '',
              location: m.location?.city || m.location?.address || rawData.location || null,
              coordinates: m.location?.coordinates ? {
                lat: m.location.coordinates.lat,
                lng: m.location.coordinates.lng,
              } : undefined,
              images,
              created_at: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
              tags: m.tags || [],
              folder: rawData.cloudinaryFolder || `journey-diary/${m.userId}/memories`,
            };
          });
          
          // Save to cache
          localStorage.setItem(cacheKey, JSON.stringify({ memories, timestamp: Date.now() }));
          
          processMemories(memories, true);
          
          if (memories.length === 0) {
            console.log('No memories found for user');
          } else {
            console.log(`✅ Loaded ${memories.length} memories`);
          }
        } catch (e) {
          console.error('Memories fetch error:', e);
          setError('Failed to load memories. Please try again.');
          setMemoriesByYear({});
          setAllYears([]);
          setVisibleYears([]);
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [userId, loading, refreshTrigger]);

  // Process memories and set up pagination
  const processMemories = useCallback((memories: Memory[], initial: boolean) => {
    const byYear: MemoriesByYear = {};
    memories.forEach((memory: Memory) => {
      const year = new Date(memory.date).getFullYear().toString();
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(memory);
    });
    
    const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));
    
    setMemoriesByYear(byYear);
    setAllYears(years);
    
    if (initial) {
      // Load first batch
      const firstBatch = years.slice(0, YEARS_PER_PAGE);
      setVisibleYears(firstBatch);
      loadedYearsRef.current = firstBatch.length;
      setHasMore(years.length > YEARS_PER_PAGE);
      setIsLoading(false);
    }
  }, []);

  // Load more years
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    
    // Simulate network delay for smooth UX
    setTimeout(() => {
      const nextBatch = allYears.slice(
        loadedYearsRef.current,
        loadedYearsRef.current + YEARS_PER_PAGE
      );
      
      if (nextBatch.length > 0) {
        setVisibleYears(prev => [...prev, ...nextBatch]);
        loadedYearsRef.current += nextBatch.length;
        setHasMore(loadedYearsRef.current < allYears.length);
      } else {
        setHasMore(false);
      }
      
      setIsLoadingMore(false);
    }, 300);
  }, [allYears, hasMore, isLoadingMore]);

  // Get visible memories by year
  const visibleMemoriesByYear: MemoriesByYear = {};
  visibleYears.forEach(year => {
    if (memoriesByYear[year]) {
      visibleMemoriesByYear[year] = memoriesByYear[year];
    }
  });

  return {
    memoriesByYear: visibleMemoriesByYear,
    years: visibleYears,
    allYears,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore
  };
}
