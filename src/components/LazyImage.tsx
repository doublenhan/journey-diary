import { useState, useEffect, useRef } from 'react';
import './LazyImage.css';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  width?: number;
  height?: number;
  transformations?: string; // Cloudinary transformations
  enableBlur?: boolean; // Enable blur placeholder
}

export function LazyImage({ 
  src, 
  alt, 
  className = '', 
  onClick,
  width,
  height,
  transformations = 'f_auto,q_auto,w_800',
  enableBlur = true
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [blurLoaded, setBlurLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const blurImgRef = useRef<HTMLImageElement>(null);

  // Apply Cloudinary transformations
  const getOptimizedUrl = (url: string) => {
    // Check if it's a Cloudinary URL
    if (url.includes('cloudinary.com')) {
      const parts = url.split('/upload/');
      if (parts.length === 2) {
        return `${parts[0]}/upload/${transformations}/${parts[1]}`;
      }
    }
    return url;
  };

  // Generate LQIP (Low Quality Image Placeholder) for blur effect
  const getBlurUrl = (url: string) => {
    if (url.includes('cloudinary.com')) {
      const parts = url.split('/upload/');
      if (parts.length === 2) {
        // Ultra low quality: 40px width, heavy blur, low quality
        return `${parts[0]}/upload/w_40,q_10,e_blur:1000/${parts[1]}`;
      }
    }
    return url;
  };

  const optimizedSrc = getOptimizedUrl(src);
  const blurSrc = enableBlur ? getBlurUrl(src) : undefined;

  useEffect(() => {
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
        rootMargin: '50px', // Start loading 50px before image enters viewport
        threshold: 0.01
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      className={`lazy-image-wrapper ${isLoaded ? 'loaded' : 'loading'} ${blurLoaded ? 'blur-loaded' : ''} ${className}`}
      onClick={onClick}
      style={{ 
        aspectRatio: width && height ? `${width}/${height}` : 'auto'
      }}
    >
      {/* Blur placeholder (LQIP) */}
      {enableBlur && blurSrc && (
        <img
          ref={blurImgRef}
          src={blurSrc}
          alt=""
          className="lazy-image-blur"
          onLoad={() => setBlurLoaded(true)}
          aria-hidden="true"
        />
      )}
      
      {/* Main image */}
      <img
        ref={imgRef}
        src={isInView ? optimizedSrc : undefined}
        alt={alt}
        className="lazy-image"
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
      />
      
      {/* Loading spinner (only show if blur not loaded) */}
      {!isLoaded && !blurLoaded && (
        <div className="lazy-image-placeholder">
          <div className="lazy-image-spinner" />
        </div>
      )}
    </div>
  );
}
