/**
 * Image Compression Utility
 * Compresses images before upload to reduce bandwidth and storage
 * 
 * Features:
 * - Resize to max dimensions (1920x1920 default)
 * - Quality reduction (80% default)
 * - Format conversion to JPEG/WebP
 * - Maintains aspect ratio
 * - Progress callback support
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
  onProgress?: (progress: number) => void;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number; // Percentage saved
}

/**
 * Compress a single image file
 * 
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise with compressed file and stats
 * 
 * @example
 * ```ts
 * const result = await compressImage(file, {
 *   maxWidth: 1920,
 *   quality: 0.8,
 *   format: 'jpeg'
 * });
 * console.log(`Saved ${result.compressionRatio}%`);
 * ```
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
    format = 'jpeg',
    onProgress
  } = options;

  const originalSize = file.size;
  onProgress?.(0);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    
    reader.onload = (e) => {
      onProgress?.(25);
      
      const img = new Image();
      
      img.onerror = () => reject(new Error('Failed to load image'));
      
      img.onload = () => {
        try {
          onProgress?.(50);
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw image with high quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          
          onProgress?.(75);
          
          // Convert to blob with specified format and quality
          const mimeType = format === 'png' 
            ? 'image/png' 
            : format === 'webp' 
            ? 'image/webp' 
            : 'image/jpeg';
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: mimeType,
                  lastModified: Date.now(),
                });
                
                const compressedSize = compressedFile.size;
                const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;
                
                onProgress?.(100);
                
                resolve({
                  file: compressedFile,
                  originalSize,
                  compressedSize,
                  compressionRatio
                });
              } else {
                // If compression fails, return original file
                resolve({
                  file,
                  originalSize,
                  compressedSize: originalSize,
                  compressionRatio: 0
                });
              }
            },
            mimeType,
            quality
          );
        } catch (error) {
          reject(error);
        }
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Compress multiple images in parallel
 * 
 * @param files - Array of image files to compress
 * @param options - Compression options
 * @returns Promise with array of compressed files and stats
 * 
 * @example
 * ```ts
 * const results = await compressImages(files, {
 *   maxWidth: 1920,
 *   quality: 0.8
 * });
 * results.forEach(result => {
 *   console.log(`${result.file.name}: ${result.compressionRatio}% saved`);
 * });
 * ```
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<CompressionResult[]> {
  return Promise.all(
    files.map(file => compressImage(file, options))
  );
}

/**
 * Format file size for display
 * 
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Check if file type supports compression
 * 
 * @param file - File to check
 * @returns True if file can be compressed
 */
export function canCompress(file: File): boolean {
  const compressibleTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/bmp',
    'image/tiff'
  ];
  
  return compressibleTypes.includes(file.type);
}
