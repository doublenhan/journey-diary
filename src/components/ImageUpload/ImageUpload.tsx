/**
 * Reusable Image Upload Component
 * Handles file selection, validation, and upload with progress indication
 */

import { useCallback, useState } from 'react';
import { Upload, X, Image, AlertCircle, CheckCircle } from 'lucide-react';
import { useCloudinary } from '../../hooks/useCloudinary';
import type { UploadOptions } from '../../apis/cloudinaryGalleryApi';

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
    <div className={`w-full ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer relative ${
          dragActive ? 'border-pink-500 bg-pink-50 scale-105' : 'border-gray-300 bg-gray-50'
        } ${
          disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:border-pink-300 hover:bg-pink-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center gap-4 pointer-events-none">
          <Upload className={`w-12 h-12 transition-colors duration-200 ${
            disabled ? 'text-gray-400' : dragActive ? 'text-pink-500' : 'text-gray-400 group-hover:text-pink-500'
          }`} />
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-gray-700 m-0">
              {dragActive ? 'Drop files here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-sm text-gray-500 m-0">
              {acceptedTypes.map(type => type.split('/')[1]).join(', ').toUpperCase()} up to {maxFileSize}MB
            </p>
          </div>
        </div>
      </div>

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="mt-6 p-6 bg-white rounded-xl border border-gray-200">
          <h4 className="flex items-center gap-2 text-base font-semibold text-gray-700 m-0 mb-4">
            <Image className="w-5 h-5" />
            Uploading Files
          </h4>
          
          <div className="flex flex-col gap-4">
            {uploadingFiles.map((uploadingFile) => (
              <div key={uploadingFile.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 sm:flex-col sm:items-start sm:gap-3">
                <div className="flex-1 flex flex-col gap-1">
                  <span className="font-medium text-gray-700 text-sm">{uploadingFile.file.name}</span>
                  <span className="text-xs text-gray-500">{formatFileSize(uploadingFile.file.size)}</span>
                </div>
                
                <div className="flex items-center gap-2 min-w-[120px] sm:self-stretch sm:justify-between">
                  {uploadingFile.status === 'uploading' && (
                    <>
                      <div className="w-20 h-1 bg-gray-200 rounded-sm overflow-hidden sm:flex-1 sm:w-auto">
                        <div 
                          className="h-full bg-gradient-to-r from-pink-500 to-red-500 rounded-sm transition-all duration-300"
                          style={{ width: `${uploadingFile.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 font-medium min-w-[30px]">{uploadingFile.progress}%</span>
                    </>
                  )}
                  
                  {uploadingFile.status === 'success' && (
                    <div className="flex items-center gap-1 text-green-500 text-sm font-medium">
                      <CheckCircle className="w-5 h-5" />
                      <span>Uploaded</span>
                    </div>
                  )}
                  
                  {uploadingFile.status === 'error' && (
                    <div className="flex items-center gap-1 text-red-500 text-sm font-medium">
                      <AlertCircle className="w-5 h-5" />
                      <span>{uploadingFile.error}</span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => removeUploadingFile(uploadingFile.id)}
                  className="p-1 rounded border-none bg-gray-100 text-gray-500 cursor-pointer transition-all duration-200 flex items-center justify-center hover:bg-red-100 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
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