// src/utils/memoryFirestore.ts
import { db, getCollectionName } from '../firebase/firebaseConfig';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  GeoPoint,
  Timestamp 
} from 'firebase/firestore';

export interface MemoryFirestore {
  id: string;
  userId: string;
  title: string;
  text: string;
  date: string;
  location?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  cloudinaryPublicIds: string[];
  cloudinaryFolder: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  tags: string[];
}

const COLLECTION_NAME = 'memories';

// Create or update memory in Firestore
export async function saveMemoryToFirestore(memoryData: {
  id: string;
  userId: string;
  title: string;
  text: string;
  date: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  cloudinaryPublicIds: string[];
  cloudinaryFolder: string;
  tags?: string[];
}): Promise<void> {
  const collectionName = getCollectionName(COLLECTION_NAME);
  const memoryRef = doc(db, collectionName, memoryData.id);

  const firestoreData: Partial<MemoryFirestore> = {
    id: memoryData.id,
    userId: memoryData.userId,
    title: memoryData.title,
    text: memoryData.text,
    date: memoryData.date,
    location: memoryData.location,
    cloudinaryPublicIds: memoryData.cloudinaryPublicIds,
    cloudinaryFolder: memoryData.cloudinaryFolder,
    tags: memoryData.tags || ['memory', 'love-journal'],
    updatedAt: Timestamp.now(),
  };

  // Add coordinates if provided
  if (memoryData.latitude && memoryData.longitude) {
    firestoreData.coordinates = new GeoPoint(memoryData.latitude, memoryData.longitude);
  }

  // Check if document exists
  const docSnap = await getDoc(memoryRef);
  
  if (!docSnap.exists()) {
    firestoreData.createdAt = Timestamp.now();
  }

  await setDoc(memoryRef, firestoreData, { merge: true });
}

// Get single memory from Firestore
export async function getMemoryFromFirestore(memoryId: string): Promise<MemoryFirestore | null> {
  const collectionName = getCollectionName(COLLECTION_NAME);
  const memoryRef = doc(db, collectionName, memoryId);
  const docSnap = await getDoc(memoryRef);

  if (docSnap.exists()) {
    return docSnap.data() as MemoryFirestore;
  }
  return null;
}

// Get all memories for a user
export async function getUserMemoriesFromFirestore(userId: string): Promise<MemoryFirestore[]> {
  const collectionName = getCollectionName(COLLECTION_NAME);
  const memoriesRef = collection(db, collectionName);
  const q = query(
    memoriesRef,
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as MemoryFirestore);
}

// Get memories with coordinates (for MapView)
export async function getMemoriesWithCoordinates(userId: string): Promise<MemoryFirestore[]> {
  const collectionName = getCollectionName(COLLECTION_NAME);
  const memoriesRef = collection(db, collectionName);
  
  // Simple query without compound index requirement
  const q = query(
    memoriesRef,
    where('userId', '==', userId)
  );

  const querySnapshot = await getDocs(q);
  
  // Filter and sort in memory (client-side)
  return querySnapshot.docs
    .map(doc => {
      const data = doc.data();
      
      // Transform Firestore data to app format
      let coordinates: { lat: number; lng: number } | undefined;
      
      // Check if coordinates exist in location.coordinates format (new V3 format)
      if (data.location?.coordinates) {
        coordinates = {
          lat: data.location.coordinates.lat,
          lng: data.location.coordinates.lng,
        };
      }
      // Fallback: old GeoPoint format (if any exists)
      else if (data.coordinates && typeof data.coordinates.latitude === 'number') {
        coordinates = {
          lat: data.coordinates.latitude,
          lng: data.coordinates.longitude,
        };
      }
      
      return {
        id: doc.id,
        userId: data.userId,
        title: data.title,
        text: data.text || data.description || '',
        date: data.date,
        location: data.location?.city || data.location?.address || data.location || undefined,
        coordinates,
        cloudinaryPublicIds: data.photos || data.cloudinaryPublicIds || [],
        cloudinaryFolder: data.cloudinaryFolder || '',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        tags: data.tags || [],
      } as MemoryFirestore;
    })
    .filter(memory => memory.coordinates != null)
    .sort((a, b) => b.date.localeCompare(a.date));
}

// Delete memory from Firestore
export async function deleteFromFirestore(memoryId: string, userId: string): Promise<void> {
  const collectionName = getCollectionName(COLLECTION_NAME);
  const memoryRef = doc(db, collectionName, memoryId);
  
  // Verify ownership before deleting
  const docSnap = await getDoc(memoryRef);
  if (!docSnap.exists()) {
    throw new Error('Memory not found');
  }
  
  const data = docSnap.data() as MemoryFirestore;
  if (data.userId !== userId) {
    throw new Error('Unauthorized: Cannot delete another user\'s memory');
  }
  
  await deleteDoc(memoryRef);
}

// Update memory in Firestore
export async function updateMemoryInFirestore(updates: {
  id: string;
  userId: string;
  title?: string;
  text?: string;
  location?: string;
  date?: string;
  latitude?: number;
  longitude?: number;
  cloudinaryPublicIds?: string[];
  tags?: string[];
}): Promise<void> {
  const collectionName = getCollectionName(COLLECTION_NAME);
  const memoryRef = doc(db, collectionName, updates.id);
  
  // Verify ownership before updating
  const docSnap = await getDoc(memoryRef);
  if (!docSnap.exists()) {
    throw new Error('Memory not found');
  }
  
  const data = docSnap.data() as MemoryFirestore;
  if (data.userId !== updates.userId) {
    throw new Error('Unauthorized: Cannot update another user\'s memory');
  }
  
  const updateData: Partial<MemoryFirestore> = {
    updatedAt: Timestamp.now(),
  };
  
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.text !== undefined) updateData.text = updates.text;
  if (updates.location !== undefined) updateData.location = updates.location;
  if (updates.date !== undefined) updateData.date = updates.date;
  if (updates.cloudinaryPublicIds !== undefined) updateData.cloudinaryPublicIds = updates.cloudinaryPublicIds;
  if (updates.tags !== undefined) updateData.tags = updates.tags;
  
  // Update coordinates if provided
  if (updates.latitude !== undefined && updates.longitude !== undefined) {
    updateData.coordinates = new GeoPoint(updates.latitude, updates.longitude);
  }
  
  await setDoc(memoryRef, updateData, { merge: true });
}
