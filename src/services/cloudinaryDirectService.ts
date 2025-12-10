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
 * Upload ảnh trực tiếp lên Cloudinary
 * Sử dụng unsigned upload với upload preset
 */
export const uploadToCloudinary = async (
  file: File,
  options: CloudinaryUploadOptions = {},
  onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResult> => {
  try {
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
  publicId: string
): Promise<CloudinaryDeleteResult> => {
  try {
    console.log('🗑️ Deleting image from Cloudinary:', publicId);
    
    // Import Firebase Functions dynamically to avoid circular dependency
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const functions = getFunctions();
    const deleteImage = httpsCallable(functions, 'deleteCloudinaryImage');
    
    const result = await deleteImage({ publicId });
    const data = result.data as any;
    
    console.log('✅ Image deleted successfully:', data);
    
    return { result: data.result || 'ok' };
  } catch (error: any) {
    console.error('❌ Error deleting from Cloudinary:', error);
    
    // Handle Firebase Functions specific errors
    if (error.code === 'functions/unauthenticated') {
      throw new Error('You must be logged in to delete images');
    } else if (error.code === 'functions/invalid-argument') {
      throw new Error('Invalid image ID');
    }
    
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
 * Upload multiple images
 */
export const uploadMultipleImages = async (
  files: File[],
  options: CloudinaryUploadOptions = {},
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<CloudinaryUploadResult[]> => {
  const results: CloudinaryUploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await uploadToCloudinary(
      file,
      options,
      (progress) => {
        if (onProgress) {
          onProgress(i, progress);
        }
      }
    );
    results.push(result);
  }

  return results;
};

export default {
  uploadToCloudinary,
  deleteFromCloudinary,
  generateCloudinaryUrl,
  generateResponsiveSrcSet,
  generateThumbnail,
  uploadMultipleImages,
};
