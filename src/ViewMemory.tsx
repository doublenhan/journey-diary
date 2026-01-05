import { useState, useEffect, useMemo } from 'react';
import { useInfiniteMemories } from './hooks/useInfiniteMemories';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { useLanguage } from './hooks/useLanguage';
import { useToast } from './hooks/useToast';
import { Heart, Calendar, ArrowLeft, ChevronLeft, ChevronRight, Map, Share2, Edit, Image, Clock, BarChart3, X } from 'lucide-react';
// import { cloudinaryApi, type SavedMemory } from './apis/cloudinaryGalleryApi';
import { useCurrentUserId } from './hooks/useCurrentUserId';
import { MoodTheme, themes } from './config/themes';
import VisualEffects from './components/VisualEffects';
import { useSyncStatus } from './hooks/useSyncStatus';
import SyncStatus from './components/SyncStatus';
import { EmptyState } from './components/EmptyState';
import { YearSectionSkeleton, DashboardSkeleton } from './components/LoadingSkeleton';
import { WebPImage } from './components/WebPImage';
import { InfiniteScrollTrigger } from './components/InfiniteScrollTrigger';
import { EnhancedSearchFilter } from './components/EnhancedSearchFilter';
import { ResponsiveGallery } from './components/ResponsiveGallery';
import { MapView } from './components/MapView';
import { EditMemoryModal } from './components/EditMemoryModal';
import { ShareMemory } from './components/ShareMemory';
import { MemoryStatistics } from './components/MemoryStatistics';
import { ShareMemoryButton } from './components/Couple';
import { useCouple } from './hooks/useCouple';
import { useSharedMemories } from './hooks/useSharedMemories';
import { sanitizePlainText, sanitizeRichText } from './utils/sanitize';

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
  const { toasts: _, removeToast: __, error: showError } = useToast();
  const { userId, loading } = useCurrentUserId();
  const { memoriesByYear, years, allYears, isLoading, isLoadingMore, error, hasMore, loadMore } = useInfiniteMemories(userId, loading);
  const { syncStatus, lastSyncTime, errorMessage, startSync, syncSuccess, syncError } = useSyncStatus();
  const { t } = useLanguage();
  const { couple, shareMemory: shareCoupleMemory, unshare: unshareCoupleMemory } = useCouple(userId || undefined);
  const { isMemoryShared, allMemories: sharedMemoriesData } = useSharedMemories(userId || undefined, couple?.coupleId);
  // Remove unused floatingHearts state
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [allPhotos, setAllPhotos] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showMapView, setShowMapView] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [shareModalMemory, setShareModalMemory] = useState<Memory | null>(null);
  const [showStatistics, setShowStatistics] = useState(false);
  const theme = themes[currentTheme];

  // Show sync status when loading memories
  useEffect(() => {
    if (isLoading && !loading) {
      startSync();
    } else if (!isLoading && !loading) {
      if (error) {
        syncError(error);
        showError(error);
      } else {
        // Always call syncSuccess when loading completes, even with no data
        syncSuccess();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, loading, error]);

  // Log all memory images for debugging after fetching
  useEffect(() => {
    // Memory images fetched successfully
  }, [memoriesByYear]);

  // Fetch memories from Cloudinary
  // TODO: Add useEffect here to fetch memories from the API if needed


  const formatDate = (dateString: string) => {
    // Safety check: return as-is if dateString is invalid
    if (!dateString || typeof dateString !== 'string') {
      return dateString || '';
    }
    
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
      const nextImg = new window.Image();
      const prevImg = new window.Image();
      nextImg.src = allPhotos[nextIndex];
      prevImg.src = allPhotos[prevIndex];
    };
    
    preloadImages();
  }, [selectedPhotoIndex, allPhotos]);

  // Handle keyboard navigation for lightbox (ESC, Arrow keys)
  useEffect(() => {
    if (!selectedPhoto) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        navigatePhoto('prev');
      } else if (e.key === 'ArrowRight') {
        navigatePhoto('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, allPhotos, selectedPhotoIndex]);

  // Debounce search query for better performance
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  // Extract available locations and tags from all memories
  const { availableLocations, availableTags } = useMemo(() => {
    const locations = new Set<string>();
    const tags = new Set<string>();

    Object.values(memoriesByYear).forEach(memories => {
      memories.forEach(memory => {
        if (memory.location) locations.add(memory.location);
        if (memory.tags) memory.tags.forEach(tag => tags.add(tag));
      });
    });

    return {
      availableLocations: Array.from(locations).sort(),
      availableTags: Array.from(tags).sort()
    };
  }, [memoriesByYear]);

  // Merge own memories with shared memories
  const allMemoriesByYear = useMemo(() => {
    const merged = { ...memoriesByYear };
    
    // Add shared memories (already extracted from memoryData)
    sharedMemoriesData.forEach(sharedMemory => {
      const date = sharedMemory.date || sharedMemory.created_at;
      if (!date) {
        return;
      }
      
      const year = new Date(date.toMillis ? date.toMillis() : date).getFullYear().toString();
      
      if (!merged[year]) {
        merged[year] = [];
      }
      
      // Add shared indicator to memory
      merged[year].push({
        ...sharedMemory,
        isSharedWithMe: true,
        sharedByPartner: true
      } as any);
    });
    
    // Sort memories within each year
    Object.keys(merged).forEach(year => {
      merged[year].sort((a, b) => {
        const dateA = new Date(a.date || a.created_at || new Date()).getTime();
        const dateB = new Date(b.date || b.created_at || new Date()).getTime();
        return dateB - dateA; // Descending order
      });
    });
    
    return merged;
  }, [memoriesByYear, sharedMemoriesData]);

  // Get all unique years from both own and shared memories
  const allUniqueYears = useMemo(() => {
    const yearsSet = new Set([
      ...years,
      ...Object.keys(allMemoriesByYear)
    ]);
    return Array.from(yearsSet).sort((a, b) => parseInt(b) - parseInt(a));
  }, [years, allMemoriesByYear]);

  // Filter memories based on search and year
  const filteredMemoriesByYear = useMemo(() => {
    let filtered = { ...allMemoriesByYear };

    // Filter by year first
    if (selectedYear !== 'ALL') {
      filtered = { [selectedYear]: filtered[selectedYear] || [] };
    }

    // Apply all filters
    filtered = Object.entries(filtered).reduce((acc, [year, memories]) => {
      const matched = memories.filter(m => {
        // Search filter: title, text, location, and date
        if (debouncedSearch.trim()) {
          const searchLower = debouncedSearch.toLowerCase();
          const titleMatch = m.title?.toLowerCase().includes(searchLower) || false;
          const textMatch = m.text?.toLowerCase().includes(searchLower) || false;
          const locationMatch = m.location?.toLowerCase().includes(searchLower) || false;
          const dateMatch = m.date?.includes(debouncedSearch) || false;
          
          if (!(titleMatch || textMatch || locationMatch || dateMatch)) return false;
        }

        // Date range filter (inclusive)
        if (dateRange.start && m.date < dateRange.start) return false;
        if (dateRange.end && m.date > dateRange.end) return false;

        // Location filter
        if (selectedLocation && m.location !== selectedLocation) return false;

        // Tags filter (memory must have ALL selected tags)
        if (selectedTags.length > 0) {
          const memoryTags = m.tags || [];
          if (!selectedTags.every(tag => memoryTags.includes(tag))) return false;
        }

        return true;
      });
      
      if (matched.length > 0) acc[year] = matched;
      return acc;
    }, {} as MemoriesByYear);

    return filtered;
  }, [allMemoriesByYear, debouncedSearch, selectedYear, dateRange, selectedLocation, selectedTags]);

  // Calculate total result count
  const resultCount = useMemo(() => {
    return Object.values(filteredMemoriesByYear).reduce((sum, memories) => sum + memories.length, 0);
  }, [filteredMemoriesByYear]);

  const filteredYears = useMemo(() => {
    return Object.keys(filteredMemoriesByYear).sort((a, b) => parseInt(b) - parseInt(a));
  }, [filteredMemoriesByYear]);


  // Removed unused createFloatingHeart function

  // Default visual effects settings
  const effectsEnabled = {
    fireworks: false,
    colorMorph: false,
    rippleWave: false,
    floatingBubbles: false,
    magneticCursor: false,
    gradientMesh: false
  };
  const animationSpeed = 50;

  return (
    <div className="min-h-screen" style={{ background: theme.background, color: theme.textPrimary }}>
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
              title={t('common.back')}
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
              {/* Statistics Button */}
              <button
                onClick={() => setShowStatistics(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-white border border-pink-200 rounded-lg hover:bg-pink-50 transition-colors"
                title="View Statistics"
              >
                <BarChart3 className="w-4 h-4 text-pink-600" />
                <span className="text-sm font-medium text-gray-700">Stats</span>
              </button>

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
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            {t('memory.viewTitle')}<br />
            <span className="text-3xl sm:text-4xl bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent"> {t('landing.gallerySubtitle')}</span> 
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('landing.heroSubtitle')}
          </p>
        </div>

        {/* Dashboard: Your Love Story by the Numbers */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-pink-600">{t('memory.statistics')}</h2>
          {isLoading ? (
            <DashboardSkeleton />
          ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow border border-pink-100 p-4 flex flex-col items-center">
              <Heart className="w-8 h-8 text-pink-500 mb-2" />
              <div className="text-2xl font-bold">{
                (Object.values(memoriesByYear) as any[][]).reduce((total, arr) => total + (Array.isArray(arr) ? arr.length : 0), 0)
              }</div>
              <div className="text-sm text-gray-500">{t('memory.totalMemories')}</div>
            </div>
            <div className="bg-white rounded-xl shadow border border-pink-100 p-4 flex flex-col items-center">
              <Calendar className="w-8 h-8 text-pink-500 mb-2" />
              <div className="text-2xl font-bold">{allYears.length}</div>
              <div className="text-sm text-gray-500">{t('common.all')}</div>
            </div>
            <div className="bg-white rounded-xl shadow border border-pink-100 p-4 flex flex-col items-center">
              <Image className="w-8 h-8 text-pink-600 mb-2" />
              <div className="text-2xl font-bold">{
                (Object.values(memoriesByYear) as any[][]).reduce((total, arr) => total + (Array.isArray(arr) ? arr.reduce((p, m) => p + (Array.isArray(m.images) ? m.images.length : 0), 0) : 0), 0)
              }</div>
              <div className="text-sm text-gray-500">{t('memory.withPhotos')}</div>
            </div>
            <div className="bg-white rounded-xl shadow border border-pink-100 p-4 flex flex-col items-center">
              <Clock className="w-8 h-8 text-pink-600 mb-2" />
              <div className="text-base font-bold">{
                (() => {
                  const allMemories = years.flatMap((y: string) => memoriesByYear[y] || []);
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
            title={t('memory.noMemories')}
            description={t('memory.noMemoriesDesc')}
            actionLabel={t('nav.create')}
            onAction={() => window.location.href = '/create-memory'}
          />
        )}

        {/* Search and Filter Bar - Show when we have data (own OR shared) */}
        {!isLoading && !error && (years.length > 0 || sharedMemoriesData.length > 0) && (
          <div>
            <EnhancedSearchFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
              availableYears={allUniqueYears}
              resultCount={resultCount}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              selectedLocation={selectedLocation}
              onLocationChange={setSelectedLocation}
              availableLocations={availableLocations}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              availableTags={availableTags}
            />

            {/* No Results State - Show BELOW search bar when filtered results = 0 */}
            {resultCount === 0 && (
              <EmptyState
                icon="🔍"
                title={t('memory.noMemories')}
                description={t('memory.searchPlaceholder')}
                actionLabel={t('common.refresh')}
                onAction={() => {
                  setSearchQuery('');
                  setSelectedYear('ALL');
                  setDateRange({ start: '', end: '' });
                  setSelectedLocation('');
                  setSelectedTags([]);
                }}
              />
            )}

            {/* Memories by Year - Only show when we have filtered results */}
            {resultCount > 0 && (
              <div className="space-y-12">
            {filteredYears.map((year: string) => (
              <div key={year} className="mb-12">
                {/* Year Header */}
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">{year}</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-pink-300 via-rose-300 to-transparent"></div>
                </div>

                {/* Memories for this year */}
                <div className="space-y-8">
                  {filteredMemoriesByYear[year]?.map((memory: any, memoryIndex: number) => (
                    <div 
                      key={memory.id} 
                      id={memory.id}
                      className="opacity-0 animate-[fade-in-up_0.6s_ease-out_forwards]"
                      style={{ animationDelay: `${memoryIndex * 0.1}s` }}
                    >
                      {/* Memory Card */}
                      <div className="bg-white rounded-3xl shadow-xl border border-pink-100 overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
                        {/* Shared Memory Badge */}
                        {memory.isSharedWithMe && (
                          <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2">
                            <p className="text-white text-sm font-bold flex items-center gap-2">
                              <Heart className="w-4 h-4" fill="currentColor" />
                              Shared by {memory.sharedInfo?.ownerName || 'Partner'}
                            </p>
                          </div>
                        )}
                        
                        {/* Date Header */}
                        <div className="relative bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-4">
                          <div className="flex items-center justify-between">
                            {/* Left: Date */}
                            <div className="flex items-center space-x-2 text-white">
                              <Calendar className="w-5 h-5" />
                              <span className="font-semibold text-lg">{formatDate(memory.date)}</span>
                            </div>
                            
                            {/* Right: Action buttons */}
                            <div className="flex items-center gap-2 z-10">
                              {/* Hide share and edit buttons for shared memories */}
                              {!memory.isSharedWithMe && (
                                <>
                                  {/* Couple Share Button */}
                                  {couple && (
                                    <ShareMemoryButton
                                      memoryId={memory.id}
                                      isShared={isMemoryShared(memory.id)}
                                      partnerName={couple.partnerName}
                                      onShare={async () => {
                                        try {
                                          const result = await shareCoupleMemory({ memoryId: memory.id });
                                          if (!result.success && result.error) {
                                            showError(result.error);
                                          }
                                        } catch (err) {
                                          showError(err instanceof Error ? err.message : 'Failed to share memory');
                                        }
                                      }}
                                      onUnshare={async () => {
                                        try {
                                          const result = await unshareCoupleMemory(memory.id);
                                          if (!result.success && result.error) {
                                            showError(result.error);
                                          }
                                        } catch (err) {
                                          showError(err instanceof Error ? err.message : 'Failed to unshare memory');
                                        }
                                      }}
                                    />
                                  )}
                                  
                                  <button
                                    onClick={() => setShareModalMemory(memory)}
                                    className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                                    title="Share memory"
                                  >
                                    <Share2 size={18} className="text-pink-600" />
                                  </button>
                                  <button
                                    onClick={() => setEditingMemory(memory)}
                                    className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                                    title="Edit memory"
                                  >
                                    <Edit size={18} className="text-pink-600" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-8">
                          {/* Title if available */}
                          {memory.title && (
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">{sanitizePlainText(memory.title)}</h3>
                          )}

                          {/* Date below title */}
                          <div className="text-xs text-pink-500 font-semibold mb-2 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(memory.date)}</span>
                          </div>

                          {/* Location if available */}
                          {memory.location && (
                            <div className="inline-flex items-center gap-1 px-3 py-1 bg-pink-50 text-pink-700 rounded-full text-sm font-medium mb-4">
                              <span>{sanitizePlainText(memory.location)}</span>
                            </div>
                          )}

                          <p 
                            className="text-gray-700 leading-relaxed mb-6 whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: sanitizeRichText(memory.text) }}
                          />

                          {/* Images Grid */}
                          {(() => {
                            // Handle both string URLs and object formats
                            const validImages = Array.isArray(memory.images) 
                              ? memory.images
                                  .filter((img: any) => {
                                    // Filter valid images (strings or objects with URL)
                                    if (typeof img === 'string') return img.length > 0;
                                    return img?.secure_url || img?.url;
                                  })
                                  .map((img: any) => {
                                    // Convert to object format if it's a string
                                    if (typeof img === 'string') {
                                      return {
                                        secure_url: img,
                                        public_id: '',
                                        width: 0,
                                        height: 0
                                      };
                                    }
                                    // Normalize object format
                                    return {
                                      ...img,
                                      secure_url: img.secure_url || img.url
                                    };
                                  })
                              : [];
                            
                            return validImages.length > 0 ? (
                              <ResponsiveGallery
                                images={validImages}
                                onImageClick={(imageUrl, index) => {
                                  const imageUrls = validImages.map((img: any) => img.secure_url);
                                  setAllPhotos(imageUrls);
                                  setSelectedPhoto(imageUrl);
                                  setSelectedPhotoIndex(index);
                                }}
                                memoryTitle={memory.title || "Memory"}
                              />
                            ) : (
                              <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                <p className="text-gray-400 text-sm">📷 No images available</p>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            </div>
          )}
            
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

        {/* Lightbox Modal - only render once at the root level */}
        {selectedPhoto && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center animate-[fade-in_0.3s_ease-out]"
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
            <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
              {/* Close Button */}
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 z-20 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all hover:scale-110 group"
                title="Đóng (ESC)"
              >
                <X className="w-6 h-6 text-white group-hover:text-pink-300" />
              </button>
              
              {/* Navigation Buttons */}
              {allPhotos.length > 1 && (
                <>
                  <button
                    onClick={() => navigatePhoto('prev')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all hover:scale-110"
                  >
                    <ChevronLeft className="w-8 h-8 text-white" />
                  </button>
                  <button
                    onClick={() => navigatePhoto('next')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all hover:scale-110"
                  >
                    <ChevronRight className="w-8 h-8 text-white" />
                  </button>
                </>
              )}

              {/* Main Image (medium size) */}
              <div className="flex-1 flex items-center justify-center max-w-5xl max-h-[80vh]">
                <div className="relative w-full h-full flex items-center justify-center">
                  <WebPImage
                    src={selectedPhoto}
                    alt="Memory"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-[zoom-in_0.3s_ease-out]"
                    loading="eager"
                  />
                </div>
              </div>
              {/* Photo Counter */}
              {allPhotos.length > 1 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-sm text-white rounded-full text-sm font-medium">
                  {selectedPhotoIndex + 1} of {allPhotos.length}
                </div>
              )}
              {/* Thumbnails Gallery */}
              {allPhotos.length > 1 && (
                <div className="w-full max-w-5xl mt-4 px-4">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-pink-500 scrollbar-track-gray-700">
                    {allPhotos.map((photo, index) => (
                      <div 
                        key={index}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                          selectedPhotoIndex === index 
                            ? 'border-pink-500 ring-2 ring-pink-400 scale-110' 
                            : 'border-white/30 hover:border-pink-400 opacity-70 hover:opacity-100'
                        }`}
                        onClick={() => navigateToPhoto(index)}
                      >
                        <WebPImage
                          src={photo}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
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
        {showMapView && userId && (
          <MapView
            userId={userId}
            onClose={() => setShowMapView(false)}
          />
        )}

        {/* Edit Memory Modal */}
        {editingMemory && userId && (
          <EditMemoryModal
            memory={editingMemory}
            userId={userId}
            onClose={() => setEditingMemory(null)}
            onSuccess={() => {
              setEditingMemory(null);
              // Cache will be invalidated by the modal, triggering refresh
            }}
          />
        )}

        {/* Share Memory Modal */}
        {shareModalMemory && (
          <ShareMemory
            memory={shareModalMemory}
            onClose={() => setShareModalMemory(null)}
            theme={{
              colors: {
                primary: theme.textPrimary,
                secondary: '#6B7280',
                background: theme.background
              }
            }}
          />
        )}

        {/* Memory Statistics Modal */}
        {showStatistics && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowStatistics(false)}>
            <div className="relative max-w-6xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowStatistics(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
              <MemoryStatistics
                memories={Object.values(memoriesByYear).flat()}
                theme={{
                  colors: {
                    primary: theme.textPrimary,
                    secondary: '#6B7280'
                  }
                }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ViewMemory;