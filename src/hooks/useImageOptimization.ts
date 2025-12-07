import { useMemo } from 'react';

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png' | 'avif';
  crop?: 'fill' | 'fit' | 'scale' | 'crop';
  gravity?: 'auto' | 'face' | 'center' | 'north' | 'south' | 'east' | 'west';
  blur?: number;
  sharpen?: boolean;
  dpr?: number | 'auto';
}

interface UseImageOptimizationReturn {
  getOptimizedUrl: (url: string, options?: ImageOptimizationOptions) => string;
  getResponsiveSrcSet: (url: string, breakpoints?: number[]) => string | undefined;
  getBlurPlaceholder: (url: string) => string;
  isCloudinaryUrl: (url: string) => boolean;
}

/**
 * Hook for Cloudinary image optimization
 * 
 * Features:
 * - Generate optimized URLs with transformations
 * - Create responsive srcset
 * - Generate blur placeholders (LQIP)
 * - WebP format with auto fallback
 * - Automatic DPR handling
 * 
 * @example
 * ```tsx
 * const { getOptimizedUrl, getResponsiveSrcSet } = useImageOptimization();
 * 
 * const optimizedUrl = getOptimizedUrl(imageUrl, { 
 *   width: 800, 
 *   quality: 80,
 *   format: 'auto' 
 * });
 * 
 * const srcSet = getResponsiveSrcSet(imageUrl);
 * ```
 */
export function useImageOptimization(): UseImageOptimizationReturn {
  
  const isCloudinaryUrl = (url: string): boolean => {
    return url.includes('cloudinary.com') || url.includes('res.cloudinary');
  };

  const getOptimizedUrl = useMemo(() => {
    return (url: string, options: ImageOptimizationOptions = {}): string => {
      if (!isCloudinaryUrl(url)) return url;

      const parts = url.split('/upload/');
      if (parts.length !== 2) return url;

      const {
        width,
        height,
        quality = 80,
        format = 'auto',
        crop = 'fill',
        gravity = 'auto',
        blur,
        sharpen = false,
        dpr = 'auto'
      } = options;

      const transformations: string[] = [];

      // Format (WebP with fallback)
      transformations.push(format === 'auto' ? 'f_auto' : `f_${format}`);

      // Quality
      transformations.push(`q_${quality}`);

      // Width
      if (width) transformations.push(`w_${width}`);

      // Height
      if (height) transformations.push(`h_${height}`);

      // Crop mode
      if (width || height) {
        transformations.push(`c_${crop}`);
        if (gravity !== 'auto') {
          transformations.push(`g_${gravity}`);
        }
      }

      // DPR (Device Pixel Ratio)
      transformations.push(dpr === 'auto' ? 'dpr_auto' : `dpr_${dpr}`);

      // Effects
      if (blur) transformations.push(`e_blur:${blur}`);
      if (sharpen) transformations.push('e_sharpen');

      // Optimizations
      transformations.push('fl_progressive'); // Progressive JPEG
      transformations.push('fl_lossy'); // Lossy compression for better size

      return `${parts[0]}/upload/${transformations.join(',')}/${parts[1]}`;
    };
  }, []);

  const getResponsiveSrcSet = useMemo(() => {
    return (url: string, breakpoints: number[] = [320, 640, 768, 1024, 1280, 1920, 2560]): string | undefined => {
      if (!isCloudinaryUrl(url)) return undefined;

      return breakpoints
        .map(width => `${getOptimizedUrl(url, { width, quality: 80 })} ${width}w`)
        .join(', ');
    };
  }, [getOptimizedUrl]);

  const getBlurPlaceholder = useMemo(() => {
    return (url: string): string => {
      if (!isCloudinaryUrl(url)) return url;

      return getOptimizedUrl(url, {
        width: 40,
        quality: 10,
        blur: 1000,
        format: 'auto'
      });
    };
  }, [getOptimizedUrl]);

  return {
    getOptimizedUrl,
    getResponsiveSrcSet,
    getBlurPlaceholder,
    isCloudinaryUrl
  };
}

/**
 * Preload critical images for better performance
 * 
 * @example
 * ```tsx
 * useEffect(() => {
 *   preloadImage(heroImageUrl, { priority: true });
 * }, []);
 * ```
 */
export function preloadImage(
  src: string,
  options: {
    priority?: boolean;
    srcSet?: string;
    sizes?: string;
  } = {}
): void {
  const { priority = false, srcSet, sizes } = options;

  const link = document.createElement('link');
  link.rel = priority ? 'preload' : 'prefetch';
  link.as = 'image';
  link.href = src;
  
  if (srcSet) link.setAttribute('imagesrcset', srcSet);
  if (sizes) link.setAttribute('imagesizes', sizes);
  
  document.head.appendChild(link);
}

/**
 * Get optimal image sizes attribute based on viewport
 */
export function getOptimalSizes(
  layout: 'full' | 'half' | 'third' | 'quarter' = 'full'
): string {
  const sizesMap = {
    full: '100vw',
    half: '(min-width: 768px) 50vw, 100vw',
    third: '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw',
    quarter: '(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw'
  };

  return sizesMap[layout];
}

export default useImageOptimization;
