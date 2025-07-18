/**
 * Custom React hook for Cloudinary operations
 * Provides a clean interface for components to interact with Cloudinary
 */

import { useState, useCallback } from 'react';
import { cloudinaryApi, type CloudinaryImage, type FetchOptions, type UploadOptions } from '../api/cloudinaryGalleryApi';

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
      const response = await cloudinaryApi.fetchImages(options);
      setImages(response.resources);
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
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const result = await cloudinaryApi.uploadImage(file, options);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Add the new image to the current list
      setImages(prev => [result, ...prev]);
      
      return result;
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
      await cloudinaryApi.deleteImage(publicId);
      
      // Remove the image from the current list
      setImages(prev => prev.filter(img => img.public_id !== publicId));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete image';
      setError(errorMessage);
      console.error('Error deleting image:', err);
      return false;
    }
  }, []);

  const generateImageUrl = useCallback((publicId: string, transformations: any = {}) => {
    return cloudinaryApi.generateImageUrl(publicId, transformations);
  }, []);

  const generateThumbnailUrl = useCallback((publicId: string, size: 'small' | 'medium' | 'large' = 'medium') => {
    return cloudinaryApi.generateThumbnailUrl(publicId, size);
  }, []);

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
  };
};

export default useCloudinary;