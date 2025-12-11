import { useState, useEffect, useRef, useCallback } from 'react';
import { MemoriesByYear, Memory, MemoryImage } from './useMemoriesCache';
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
          // Check if offline before attempting fetch
          if (!navigator.onLine) {
            setIsLoading(false);
            // Try to use expired cache if available
            if (cache) {
              try {
                const { memories } = JSON.parse(cache);
                if (memories && Array.isArray(memories)) {
                  processMemories(memories, true);
                  setError('Đang offline - hiển thị dữ liệu đã lưu');
                  return;
                }
              } catch (e) {
                console.debug('Failed to parse expired cache:', e);
              }
            }
            // No cache available
            setError('Không có kết nối internet. Vui lòng kết nối để tải dữ liệu.');
            setMemoriesByYear({});
            setAllYears([]);
            setVisibleYears([]);
            return;
          }

          // Fetch memories directly from Firestore
          const firebaseMemories = await fetchMemories({ userId: userId || '' });
          
          // Detect current environment
          const hostname = window.location.hostname;
          const isPreview = hostname.includes('git-dev') || 
                           hostname.includes('doublenhans-projects.vercel.app') ||
                           hostname.includes('localhost');
          const currentEnv = isPreview ? 'dev' : 'production';
          
          // Transform Firebase memories to app format
          const transformedMemories = firebaseMemories.map((m: FirebaseMemory) => {
            // Handle both old format (cloudinaryPublicIds) and new format (photos)
            const rawData = m as any;
            let images: MemoryImage[] = [];
            
            if (m.photos && Array.isArray(m.photos)) {
              images = m.photos.map((photo: any) => {
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
                      created_at: typeof m.createdAt === 'string' ? m.createdAt : new Date().toISOString(),
                      bytes: 0,
                      tags: [],
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
                      created_at: typeof m.createdAt === 'string' ? m.createdAt : new Date().toISOString(),
                      bytes: 0,
                      tags: [],
                    };
                  }
                } else {
                  // Photo is object with publicId, url, etc
                  return {
                    public_id: photo.publicId || photo.public_id || '',
                    secure_url: photo.url || photo.secure_url || '',
                    url: photo.url || '',
                    width: photo.width || 0,
                    height: photo.height || 0,
                    format: photo.format || 'jpg',
                    resource_type: 'image' as const,
                    created_at: typeof m.createdAt === 'string' ? m.createdAt : new Date().toISOString(),
                    bytes: 0,
                    tags: photo.tags || [],
                  };
                }
              });
            }
            
            return {
              id: m.id,
              title: m.title,
              date: typeof rawData.date === 'string' ? rawData.date : (m.date ? new Date(m.date as any).toISOString().split('T')[0] : ''),
              text: m.description || rawData.text || '',
              location: m.location?.city || m.location?.address || rawData.location || null,
              coordinates: m.location?.coordinates ? {
                lat: m.location.coordinates.lat,
                lng: m.location.coordinates.lng,
              } : undefined,
              images,
              created_at: typeof m.createdAt === 'string' ? m.createdAt : new Date().toISOString(),
              tags: m.tags || [],
              folder: rawData.cloudinaryFolder || `journey-diary/${m.userId}/memories`,
            };
          });
          
          // Filter by environment
          const memories: Memory[] = transformedMemories.filter(memory => {
            // Check if any image URL contains the current environment prefix
            const hasMatchingImages = memory.images.some(img => {
              const publicId = img.public_id || '';
              const url = img.secure_url || '';
              // Check both publicId and URL for environment prefix
              return publicId.startsWith(`${currentEnv}/`) || url.includes(`/${currentEnv}/`);
            });
            
            // If no images, include in both environments (backward compatibility)
            if (memory.images.length === 0) {
              return true;
            }
            
            return hasMatchingImages;
          });
          
          // Save to cache
          localStorage.setItem(cacheKey, JSON.stringify({ memories, timestamp: Date.now() }));
          
          processMemories(memories, true);
        } catch (e) {
          console.error('Memories fetch error:', e);
          // On error, try to use any cached data (even expired)
          if (!navigator.onLine && cache) {
            try {
              const { memories } = JSON.parse(cache);
              if (memories && Array.isArray(memories)) {
                processMemories(memories, true);
                setError('Đang offline - hiển thị dữ liệu đã lưu');
                return;
              }
            } catch (parseError) {
              console.debug('Failed to parse cache on error:', parseError);
            }
          }
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
