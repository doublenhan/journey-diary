import React from 'react';

interface WebPImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
}

/**
 * WebPImage component with automatic fallback to original format
 * Uses Cloudinary's f_auto to deliver WebP when supported
 */
export const WebPImage: React.FC<WebPImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
  decoding = 'async'
}) => {
  // Generate WebP and fallback URLs for Cloudinary images
  const getWebPUrl = (url: string) => {
    if (url.includes('cloudinary.com')) {
      const parts = url.split('/upload/');
      if (parts.length === 2) {
        // Force WebP format with auto quality
        return `${parts[0]}/upload/f_webp,q_auto/${parts[1]}`;
      }
    }
    return url;
  };

  const getFallbackUrl = (url: string) => {
    if (url.includes('cloudinary.com')) {
      const parts = url.split('/upload/');
      if (parts.length === 2) {
        // Auto format (will use original format or best supported)
        return `${parts[0]}/upload/f_auto,q_auto/${parts[1]}`;
      }
    }
    return url;
  };

  const webpSrc = getWebPUrl(src);
  const fallbackSrc = getFallbackUrl(src);

  // If not a Cloudinary URL, use simple img tag
  if (!src.includes('cloudinary.com')) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
      />
    );
  }

  // Use picture element for WebP with fallback
  return (
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
      <img
        src={fallbackSrc}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
      />
    </picture>
  );
};
