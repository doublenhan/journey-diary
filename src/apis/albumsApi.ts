import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Album, CreateAlbumData, UpdateAlbumData, AlbumPage } from '../types/album';

const ENV_PREFIX = import.meta.env.VITE_ENV_PREFIX || '';
const COLLECTION_NAME = `${ENV_PREFIX}albums`;

// Convert Firestore Timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};

// Create new album
export const createAlbum = async (userId: string, albumData: CreateAlbumData): Promise<Album> => {
  try {
    const newAlbum = {
      userId,
      title: albumData.title,
      description: albumData.description || '',
      coverImage: albumData.coverImage || '',
      albumDate: albumData.albumDate || new Date().toISOString().split('T')[0],
      theme: albumData.theme || 'modern',
      privacy: albumData.privacy || 'private',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      pages: [],
      memoryIds: []
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), newAlbum);
    
    return {
      id: docRef.id,
      ...newAlbum,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error creating album:', error);
    throw new Error('Failed to create album');
  }
};

// Get all albums for a user
export const getAllAlbums = async (userId: string): Promise<Album[]> => {
  try {
    console.log('[Albums Debug] Fetching albums for userId:', userId);
    console.log('[Albums Debug] Collection name:', COLLECTION_NAME);
    
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    console.log('[Albums Debug] Found albums:', querySnapshot.docs.length);
    
    const albums = querySnapshot.docs.map(doc => {
      console.log('[Albums Debug] Album data:', doc.id, doc.data());
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt),
        updatedAt: convertTimestamp(doc.data().updatedAt)
      } as Album;
    });
    
    // Sort by updatedAt in memory instead of in query
    return albums.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  } catch (error) {
    console.error('[Albums Debug] Error fetching albums:', error);
    throw new Error('Failed to fetch albums');
  }
};

// Get single album by ID
export const getAlbumById = async (albumId: string): Promise<Album> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, albumId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Album not found');
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: convertTimestamp(docSnap.data().createdAt),
      updatedAt: convertTimestamp(docSnap.data().updatedAt)
    } as Album;
  } catch (error) {
    console.error('Error fetching album:', error);
    throw new Error('Failed to fetch album');
  }
};

// Update album
export const updateAlbum = async (albumId: string, updates: UpdateAlbumData): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, albumId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating album:', error);
    throw new Error('Failed to update album');
  }
};

// Add memory to album
export const addMemoryToAlbum = async (
  albumId: string, 
  memoryId: string, 
  order?: number
): Promise<void> => {
  try {
    const album = await getAlbumById(albumId);
    
    // Check if memory already exists
    if (album.memoryIds.includes(memoryId)) {
      throw new Error('Memory already in album');
    }
    
    const newPage: AlbumPage = {
      id: `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      memoryId,
      order: order ?? album.pages.length,
      layout: 'single'
    };
    
    const updatedPages = [...album.pages, newPage];
    const updatedMemoryIds = [...album.memoryIds, memoryId];
    
    await updateAlbum(albumId, {
      pages: updatedPages,
      memoryIds: updatedMemoryIds
    });
  } catch (error) {
    console.error('Error adding memory to album:', error);
    throw error;
  }
};

// Remove memory from album
export const removeMemoryFromAlbum = async (albumId: string, memoryId: string): Promise<void> => {
  try {
    const album = await getAlbumById(albumId);
    
    const updatedPages = album.pages.filter(page => page.memoryId !== memoryId);
    const updatedMemoryIds = album.memoryIds.filter(id => id !== memoryId);
    
    await updateAlbum(albumId, {
      pages: updatedPages,
      memoryIds: updatedMemoryIds
    });
  } catch (error) {
    console.error('Error removing memory from album:', error);
    throw new Error('Failed to remove memory from album');
  }
};

// Reorder pages in album
export const reorderAlbumPages = async (albumId: string, pages: AlbumPage[]): Promise<void> => {
  try {
    await updateAlbum(albumId, { pages });
  } catch (error) {
    console.error('Error reordering album pages:', error);
    throw new Error('Failed to reorder pages');
  }
};

// Delete album
export const deleteAlbum = async (albumId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, albumId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting album:', error);
    throw new Error('Failed to delete album');
  }
};

export const albumsApi = {
  create: createAlbum,
  getAll: getAllAlbums,
  getById: getAlbumById,
  update: updateAlbum,
  addMemory: addMemoryToAlbum,
  removeMemory: removeMemoryFromAlbum,
  reorderPages: reorderAlbumPages,
  delete: deleteAlbum
};
