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
  const imageCount = images.length;
  const allPhotoUrls = useMemo(() => images.map(img => img.secure_url), [images]);

  // Mobile: Show only first 3 images
  const mobileImages = images.slice(0, 3);
  const mobileRemainingCount = Math.max(0, imageCount - 3);

  // Desktop: Show all images
  const desktopImages = images;

  // Determine grid layout based on number of images (Desktop) - Instagram/Pinterest style
  const getDesktopGridClass = () => {
    if (imageCount === 1) {
      return 'flex justify-center';
    } else if (imageCount === 2) {
      return 'grid grid-cols-2 gap-3';
    } else if (imageCount === 3) {
      return 'grid grid-cols-3 gap-3';
    } else if (imageCount === 4) {
      return 'grid grid-cols-2 gap-3';
    } else if (imageCount === 5) {
      return 'grid grid-cols-6 gap-3';
    } else if (imageCount === 6) {
      return 'grid grid-cols-3 gap-3';
    } else {
      // 7+ images: 3 columns masonry-style
      return 'grid grid-cols-3 gap-3';
    }
  };

  // Get special styling for specific image counts (Desktop) - Creative layouts
  const getDesktopImageClass = (index: number) => {
    if (imageCount === 1) {
      return 'aspect-[4/3] max-h-[650px] w-full max-w-[950px] shadow-2xl';
    } else if (imageCount === 2) {
      return 'aspect-[3/4] max-h-[700px]';
    } else if (imageCount === 3) {
      // Instagram style: All same size
      return 'aspect-square';
    } else if (imageCount === 4) {
      // 2x2 grid perfect squares
      return 'aspect-square';
    } else if (imageCount === 5) {
      // Creative 5-image layout: 2 large (4 cols each) on top, 3 small (2 cols each) on bottom
      if (index < 2) {
        return 'col-span-3 aspect-[3/2] row-span-1';
      }
      return 'col-span-2 aspect-square';
    } else if (imageCount === 6) {
      // 3x2 grid
      return 'aspect-square';
    } else {
      // 7+ images: Masonry-style with varying heights
      const patterns = ['aspect-square', 'aspect-[4/5]', 'aspect-[3/4]'];
      return patterns[index % patterns.length];
    }
  };

  // Mobile layout: max 3 images in 2 columns
  const getMobileImageClass = (index: number) => {
    if (imageCount === 1) {
      return 'col-span-2 aspect-video';
    } else if (imageCount === 2) {
      return 'aspect-square';
    } else {
      // 3+ images: show 3 in creative layout
      if (index === 0) {
        return 'col-span-2 aspect-[5/3]'; // First image takes full width
      }
      return 'aspect-square'; // Last 2 images are square
    }
  };

  return (
    <div className="mt-4 w-full">
      {/* Mobile View: Max 3 images */}
      <div className={`md:hidden grid grid-cols-2 gap-2`}>
        {mobileImages.map((image, index) => {
          const isLast = index === 2 && mobileRemainingCount > 0;
          
          return (
            <div
              key={image.public_id}
              className={`relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 bg-gray-100 active:scale-95 ${getMobileImageClass(index)}`}
              onClick={() => onImageClick(image.secure_url, index, allPhotoUrls)}
            >
              <LazyImage
                src={image.secure_url}
                alt={`${memoryTitle} - Photo ${index + 1}`}
                className="w-full h-full object-cover block"
                width={image.width}
                height={image.height}
                transformations="f_auto,q_auto,w_600,c_limit"
              />
              {isLast && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">+{mobileRemainingCount}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop View: All images with smart layout */}
      <div className={`hidden md:block`}>
        <div className={getDesktopGridClass()}>
          {desktopImages.map((image, index) => {
            return (
              <div
                key={image.public_id}
                className={`relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 bg-gray-100 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_12px_24px_rgba(236,72,153,0.25)] hover:z-10 ${getDesktopImageClass(index)}`}
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
