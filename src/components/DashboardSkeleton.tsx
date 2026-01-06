import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="mb-8">
      <div className="h-7 w-[280px] rounded-lg bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-shimmer mb-4"></div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-pink-100 p-4 flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-50 via-pink-200 to-pink-50 bg-[length:200%_100%] animate-shimmer"></div>
            <div className="w-[60px] h-8 rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-shimmer"></div>
            <div className="w-20 h-4 rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-shimmer"></div>
          </div>
        ))}
      </div>
    </div>
  );
};
