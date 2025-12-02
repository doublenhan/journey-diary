import { useState, useEffect, useMemo } from 'react';
import { useInfiniteMemories } from './hooks/useInfiniteMemories';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { Heart, Calendar, ArrowLeft, ChevronLeft, ChevronRight, Loader, Map, Share2, Edit, Trash2 } from 'lucide-react';
// import { cloudinaryApi, type SavedMemory } from './apis/cloudinaryGalleryApi';
import { useCurrentUserId } from './hooks/useCurrentUserId';
import { MoodTheme, themes } from './config/themes';
import VisualEffects from './components/VisualEffects';
import { useSyncStatus } from './hooks/useSyncStatus';
import SyncStatus from './components/SyncStatus';
import { EmptyState } from './components/EmptyState';
import { YearSectionSkeleton, DashboardSkeleton } from './components/LoadingSkeleton';
import { LazyImage } from './components/LazyImage';
import { InfiniteScrollTrigger } from './components/InfiniteScrollTrigger';
import { SearchFilterBar } from './components/SearchFilterBar';
import { ResponsiveGallery } from './components/ResponsiveGallery';
import { MapView } from './components/MapView';
import './styles/ViewMemory.css';
import './styles/MemoryCardHover.css';

// Update Memory interface to match SavedMemory from the API
interface MemoryImage {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  created_at: string;
  tags: string[];
}

interface Memory {
  id: string;
  title: string;
  date: string;
  text: string;
  location?: string | null;
  images: MemoryImage[];
  created_at?: string;
  tags?: string[];
  folder?: string;
}

interface MemoriesByYear {
  [year: string]: Memory[];
}

interface ViewMemoryProps {
  onBack?: () => void;
  currentTheme: MoodTheme;
}

function ViewMemory({ onBack, currentTheme }: ViewMemoryProps) {
  // All hooks must come first
  const { userId, loading } = useCurrentUserId();
  const { memoriesByYear, years, allYears, isLoading, isLoadingMore, error, hasMore, loadMore } = useInfiniteMemories(userId, loading);
  const { syncStatus, lastSyncTime, errorMessage, startSync, syncSuccess, syncError } = useSyncStatus();
  // Remove unused floatingHearts state
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [allPhotos, setAllPhotos] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [showMapView, setShowMapView] = useState(false);
  const theme = themes[currentTheme];

  // Show sync status when loading memories
  useEffect(() => {
    if (isLoading && !loading) {
      startSync();
    } else if (!isLoading && !loading) {
      if (error) {
        syncError(error);
      } else {
        // Always call syncSuccess when loading completes, even with no data
        syncSuccess();
      }
    }
  }, [isLoading, loading, error, startSync, syncSuccess, syncError]);

  // Log all memory images for debugging after fetching
  useEffect(() => {
    // Memory images fetched successfully
  }, [memoriesByYear]);

  // Fetch memories from Cloudinary
  // TODO: Add useEffect here to fetch memories from the API if needed


  const formatDate = (dateString: string) => {
    // Parse date string directly to avoid timezone offset
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return dateString;
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    
    return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
  };

  // Removed unused openLightbox function

  const closeLightbox = () => {
    setSelectedPhoto(null);
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? (selectedPhotoIndex - 1 + allPhotos.length) % allPhotos.length
      : (selectedPhotoIndex + 1) % allPhotos.length;
    
    setSelectedPhotoIndex(newIndex);
    setSelectedPhoto(allPhotos[newIndex]);
  };

  const navigateToPhoto = (index: number) => {
    setSelectedPhotoIndex(index);
    setSelectedPhoto(allPhotos[index]);
  };

  // Preload adjacent images for smooth navigation
  useEffect(() => {
    if (selectedPhotoIndex === null || allPhotos.length <= 1) return;
    
    const preloadImages = () => {
      const nextIndex = (selectedPhotoIndex + 1) % allPhotos.length;
      const prevIndex = (selectedPhotoIndex - 1 + allPhotos.length) % allPhotos.length;
      
      // Preload next and previous images
      const nextImg = new Image();
      const prevImg = new Image();
      nextImg.src = allPhotos[nextIndex];
      prevImg.src = allPhotos[prevIndex];
    };
    
    preloadImages();
  }, [selectedPhotoIndex, allPhotos]);

  // Debounce search query for better performance
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  // Filter memories based on search and year
  // Important: Use years (visible) data, not allYears, to respect pagination
  const filteredMemoriesByYear = useMemo(() => {
    let filtered = { ...memoriesByYear };

    // If searching or filtering by year, we need to check if data exists
    const hasActiveFilter = debouncedSearch.trim() || selectedYear !== 'ALL';

    // Filter by year first
    if (selectedYear !== 'ALL') {
      // Only show selected year if it exists in visible data
      filtered = { [selectedYear]: filtered[selectedYear] || [] };
    }

    // Search across title, text, location, and date
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = Object.entries(filtered).reduce((acc, [year, memories]) => {
        const matched = memories.filter(m => {
          // Check all fields
          const titleMatch = m.title?.toLowerCase().includes(searchLower) || false;
          const textMatch = m.text?.toLowerCase().includes(searchLower) || false;
          const locationMatch = m.location?.toLowerCase().includes(searchLower) || false;
          const dateMatch = m.date?.includes(debouncedSearch) || false;
          
          return titleMatch || textMatch || locationMatch || dateMatch;
        });
        if (matched.length > 0) acc[year] = matched;
        return acc;
      }, {} as MemoriesByYear);
    }

    return filtered;
  }, [memoriesByYear, debouncedSearch, selectedYear]);

  // Calculate total result count
  const resultCount = useMemo(() => {
    return Object.values(filteredMemoriesByYear).reduce((sum, memories) => sum + memories.length, 0);
  }, [filteredMemoriesByYear]);

  // Update allYears to match filtered results
  const filteredYears = useMemo(() => {
    return Object.keys(filteredMemoriesByYear).sort((a, b) => parseInt(b) - parseInt(a));
  }, [filteredMemoriesByYear]);


  // Removed unused createFloatingHeart function

  // Default visual effects settings
  const effectsEnabled = {
    particles: true,
    hearts: true,
    transitions: true,
    glow: true,
    fadeIn: true,
    slideIn: true
  };
  const animationSpeed = 50;

  return (
    <div className="view-memory-page" style={{ background: theme.background, color: theme.textPrimary }}>
      {/* Visual Effects */}
      <VisualEffects 
        effectsEnabled={effectsEnabled}
        animationSpeed={animationSpeed}
        theme={{ colors: { primary: theme.textPrimary } }}
      />

      {/* Sync Status Indicator */}
      <SyncStatus 
        status={syncStatus}
        lastSyncTime={lastSyncTime}
        errorMessage={errorMessage || undefined}
      />
      
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button 
              onClick={onBack}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-pink-200 hover:bg-pink-50 hover:border-pink-300 transition-all duration-300 shadow-sm hover:shadow-md active:scale-90 active:shadow-inner"
              title="Quay Lại"
            >
              <ArrowLeft className="w-5 h-5 text-pink-600" />
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-2 rounded-xl">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                Love Journal
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Map View Button */}
              <button
                onClick={() => setShowMapView(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-white border border-pink-200 rounded-lg hover:bg-pink-50 transition-colors"
                title="View on Map"
              >
                <Map className="w-4 h-4 text-pink-600" />
                <span className="text-sm font-medium text-gray-700">Map</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">
            Những Kỷ Niệm
            <span className="gradient-text"> Của Chúng Ta</span>
          </h1>
          <p className="page-subtitle">
            Mỗi khoảnh khắc chúng ta chia sẻ, mỗi lần cười, mỗi cuộc phiêu lưu - tất cả đều được lưu lại ở câu chuyện tình yêu.
          </p>
        </div>

        {/* Dashboard: Your Love Story by the Numbers */}
        <div className="love-story-dashboard mb-8">
          <h2 className="dashboard-title text-xl font-bold mb-4 text-pink-600">Câu Chuyện Tình Yêu Của Bạn</h2>
          {isLoading ? (
            <DashboardSkeleton />
          ) : (
          <div className="dashboard-grid grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="dashboard-card bg-white rounded-xl shadow border border-pink-100 p-4 flex flex-col items-center">
              <Heart className="w-8 h-8 text-pink-500 mb-2" />
              <div className="dashboard-number text-2xl font-bold">{
                (Object.values(memoriesByYear) as any[][]).reduce((total, arr) => total + (Array.isArray(arr) ? arr.length : 0), 0)
              }</div>
              <div className="dashboard-label text-sm text-gray-500">Kỷ Niệm</div>
            </div>
            <div className="dashboard-card bg-white rounded-xl shadow border border-pink-100 p-4 flex flex-col items-center">
              <Calendar className="w-8 h-8 text-blue-500 mb-2" />
              <div className="dashboard-number text-2xl font-bold">{allYears.length}</div>
              <div className="dashboard-label text-sm text-gray-500">Năm</div>
            </div>
            <div className="dashboard-card bg-white rounded-xl shadow border border-pink-100 p-4 flex flex-col items-center">
              <span className="inline-block bg-pink-100 rounded-full p-2 mb-2">
                📷
              </span>
              <div className="dashboard-number text-2xl font-bold">{
                (Object.values(memoriesByYear) as any[][]).reduce((total, arr) => total + (Array.isArray(arr) ? arr.reduce((p, m) => p + (Array.isArray(m.images) ? m.images.length : 0), 0) : 0), 0)
              }</div>
              <div className="dashboard-label text-sm text-gray-500">Ảnh</div>
            </div>
            <div className="dashboard-card bg-white rounded-xl shadow border border-pink-100 p-4 flex flex-col items-center">
              <span className="inline-block bg-pink-100 rounded-full p-2 mb-2">
                🕰️
              </span>
              <div className="dashboard-number text-base font-bold">{
                (() => {
                  const allMemories = years.flatMap((y: string) => memoriesByYear[y] || []);
                  <div className="dashboard-number text-2xl font-bold">{years.length}</div>
                  if (allMemories.length === 0) return '--';
                  const firstDate = allMemories[allMemories.length - 1]?.date;
                  const lastDate = allMemories[0]?.date;
                  return `Từ ${firstDate ? formatDate(firstDate) : '--'} đến ${lastDate ? formatDate(lastDate) : '--'}`;
                })()
              }</div>
            </div>
          </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div>
            <YearSectionSkeleton />
            <YearSectionSkeleton />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-red-100 border border-red-300 text-red-700 px-6 py-4 rounded-lg mb-4">
              <p>{error}</p>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-pink-500 hover:bg-pink-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Thử Lại
            </button>
          </div>
        )}

        {/* Empty State - NO DATA AT ALL */}
        {!isLoading && !error && years.length === 0 && (
          <EmptyState
            icon="📸"
            title="Chưa có kỷ niệm nào"
            description="Bắt đầu tạo những kỷ niệm đẹp cùng nhau! Mỗi khoảnh khắc bạn ghi lại sẽ xuất hiện ở đây."
            actionLabel="Tạo Kỷ Niệm Đầu Tiên"
            onAction={() => window.location.href = '/create-memory'}
          />
        )}

        {/* Search and Filter Bar - Show when we have data (even if filtered results = 0) */}
        {!isLoading && !error && years.length > 0 && (
          <>
            <SearchFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
              availableYears={allYears}
              resultCount={resultCount}
            />

            {/* No Results State - Show BELOW search bar when filtered results = 0 */}
            {resultCount === 0 && (
              <EmptyState
                icon="🔍"
                title="Không tìm thấy kỷ niệm"
                description="Thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác."
                actionLabel="Xóa Bộ Lọc"
                onAction={() => {
                  setSearchQuery('');
                  setSelectedYear('ALL');
                }}
              />
            )}

            {/* Memories by Year - Only show when we have filtered results */}
            {resultCount > 0 && (
              <div className="memories-by-year">
            {filteredYears.map((year: string) => (
              <div key={year} className="year-section">
                {/* Year Header */}
                <div className="year-header">
                  <h2 className="year-title">{year}</h2>
                  <div className="year-divider"></div>
                </div>

                {/* Memories for this year */}
                <div className="memory-timeline">
                  {filteredMemoriesByYear[year].map((memory: any, memoryIndex: number) => (
                    <div 
                      key={memory.id} 
                      id={memory.id}
                      className="memory-card memory-card-hover animate-fade-in"
                      style={{ animationDelay: `${memoryIndex * 0.2}s` }}
                    >
                      {/* Memory Card */}
                      <div className="bg-white rounded-3xl shadow-xl border border-pink-100 overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
                        {/* Date Header */}
                        <div className="date-header">
                          <div className="flex items-center justify-center space-x-2 text-white">
                            <Calendar className="w-5 h-5" />
                            <span className="date-text">{formatDate(memory.date)}</span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-8">
                          {/* Title if available */}
                          {memory.title && (
                            <h3 className="memory-title">{memory.title}</h3>
                          )}

                          {/* Date below title */}
                          <div className="memory-date text-xs text-pink-500 font-semibold mb-2 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(memory.date)}</span>
                          </div>

                          {/* Location if available */}
                          {memory.location && (
                            <div className="memory-location">
                              <span>{memory.location}</span>
                            </div>
                          )}

                          <p className="memory-content">
                            {memory.text}
                          </p>

                          {/* Images Grid */}
                          {Array.isArray(memory.images) && memory.images.length > 0 ? (
                            <ResponsiveGallery
                              images={memory.images}
                              onImageClick={(imageUrl, index) => {
                                setAllPhotos(memory.images.map((img: any) => img.secure_url));
                                setSelectedPhoto(imageUrl);
                                setSelectedPhotoIndex(index);
                              }}
                              memoryTitle={memory.title || "Memory"}
                            />
                          ) : (
                            <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                              <p className="text-gray-400 text-sm">📷 No images available</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {/* Infinite Scroll Trigger - Only show when no active search/filter */}
            {!searchQuery && selectedYear === 'ALL' && (
              <InfiniteScrollTrigger 
                onLoadMore={loadMore}
                isLoading={isLoadingMore}
                hasMore={hasMore}
              />
            )}
            </div>
          )}
        </>
        )}

        {/* Lightbox Modal - only render once at the root level */}
        {selectedPhoto && (
          <div 
            className="lightbox-overlay animate-fade-in"
            tabIndex={0}
            onBlur={e => {
              // Only close if focus moves outside the lightbox
              if (!e.currentTarget.contains(e.relatedTarget)) closeLightbox();
            }}
            onClick={e => {
              // Only close if click is on the overlay, not the image or its children
              if (e.target === e.currentTarget) closeLightbox();
            }}
            style={{ outline: 'none' }}
          >
            <div className="lightbox-container">
              {/* Navigation Buttons */}
              {allPhotos.length > 1 && (
                <>
                  <button
                    onClick={() => navigatePhoto('prev')}
                    className="lightbox-nav lightbox-nav-prev"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  <button
                    onClick={() => navigatePhoto('next')}
                    className="lightbox-nav lightbox-nav-next"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </>
              )}

              {/* Main Image (medium size) */}
              <div className="lightbox-image-container">
                <div className="lightbox-image-inner">
                  <img
                    src={selectedPhoto}
                    alt="Memory"
                    className="animate-zoom-in lightbox-main-img"
                  />
                </div>
              </div>
              {/* Photo Counter */}
              {allPhotos.length > 1 && (
                <div className="lightbox-counter">
                  {selectedPhotoIndex + 1} of {allPhotos.length}
                </div>
              )}
              {/* Thumbnails Gallery */}
              {allPhotos.length > 1 && (
                <div className="lightbox-thumbnails-container">
                  <div className="lightbox-thumbnails">
                    {allPhotos.map((photo, index) => (
                      <div 
                        key={index}
                        className={`lightbox-thumbnail ${selectedPhotoIndex === index ? 'active' : ''}`}
                        onClick={() => navigateToPhoto(index)}
                      >
                        <img 
                          src={photo} 
                          alt={`Thumbnail ${index + 1}`}
                          className="thumbnail-img"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Map View Modal */}
        {showMapView && (
          <MapView
            memories={Object.values(memoriesByYear).flat()}
            onMemoryClick={(memory) => {
              setShowMapView(false);
              // Scroll to memory card
              const element = document.getElementById(memory.id);
              element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            onClose={() => setShowMapView(false)}
          />
        )}
      </main>
    </div>
  );
}

export default ViewMemory;