export interface MemoryImage {
  url: string;
  public_id: string;
  created_at: string;
  tags: string[];
}

export interface Memory {
  id: string;
  title: string;
  date: string;
  text: string;
  location?: string;
  images: MemoryImage[];
  created_at?: string;
  tags?: string[];
  folder?: string;
}

export interface MemoriesByYear {
  [year: string]: Memory[];
}
