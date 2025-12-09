import React from 'react';
import '../styles/GallerySkeleton.css';

export const GallerySkeleton: React.FC = () => {
  return (
    <div className="gallery-skeleton">
      <div className="gallery-skeleton-header">
        <div className="skeleton-title skeleton-animate"></div>
        <div className="skeleton-subtitle skeleton-animate"></div>
      </div>
      <div className="gallery-skeleton-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="gallery-skeleton-item skeleton-animate"></div>
        ))}
      </div>
    </div>
  );
};
