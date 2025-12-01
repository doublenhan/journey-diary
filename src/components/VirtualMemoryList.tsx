import { useMemo, useRef } from 'react';
import { VariableSizeList as List, ListChildComponentProps } from 'react-window';
import { Calendar } from 'lucide-react';
import { LazyImage } from './LazyImage';
import type { Memory } from '../types/Memory';

interface VirtualMemoryListProps {
  memories: Memory[];
  year: string;
  onPhotoClick: (photoUrl: string, allPhotos: string[]) => void;
  formatDate: (dateString: string) => string;
}

interface ItemData {
  memories: Memory[];
  year: string;
  onPhotoClick: (photoUrl: string, allPhotos: string[]) => void;
  formatDate: (dateString: string) => string;
  itemHeights: Map<number, number>;
}

// Estimate height for each memory card
const estimateItemHeight = (memory: Memory): number => {
  const baseHeight = 300; // Base card height
  const imageHeight = memory.images.length > 0 ? 400 : 0; // Image gallery height
  const textHeight = Math.ceil(memory.text.length / 100) * 20; // Estimate text height
  const titleHeight = memory.title ? 40 : 0;
  
  return baseHeight + imageHeight + textHeight + titleHeight;
};

const MemoryRow = ({ index, style, data }: ListChildComponentProps<ItemData>) => {
  const { memories, onPhotoClick, formatDate } = data;
  const memory = memories[index];

  if (!memory) return null;

  const allPhotos = memory.images.map(img => img.url);

  return (
    <div style={style}>
      <div 
        className="memory-card animate-fade-in"
        style={{ 
          animationDelay: `${index * 0.1}s`,
          padding: '0 0 20px 0'
        }}
      >
        {/* Memory Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-pink-100 overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
          {/* Date Header */}
          <div className="date-header">
            <div className="flex items-center justify-center space-x-2 text-white">
              <Calendar className="w-5 h-5" />
              <span className="date-text">{formatDate(memory.date)}</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Title if available */}
            {memory.title && (
              <h3 className="memory-title">{memory.title}</h3>
            )}

            {/* Description */}
            <p className="memory-text">{memory.text}</p>

            {/* Location if available */}
            {memory.location && (
              <div className="memory-location">
                <span className="location-icon">📍</span>
                <span className="location-text">{memory.location}</span>
              </div>
            )}

            {/* Image Gallery */}
            {memory.images && memory.images.length > 0 && (
              <div className="image-gallery">
                <div className={`gallery-grid gallery-grid-${Math.min(memory.images.length, 4)}`}>
                  {memory.images.slice(0, 6).map((image, imgIndex) => (
                    <div
                      key={image.public_id}
                      className={`gallery-item ${imgIndex === 5 && memory.images.length > 6 ? 'gallery-item-more' : ''}`}
                      onClick={() => onPhotoClick(image.url, allPhotos)}
                      style={{ cursor: 'pointer' }}
                    >
                      <LazyImage 
                        src={image.url}
                        alt={`${memory.title || 'Memory'} - Photo ${imgIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {imgIndex === 5 && memory.images.length > 6 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white text-2xl font-bold">
                            +{memory.images.length - 6}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const VirtualMemoryList = ({ 
  memories, 
  year, 
  onPhotoClick, 
  formatDate 
}: VirtualMemoryListProps) => {
  const listRef = useRef<List>(null);
  const itemHeightsRef = useRef(new Map<number, number>());

  // Pre-calculate estimated heights
  const estimatedHeights = useMemo(() => {
    return memories.map((memory, index) => {
      const cached = itemHeightsRef.current.get(index);
      if (cached) return cached;
      
      const estimated = estimateItemHeight(memory);
      itemHeightsRef.current.set(index, estimated);
      return estimated;
    });
  }, [memories]);

  const getItemSize = (index: number): number => {
    return estimatedHeights[index] || 500;
  };

  const itemData: ItemData = {
    memories,
    year,
    onPhotoClick,
    formatDate,
    itemHeights: itemHeightsRef.current,
  };

  // Calculate total height (max 800px to prevent excessive height)
  const listHeight = Math.min(
    window.innerHeight - 200,
    800
  );

  return (
    <List
      ref={listRef}
      height={listHeight}
      itemCount={memories.length}
      itemSize={getItemSize}
      width="100%"
      itemData={itemData}
      overscanCount={2}
    >
      {MemoryRow}
    </List>
  );
};
