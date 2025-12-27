import React, { useMemo } from 'react';
import { LazyImage } from './LazyImage';

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
        return 'grid grid-cols-1 place-items-center md:flex md:flex-col md:items-center';
      case 2:
        return 'grid grid-cols-2 md:flex md:flex-col md:items-center';
      case 3:
        return 'grid grid-cols-2 grid-rows-2 md:flex md:flex-col md:items-center';
      case 4:
        return 'grid grid-cols-2 md:flex md:flex-col md:items-center';
      default:
        return 'grid grid-cols-3 md:flex md:flex-col md:items-center';
    }
  };

  // Show max 6 images
  const visibleImages = limitedImages;
  const remainingCount = images.length > 6 ? images.length - 6 : 0;

  return (
    <div className={`gap-3 mt-4 rounded-2xl overflow-hidden w-full md:gap-2 md:w-full ${getGridClass()}`}>
      {visibleImages.map((image, index) => {
        const isLast = index === 5 && remainingCount > 0;
        
        return (
          <div
            key={image.public_id}
            className={`relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 bg-gray-100 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_12px_24px_rgba(236,72,153,0.25)] hover:z-10 ${
              imageCount === 1 ? 'aspect-video max-h-[500px] md:aspect-[4/3] md:max-h-[400px] md:w-full md:max-w-[500px] md:mx-auto' :
              imageCount === 2 ? 'aspect-[4/5] md:aspect-[4/3] md:max-h-[400px] md:w-full md:max-w-[500px] md:mx-auto' :
              imageCount === 3 && index === 0 ? 'row-span-2 aspect-[4/5] md:row-span-1 md:aspect-[4/3] md:max-h-[400px] md:w-full md:max-w-[500px] md:mx-auto' :
              imageCount === 3 && index !== 0 ? 'aspect-square md:aspect-[4/3] md:max-h-[400px] md:w-full md:max-w-[500px] md:mx-auto' :
              imageCount === 4 ? 'aspect-square md:aspect-[4/3] md:max-h-[400px] md:w-full md:max-w-[500px] md:mx-auto' :
              index === 0 ? 'col-span-2 row-span-2 aspect-[4/3] md:col-span-1 md:row-span-1 md:max-h-[400px] md:w-full md:max-w-[500px] md:mx-auto' :
              'aspect-square md:aspect-[4/3] md:max-h-[400px] md:w-full md:max-w-[500px] md:mx-auto'
            }`}
            onClick={() => onImageClick(image.secure_url, index, allPhotoUrls)}
          >
            <LazyImage
              src={image.secure_url}
              alt={`${memoryTitle} - Photo ${index + 1}`}
              className="w-full h-full object-cover block transition-transform duration-400 group-hover:scale-110"
              width={image.width}
              height={image.height}
              transformations="f_auto,q_auto,w_800,c_limit"
            />
            {isLast && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur flex items-center justify-center transition-colors duration-300 hover:bg-black/70">
                <span className="text-white text-[2rem] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.3)] md:text-2xl">+{remainingCount}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
