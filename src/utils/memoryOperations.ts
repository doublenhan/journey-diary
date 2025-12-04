import { deleteFromFirestore, updateMemoryInFirestore } from './memoryFirestore';
import { invalidateCache } from './memoryCacheUtils';

export interface UpdateMemoryData {
  id: string;
  userId: string;
  title?: string;
  text?: string;
  location?: string;
  date?: string;
  latitude?: number;
  longitude?: number;
  cloudinaryPublicIds?: string[];
}

/**
 * Delete a memory from both Cloudinary and Firestore
 */
export async function deleteMemory(memoryId: string, userId: string, publicIds: string[]): Promise<void> {
  try {
    // Delete images from Cloudinary
    if (publicIds && publicIds.length > 0) {
      const response = await fetch('/api/cloudinary/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicIds })
      });

      if (!response.ok) {
        console.warn('Failed to delete from Cloudinary:', await response.text());
      }
    }

    // Delete from Firestore
    await deleteFromFirestore(memoryId, userId);

    // Invalidate cache
    invalidateCache(userId);
  } catch (error) {
    console.error('Error deleting memory:', error);
    throw error;
  }
}

/**
 * Update an existing memory
 */
export async function updateMemory(data: UpdateMemoryData): Promise<void> {
  try {
    await updateMemoryInFirestore(data);
    
    // Invalidate cache to refresh UI
    invalidateCache(data.userId);
  } catch (error) {
    console.error('Error updating memory:', error);
    throw error;
  }
}

/**
 * Reorder images in a memory
 */
export async function reorderMemoryImages(
  memoryId: string,
  userId: string,
  newImageOrder: string[]
): Promise<void> {
  try {
    await updateMemoryInFirestore({
      id: memoryId,
      userId,
      cloudinaryPublicIds: newImageOrder
    });
    
    invalidateCache(userId);
  } catch (error) {
    console.error('Error reordering images:', error);
    throw error;
  }
}
