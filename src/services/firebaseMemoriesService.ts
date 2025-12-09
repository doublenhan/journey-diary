/**
 * Firebase Memories Service - V3.0
 * Thay thế API routes bằng Firebase Direct SDK
 * Sử dụng Firestore để lưu trữ và truy vấn memories trực tiếp
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  Timestamp,
  QueryConstraint,
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Determine collection name based on environment
const COLLECTION_NAME = import.meta.env.VITE_FIREBASE_ENV === 'production' 
  ? 'memories' 
  : 'dev_memories';

export interface Memory {
  id: string;
  userId: string;
  title: string;
  description: string;
  mood: 'ecstatic' | 'happy' | 'romantic' | 'nostalgic' | 'excited' | 'peaceful';
  photos: string[]; // Cloudinary URLs
  location?: {
    city?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMemoryInput {
  userId: string;
  title: string;
  description: string;
  mood: Memory['mood'];
  photos: string[];
  location?: Memory['location'];
  tags?: string[];
}

export interface UpdateMemoryInput {
  title?: string;
  description?: string;
  mood?: Memory['mood'];
  photos?: string[];
  location?: Memory['location'];
  tags?: string[];
}

export interface FetchMemoriesOptions {
  userId: string;
  limit?: number;
  orderByField?: 'createdAt' | 'updatedAt';
  orderDirection?: 'asc' | 'desc';
  startAfterDoc?: QueryDocumentSnapshot;
  filterByMood?: Memory['mood'];
  filterByCity?: string;
}

/**
 * Convert Firestore document to Memory object
 */
const docToMemory = (doc: QueryDocumentSnapshot): Memory => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    title: data.title,
    description: data.description,
    mood: data.mood,
    photos: data.photos || [],
    location: data.location,
    tags: data.tags || [],
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
};

/**
 * Tạo memory mới trong Firestore
 */
export const createMemory = async (input: CreateMemoryInput): Promise<Memory> => {
  try {
    const now = Timestamp.now();
    const memoryData = {
      ...input,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), memoryData);
    
    console.log('✅ Memory created successfully:', docRef.id);
    
    // Fetch the created document to return full Memory object
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('Memory created but not found');
    }
    
    return docToMemory(docSnap as QueryDocumentSnapshot);
  } catch (error) {
    console.error('❌ Error creating memory:', error);
    throw error;
  }
};

/**
 * Lấy một memory theo ID
 */
export const getMemoryById = async (memoryId: string): Promise<Memory | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, memoryId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.warn('Memory not found:', memoryId);
      return null;
    }
    
    return docToMemory(docSnap as QueryDocumentSnapshot);
  } catch (error) {
    console.error('❌ Error getting memory:', error);
    throw error;
  }
};

/**
 * Lấy danh sách memories với filters và pagination
 */
export const fetchMemories = async (options: FetchMemoriesOptions): Promise<Memory[]> => {
  try {
    const {
      userId,
      limit: limitCount = 20,
      orderByField = 'createdAt',
      orderDirection = 'desc',
      startAfterDoc,
      filterByMood,
      filterByCity,
    } = options;

    // Build query constraints
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
    ];

    // Add mood filter if specified
    if (filterByMood) {
      constraints.push(where('mood', '==', filterByMood));
    }

    // Add city filter if specified
    if (filterByCity) {
      constraints.push(where('location.city', '==', filterByCity));
    }

    // Add ordering
    constraints.push(orderBy(orderByField, orderDirection));

    // Add pagination
    if (startAfterDoc) {
      constraints.push(startAfter(startAfterDoc));
    }

    constraints.push(limit(limitCount));

    // Execute query
    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const querySnapshot = await getDocs(q);

    const memories = querySnapshot.docs.map(docToMemory);
    
    console.log(`✅ Fetched ${memories.length} memories for user ${userId}`);
    
    return memories;
  } catch (error) {
    console.error('❌ Error fetching memories:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates của memories
 * Trả về unsubscribe function
 */
export const subscribeToMemories = (
  options: FetchMemoriesOptions,
  onUpdate: (memories: Memory[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  try {
    const {
      userId,
      limit: limitCount = 20,
      orderByField = 'createdAt',
      orderDirection = 'desc',
      filterByMood,
      filterByCity,
    } = options;

    // Build query constraints
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
    ];

    if (filterByMood) {
      constraints.push(where('mood', '==', filterByMood));
    }

    if (filterByCity) {
      constraints.push(where('location.city', '==', filterByCity));
    }

    constraints.push(orderBy(orderByField, orderDirection));
    constraints.push(limit(limitCount));

    const q = query(collection(db, COLLECTION_NAME), ...constraints);

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const memories = querySnapshot.docs.map(docToMemory);
        console.log(`🔄 Real-time update: ${memories.length} memories`);
        onUpdate(memories);
      },
      (error) => {
        console.error('❌ Error in real-time subscription:', error);
        if (onError) onError(error as Error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('❌ Error setting up real-time subscription:', error);
    throw error;
  }
};

/**
 * Cập nhật memory
 */
export const updateMemory = async (
  memoryId: string,
  updates: UpdateMemoryInput
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, memoryId);
    
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    
    console.log('✅ Memory updated successfully:', memoryId);
  } catch (error) {
    console.error('❌ Error updating memory:', error);
    throw error;
  }
};

/**
 * Xóa memory
 */
export const deleteMemory = async (memoryId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, memoryId);
    await deleteDoc(docRef);
    
    console.log('✅ Memory deleted successfully:', memoryId);
  } catch (error) {
    console.error('❌ Error deleting memory:', error);
    throw error;
  }
};

/**
 * Đếm số lượng memories của user
 */
export const countUserMemories = async (userId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('❌ Error counting memories:', error);
    throw error;
  }
};

export default {
  createMemory,
  getMemoryById,
  fetchMemories,
  subscribeToMemories,
  updateMemory,
  deleteMemory,
  countUserMemories,
};
