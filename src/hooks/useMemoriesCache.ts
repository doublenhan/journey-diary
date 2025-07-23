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
      } catch {}
    }
    if (!cacheValid) {
      (async () => {
        try {
          const params = userId ? `?userId=${encodeURIComponent(userId)}` : '';
          const res = await fetch(`/api/cloudinary/memories${params}`);
          if (!res.ok) throw new Error('Failed to fetch memories');
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
        } catch (e) {
          setError('Failed to load memories.');
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [userId, loading]);

  return { memoriesByYear, years, isLoading, error };
}
