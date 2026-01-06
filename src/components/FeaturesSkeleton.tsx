import React from 'react';

export const FeaturesSkeleton: React.FC = () => {
  return (
    <div className="py-16 px-4 md:py-8 md:px-4">
      <div className="text-center mb-12">
        <div className="w-[350px] h-10 mx-auto mb-4 rounded-lg bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:1000px_100%] animate-[skeleton-shimmer_2s_infinite_linear] md:w-4/5 md:h-8"></div>
        <div className="w-[450px] h-5 mx-auto rounded-md bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:1000px_100%] animate-[skeleton-shimmer_2s_infinite_linear] md:w-[90%] md:h-[18px]"></div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-8 max-w-[1200px] mx-auto md:grid-cols-1 md:gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="p-8 rounded-xl bg-white shadow-md">
            <div className="w-[50px] h-[50px] mx-auto mb-4 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:1000px_100%] animate-[skeleton-shimmer_2s_infinite_linear]"></div>
            <div className="w-[70%] h-6 mx-auto mb-4 rounded-md bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:1000px_100%] animate-[skeleton-shimmer_2s_infinite_linear]"></div>
            <div className="w-[90%] h-4 mx-auto rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:1000px_100%] animate-[skeleton-shimmer_2s_infinite_linear]"></div>
          </div>
        ))}
      </div>
    </div>
  );
};
