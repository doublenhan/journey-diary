import React from 'react';

export const GallerySkeleton: React.FC = () => {
  return (
    <div className="py-16 px-4 bg-white md:py-8">
      <div className="text-center mb-12">
        <div className="w-[300px] h-10 mx-auto mb-4 rounded-lg bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:1000px_100%] animate-skeleton-shimmer md:w-4/5 md:h-8"></div>
        <div className="w-[400px] h-5 mx-auto rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:1000px_100%] animate-skeleton-shimmer md:w-[90%] md:h-[18px]"></div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6 max-w-[1200px] mx-auto md:grid-cols-1 md:gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="w-full aspect-[4/3] rounded-xl bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:1000px_100%] animate-skeleton-shimmer"></div>
        ))}
      </div>
    </div>
  );
};
