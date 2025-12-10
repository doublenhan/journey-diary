# 📤 Cloudinary Upload Widget Integration Plan

**Date**: December 10, 2025  
**Purpose**: Replace API-based uploads with direct Cloudinary Upload Widget  
**Status**: Complete Design

---

## 🎯 Overview

Replace server-side image uploads through `/api/cloudinary/upload` with direct client-side uploads using Cloudinary's Upload Widget and unsigned upload preset.

### Benefits
- ✅ No server round-trip (faster uploads)
- ✅ Built-in progress tracking
- ✅ Multiple upload sources (local, camera, Google Drive, Dropbox)
- ✅ Client-side image transformations
- ✅ Automatic format optimization (WebP, AVIF)
- ✅ Reduced Vercel costs (no serverless functions)

---

## 🔧 Implementation Strategy

### Option 1: Cloudinary Upload Widget (Recommended)
Full-featured UI widget with multiple sources and transformations.

### Option 2: Direct API Upload (Current Enhanced)
Simple programmatic upload without UI, already implemented in `cloudinaryDirectService.ts`.

**Decision: Use Option 2 (Enhanced)** - Already working, just needs optimization.

---

## 📝 Current Implementation Analysis

### Existing Service: `src/services/cloudinaryDirectService.ts`

```typescript
// Current implementation (working)
export async function uploadToCloudinary(
  file: File,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', options.folder || 'memories');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await response.json();
  
  return {
    url: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
    format: data.format,
  };
}
```

**Status:** ✅ Already working, no API needed!

---

## 🎨 Enhancement Plan

### 1. Add Progress Tracking

```typescript
export async function uploadToCloudinary(
  file: File,
  options: CloudinaryUploadOptions = {},
  onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResult> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', options.folder || `memories/${options.userId || 'default'}`);
  
  // Add transformations
  if (options.transformation) {
    formData.append('transformation', JSON.stringify(options.transformation));
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Progress tracking
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percentComplete = (e.loaded / e.total) * 100;
        onProgress(percentComplete);
      }
    });
    
    // Success
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        resolve({
          url: data.secure_url,
          publicId: data.public_id,
          width: data.width,
          height: data.height,
          format: data.format,
        });
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    });
    
    // Error
    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed: Network error'));
    });
    
    // Abort
    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });
    
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
    xhr.send(formData);
  });
}
```

### 2. Add Image Optimization

```typescript
export interface CloudinaryTransformation {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'limit' | 'scale';
  quality?: 'auto' | 'auto:low' | 'auto:good' | 'auto:best';
  fetch_format?: 'auto' | 'webp' | 'avif';
  gravity?: 'auto' | 'face' | 'center';
}

export interface CloudinaryUploadOptions {
  folder?: string;
  userId?: string;
  transformation?: CloudinaryTransformation[];
  tags?: string[];
  context?: Record<string, string>;
}

// Default optimization preset
const DEFAULT_TRANSFORMATION: CloudinaryTransformation[] = [
  {
    quality: 'auto:good',
    fetch_format: 'auto',  // Auto WebP/AVIF
  },
  {
    width: 1920,
    height: 1080,
    crop: 'limit',  // Never upscale
  }
];
```

### 3. Add Batch Upload Support

```typescript
export async function uploadMultipleImages(
  files: File[],
  options: CloudinaryUploadOptions = {},
  onProgress?: (fileIndex: number, progress: number, fileName: string) => void
): Promise<CloudinaryUploadResult[]> {
  const results: CloudinaryUploadResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      const result = await uploadToCloudinary(
        file,
        {
          ...options,
          transformation: options.transformation || DEFAULT_TRANSFORMATION,
        },
        (progress) => {
          if (onProgress) {
            onProgress(i, progress, file.name);
          }
        }
      );
      
      results.push(result);
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
      throw error;
    }
  }
  
  return results;
}
```

### 4. Add Client-Side Validation

```typescript
export interface ImageValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateImageFile(file: File): ImageValidationResult {
  const errors: string[] = [];
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    errors.push(`Invalid file type: ${file.type}. Allowed: JPG, PNG, GIF, WebP`);
  }
  
  // Check file size (10MB max)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    errors.push(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max: 10MB`);
  }
  
  // Check file name
  if (file.name.length > 255) {
    errors.push('File name too long (max 255 characters)');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateImageFiles(files: File[]): ImageValidationResult {
  const errors: string[] = [];
  
  // Check array length
  if (files.length === 0) {
    errors.push('No files selected');
  }
  
  if (files.length > 10) {
    errors.push(`Too many files: ${files.length}. Max: 10`);
  }
  
  // Validate each file
  files.forEach((file, index) => {
    const result = validateImageFile(file);
    if (!result.valid) {
      errors.push(`File ${index + 1} (${file.name}): ${result.errors.join(', ')}`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
```

---

## 🔐 Cloudinary Upload Preset Configuration

### Dashboard Setup

1. Go to Cloudinary Dashboard → Settings → Upload
2. Click "Add upload preset"
3. Configure:

```json
{
  "name": "diary_unsigned_upload",
  "unsigned": true,
  "folder": "memories",
  "allowed_formats": ["jpg", "jpeg", "png", "gif", "webp", "avif"],
  "max_file_size": 10485760,
  "max_image_width": 4096,
  "max_image_height": 4096,
  "use_filename": true,
  "unique_filename": true,
  "overwrite": false,
  "tags": ["user_upload", "memory"],
  "transformation": [
    {
      "quality": "auto:good",
      "fetch_format": "auto"
    },
    {
      "width": 1920,
      "height": 1080,
      "crop": "limit"
    }
  ],
  "eager": [
    {
      "width": 400,
      "height": 300,
      "crop": "fill",
      "gravity": "auto",
      "quality": "auto:low",
      "fetch_format": "auto"
    }
  ],
  "eager_async": true
}
```

### Environment Variables

```env
# .env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=diary_unsigned_upload
```

---

## 🎨 UI Components Update

### CreateMemory.tsx

```typescript
// Current: No changes needed, already using cloudinaryDirectService.ts
import { uploadMultipleImages } from './services/cloudinaryDirectService';

const handleSave = async () => {
  // Upload images
  const uploadResults = await uploadMultipleImages(
    uploadedImages,
    {
      folder: `memories/${userId}`,
      userId,
      tags: ['memory', userId],
      context: { userId, memoryType: 'personal' },
    },
    (fileIndex, progress, fileName) => {
      // Update progress UI
      setUploadProgress(prev => ({
        ...prev,
        [fileName]: progress,
      }));
    }
  );
  
  // Save to Firestore
  await addDoc(collection(db, 'memories'), {
    userId,
    title,
    text,
    location,
    photos: uploadResults.map(r => ({
      url: r.url,
      publicId: r.publicId,
      width: r.width,
      height: r.height,
      format: r.format,
    })),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};
```

### EditMemoryModal.tsx

```typescript
// Replace API upload with direct upload
const handleImageUpload = async (file: File) => {
  // Validate
  const validation = validateImageFile(file);
  if (!validation.valid) {
    setError(validation.errors[0]);
    return;
  }
  
  // Upload
  setUploading(true);
  try {
    const result = await uploadToCloudinary(
      file,
      {
        folder: `memories/${userId}`,
        userId,
      },
      (progress) => {
        setUploadProgress(progress);
      }
    );
    
    // Add to memory photos
    const updatedPhotos = [...memory.photos, {
      url: result.url,
      publicId: result.publicId,
      width: result.width,
      height: result.height,
      format: result.format,
    }];
    
    // Update Firestore
    await updateDoc(doc(db, 'memories', memory.id), {
      photos: updatedPhotos,
      updatedAt: serverTimestamp(),
    });
    
    setUploading(false);
  } catch (error) {
    setError('Upload failed: ' + error.message);
    setUploading(false);
  }
};
```

---

## 📊 Progress Tracking Component

```typescript
// components/UploadProgress.tsx
import { useEffect, useState } from 'react';

interface UploadProgressProps {
  fileName: string;
  progress: number;
  onCancel?: () => void;
}

export function UploadProgress({ fileName, progress, onCancel }: UploadProgressProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <div className="upload-progress-item">
      <div className="upload-progress-header">
        <span className="file-name">{fileName}</span>
        <span className="progress-percent">{progress.toFixed(0)}%</span>
      </div>
      
      <div className="progress-bar-container">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {progress < 100 && onCancel && (
        <button onClick={onCancel} className="cancel-button">
          Cancel
        </button>
      )}
      
      {progress === 100 && (
        <span className="upload-complete">✓ Complete</span>
      )}
    </div>
  );
}

// Batch progress tracker
interface BatchUploadProgressProps {
  files: Array<{ name: string; progress: number; status: 'pending' | 'uploading' | 'complete' | 'error' }>;
}

export function BatchUploadProgress({ files }: BatchUploadProgressProps) {
  const totalProgress = files.reduce((sum, file) => sum + file.progress, 0) / files.length;
  
  return (
    <div className="batch-upload-progress">
      <div className="batch-header">
        <h3>Uploading {files.length} images</h3>
        <span>{totalProgress.toFixed(0)}% complete</span>
      </div>
      
      <div className="overall-progress-bar">
        <div className="progress-fill" style={{ width: `${totalProgress}%` }} />
      </div>
      
      <div className="file-list">
        {files.map((file, index) => (
          <UploadProgress
            key={index}
            fileName={file.name}
            progress={file.progress}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## 🧪 Testing Plan

### Unit Tests

```typescript
// tests/cloudinaryService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { uploadToCloudinary, validateImageFile } from '../services/cloudinaryDirectService';

describe('Cloudinary Upload Service', () => {
  it('should validate image file type', () => {
    const validFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const result = validateImageFile(validFile);
    expect(result.valid).toBe(true);
  });
  
  it('should reject invalid file type', () => {
    const invalidFile = new File([''], 'test.pdf', { type: 'application/pdf' });
    const result = validateImageFile(invalidFile);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Invalid file type');
  });
  
  it('should reject file too large', () => {
    const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    const result = validateImageFile(largeFile);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('too large');
  });
  
  it('should upload image successfully', async () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const result = await uploadToCloudinary(file, { folder: 'test' });
    
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('publicId');
    expect(result.url).toContain('cloudinary.com');
  });
});
```

### Integration Tests

```typescript
// tests/integration/upload.test.ts
describe('Image Upload Flow', () => {
  it('should upload image and save to Firestore', async () => {
    // 1. Upload to Cloudinary
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const uploadResult = await uploadToCloudinary(file, { userId: 'test123' });
    
    // 2. Save to Firestore
    const docRef = await addDoc(collection(db, 'memories'), {
      userId: 'test123',
      photos: [uploadResult],
      createdAt: serverTimestamp(),
    });
    
    // 3. Verify
    expect(docRef.id).toBeTruthy();
    
    const doc = await getDoc(docRef);
    expect(doc.data().photos[0].url).toBe(uploadResult.url);
  });
});
```

---

## ✅ Migration Checklist

### Phase 1: Enhance Service (Week 5, Day 1-2)
- [x] Add progress tracking to `uploadToCloudinary()`
- [x] Add `uploadMultipleImages()` function
- [x] Add validation functions
- [x] Add default transformations
- [ ] Add error handling and retry logic
- [ ] Add cancellation support

### Phase 2: Update Components (Week 5, Day 3-4)
- [ ] Update `CreateMemory.tsx` to use enhanced service
- [ ] Update `EditMemoryModal.tsx` to use direct upload
- [ ] Update `useCloudinary.ts` hook
- [ ] Add progress UI components
- [ ] Test upload flows

### Phase 3: Cloudinary Setup (Week 5, Day 5)
- [ ] Create unsigned upload preset
- [ ] Configure transformations
- [ ] Set up eager transformations
- [ ] Test upload preset
- [ ] Document configuration

### Phase 4: Testing (Week 6, Day 1-2)
- [ ] Unit tests for validation
- [ ] Integration tests for upload flow
- [ ] E2E tests for memory creation
- [ ] Performance testing
- [ ] Error scenario testing

### Phase 5: Deploy (Week 6, Day 3)
- [ ] Deploy to staging
- [ ] Test in production-like environment
- [ ] Monitor upload success rate
- [ ] Deploy to production
- [ ] Remove old API route

---

## 📈 Success Metrics

- ✅ Upload latency: < 2s for 2MB image
- ✅ Upload success rate: > 99%
- ✅ Progress tracking accuracy: ±2%
- ✅ Validation catches 100% of invalid files
- ✅ Zero API costs (direct upload)
- ✅ User satisfaction: Faster uploads

---

**Status**: 🟢 Design Complete - Ready for Implementation

**Next Steps**:
1. Enhance `cloudinaryDirectService.ts` with progress tracking
2. Update components to use enhanced service
3. Configure Cloudinary upload preset
4. Test upload flows
5. Deploy and monitor
