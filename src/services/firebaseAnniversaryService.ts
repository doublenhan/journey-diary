/**
 * Firebase Anniversary Service - V3.0
 * Thay thế API routes bằng Firebase Direct SDK
 * Sử dụng Firestore để lưu trữ và truy vấn anniversary events
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
  onSnapshot,
  Timestamp,
  QueryConstraint,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Determine collection name based on environment
const COLLECTION_NAME = import.meta.env.VITE_FIREBASE_ENV === 'production'
  ? 'AnniversaryEvent'
  : 'dev_AnniversaryEvent';

export interface AnniversaryEvent {
  id: string;
  userId: string;
  title: string;
  date: Date;
  description?: string;
  type: 'anniversary' | 'birthday' | 'special' | 'reminder';
  recurring?: boolean;
  notifyDaysBefore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAnniversaryInput {
  userId: string;
  title: string;
  date: Date;
  description?: string;
  type: AnniversaryEvent['type'];
  recurring?: boolean;
  notifyDaysBefore?: number;
}

export interface UpdateAnniversaryInput {
  title?: string;
  date?: Date;
  description?: string;
  type?: AnniversaryEvent['type'];
  recurring?: boolean;
  notifyDaysBefore?: number;
}

export interface FetchAnniversariesOptions {
  userId: string;
  limit?: number;
  orderDirection?: 'asc' | 'desc';
  upcomingOnly?: boolean;
  filterByType?: AnniversaryEvent['type'];
}

/**
 * Convert Firestore document to AnniversaryEvent object
 */
const docToAnniversary = (doc: QueryDocumentSnapshot): AnniversaryEvent => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    title: data.title,
    date: data.date?.toDate() || new Date(),
    description: data.description,
    type: data.type,
    recurring: data.recurring || false,
    notifyDaysBefore: data.notifyDaysBefore || 7,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
};

/**
 * Tạo anniversary event mới
 */
export const createAnniversary = async (
  input: CreateAnniversaryInput
): Promise<AnniversaryEvent> => {
  try {
    const now = Timestamp.now();
    const eventData = {
      ...input,
      date: Timestamp.fromDate(input.date),
      recurring: input.recurring ?? false,
      notifyDaysBefore: input.notifyDaysBefore ?? 7,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), eventData);

    console.log('✅ Anniversary created successfully:', docRef.id);

    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('Anniversary created but not found');
    }

    return docToAnniversary(docSnap as QueryDocumentSnapshot);
  } catch (error) {
    console.error('❌ Error creating anniversary:', error);
    throw error;
  }
};

/**
 * Lấy một anniversary theo ID
 */
export const getAnniversaryById = async (
  eventId: string
): Promise<AnniversaryEvent | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, eventId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.warn('Anniversary not found:', eventId);
      return null;
    }

    return docToAnniversary(docSnap as QueryDocumentSnapshot);
  } catch (error) {
    console.error('❌ Error getting anniversary:', error);
    throw error;
  }
};

/**
 * Lấy danh sách anniversaries
 */
export const fetchAnniversaries = async (
  options: FetchAnniversariesOptions
): Promise<AnniversaryEvent[]> => {
  try {
    const {
      userId,
      limit: limitCount = 50,
      orderDirection = 'asc',
      upcomingOnly = false,
      filterByType,
    } = options;

    // Build query constraints
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
    ];

    // Filter by type if specified
    if (filterByType) {
      constraints.push(where('type', '==', filterByType));
    }

    // Filter upcoming events only
    if (upcomingOnly) {
      const now = Timestamp.now();
      constraints.push(where('date', '>=', now));
    }

    // Add ordering
    constraints.push(orderBy('date', orderDirection));
    constraints.push(limit(limitCount));

    // Execute query
    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const querySnapshot = await getDocs(q);

    const events = querySnapshot.docs.map(docToAnniversary);

    console.log(`✅ Fetched ${events.length} anniversaries for user ${userId}`);

    return events;
  } catch (error) {
    console.error('❌ Error fetching anniversaries:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates của anniversaries
 */
export const subscribeToAnniversaries = (
  options: FetchAnniversariesOptions,
  onUpdate: (events: AnniversaryEvent[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  try {
    const {
      userId,
      limit: limitCount = 50,
      orderDirection = 'asc',
      upcomingOnly = false,
      filterByType,
    } = options;

    // Build query constraints
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
    ];

    if (filterByType) {
      constraints.push(where('type', '==', filterByType));
    }

    if (upcomingOnly) {
      const now = Timestamp.now();
      constraints.push(where('date', '>=', now));
    }

    constraints.push(orderBy('date', orderDirection));
    constraints.push(limit(limitCount));

    const q = query(collection(db, COLLECTION_NAME), ...constraints);

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const events = querySnapshot.docs.map(docToAnniversary);
        console.log(`🔄 Real-time update: ${events.length} anniversaries`);
        onUpdate(events);
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
 * Cập nhật anniversary
 */
export const updateAnniversary = async (
  eventId: string,
  updates: UpdateAnniversaryInput
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, eventId);

    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    // Convert Date to Timestamp if date is being updated
    if (updates.date) {
      updateData.date = Timestamp.fromDate(updates.date);
    }

    await updateDoc(docRef, updateData);

    console.log('✅ Anniversary updated successfully:', eventId);
  } catch (error) {
    console.error('❌ Error updating anniversary:', error);
    throw error;
  }
};

/**
 * Xóa anniversary
 */
export const deleteAnniversary = async (eventId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, eventId);
    await deleteDoc(docRef);

    console.log('✅ Anniversary deleted successfully:', eventId);
  } catch (error) {
    console.error('❌ Error deleting anniversary:', error);
    throw error;
  }
};

/**
 * Lấy upcoming anniversaries (trong X ngày tới)
 */
export const getUpcomingAnniversaries = async (
  userId: string,
  daysAhead: number = 30
): Promise<AnniversaryEvent[]> => {
  try {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + daysAhead);

    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      where('date', '>=', Timestamp.fromDate(now)),
      where('date', '<=', Timestamp.fromDate(futureDate)),
      orderBy('date', 'asc'),
    ];

    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(docToAnniversary);
  } catch (error) {
    console.error('❌ Error fetching upcoming anniversaries:', error);
    throw error;
  }
};

/**
 * Đếm số lượng anniversaries của user
 */
export const countUserAnniversaries = async (userId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('❌ Error counting anniversaries:', error);
    throw error;
  }
};

export default {
  createAnniversary,
  getAnniversaryById,
  fetchAnniversaries,
  subscribeToAnniversaries,
  updateAnniversary,
  deleteAnniversary,
  getUpcomingAnniversaries,
  countUserAnniversaries,
};
