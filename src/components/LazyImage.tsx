import { useState, useEffect, useRef } from 'react';
import '../styles/LazyImage.css';
import '../styles/LazyImageEnhanced.css';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  width?: number;
  height?: number;
  transformations?: string; // Cloudinary transformations
  enableBlur?: boolean; // Enable blur placeholder
  sizes?: string; // Responsive sizes attribute
  priority?: boolean; // High priority images (above fold)
}

export function LazyImage({ 
  src, 
  alt, 
  className = '', 
  onClick,
  width,
  height,
  transformations = 'f_auto,q_auto',
  enableBlur = true,
  sizes = '100vw',
  priority = false
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority); // Priority images start as visible
  const [blurLoaded, setBlurLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const blurImgRef = useRef<HTMLImageElement>(null);

  // Apply Cloudinary transformations with WebP support
  const getOptimizedUrl = (url: string, width?: number, format?: string) => {
    if (url.includes('cloudinary.com')) {
      const parts = url.split('/upload/');
      if (parts.length === 2) {
        // Enhanced transformations: WebP with JPEG fallback, auto quality
        const widthParam = width ? `,w_${width}` : '';
        const formatParam = format ? `,f_${format}` : '';
        const transforms = `${transformations}${widthParam}${formatParam}`;
        return `${parts[0]}/upload/${transforms}/${parts[1]}`;
      }
    }
    return url;
  };

  // Generate WebP URL for picture element
  const getWebPUrl = (url: string, width?: number) => {
    return getOptimizedUrl(url, width, 'webp');
  };

  // Generate responsive srcset for different screen sizes
  const generateSrcSet = (url: string, format?: string) => {
    if (!url.includes('cloudinary.com')) return undefined;
    
    const widths = [320, 640, 768, 1024, 1280, 1920];
    const srcsetArray = widths.map(w => 
      `${getOptimizedUrl(url, w, format)} ${w}w`
    );
    
    return srcsetArray.join(', ');
  };

  // Generate LQIP (Low Quality Image Placeholder) for blur effect
  const getBlurUrl = (url: string) => {
    if (url.includes('cloudinary.com')) {
      const parts = url.split('/upload/');
      if (parts.length === 2) {
        // Ultra low quality: 40px width, heavy blur, low quality, WebP format
        return `${parts[0]}/upload/w_40,q_10,e_blur:1000,f_auto/${parts[1]}`;
      }
    }
    return url;
  };

  const optimizedSrc = getOptimizedUrl(src);
  const srcSet = generateSrcSet(src);
  const webpSrcSet = generateSrcSet(src, 'webp');
  const blurSrc = enableBlur ? getBlurUrl(src) : undefined;

  useEffect(() => {
    // Skip intersection observer for priority images
    if (priority) return;
    
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
        rootMargin: '100px', // Start loading 100px before image enters viewport
        threshold: 0.01
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  // Preload priority images immediately
  useEffect(() => {
    if (priority && optimizedSrc) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = optimizedSrc;
      if (srcSet) link.setAttribute('imagesrcset', srcSet);
      if (sizes) link.setAttribute('imagesizes', sizes);
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, optimizedSrc, srcSet, sizes]);

  const handleImageError = () => {
    setImageError(true);
    setIsLoaded(true); // Show error state
  };

  return (
    <div 
      className={`lazy-image-wrapper ${isLoaded ? 'loaded' : 'loading'} ${blurLoaded ? 'blur-loaded' : ''} ${imageError ? 'error' : ''} ${className}`}
      onClick={onClick}
      style={{ 
        aspectRatio: width && height ? `${width}/${height}` : 'auto'
      }}
    >
      {/* Blur placeholder (LQIP) */}
      {enableBlur && blurSrc && !imageError && (
        <img
          ref={blurImgRef}
          src={blurSrc}
          alt=""
          className="lazy-image-blur"
          onLoad={() => setBlurLoaded(true)}
          aria-hidden="true"
        />
      )}
      
      {/* Main image with responsive srcset and WebP support */}
      {!imageError ? (
        <picture>
          {/* WebP source for modern browsers */}
          {isInView && webpSrcSet && src.includes('cloudinary.com') && (
            <source 
              srcSet={webpSrcSet}
              sizes={sizes}
              type="image/webp"
            />
          )}
          {/* Fallback image */}
          <img
            ref={imgRef}
            src={isInView ? optimizedSrc : undefined}
            srcSet={isInView && srcSet ? srcSet : undefined}
            sizes={isInView ? sizes : undefined}
            alt={alt}
            className="lazy-image"
            onLoad={() => setIsLoaded(true)}
            onError={handleImageError}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            {...(priority && { fetchPriority: 'high' as any })}
          />
        </picture>
      ) : (
        <div className="lazy-image-error">
          <svg className="error-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor" opacity="0.3"/>
            <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z" fill="currentColor"/>
          </svg>
          <p className="error-text">Failed to load image</p>
        </div>
      )}
      
      {/* Loading spinner (only show if blur not loaded and not priority) */}
      {!isLoaded && !blurLoaded && !priority && !imageError && (
        <div className="lazy-image-placeholder">
          <div className="lazy-image-spinner" />
        </div>
      )}
    </div>
  );
}
