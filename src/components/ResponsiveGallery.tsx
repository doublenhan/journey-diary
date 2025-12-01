import React, { useMemo } from 'react';
import { LazyImage } from './LazyImage';
import '../styles/ResponsiveGallery.css';

interface GalleryImage {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
}

interface ResponsiveGalleryProps {
  images: GalleryImage[];
  memoryTitle?: string;
  onImageClick: (imageUrl: string, index: number, allUrls: string[]) => void;
}

export const ResponsiveGallery: React.FC<ResponsiveGalleryProps> = ({
  images,
  memoryTitle = 'Memory',
  onImageClick
}) => {
  const imageCount = Math.min(images.length, 6);
  const limitedImages = images.slice(0, 6);
  const allPhotoUrls = useMemo(() => limitedImages.map(img => img.secure_url), [limitedImages]);

  // Determine grid layout based on number of images
  const getGridClass = () => {
    switch (imageCount) {
      case 1:
        return 'gallery-single';
      case 2:
        return 'gallery-double';
      case 3:
        return 'gallery-triple';
      case 4:
        return 'gallery-quad';
      default:
        return 'gallery-grid';
    }
  };

  // Show max 6 images
  const visibleImages = limitedImages;
  const remainingCount = images.length > 6 ? images.length - 6 : 0;

  return (
    <div className={`responsive-gallery ${getGridClass()}`}>
      {visibleImages.map((image, index) => {
        const isLast = index === 5 && remainingCount > 0;
        
        return (
          <div
            key={image.public_id}
            className={`gallery-item ${isLast ? 'has-overlay' : ''}`}
            onClick={() => onImageClick(image.secure_url, index, allPhotoUrls)}
          >
            <LazyImage
              src={image.secure_url}
              alt={`${memoryTitle} - Photo ${index + 1}`}
              className="gallery-image"
              width={image.width}
              height={image.height}
              transformations="f_auto,q_auto,w_800,c_limit"
            />
            {isLast && (
              <div className="gallery-overlay">
                <span className="overlay-text">+{remainingCount}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
