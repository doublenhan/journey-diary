/**
 * Reusable Image Upload Component
 * Handles file selection, validation, and upload with progress indication
 */

import { useCallback, useState } from 'react';
import { Upload, X, Image, AlertCircle, CheckCircle } from 'lucide-react';
import { useCloudinary } from '../../hooks/useCloudinary';
import type { UploadOptions } from '../../apis/cloudinaryGalleryApi';
import './ImageUpload.css';

interface ImageUploadProps {
  onUploadComplete?: (imageUrl: string, publicId: string) => void;
  onUploadError?: (error: string) => void;
  uploadOptions?: UploadOptions;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxFileSize?: number; // in MB
  className?: string;
  disabled?: boolean;
}

interface UploadingFile {
  file: File;
  id: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  result?: {
    url: string;
    publicId: string;
  };
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onUploadComplete,
  onUploadError,
  uploadOptions = {},
  maxFiles = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  maxFileSize = 10, // 10MB default
  className = '',
  disabled = false
}) => {
  const { uploadImage, uploading } = useCloudinary();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported. Please use: ${acceptedTypes.join(', ')}`;
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }
    
    return null;
  }, [acceptedTypes, maxFileSize]);

  const handleFiles = useCallback(async (files: FileList) => {
    if (disabled) return;
    
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    
    // Validate files
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        onUploadError?.(error);
        continue;
      }
      validFiles.push(file);
    }
    
    // Check max files limit
    if (uploadingFiles.length + validFiles.length > maxFiles) {
      onUploadError?.(` Maximum ${maxFiles} files allowed`);
      return;
    }
    
    // Start uploads
    for (const file of validFiles) {
      const uploadId = `${Date.now()}-${Math.random()}`;
      const uploadingFile: UploadingFile = {
        file,
        id: uploadId,
        progress: 0,
        status: 'uploading'
      };
      
      setUploadingFiles(prev => [...prev, uploadingFile]);
      
      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadingFiles(prev => prev.map(f => 
            f.id === uploadId 
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          ));
        }, 200);
        
        const result = await uploadImage(file, uploadOptions);
        
        clearInterval(progressInterval);
        
        if (result) {
          setUploadingFiles(prev => prev.map(f => 
            f.id === uploadId 
              ? { 
                  ...f, 
                  progress: 100, 
                  status: 'success',
                  result: {
                    url: result.secure_url,
                    publicId: result.public_id || ''
                  }
                }
              : f
          ));
          
          onUploadComplete?.(result.secure_url, result.public_id || '');
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        
        setUploadingFiles(prev => prev.map(f => 
          f.id === uploadId 
            ? { ...f, status: 'error', error: errorMessage }
            : f
        ));
        
        onUploadError?.(errorMessage);
      }
    }
  }, [disabled, validateFile, uploadingFiles.length, maxFiles, onUploadError, uploadImage, uploadOptions, onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeUploadingFile = useCallback((id: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`image-upload ${className}`}>
      {/* Upload Area */}
      <div
        className={`upload-dropzone ${dragActive ? 'drag-active' : ''} ${disabled ? 'disabled' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="upload-input"
          disabled={disabled}
        />
        
        <div className="upload-content">
          <Upload className="upload-icon" />
          <div className="upload-text">
            <p className="upload-primary">
              {dragActive ? 'Drop files here' : 'Click to upload or drag and drop'}
            </p>
            <p className="upload-secondary">
              {acceptedTypes.map(type => type.split('/')[1]).join(', ').toUpperCase()} up to {maxFileSize}MB
            </p>
          </div>
        </div>
      </div>

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="uploading-files">
          <h4 className="uploading-title">
            <Image className="w-5 h-5" />
            Uploading Files
          </h4>
          
          <div className="uploading-list">
            {uploadingFiles.map((uploadingFile) => (
              <div key={uploadingFile.id} className="uploading-item">
                <div className="file-info">
                  <span className="file-name">{uploadingFile.file.name}</span>
                  <span className="file-size">{formatFileSize(uploadingFile.file.size)}</span>
                </div>
                
                <div className="upload-status">
                  {uploadingFile.status === 'uploading' && (
                    <>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${uploadingFile.progress}%` }}
                        />
                      </div>
                      <span className="progress-text">{uploadingFile.progress}%</span>
                    </>
                  )}
                  
                  {uploadingFile.status === 'success' && (
                    <div className="status-success">
                      <CheckCircle className="w-5 h-5" />
                      <span>Uploaded</span>
                    </div>
                  )}
                  
                  {uploadingFile.status === 'error' && (
                    <div className="status-error">
                      <AlertCircle className="w-5 h-5" />
                      <span>{uploadingFile.error}</span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => removeUploadingFile(uploadingFile.id)}
                  className="remove-button"
                  disabled={uploadingFile.status === 'uploading'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;