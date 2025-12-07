import { useState, useEffect, useRef, useMemo } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number; // 1-100
  sizes?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * OptimizedImage Component
 * 
 * Features:
 * - WebP format with automatic JPEG fallback
 * - Responsive srcset for different screen sizes
 * - Progressive blur-up loading effect
 * - Lazy loading with Intersection Observer
 * - Priority loading for above-the-fold images
 * - Error handling with fallback UI
 * - Performance optimized with Cloudinary transformations
 */
export function OptimizedImage({
  src,
  alt,
  className = '',
  onClick,
  width,
  height,
  priority = false,
  quality = 80,
  sizes = '100vw',
  objectFit = 'cover',
  loading = 'lazy',
  onLoad,
  onError
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate Cloudinary URL with transformations
  const getCloudinaryUrl = useMemo(() => {
    return (url: string, options: { width?: number; quality?: number; format?: string; blur?: boolean }) => {
      if (!url.includes('cloudinary.com')) return url;

      const parts = url.split('/upload/');
      if (parts.length !== 2) return url;

      const transforms: string[] = [];
      
      // Format (WebP with auto fallback)
      transforms.push(options.format || 'f_auto');
      
      // Quality
      if (options.quality) {
        transforms.push(`q_${options.quality}`);
      }
      
      // Width
      if (options.width) {
        transforms.push(`w_${options.width}`);
      }
      
      // Blur for LQIP
      if (options.blur) {
        transforms.push('e_blur:1000');
      }

      // DPR (Device Pixel Ratio) auto
      transforms.push('dpr_auto');

      return `${parts[0]}/upload/${transforms.join(',')}/${parts[1]}`;
    };
  }, []);

  // Generate responsive srcset
  const srcSet = useMemo(() => {
    if (!src.includes('cloudinary.com')) return undefined;

    const breakpoints = [320, 640, 750, 828, 1080, 1200, 1920, 2048, 3840];
    return breakpoints
      .map(w => `${getCloudinaryUrl(src, { quality, width: w })} ${w}w`)
      .join(', ');
  }, [src, quality, getCloudinaryUrl]);

  // Main image URL
  const mainSrc = useMemo(() => {
    return getCloudinaryUrl(src, { 
      quality, 
      width: width ? Math.min(width * 2, 3840) : undefined // 2x for retina
    });
  }, [src, quality, width, getCloudinaryUrl]);

  // Blur placeholder (LQIP)
  const blurSrc = useMemo(() => {
    return getCloudinaryUrl(src, { 
      quality: 10, 
      width: 40, 
      blur: true 
    });
  }, [src, getCloudinaryUrl]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || loading === 'eager') {
      setIsInView(true);
      return;
    }

    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px',
        threshold: 0.01
      }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [priority, loading]);

  // Preload for priority images
  useEffect(() => {
    if (priority && mainSrc) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = mainSrc;
      if (srcSet) link.setAttribute('imagesrcset', srcSet);
      if (sizes) link.setAttribute('imagesizes', sizes);
      document.head.appendChild(link);

      return () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      };
    }
  }, [priority, mainSrc, srcSet, sizes]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const imageStyle = {
    objectFit,
    aspectRatio: width && height ? `${width}/${height}` : undefined
  };

  return (
    <div
      ref={imgRef}
      className={`optimized-image-container ${className}`}
      onClick={onClick}
      style={imageStyle}
    >
      {/* Blur placeholder */}
      {!hasError && (
        <img
          src={blurSrc}
          alt=""
          className={`optimized-image-blur ${isLoaded ? 'fade-out' : ''}`}
          aria-hidden="true"
          style={imageStyle}
        />
      )}

      {/* Main image */}
      {isInView && !hasError && (
        <picture>
          {/* WebP source */}
          <source
            type="image/webp"
            srcSet={srcSet}
            sizes={sizes}
          />
          
          {/* JPEG fallback */}
          <source
            type="image/jpeg"
            srcSet={srcSet?.replace(/f_auto/g, 'f_jpg')}
            sizes={sizes}
          />

          {/* Fallback img tag */}
          <img
            src={mainSrc}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            className={`optimized-image ${isLoaded ? 'loaded' : ''}`}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            style={imageStyle}
          />
        </picture>
      )}

      {/* Error state */}
      {hasError && (
        <div className="optimized-image-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor" opacity="0.3"/>
          </svg>
          <p>Failed to load</p>
        </div>
      )}

      {/* Loading indicator */}
      {!isLoaded && !hasError && isInView && (
        <div className="optimized-image-loading">
          <div className="spinner" />
        </div>
      )}
    </div>
  );
}

export default OptimizedImage;
