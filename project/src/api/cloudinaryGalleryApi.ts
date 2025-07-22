/**
 * Cloudinary Gallery API Service
 * Handles all Cloudinary-related operations for the Love Journal app
 * 
 * SECURITY NOTE: This service only uses public credentials on the client.
 * All operations requiring API_SECRET are handled by the backend API routes.
 */

interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  // Note: API_SECRET should NEVER be used on the client side
}

interface CloudinaryImage {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  created_at: string;
  tags: string[];
  folder?: string;
  context?: Record<string, string>;
}

interface CloudinaryResponse {
  resources: CloudinaryImage[];
  next_cursor?: string;
  total_count: number;
}

interface UploadOptions {
  folder?: string;
  tags?: string[];
  publicId?: string;
  transformation?: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'crop';
    quality?: 'auto' | number;
  };
}

interface FetchOptions {
  folder?: string;
  tags?: string[];
  maxResults?: number;
  nextCursor?: string;
  sortBy?: 'created_at' | 'uploaded_at' | 'public_id';
  sortOrder?: 'asc' | 'desc';
}

interface MemoryData {
  title: string;
  location?: string;
  text: string;
  date: string;
  tags?: string[];
}

interface SavedMemory {
  id: string;
  title: string;
  location: string | null;
  text: string;
  date: string;
  images: CloudinaryImage[];
  created_at: string;
  tags: string[];
  context?: Record<string, string>;
  folder: string;
}

interface SaveMemoryResponse {
  success: boolean;
  memory: SavedMemory;
  message: string;
}

class CloudinaryGalleryApi {
  private config: CloudinaryConfig;
  private baseUrl: string;

  constructor() {
    // Only use public configuration on the client
    this.config = {
      cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo',
      apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || ''
    };
    
    // Points to our secure backend endpoint (local development server)
    // Ensure the port matches the server's PORT (3001 by default)
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/cloudinary';
  }

  /**
   * Fetch images from Cloudinary via our secure backend endpoint
   * This replaces direct Cloudinary API calls for security
   */
  async fetchImages(options: FetchOptions = {}): Promise<CloudinaryResponse> {
    try {
      const params = new URLSearchParams();
      
      if (options.folder) params.append('folder', options.folder);
      if (options.tags?.length) params.append('tags', options.tags.join(','));
      if (options.maxResults) params.append('max_results', options.maxResults.toString());
      if (options.nextCursor) params.append('next_cursor', options.nextCursor);
      if (options.sortBy) params.append('sort_by', options.sortBy);
      if (options.sortOrder) params.append('sort_order', options.sortOrder);

      const response = await fetch(`${this.baseUrl}/images?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch images: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching images from Cloudinary:', error);
      
      // Return mock data for development/demo purposes
      return this.getMockImages(options);
    }
  }

  /**
   * Upload image to Cloudinary via our secure backend endpoint
   */
  async uploadImage(file: File, options: UploadOptions = {}): Promise<CloudinaryImage> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (options.folder) formData.append('folder', options.folder);
      if (options.tags?.length) formData.append('tags', options.tags.join(','));
      if (options.publicId) formData.append('public_id', options.publicId);
      if (options.transformation) {
        formData.append('transformation', JSON.stringify(options.transformation));
      }

      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to upload image: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error);
      throw new Error('Failed to upload image. Please try again later.');
    }
  }

  /**
   * Delete image from Cloudinary via our secure backend endpoint
   */
  async deleteImage(publicId: string): Promise<{ result: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_id: publicId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete image: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
      throw new Error('Failed to delete image. Please try again later.');
    }
  }

  /**
   * Generate optimized image URL with transformations
   * This can be done client-side as it doesn't require API secrets
   */
  generateImageUrl(publicId: string, transformations: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb' | 'pad';
    quality?: 'auto' | number;
    format?: 'auto' | 'jpg' | 'png' | 'webp' | 'avif';
    gravity?: 'auto' | 'face' | 'center' | 'north' | 'south' | 'east' | 'west';
    effect?: string;
    radius?: number | 'max';
  } = {}): string {
    if (!this.config.cloudName || this.config.cloudName === 'demo') {
      // Return the original URL if no cloud name is configured
      return publicId.startsWith('http') ? publicId : `https://via.placeholder.com/400x300?text=Demo+Image`;
    }

    const baseUrl = `https://res.cloudinary.com/${this.config.cloudName}/image/upload`;
    
    const transformParts: string[] = [];
    
    if (transformations.width) transformParts.push(`w_${transformations.width}`);
    if (transformations.height) transformParts.push(`h_${transformations.height}`);
    if (transformations.crop) transformParts.push(`c_${transformations.crop}`);
    if (transformations.quality) transformParts.push(`q_${transformations.quality}`);
    if (transformations.format) transformParts.push(`f_${transformations.format}`);
    if (transformations.gravity) transformParts.push(`g_${transformations.gravity}`);
    if (transformations.effect) transformParts.push(`e_${transformations.effect}`);
    if (transformations.radius) transformParts.push(`r_${transformations.radius}`);
    
    const transformString = transformParts.length > 0 ? `${transformParts.join(',')}/` : '';
    
    return `${baseUrl}/${transformString}${publicId}`;
  }

  /**
   * Generate thumbnail URL for gallery views
   */
  generateThumbnailUrl(publicId: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
    const sizeMap = {
      small: { width: 150, height: 150 },
      medium: { width: 300, height: 300 },
      large: { width: 600, height: 600 }
    };

    return this.generateImageUrl(publicId, {
      ...sizeMap[size],
      crop: 'fill',
      quality: 'auto',
      format: 'auto',
      gravity: 'auto'
    });
  }

  /**
   * Get cloud name for client-side operations
   */
  getCloudName(): string {
    return this.config.cloudName;
  }

  /**
   * Get API key for client-side operations (when needed)
   */
  getApiKey(): string {
    return this.config.apiKey;
  }

  /**
   * Get API URL for debugging purposes
   */
  getApiUrl(): string {
    return this.baseUrl;
  }

  /**
   * Check if Cloudinary is properly configured
   */
  isConfigured(): boolean {
    return !!(this.config.cloudName && this.config.cloudName !== 'demo' && this.config.apiKey);
  }

  /**
   * Get all memories from the backend, optionally filtered by userId
   */
  async getMemories(userId?: string): Promise<{ memories: SavedMemory[] }> {
    try {
      const url = userId ? `${this.baseUrl}/memories?userId=${encodeURIComponent(userId)}` : `${this.baseUrl}/memories`;
      console.log(`Fetching memories from ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-cache',
      });
      console.log(`Response status: ${response.status} ${response.statusText}`);
      if (!response.ok) {
        let errorMessage = `Failed to fetch memories: ${response.statusText}`;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            if (errorData.error || errorData.message) {
              errorMessage = errorData.error || errorData.message;
            }
            console.error('Error details:', errorData);
          } catch (jsonError) {
            console.error('Could not parse error response:', jsonError);
          }
        } else {
          console.error('Received non-JSON error response with content-type:', contentType);
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      console.log(`Retrieved ${data.memories?.length || 0} memories`);
      return data;
    } catch (error) {
      console.error('Error fetching memories:', error);
      throw new Error('Failed to load memories. Please try again later.');
    }
  }

  /**
   * Mock data for development/demo purposes - Empty by default
   */
  private getMockImages(_options: FetchOptions): CloudinaryResponse {
    return {
      resources: [],
      next_cursor: undefined,
      total_count: 0
    };
  }

  /**
   * Save a complete memory with text data and multiple images
   */
  async saveMemory(memoryData: MemoryData, images: File[] = []): Promise<SaveMemoryResponse> {
    try {
      const formData = new FormData();
      
      // Add memory data
      formData.append('title', memoryData.title);
      if (memoryData.location) formData.append('location', memoryData.location);
      formData.append('text', memoryData.text);
      formData.append('date', memoryData.date);
      if (memoryData.tags?.length) {
        formData.append('tags', memoryData.tags.join(','));
      }
      
      // Add images
      images.forEach((image) => {
        formData.append('images', image);
      });

      console.log(`Sending memory data to ${this.baseUrl}/memory with ${images.length} images`);
      
      try {
        const response = await fetch(`${this.baseUrl}/memory`, {
          method: 'POST',
          body: formData,
          // Add credentials mode for CORS
          credentials: 'include',
          // Explicitly disable cache to prevent issues
          cache: 'no-cache',
        });

        // Log response status for debugging
        console.log(`Response status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          let errorMessage = `Failed to save memory: ${response.statusText}`;
          try {
            const errorData = await response.json();
            if (errorData.error || errorData.message) {
              errorMessage = errorData.error || errorData.message;
            }
            console.error('Error details:', errorData);
          } catch (jsonError) {
            console.error('Could not parse error response:', jsonError);
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('Response data:', data);
        return data;
      } catch (fetchError) {
        console.error('Fetch operation failed:', fetchError);
        throw fetchError;
      }
    } catch (error) {
      console.error('Error saving memory:', error);
      if (error instanceof Error) {
        throw error; // Rethrow the original error to keep its message
      }
      throw new Error('Failed to save memory. Please try again later.');
    }
  }
}

// Export singleton instance
export const cloudinaryApi = new CloudinaryGalleryApi();
export default cloudinaryApi;

// Export types for use in components
export type { CloudinaryImage, CloudinaryResponse, UploadOptions, FetchOptions, MemoryData, SavedMemory, SaveMemoryResponse };