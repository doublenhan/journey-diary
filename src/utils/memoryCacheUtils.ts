import type { Memory } from '../hooks/useMemoriesCache';

export interface CacheData {
  memories: Memory[];
  timestamp: number;
}

/**
 * Get cache key for a specific user
 */
export const getCacheKey = (userId: string): string => {
  return `memoriesCache_${userId}`;
};

/**
 * Get cached memories for a user
 */
export const getCachedMemories = (userId: string): CacheData | null => {
  const cacheKey = getCacheKey(userId);
  const cache = localStorage.getItem(cacheKey);
  
  if (!cache) return null;
  
  try {
    const data = JSON.parse(cache);
    return data;
  } catch (e) {
    console.error('Failed to parse cache:', e);
    return null;
  }
};

/**
 * Save memories to cache
 */
export const setCachedMemories = (userId: string, memories: Memory[]): void => {
  const cacheKey = getCacheKey(userId);
  const data: CacheData = {
    memories,
    timestamp: Date.now()
  };
  
  try {
    localStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save cache:', e);
  }
};

/**
 * Add a new memory to the cache optimistically
 */
export const addMemoryToCache = (userId: string, newMemory: Memory): boolean => {
  const cached = getCachedMemories(userId);
  
  if (!cached) {
    // No cache exists, create new one
    setCachedMemories(userId, [newMemory]);
    return true;
  }
  
  // Prepend new memory (newest first)
  const updatedMemories = [newMemory, ...cached.memories];
  
  // Keep the same timestamp to preserve cache validity
  const cacheKey = getCacheKey(userId);
  localStorage.setItem(cacheKey, JSON.stringify({
    memories: updatedMemories,
    timestamp: cached.timestamp
  }));
  
  return true;
};

/**
 * Update a memory in the cache
 */
export const updateMemoryInCache = (userId: string, memoryId: string, updatedMemory: Partial<Memory>): boolean => {
  const cached = getCachedMemories(userId);
  
  if (!cached) return false;
  
  const updatedMemories = cached.memories.map(m => 
    m.id === memoryId ? { ...m, ...updatedMemory } : m
  );
  
  const cacheKey = getCacheKey(userId);
  localStorage.setItem(cacheKey, JSON.stringify({
    memories: updatedMemories,
    timestamp: cached.timestamp
  }));
  
  return true;
};

/**
 * Remove a memory from the cache
 */
export const removeMemoryFromCache = (userId: string, memoryId: string): boolean => {
  const cached = getCachedMemories(userId);
  
  if (!cached) return false;
  
  const filteredMemories = cached.memories.filter(m => m.id !== memoryId);
  
  setCachedMemories(userId, filteredMemories);
  
  return true;
};

/**
 * Clear all cache for a user
 */
export const clearCache = (userId: string): void => {
  const cacheKey = getCacheKey(userId);
  localStorage.removeItem(cacheKey);
};

/**
 * Invalidate cache and trigger refresh
 */
export const invalidateCache = (userId: string): void => {
  clearCache(userId);
  
  // Dispatch event to notify components
  window.dispatchEvent(new CustomEvent('memoryCacheInvalidated', { 
    detail: { userId } 
  }));
};

/**
 * Update cache and trigger UI refresh without clearing cache
 */
export const updateCacheAndNotify = (userId: string): void => {
  // Dispatch event to notify components to refresh
  window.dispatchEvent(new CustomEvent('memoryCacheInvalidated', { 
    detail: { userId } 
  }));
};
