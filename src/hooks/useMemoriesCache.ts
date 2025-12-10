import { useState, useEffect } from 'react';
import { CloudinaryImage } from '../apis/cloudinaryGalleryApi';
import { fetchMemories } from '../services/firebaseMemoriesService';
import type { Memory as FirebaseMemory } from '../services/firebaseMemoriesService';


// Use CloudinaryImage from API
export type MemoryImage = CloudinaryImage;

export interface Memory {
  id: string;
  title: string;
  date: string;
  text: string;
  location?: string | null;
  coordinates?: {
    lat: number;
    lng: number;
  };
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
