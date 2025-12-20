import React from 'react';
import '../styles/FeaturesSkeleton.css';

export const FeaturesSkeleton: React.FC = () => {
  return (
    <div className="features-skeleton">
      <div className="features-skeleton-header">
        <div className="skeleton-title skeleton-animate"></div>
        <div className="skeleton-subtitle skeleton-animate"></div>
      </div>
      <div className="features-skeleton-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="feature-skeleton-card">
            <div className="skeleton-icon skeleton-animate"></div>
            <div className="skeleton-text skeleton-animate"></div>
            <div className="skeleton-description skeleton-animate"></div>
          </div>
        ))}
      </div>
    </div>
  );
};
