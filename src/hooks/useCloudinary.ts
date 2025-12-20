/**
 * Custom React hook for Cloudinary operations - V3.0
 * Updated to use Firebase Direct services instead of API routes
 */

import { useState, useCallback } from 'react';
import type { CloudinaryImage, FetchOptions, UploadOptions } from '../apis/cloudinaryGalleryApi';
import { 
  uploadToCloudinary, 
  deleteFromCloudinary,
  generateCloudinaryUrl,
  generateThumbnail 
} from '../services/cloudinaryDirectService';
import { fetchMemories } from '../services/firebaseMemoriesService';

interface UseCloudinaryReturn {
  // State
  images: CloudinaryImage[];
  loading: boolean;
  error: string | null;
  uploading: boolean;
  uploadProgress: number;
  
  // Actions
  fetchImages: (options?: FetchOptions) => Promise<void>;
  uploadImage: (file: File, options?: UploadOptions) => Promise<CloudinaryImage | null>;
  deleteImage: (publicId: string) => Promise<boolean>;
  generateImageUrl: (publicId: string, transformations?: any) => string;
  generateThumbnailUrl: (publicId: string, size?: 'small' | 'medium' | 'large') => string;
  clearError: () => void;
  clearImages: () => void;
  fetchMemories: (userId?: string) => Promise<any[]>;
}

export const useCloudinary = (): UseCloudinaryReturn => {
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearImages = useCallback(() => {
    setImages([]);
  }, []);

  const fetchImages = useCallback(async (options: FetchOptions = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Note: This function is deprecated in V3.0
      // Use fetchMemories from firebaseMemoriesService instead
      console.warn('fetchImages is deprecated. Use fetchMemories from firebaseMemoriesService');
      setImages([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch images';
      setError(errorMessage);
      console.error('Error fetching images:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadImage = useCallback(async (file: File, options: UploadOptions = {}): Promise<CloudinaryImage | null> => {
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      const result = await uploadToCloudinary(
        file,
        {
          folder: options.folder,
          tags: options.tags,
          format: 'auto',
          quality: 'auto',
        },
        (progress) => {
          setUploadProgress(progress);
        }
      );

      const cloudinaryImage: CloudinaryImage = {
        public_id: result.public_id,
        secure_url: result.secure_url,
        url: result.url,
        width: result.width,
        height: result.height,
        format: result.format,
        resource_type: result.resource_type,
        created_at: result.created_at,
        bytes: result.bytes,
      };

      setImages(prev => [cloudinaryImage, ...prev]);
      return cloudinaryImage;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
      setError(errorMessage);
      console.error('Error uploading image:', err);
      return null;
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, []);
  const deleteImage = useCallback(async (publicId: string): Promise<boolean> => {
    setError(null);
    try {
      const result = await deleteFromCloudinary(publicId);
      
      if (result.success) {
        setImages(prev => prev.filter(img => img.public_id !== publicId));
        return true;
      }
      
      throw new Error(result.error || 'Failed to delete image');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete image';
      setError(errorMessage);
      console.error('Error deleting image:', err);
      return false;
    }
  }, []);

  const generateImageUrl = useCallback((publicId: string, transformations: any = {}) => {
    if (publicId.startsWith('http')) return publicId;
    
    return generateCloudinaryUrl(publicId, {
      width: transformations.width,
      height: transformations.height,
      crop: transformations.crop,
      quality: transformations.quality,
      format: transformations.format,
    });
  }, []);

  const generateThumbnailUrl = useCallback((publicId: string, size: 'small' | 'medium' | 'large' = 'medium') => {
    if (publicId.startsWith('http')) return publicId;
    
    return generateThumbnail(publicId, size);
  }, []);

  const fetchMemoriesFromCloudinary = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch memories from Firestore using the Firebase Direct service
      const memories = await fetchMemories({ userId });
      
      // Extract Cloudinary images from memories
      const cloudinaryImages: CloudinaryImage[] = memories.flatMap(memory => 
        memory.photos.map(photo => ({
          public_id: photo.publicId,
          secure_url: photo.url,
          url: photo.url,
          width: photo.width || 0,
          height: photo.height || 0,
          format: photo.format || 'jpg',
          resource_type: 'image' as const,
          created_at: memory.createdAt,
          bytes: 0,
        }))
      );
      
      setImages(cloudinaryImages);
      return cloudinaryImages;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch memories';
      setError(errorMessage);
      console.error('Error fetching memories:', err);
      return [];
    } finally {
      setLoading(false);
  return {
    // State
    images,
    loading,
    error,
    uploading,
    uploadProgress,
    
    // Actions
    fetchImages,
    uploadImage,
    deleteImage,
    generateImageUrl,
    generateThumbnailUrl,
    clearError,
    clearImages,
    fetchMemories: fetchMemoriesFromCloudinary, // Renamed for clarity
  };
};


export default useCloudinary;