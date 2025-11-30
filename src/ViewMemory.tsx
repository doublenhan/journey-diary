import { useState, useEffect } from 'react';
import { useMemoriesCache } from './hooks/useMemoriesCache';
import { Heart, Calendar, ArrowLeft, ChevronLeft, ChevronRight, Loader } from 'lucide-react';
// import { cloudinaryApi, type SavedMemory } from './apis/cloudinaryGalleryApi';
import { useCurrentUserId } from './hooks/useCurrentUserId';
import './styles/ViewMemory.css';

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
  location?: string;
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
  currentTheme: 'happy' | 'calm' | 'romantic';
}

const themes = {
  happy: {
    background: 'linear-gradient(135deg, #FFFDE4 0%, #FFF 50%, #FEF08A 100%)',
    cardBg: '#fff',
    textPrimary: '#78350f',
    border: '#FEF08A',
  },
  calm: {
    background: 'linear-gradient(135deg, #EEF2FF 0%, #FFF 50%, #E0E7FF 100%)',
    cardBg: '#fff',
    textPrimary: '#3730a3',
    border: '#E0E7FF',
  },
  romantic: {
    background: 'linear-gradient(135deg, #FDF2F8 0%, #FFF 50%, #FCE7F3 100%)',
    cardBg: '#fff',
    textPrimary: '#831843',
    border: '#FCE7F3',
  }
};
function ViewMemory({ onBack, currentTheme }: ViewMemoryProps) {
  // All hooks must come first
  const { userId, loading } = useCurrentUserId();
  const { memoriesByYear, years, isLoading, error } = useMemoriesCache(userId, loading);
  // Remove unused floatingHearts state
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [allPhotos, setAllPhotos] = useState<string[]>([]);
  const theme = themes[currentTheme];

  // Log all memory images for debugging after fetching
  useEffect(() => {
    // Memory images fetched successfully
  }, [memoriesByYear]);

  // Fetch memories from Cloudinary
  // TODO: Add useEffect here to fetch memories from the API if needed


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  // Removed unused createFloatingHeart function

  return (
    <div className="view-memory-page" style={{ background: theme.background, color: theme.textPrimary }}>
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button 
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-700 hover:text-pink-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Quay Lại</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-2 rounded-xl">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                Love Journal
              </span>
            </div>
            
            <div className="w-16"></div>
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
            Mỗi khoảnh khắc chúng ta chia sẻ, mỗi lần cười, mỗi cuộc phiêu lưu - tất cả đều được lưu lại ở câu chuyện tình yêu kỹ thuậc về chúng ta.
          </p>
        </div>

        {/* Dashboard: Your Love Story by the Numbers */}
        <div className="love-story-dashboard mb-8">
          <h2 className="dashboard-title text-xl font-bold mb-4 text-pink-600">Câu Chuyện Tình Yêu Của Bạn Trong Số Liệu</h2>
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
              <div className="dashboard-number text-2xl font-bold">{years.length}</div>
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
                  if (allMemories.length === 0) return '--';
                  const firstDate = allMemories[allMemories.length - 1]?.date;
                  const lastDate = allMemories[0]?.date;
                  return `Từ ${firstDate ? formatDate(firstDate) : '--'} đến ${lastDate ? formatDate(lastDate) : '--'}`;
                })()
              }</div>

            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader className="w-10 h-10 text-pink-500 animate-spin mb-4" />
            <p className="text-lg text-gray-600">Đang tải những kỷ niệm quý giá của bạn...</p>
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

        {/* Empty State */}
        {!isLoading && !error && years.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
              <Heart className="w-16 h-16 text-pink-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2 text-gray-800">Chưa Có Kỷ Niệm Nào</h3>
              <p className="text-gray-600 mb-6">
                Bắt đầu tạo những kỷ niệm đẹp cùng nhau! Mỗi kỷ niệm sẽ xuất hiện ở đây.
              </p>
              <a 
                href="/create-memory" 
                className="inline-block bg-pink-500 hover:bg-pink-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Tạo Kỷ Niệm Đầu Tiên
              </a>
            </div>
          </div>
        )}

        {/* Memories by Year */}
        {!isLoading && !error && years.length > 0 && (
          <div className="memories-by-year">
            {years.map((year: string) => (
              <div key={year} className="year-section">
                {/* Year Header */}
                <div className="year-header">
                  <h2 className="year-title">{year}</h2>
                  <div className="year-divider"></div>
                </div>

                {/* Memories for this year */}
                <div className="memory-timeline">
                  {memoriesByYear[year].map((memory: any, memoryIndex: number) => (
                    <div 
                      key={memory.id} 
                      className="memory-card animate-fade-in"
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
                          {Array.isArray(memory.images) && memory.images.length > 0 && (
                            <div className="relative">
                              <div className="photo-grid">
                                {memory.images.slice(0, 3).map((image: any, imageIndex: number) => (
                                  <div
                                    key={image.public_id}
                                    className="gradient-border-image-rounded transform hover:scale-105 transition-all duration-300"
                                    onClick={() => {
                                      setAllPhotos(memory.images.map((img: any) => img.secure_url));
                                      setSelectedPhoto(image.secure_url);
                                      setSelectedPhotoIndex(imageIndex);
                                    }}
                                  >
                                    <div className="gradient-border-inner">
                                      <img
                                        src={image.secure_url}
                                        alt={`${memory.title || "Memory"} ${imageIndex + 1}`}
                                        className="photo-img enhanced-photo-img"
                                        onError={e => { e.currentTarget.style.display = 'none'; }}
                                      />
                                    </div>
                                  </div>
                                ))}
                                {memory.images.length > 3 && (
                                  <button
                                    className="view-all-photos-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAllPhotos(memory.images.map((img: any) => img.secure_url));
                                      setSelectedPhoto(memory.images[3].secure_url);
                                      setSelectedPhotoIndex(3);
                                    }}
                                  >
                                    +{memory.images.length - 3} ảnh
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
      </main>
    </div>
  );
}

export default ViewMemory;