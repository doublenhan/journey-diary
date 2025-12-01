import React from 'react';
import '../styles/LoadingSkeleton.css';

export const MemoryCardSkeleton: React.FC = () => {
  return (
    <div className="memory-card-skeleton skeleton-animate">
      <div className="skeleton-image"></div>
      <div className="skeleton-content">
        <div className="skeleton-title"></div>
        <div className="skeleton-date"></div>
        <div className="skeleton-text"></div>
        <div className="skeleton-text short"></div>
      </div>
    </div>
  );
};

export const AnniversaryItemSkeleton: React.FC = () => {
  return (
    <div className="anniversary-item-skeleton skeleton-animate">
      <div className="skeleton-icon"></div>
      <div className="skeleton-content">
        <div className="skeleton-title"></div>
        <div className="skeleton-date"></div>
      </div>
      <div className="skeleton-actions">
        <div className="skeleton-button"></div>
        <div className="skeleton-button"></div>
      </div>
    </div>
  );
};

export const GalleryGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="gallery-grid-skeleton">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="gallery-item-skeleton skeleton-animate">
          <div className="skeleton-image square"></div>
        </div>
      ))}
    </div>
  );
};

export const YearSectionSkeleton: React.FC = () => {
  return (
    <div className="year-section-skeleton">
      <div className="skeleton-year-header skeleton-animate"></div>
      <GalleryGridSkeleton count={4} />
    </div>
  );
};
