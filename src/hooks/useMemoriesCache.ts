import { useState, useEffect } from 'react';
import { CloudinaryImage } from '../apis/cloudinaryGalleryApi';


// Use CloudinaryImage from API
export type MemoryImage = CloudinaryImage;

export interface Memory {
  id: string;
  title: string;
  date: string;
  text: string;
  location?: string | null;
  images: MemoryImage[];
  created_at?: string;
  tags?: string[];
  folder?: string;
}

export interface MemoriesByYear {
  [year: string]: Memory[];
}

export function useMemoriesCache(userId: string | null, loading: boolean) {
  const [memoriesByYear, setMemoriesByYear] = useState<MemoriesByYear>({});
  const [years, setYears] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Listen for memory cache invalidation events
  useEffect(() => {
    const handleCacheInvalidated = (e: Event) => {
      const customEvent = e as CustomEvent;
      const eventUserId = customEvent.detail?.userId;
      
      // Trigger refresh if the event is for this user or no specific user
      if (!eventUserId || eventUserId === userId) {
        console.log('[DEBUG] Memory cache invalidated event received, triggering refresh');
        setRefreshTrigger(t => t + 1);
      }
    };

    window.addEventListener('memoryCacheInvalidated', handleCacheInvalidated);
    return () => window.removeEventListener('memoryCacheInvalidated', handleCacheInvalidated);
  }, [userId]);

  useEffect(() => {
    if (loading || !userId) return;
    setIsLoading(true);
    setError(null);
    const cacheKey = `memoriesCache_${userId}`;
    const cache = localStorage.getItem(cacheKey);
    let cacheValid = false;
    if (cache) {
      try {
        const { memories, timestamp } = JSON.parse(cache);
        if (memories && Array.isArray(memories) && timestamp && Date.now() - timestamp < 10 * 60 * 1000) {
          const byYear: MemoriesByYear = {};
          memories.forEach((memory: Memory) => {
            const year = new Date(memory.date).getFullYear().toString();
            if (!byYear[year]) byYear[year] = [];
            byYear[year].push(memory);
          });
          setMemoriesByYear(byYear);
          setYears(Object.keys(byYear).sort((a, b) => Number(b) - Number(a)));
          setIsLoading(false);
          cacheValid = true;
        }
      } catch (e) {
        console.debug('Cache parse error:', e);
      }
    }
    if (!cacheValid) {
      (async () => {
        try {
          const params = userId ? `?userId=${encodeURIComponent(userId)}` : '';
          const res = await fetch(`/api/cloudinary/memories${params}`);
          
          if (!res.ok) {
            console.warn(`Memories API returned ${res.status}`);
            setMemoriesByYear({});
            setYears([]);
            setIsLoading(false);
            return;
          }
          
          const data = await res.json();
          const memories = data.memories || [];
          
          localStorage.setItem(cacheKey, JSON.stringify({ memories, timestamp: Date.now() }));
          
          const byYear: MemoriesByYear = {};
          memories.forEach((memory: Memory) => {
            const year = new Date(memory.date).getFullYear().toString();
            if (!byYear[year]) byYear[year] = [];
            byYear[year].push(memory);
          });
          
          setMemoriesByYear(byYear);
          setYears(Object.keys(byYear).sort((a, b) => Number(b) - Number(a)));
          
          if (memories.length === 0) {
            console.log('No memories found for user');
          } else {
            console.log(`✅ Loaded ${memories.length} memories`);
          }
        } catch (e) {
          console.error('Memories fetch error:', e);
          setError('Failed to load memories. Please try again.');
          setMemoriesByYear({});
          setYears([]);
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [userId, loading, refreshTrigger]);

  return { memoriesByYear, years, isLoading, error };
}
