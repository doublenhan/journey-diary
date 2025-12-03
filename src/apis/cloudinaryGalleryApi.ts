export interface CloudinaryImage {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  created_at: string;
  tags: string[];
  folder?: string;
  context?: Record<string, string>;
}

export interface CloudinaryResponse {
  resources: CloudinaryImage[];
  next_cursor?: string;
  total_count: number;
}

export interface UploadOptions {
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

export interface FetchOptions {
  folder?: string;
  tags?: string[];
  maxResults?: number;
  nextCursor?: string;
  sortBy?: 'created_at' | 'uploaded_at' | 'public_id';
  sortOrder?: 'asc' | 'desc';
  userId?: string;
}

export interface MemoryData {
  title: string;
  location?: string;
  text: string;
  date: string;
  tags?: string[];
}

export interface SavedMemory {
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

export interface SaveMemoryResponse {
  success: boolean;
  memory: SavedMemory;
  message: string;
}