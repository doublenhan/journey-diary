import React from 'react';

export const MemoryCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl overflow-hidden mb-6 shadow-md relative bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-skeleton-shimmer">
      <div className="w-full h-[200px] bg-gray-200"></div>
      <div className="p-5">
        <div className="h-6 w-3/5 rounded mb-3 bg-gray-200"></div>
        <div className="h-4 w-2/5 rounded mb-4 bg-gray-200"></div>
        <div className="h-3.5 w-full rounded mb-2 bg-gray-200"></div>
        <div className="h-3.5 w-[70%] rounded bg-gray-200"></div>
      </div>
    </div>
  );
};

export const AnniversaryItemSkeleton: React.FC = () => {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg mb-3 bg-white shadow-sm">
      <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 relative overflow-hidden bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-skeleton-shimmer"></div>
      <div className="flex-1">
        <div className="h-6 w-1/2 rounded mb-2 bg-gray-200 relative overflow-hidden bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-skeleton-shimmer"></div>
        <div className="h-4 w-[35%] rounded bg-gray-200 relative overflow-hidden bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-skeleton-shimmer"></div>
      </div>
      <div className="flex gap-2">
        <div className="w-8 h-8 rounded-md bg-gray-200 relative overflow-hidden bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-skeleton-shimmer"></div>
        <div className="w-8 h-8 rounded-md bg-gray-200 relative overflow-hidden bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-skeleton-shimmer"></div>
      </div>
    </div>
  );
};

export const GalleryGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 py-5">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-lg overflow-hidden aspect-square relative bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-skeleton-shimmer">
          <div className="w-full h-full bg-gray-200"></div>
        </div>
      ))}
    </div>
  );
};

export const YearSectionSkeleton: React.FC = () => {
  return (
    <div className="mb-10">
      <div className="h-9 w-[120px] rounded-lg mb-5 bg-gray-200 relative overflow-hidden bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-skeleton-shimmer"></div>
      <GalleryGridSkeleton count={4} />
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="mb-8">
      <div className="h-7 w-[280px] rounded-lg bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-shimmer mb-4"></div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-pink-100 p-4 flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-50 via-pink-200 to-pink-50 bg-[length:200%_100%] animate-skeleton-shimmer"></div>
            <div className="w-[60px] h-8 rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-skeleton-shimmer"></div>
            <div className="w-20 h-4 rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-skeleton-shimmer"></div>
          </div>
        ))}
      </div>
    </div>
  );
};
