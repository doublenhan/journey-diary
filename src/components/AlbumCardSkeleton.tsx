function AlbumCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
      {/* Cover Image Skeleton */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-200 to-gray-300" />
      
      {/* Album Info Skeleton */}
      <div className="p-4 sm:p-5">
        {/* Title */}
        <div className="h-6 bg-gray-300 rounded-lg mb-2 w-3/4" />
        
        {/* Description */}
        <div className="space-y-2 mb-3">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
        
        {/* Stats Row */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="h-5 bg-gray-200 rounded-full w-16" />
          <div className="h-5 bg-gray-200 rounded-full w-20" />
        </div>
      </div>
    </div>
  );
}

export default AlbumCardSkeleton;
