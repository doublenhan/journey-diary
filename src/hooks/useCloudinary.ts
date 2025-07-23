/**
 * Custom React hook for Cloudinary operations
 * Provides a clean interface for components to interact with Cloudinary
 */

import { useState, useCallback } from 'react';
import type { CloudinaryImage, FetchOptions, UploadOptions } from '../apis/cloudinaryGalleryApi';
// Đã chuyển sang fetch API serverless, xóa import service client

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
      const params = new URLSearchParams();
      if (options.folder) params.append('folder', options.folder);
      if (options.tags?.length) params.append('tags', options.tags.join(','));
      if (options.maxResults) params.append('max_results', options.maxResults.toString());
      if (options.nextCursor) params.append('next_cursor', options.nextCursor);
      if (options.sortBy) params.append('sort_by', options.sortBy);
      if (options.sortOrder) params.append('sort_order', options.sortOrder);
      const res = await fetch(`/api/cloudinary/images?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch images');
      const response = await res.json();
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

      const formData = new FormData();
      formData.append('file', file);
      if (options.folder) formData.append('folder', options.folder);
      if (options.tags && options.tags.length) formData.append('tags', options.tags.join(','));
      // Thêm các option khác nếu cần

      const res = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        body: formData
      });
      clearInterval(progressInterval);
      setUploadProgress(100);
      if (!res.ok) throw new Error('Failed to upload image');
      const result = await res.json();
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
      const res = await fetch('/api/cloudinary/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId })
      });
      if (!res.ok) throw new Error('Failed to delete image');
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
    // Tạo URL Cloudinary thủ công nếu cần, hoặc trả về publicId nếu đã là URL
    if (publicId.startsWith('http')) return publicId;
    // Thay YOUR_CLOUD_NAME bằng cloud_name thực tế
    let url = `https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload`;
    // Thêm transformations nếu cần
    return `${url}/${publicId}`;
  }, []);

  const generateThumbnailUrl = useCallback((publicId: string, size: 'small' | 'medium' | 'large' = 'medium') => {
    // Tạo URL thumbnail Cloudinary thủ công
    if (publicId.startsWith('http')) return publicId;
    let transformation = '';
    if (size === 'small') transformation = 'w_100,h_100,c_fill';
    if (size === 'medium') transformation = 'w_300,h_300,c_fill';
    if (size === 'large') transformation = 'w_600,h_600,c_fill';
    // Thay YOUR_CLOUD_NAME bằng cloud_name thực tế
    return `https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/${transformation}/${publicId}`;
  }, []);

  // Add fetchMemories method for fetching memories from Cloudinary
  const fetchMemories = useCallback(async (userId?: string) => {
    try {
      const params = userId ? `?userId=${encodeURIComponent(userId)}` : '';
      const res = await fetch(`/api/cloudinary/memories${params}`);
      if (!res.ok) throw new Error('Failed to fetch memories');
      const data = await res.json();
      return data.memories || [];
    } catch (e) {
      console.error('Failed to fetch memories:', e);
      return [];
    }
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
    fetchMemories,
  };
};

export default useCloudinary;