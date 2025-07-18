import React, { useState, useEffect } from 'react';
import { Heart, Calendar, ArrowLeft, X, ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import { cloudinaryApi, type SavedMemory } from './api/cloudinaryGalleryApi';
import './styles/ViewMemory.css';

// Update Memory interface to match SavedMemory from the API
interface Memory {
  id: string;
  title: string;
  date: string;
  text: string;
  location?: string;
  photos: string[];
}

interface MemoriesByYear {
  [year: string]: Memory[];
}

interface ViewMemoryProps {
  onBack?: () => void;
}

function ViewMemory({ onBack }: ViewMemoryProps) {
  const [memoriesByYear, setMemoriesByYear] = useState<MemoriesByYear>({});
  const [years, setYears] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [allPhotos, setAllPhotos] = useState<string[]>([]);
  const [floatingHearts, setFloatingHearts] = useState<Array<{ id: number; x: number; y: number }>>([]);

  // Fetch memories from Cloudinary
  useEffect(() => {
    const fetchMemories = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch memories from the API
        const response = await cloudinaryApi.getMemories();
        const fetchedMemories = response.memories;
        
        // Transform API response to match our Memory interface
        const transformedMemories: Memory[] = fetchedMemories.map((memory: SavedMemory) => ({
          id: memory.id,
          title: memory.title,
          date: memory.date,
          text: memory.text,
          location: memory.location || undefined,
          // Map the Cloudinary images to their URLs
          photos: memory.images.map(img => img.secure_url)
        }));
        
        // Group memories by year
        const groupedMemories: MemoriesByYear = {};
        
        transformedMemories.forEach((memory: Memory) => {
          const year = new Date(memory.date).getFullYear().toString();
          
          if (!groupedMemories[year]) {
            groupedMemories[year] = [];
          }
          
          groupedMemories[year].push(memory);
        });
        
        // Sort memories within each year by date (newest first)
        Object.keys(groupedMemories).forEach(year => {
          groupedMemories[year].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        });
        
        // Get sorted years (newest first)
        const sortedYears = Object.keys(groupedMemories).sort((a, b) => parseInt(b) - parseInt(a));
        
        setMemoriesByYear(groupedMemories);
        setYears(sortedYears);
        
        // Collect all photos for lightbox navigation
        const photos = transformedMemories.flatMap((memory: Memory) => memory.photos);
        setAllPhotos(photos);
      } catch (err) {
        console.error('Failed to fetch memories:', err);
        setError('Failed to load memories. Please try again later.');
        
        // Set empty states
        setMemoriesByYear({});
        setYears([]);
        setAllPhotos([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMemories();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const openLightbox = (photo: string) => {
    setSelectedPhoto(photo);
    setSelectedPhotoIndex(allPhotos.indexOf(photo));
  };

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

  const createFloatingHeart = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const heartId = Date.now() + Math.random();
    setFloatingHearts(prev => [...prev, { id: heartId, x, y }]);
    
    // Remove heart after animation
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(heart => heart.id !== heartId));
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button 
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-700 hover:text-pink-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
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
            Our Love
            <span className="gradient-text"> Memories</span>
          </h1>
          <p className="page-subtitle">
            Every moment we've shared, every laugh, every adventure - all captured here in our digital love story.
          </p>
        </div>

        {/* Dashboard: Your Love Story by the Numbers */}
        <div className="love-story-dashboard mb-8">
          <h2 className="dashboard-title text-xl font-bold mb-4 text-pink-600">Your Love Story by the Numbers</h2>
          <div className="dashboard-grid grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="dashboard-card bg-white rounded-xl shadow border border-pink-100 p-4 flex flex-col items-center">
              <Heart className="w-8 h-8 text-pink-500 mb-2" />
              <div className="dashboard-number text-2xl font-bold">{
                Object.values(memoriesByYear).reduce((total, arr) => total + arr.length, 0)
              }</div>
              <div className="dashboard-label text-sm text-gray-500">Memories</div>
            </div>
            <div className="dashboard-card bg-white rounded-xl shadow border border-pink-100 p-4 flex flex-col items-center">
              <Calendar className="w-8 h-8 text-blue-500 mb-2" />
              <div className="dashboard-number text-2xl font-bold">{years.length}</div>
              <div className="dashboard-label text-sm text-gray-500">Years</div>
            </div>
            <div className="dashboard-card bg-white rounded-xl shadow border border-pink-100 p-4 flex flex-col items-center">
              <span className="inline-block bg-pink-100 rounded-full p-2 mb-2">
                📷
              </span>
              <div className="dashboard-number text-2xl font-bold">{
                Object.values(memoriesByYear).reduce((total, arr) => total + arr.reduce((p, m) => p + m.photos.length, 0), 0)
              }</div>
              <div className="dashboard-label text-sm text-gray-500">Photos</div>
            </div>
            <div className="dashboard-card bg-white rounded-xl shadow border border-pink-100 p-4 flex flex-col items-center">
              <span className="inline-block bg-pink-100 rounded-full p-2 mb-2">
                🕰️
              </span>
              <div className="dashboard-number text-base font-bold">{
                (() => {
                  const allMemories = years.flatMap(y => memoriesByYear[y] || []);
                  if (allMemories.length === 0) return '--';
                  const firstDate = allMemories[allMemories.length - 1]?.date;
                  const lastDate = allMemories[0]?.date;
                  return `From ${firstDate ? formatDate(firstDate) : '--'} to ${lastDate ? formatDate(lastDate) : '--'}`;
                })()
              }</div>

            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader className="w-10 h-10 text-pink-500 animate-spin mb-4" />
            <p className="text-lg text-gray-600">Loading your precious memories...</p>
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
              Try Again
            </button>
          </div>
        )}

        {/* Memories by Year */}
        {!isLoading && !error && years.length > 0 && (
          <div className="memories-by-year">
            {years.map(year => (
              <div key={year} className="year-section">
                {/* Year Header */}
                <div className="year-header">
                  <h2 className="year-title">{year}</h2>
                  <div className="year-divider"></div>
                </div>

                {/* Memories for this year */}
                <div className="memory-timeline">
                  {memoriesByYear[year].map((memory, memoryIndex) => (
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

                          {/* Photos Grid */}
                          {memory.photos.length > 0 && (
                            <div className="relative">
                              <div className="photo-grid">
                                {memory.photos.map((photo, photoIndex) => (
                                  <div
                                    key={photoIndex}
                                    className="photo-item transform hover:scale-105 transition-all duration-300"
                                    onClick={(e) => {
                                      createFloatingHeart(e);
                                      setAllPhotos(memory.photos);
                                      setSelectedPhoto(photo);
                                      setSelectedPhotoIndex(photoIndex);
                                    }}
                                  >
                                    <img
                                      src={photo}
                                      alt={`${memory.title || "Memory"} ${photoIndex + 1}`}
                                      className="photo-img"
                                    />
                                    <div className="photo-overlay" />
                                  </div>
                                ))}
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

        {/* Empty State */}
        {!isLoading && !error && years.length === 0 && (
          <div className="empty-state">
            <Heart className="empty-state-icon" />
            <h3 className="empty-state-title">No memories yet</h3>
            <p className="empty-state-text">Start creating beautiful memories together!</p>
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="lightbox-overlay animate-fade-in">
          <div className="lightbox-container">
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="lightbox-close"
            >
              <X className="w-8 h-8" />
            </button>

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

            {/* Main Image */}
            <img
              src={selectedPhoto}
              alt="Memory"
              className="lightbox-image animate-zoom-in"
            />

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
    </div>
  );
}

export default ViewMemory;