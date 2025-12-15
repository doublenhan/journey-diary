/**
 * Document Structure Optimizer - V3.0
 * 
 * Analyzes and optimizes Firestore document structure
 * - Flatten nested objects when possible
 * - Remove null/undefined fields
 * - Normalize data types
 * - Reduce document size
 * - Validate field constraints
 */

import type { Memory } from '../services/firebaseMemoriesService';

export interface OptimizedMemory {
  userId: string;
  title: string;
  description: string;
  mood: Memory['mood'];
  photos: string[];
  date: string;
  
  // Location - flattened for better indexing
  locationCity?: string;
  locationCountry?: string;
  locationAddress?: string;
  locationLat?: number;
  locationLng?: number;
  
  // Metadata
  tags?: string[];
  createdAt: any; // Timestamp
  updatedAt: any; // Timestamp
}

/**
 * Optimize Memory document structure before saving
 */
export function optimizeMemoryDocument(memory: Partial<Memory>): Record<string, any> {
  const optimized: Record<string, any> = {};

  // Required fields
  if (memory.userId) optimized.userId = memory.userId;
  if (memory.title) optimized.title = memory.title.trim().slice(0, 200); // Max 200 chars
  if (memory.description) optimized.description = memory.description.trim().slice(0, 5000); // Max 5000 chars
  if (memory.mood) optimized.mood = memory.mood;
  if (memory.photos) optimized.photos = memory.photos.slice(0, 10); // Max 10 photos
  if (memory.date) optimized.date = memory.date;

  // Flatten location for better indexing
  if (memory.location) {
    if (memory.location.city) {
      optimized.locationCity = memory.location.city.trim();
    }
    if (memory.location.country) {
      optimized.locationCountry = memory.location.country.trim();
    }
    if (memory.location.address) {
      optimized.locationAddress = memory.location.address.trim().slice(0, 300);
    }
    if (memory.location.coordinates) {
      optimized.locationLat = memory.location.coordinates.lat;
      optimized.locationLng = memory.location.coordinates.lng;
    }
    
    // Also keep nested structure for backwards compatibility
    optimized.location = {
      city: memory.location.city,
      country: memory.location.country,
      address: memory.location.address,
      coordinates: memory.location.coordinates,
    };
  }

  // Optional fields
  if (memory.tags && memory.tags.length > 0) {
    optimized.tags = memory.tags
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .slice(0, 20); // Max 20 tags
  }

  // Timestamps
  if (memory.createdAt) optimized.createdAt = memory.createdAt;
  if (memory.updatedAt) optimized.updatedAt = memory.updatedAt;

  return optimized;
}

/**
 * Convert optimized document back to Memory format
 */
export function parseOptimizedMemory(doc: any): Memory {
  return {
    id: doc.id,
    userId: doc.userId,
    title: doc.title,
    description: doc.description,
    mood: doc.mood,
    photos: doc.photos || [],
    date: doc.date,
    location: doc.location || (doc.locationCity ? {
      city: doc.locationCity,
      country: doc.locationCountry,
      address: doc.locationAddress,
      coordinates: doc.locationLat && doc.locationLng ? {
        lat: doc.locationLat,
        lng: doc.locationLng,
      } : undefined,
    } : undefined),
    tags: doc.tags || [],
    createdAt: doc.createdAt?.toDate?.() || new Date(doc.createdAt),
    updatedAt: doc.updatedAt?.toDate?.() || new Date(doc.updatedAt),
  };
}

/**
 * Calculate document size in bytes (approximate)
 */
export function calculateDocumentSize(doc: any): number {
  return JSON.stringify(doc).length;
}

/**
 * Analyze document and provide optimization recommendations
 */
export function analyzeDocument(doc: any): {
  size: number;
  recommendations: string[];
  savings: number;
} {
  const recommendations: string[] = [];
  let potentialSavings = 0;

  // Check for null/undefined fields
  Object.entries(doc).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      recommendations.push(`Remove null field: ${key}`);
      potentialSavings += key.length + 10;
    }
  });

  // Check for long strings
  Object.entries(doc).forEach(([key, value]) => {
    if (typeof value === 'string' && value.length > 1000) {
      recommendations.push(`Long string in ${key}: ${value.length} chars`);
    }
  });

  // Check for large arrays
  Object.entries(doc).forEach(([key, value]) => {
    if (Array.isArray(value) && value.length > 50) {
      recommendations.push(`Large array in ${key}: ${value.length} items`);
    }
  });

  // Check for nested objects (more than 2 levels)
  const checkNesting = (obj: any, level: number = 0, path: string = ''): void => {
    if (level > 2) {
      recommendations.push(`Deep nesting at ${path} (level ${level})`);
      return;
    }
    if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        checkNesting(value, level + 1, path ? `${path}.${key}` : key);
      });
    }
  };
  checkNesting(doc);

  const size = calculateDocumentSize(doc);

  return {
    size,
    recommendations,
    savings: potentialSavings,
  };
}

/**
 * Batch optimize multiple documents
 */
export function batchOptimizeDocuments(documents: any[]): {
  optimized: any[];
  totalSizeBefore: number;
  totalSizeAfter: number;
  savings: number;
} {
  let totalSizeBefore = 0;
  let totalSizeAfter = 0;

  const optimized = documents.map(doc => {
    const before = calculateDocumentSize(doc);
    const optimizedDoc = optimizeMemoryDocument(doc);
    const after = calculateDocumentSize(optimizedDoc);

    totalSizeBefore += before;
    totalSizeAfter += after;

    return optimizedDoc;
  });

  return {
    optimized,
    totalSizeBefore,
    totalSizeAfter,
    savings: totalSizeBefore - totalSizeAfter,
  };
}

/**
 * Validate document against schema
 */
export function validateMemoryDocument(doc: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields
  if (!doc.userId || typeof doc.userId !== 'string') {
    errors.push('userId is required and must be a string');
  }
  if (!doc.title || typeof doc.title !== 'string') {
    errors.push('title is required and must be a string');
  }
  if (doc.title && doc.title.length > 200) {
    errors.push('title must be <= 200 characters');
  }
  if (!doc.description || typeof doc.description !== 'string') {
    errors.push('description is required and must be a string');
  }
  if (doc.description && doc.description.length > 5000) {
    errors.push('description must be <= 5000 characters');
  }
  if (!doc.mood || !['ecstatic', 'happy', 'romantic', 'nostalgic', 'excited', 'peaceful'].includes(doc.mood)) {
    errors.push('mood is required and must be a valid value');
  }
  if (!doc.photos || !Array.isArray(doc.photos) || doc.photos.length === 0) {
    errors.push('photos is required and must be a non-empty array');
  }
  if (doc.photos && doc.photos.length > 10) {
    errors.push('photos must contain <= 10 items');
  }

  // Optional fields validation
  if (doc.tags && !Array.isArray(doc.tags)) {
    errors.push('tags must be an array');
  }
  if (doc.tags && doc.tags.length > 20) {
    errors.push('tags must contain <= 20 items');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default {
  optimizeMemoryDocument,
  parseOptimizedMemory,
  calculateDocumentSize,
  analyzeDocument,
  batchOptimizeDocuments,
  validateMemoryDocument,
};
