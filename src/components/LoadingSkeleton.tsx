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

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="dashboard-skeleton" style={{ marginBottom: '2rem' }}>
      <div style={{
        height: '28px',
        width: '280px',
        borderRadius: '8px',
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        marginBottom: '1rem',
        animation: 'shimmer 1.5s infinite'
      }}></div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem'
      }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} style={{
            background: 'white',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #fce7f3',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div className="skeleton-animate" style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(90deg, #fce7f3 25%, #fbcfe8 50%, #fce7f3 75%)',
              backgroundSize: '200% 100%'
            }}></div>
            <div className="skeleton-animate" style={{
              width: '60px',
              height: '32px',
              borderRadius: '6px',
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%'
            }}></div>
            <div className="skeleton-animate" style={{
              width: '80px',
              height: '16px',
              borderRadius: '4px',
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%'
            }}></div>
          </div>
        ))}
      </div>
    </div>
  );
};
