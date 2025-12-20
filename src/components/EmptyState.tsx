import React from 'react';
import '../styles/EmptyState.css';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '32px', fontSize: '80px' }}>{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description" style={{ marginTop: '16px' }}>{description}</p>
      {actionLabel && onAction && (
        <button className="empty-state-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};
