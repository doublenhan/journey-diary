/// <reference types="vite/client" />

/**
 * Cloudinary Direct Upload Service - V3.0
 * Upload ảnh trực tiếp từ client lên Cloudinary
 * Không cần API server trung gian
 */

// Cloudinary config từ environment variables
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY;

export interface CloudinaryUploadOptions {
  folder?: string;
  tags?: string[];
  userId?: string;
  public_id?: string;
  transformation?: string;
  format?: 'auto' | 'jpg' | 'png' | 'webp' | 'avif';
  quality?: 'auto' | number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface UploadController {
  abort: () => void;
  promise: Promise<CloudinaryUploadResult>;
}

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  thumbnail_url?: string;
  optimized_url?: string;
}

export interface CloudinaryDeleteResult {
  result: 'ok' | 'not found';
}

/**
 * Extract publicId from Cloudinary URL
 * Example: https://res.cloudinary.com/dhelefhv1/image/upload/v1765358332/dev/love-journal/users/.../image.jpg
 * Returns: dev/love-journal/users/.../image (without extension)
 */
export const extractPublicIdFromUrl = (urlOrPublicId: string): string => {
  // If it's not a URL, return as-is
  if (!urlOrPublicId.startsWith('http://') && !urlOrPublicId.startsWith('https://')) {
    return urlOrPublicId;
  }

  try {
    const url = new URL(urlOrPublicId);
    const pathParts = url.pathname.split('/');
    
    // Find the index of 'upload' in the path
    const uploadIndex = pathParts.indexOf('upload');
    if (uploadIndex === -1) {
      throw new Error('Invalid Cloudinary URL format');
    }
    
    // Get everything after 'upload' and version (v1234567890)
    // Skip the version part (starts with 'v' followed by numbers)
    let startIndex = uploadIndex + 1;
    if (pathParts[startIndex]?.match(/^v\d+$/)) {
      startIndex++;
    }
    
    // Join the remaining parts
    const publicIdWithExtension = pathParts.slice(startIndex).join('/');
    
    // Remove file extension
    const lastDotIndex = publicIdWithExtension.lastIndexOf('.');
    const publicId = lastDotIndex > 0 
      ? publicIdWithExtension.substring(0, lastDotIndex)
      : publicIdWithExtension;
    
    return publicId;
  } catch (error) {
    console.error('Error extracting publicId from URL:', error);
    return urlOrPublicId; // Return original if parsing fails
  }
};

/**
 * Upload ảnh trực tiếp lên Cloudinary với retry logic
 * Sử dụng unsigned upload với upload preset
 */
export const uploadToCloudinary = async (
  file: File,
  options: CloudinaryUploadOptions = {},
  onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResult> => {
  const maxRetries = options.maxRetries ?? 3;
  const retryDelay = options.retryDelay ?? 1000;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`🔄 Retry attempt ${attempt}/${maxRetries} for ${file.name}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
      
      return await uploadToCloudinaryInternal(file, options, onProgress);
    } catch (error: any) {
      lastError = error;
      if (attempt === maxRetries) {
        console.error(`❌ Upload failed after ${maxRetries} retries:`, error);
        throw error;
      }
    }
  }
  
  throw lastError || new Error('Upload failed');
};

/**
 * Internal upload function (without retry)
 */
const uploadToCloudinaryInternal = async (
  file: File,
  options: CloudinaryUploadOptions = {},
  onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResult> => {
  try {
    // Check online status first
    if (!navigator.onLine) {
      throw new Error('No internet connection. Please check your network and try again.');
    }

    // Validate cloud name và upload preset
    if (!CLOUDINARY_CLOUD_NAME) {
      throw new Error('Cloudinary cloud name not configured');
    }
    if (!CLOUDINARY_UPLOAD_PRESET) {
      throw new Error('Cloudinary upload preset not configured');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    // Add folder nếu có
    if (options.folder) {
      formData.append('folder', options.folder);
    }

    // Add tags nếu có (bao gồm userId để dễ quản lý)
    const tags = [...(options.tags || [])];
    if (options.userId) {
      tags.push(`user_${options.userId}`);
    }
    if (tags.length > 0) {
      formData.append('tags', tags.join(','));
    }

    // Add public_id nếu có
    if (options.public_id) {
      formData.append('public_id', options.public_id);
    }

    // Note: Unsigned uploads don't support transformation parameters
    // Transformations should be configured in the upload preset
    // or applied via URL when displaying images

    // Upload URL
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

    // Create XMLHttpRequest để track progress
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const result = JSON.parse(xhr.responseText);
            
            // Generate thumbnail và optimized URLs
            const thumbnailUrl = generateCloudinaryUrl(result.public_id, {
              width: 300,
              height: 300,
              crop: 'fill',
              gravity: 'auto',
              format: 'auto',
              quality: 'auto',
            });

            const optimizedUrl = generateCloudinaryUrl(result.public_id, {
              width: 1200,
              crop: 'limit',
              format: 'auto',
              quality: 'auto',
            });

            console.log('✅ Image uploaded to Cloudinary:', result.public_id);
            
            resolve({
              ...result,
              thumbnail_url: thumbnailUrl,
              optimized_url: optimizedUrl,
            });
          } catch (error) {
            reject(new Error('Failed to parse upload response'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });

      // Send request
      xhr.open('POST', uploadUrl);
      xhr.send(formData);
    });
  } catch (error) {
    console.error('❌ Error uploading to Cloudinary:', error);
    throw error;
  }
};

/**
 * Xóa ảnh từ Cloudinary via Firebase Cloud Function
 */
export const deleteFromCloudinary = async (
  publicIdOrUrl: string
): Promise<CloudinaryDeleteResult> => {
  try {
    // Extract publicId from URL if necessary
    const publicId = extractPublicIdFromUrl(publicIdOrUrl);
    
    console.log('🗑️ Deleting image from Cloudinary');
    console.log('   Original input:', publicIdOrUrl);
    console.log('   Extracted publicId:', publicId);
    
    // Get Firebase Auth to get current user token
    const { getAuth } = await import('firebase/auth');
    const { default: app } = await import('../firebase/firebaseConfig');
    
    const auth = getAuth(app);
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.error('❌ User not authenticated');
      throw new Error('You must be logged in to delete images');
    }
    
    console.log('👤 Current user:', currentUser.uid);
    
    // Get ID token
    const idToken = await currentUser.getIdToken();
    
    // Call Firebase Function via HTTP
    const functionUrl = 'https://us-central1-love-journal-2025.cloudfunctions.net/deleteCloudinaryImage';
    
    console.log('📡 Calling Firebase Function...');
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        data: { publicId }
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      console.error('❌ Function error:', errorData);
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Image deleted successfully:', result);
    
    return { result: result.result?.result || 'ok' };
  } catch (error: any) {
    console.error('❌ Error deleting from Cloudinary:', error);
    throw error;
  }
};

/**
 * Generate Cloudinary URL với transformations
 */
export const generateCloudinaryUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'limit' | 'scale' | 'pad';
    gravity?: 'auto' | 'center' | 'face' | 'faces';
    format?: 'auto' | 'jpg' | 'png' | 'webp' | 'avif';
    quality?: 'auto' | number;
    effect?: string;
  } = {}
): string => {
  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error('Cloudinary cloud name not configured');
  }

  // Build transformation string
  const transformations: string[] = [];
  
  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  if (options.gravity) transformations.push(`g_${options.gravity}`);
  if (options.format) transformations.push(`f_${options.format}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.effect) transformations.push(`e_${options.effect}`);

  const transformationString = transformations.length > 0 
    ? transformations.join(',') + '/'
    : '';

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformationString}${publicId}`;
};

/**
 * Generate responsive image URLs (srcset)
 */
export const generateResponsiveSrcSet = (
  publicId: string,
  options: {
    widths?: number[];
    format?: 'auto' | 'jpg' | 'png' | 'webp' | 'avif';
    quality?: 'auto' | number;
  } = {}
): string => {
  const widths = options.widths || [320, 640, 768, 1024, 1280, 1536, 1920];
  
  return widths
    .map((width) => {
      const url = generateCloudinaryUrl(publicId, {
        width,
        crop: 'limit',
        format: options.format || 'auto',
        quality: options.quality || 'auto',
      });
      return `${url} ${width}w`;
    })
    .join(', ');
};

/**
 * Generate thumbnail URL
 */
export const generateThumbnail = (
  publicId: string,
  size: 'small' | 'medium' | 'large' = 'medium'
): string => {
  const sizes = {
    small: { width: 150, height: 150 },
    medium: { width: 300, height: 300 },
    large: { width: 600, height: 600 },
  };

  const { width, height } = sizes[size];

  return generateCloudinaryUrl(publicId, {
    width,
    height,
    crop: 'fill',
    gravity: 'auto',
    format: 'auto',
    quality: 'auto',
  });
};

/**
 * Upload with cancellation support
 */
export const uploadWithCancellation = (
  file: File,
  options: CloudinaryUploadOptions = {},
  onProgress?: (progress: number) => void
): UploadController => {
  let aborted = false;
  let xhrInstance: XMLHttpRequest | null = null;
  
  const promise = new Promise<CloudinaryUploadResult>((resolve, reject) => {
    if (aborted) {
      reject(new Error('Upload cancelled'));
      return;
    }
    
    // Store XHR instance for cancellation
    const originalUpload = uploadToCloudinaryInternal(file, options, onProgress);
    originalUpload.then(resolve).catch(reject);
  });
  
  return {
    abort: () => {
      aborted = true;
      if (xhrInstance) {
        xhrInstance.abort();
      }
    },
    promise,
  };
};

/**
 * Upload multiple images with individual progress tracking
 */
export const uploadMultipleImages = async (
  files: File[],
  options: CloudinaryUploadOptions = {},
  onProgress?: (fileIndex: number, progress: number, fileName: string) => void
): Promise<CloudinaryUploadResult[]> => {
  const results: CloudinaryUploadResult[] = [];
  const errors: Array<{ index: number; fileName: string; error: Error }> = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const result = await uploadToCloudinary(
        file,
        options,
        (progress) => {
          if (onProgress) {
            onProgress(i, progress, file.name);
          }
        }
      );
      results.push(result);
    } catch (error: any) {
      console.error(`❌ Failed to upload ${file.name}:`, error);
      errors.push({ index: i, fileName: file.name, error });
      // Continue with other files instead of stopping
    }
  }

  if (errors.length > 0 && results.length === 0) {
    throw new Error(`All uploads failed. First error: ${errors[0].error.message}`);
  }

  return results;
};

/**
 * Upload multiple images in parallel (faster but more resource intensive)
 */
export const uploadMultipleImagesParallel = async (
  files: File[],
  options: CloudinaryUploadOptions = {},
  onProgress?: (fileIndex: number, progress: number, fileName: string) => void,
  maxConcurrent: number = 3
): Promise<CloudinaryUploadResult[]> => {
  const results: (CloudinaryUploadResult | null)[] = new Array(files.length).fill(null);
  const errors: Array<{ index: number; fileName: string; error: Error }> = [];
  
  // Upload in batches to avoid overwhelming the browser
  for (let i = 0; i < files.length; i += maxConcurrent) {
    const batch = files.slice(i, i + maxConcurrent);
    const batchPromises = batch.map((file, batchIndex) => {
      const fileIndex = i + batchIndex;
      return uploadToCloudinary(
        file,
        options,
        (progress) => {
          if (onProgress) {
            onProgress(fileIndex, progress, file.name);
          }
        }
      ).then(result => {
        results[fileIndex] = result;
      }).catch(error => {
        console.error(`❌ Failed to upload ${file.name}:`, error);
        errors.push({ index: fileIndex, fileName: file.name, error });
      });
    });
    
    await Promise.all(batchPromises);
  }
  
  const successfulResults = results.filter((r): r is CloudinaryUploadResult => r !== null);
  
  if (errors.length > 0 && successfulResults.length === 0) {
    throw new Error(`All uploads failed. First error: ${errors[0].error.message}`);
  }
  
  return successfulResults;
};

export default {
  uploadToCloudinary,
  uploadWithCancellation,
  uploadMultipleImages,
  uploadMultipleImagesParallel,
  deleteFromCloudinary,
  extractPublicIdFromUrl,
  generateCloudinaryUrl,
  generateResponsiveSrcSet,
  generateThumbnail,
};
