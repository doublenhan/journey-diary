import React from 'react';

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
    <div className="flex flex-col items-center justify-center py-[60px] px-5 text-center min-h-[400px]">
      <div className="text-[80px] mb-8 opacity-60 animate-float flex justify-center items-center w-full">{icon}</div>
      <h3 className="text-2xl font-semibold text-gray-800 mb-3 animate-fade-in-up">{title}</h3>
      <p className="text-base text-gray-600 max-w-[400px] leading-relaxed mt-4 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>{description}</p>
      {actionLabel && onAction && (
        <button 
          className="py-3 px-8 text-base font-medium text-white bg-gradient-to-br from-indigo-500 to-purple-600 border-none rounded-lg cursor-pointer transition-all duration-300 animate-fade-in-up hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(102,126,234,0.3)] active:translate-y-0" 
          style={{ animationDelay: '0.2s' }}
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
