// Image validation constants and utilities

export const IMAGE_VALIDATION = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  MAX_IMAGES: 10,
  ALLOWED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']
};

export interface ImageValidationError {
  file: File;
  error: string;
}

export function validateImageFile(file: File): string | null {
  // Check file type
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  const isValidFormat = IMAGE_VALIDATION.ALLOWED_FORMATS.includes(file.type) || 
                        IMAGE_VALIDATION.ALLOWED_EXTENSIONS.includes(fileExtension || '');
  
  if (!isValidFormat) {
    return `${file.name}: Định dạng không hợp lệ. Chỉ chấp nhận JPG, PNG, WebP, HEIC`;
  }

  // Check file size
  if (file.size > IMAGE_VALIDATION.MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return `${file.name}: Kích thước ${sizeMB}MB vượt quá giới hạn 10MB`;
  }

  return null;
}

export function validateImageFiles(files: File[], currentImageCount: number = 0): {
  validFiles: File[];
  errors: string[];
} {
  const validFiles: File[] = [];
  const errors: string[] = [];

  // Check total image limit
  const totalImages = currentImageCount + files.length;
  if (totalImages > IMAGE_VALIDATION.MAX_IMAGES) {
    errors.push(`Chỉ có thể upload tối đa ${IMAGE_VALIDATION.MAX_IMAGES} ảnh. Hiện tại có ${currentImageCount} ảnh, bạn đang thêm ${files.length} ảnh.`);
    return { validFiles: [], errors };
  }

  // Validate each file
  files.forEach(file => {
    const error = validateImageFile(file);
    if (error) {
      errors.push(error);
    } else {
      validFiles.push(file);
    }
  });

  return { validFiles, errors };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
