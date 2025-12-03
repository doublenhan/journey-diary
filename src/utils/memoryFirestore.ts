// src/utils/memoryFirestore.ts
import { db, getCollectionName } from '../firebase/firebaseConfig';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
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
  coordinates?: GeoPoint;
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
  const q = query(
    memoriesRef,
    where('userId', '==', userId),
    where('coordinates', '!=', null),
    orderBy('coordinates'),
    orderBy('date', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as MemoryFirestore);
}
