import React from 'react';
import '../styles/DashboardSkeleton.css';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="dashboard-skeleton">
      <div className="dashboard-skeleton-title skeleton-animate"></div>
      <div className="dashboard-skeleton-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="dashboard-skeleton-card">
            <div className="skeleton-icon skeleton-animate"></div>
            <div className="skeleton-number skeleton-animate"></div>
            <div className="skeleton-label skeleton-animate"></div>
          </div>
        ))}
      </div>
    </div>
  );
};
