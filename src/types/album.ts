export interface AlbumPage {
  id: string;
  memoryId: string;
  order: number;
  customCaption?: string;
  layout?: 'single' | 'collage';
}

export interface Album {
  id: string;
  userId: string;
  title: string;
  description?: string;
  coverImage?: string;
  albumDate?: string; // Custom date for the album (e.g., "2024-12-25")
  theme?: 'classic' | 'modern' | 'romantic' | 'minimal';
  privacy: 'private' | 'public' | 'shared';
  createdAt: Date;
  updatedAt: Date;
  pages: AlbumPage[];
  memoryIds: string[]; // Quick reference to all memories in album
}

export interface CreateAlbumData {
  title: string;
  description?: string;
  coverImage?: string;
  albumDate?: string;
  theme?: Album['theme'];
  privacy?: Album['privacy'];
}

export interface UpdateAlbumData {
  title?: string;
  description?: string;
  coverImage?: string;
  albumDate?: string;
  theme?: Album['theme'];
  privacy?: Album['privacy'];
  pages?: AlbumPage[];
  memoryIds?: string[];
}

