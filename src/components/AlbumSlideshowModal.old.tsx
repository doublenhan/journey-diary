import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

// Determine collection name based on environment
const ENV_PREFIX = import.meta.env.VITE_ENV_PREFIX || '';
const ALBUMS_COLLECTION = `${ENV_PREFIX}albums`;
const MEMORIES_COLLECTION = `${ENV_PREFIX}memories`;

interface AlbumSlideshowModalProps {
  isOpen: boolean;
  onClose: () => void;
  albumId: string | null;
}

interface Memory {
  id: string;
  photos: string[];
}

interface Album {
  id: string;
  memoryIds: string[];
  title?: string;
}

export default function AlbumSlideshowModal({ isOpen, onClose, albumId }: AlbumSlideshowModalProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [albumTitle, setAlbumTitle] = useState('');
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [imageLoadStates, setImageLoadStates] = useState<Record<number, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!isOpen || !albumId) return;

    const fetchMemories = async () => {
      try {
        setLoading(true);
        
        // Fetch album to get memoryIds
        const albumDoc = await getDoc(doc(db, ALBUMS_COLLECTION, albumId));
        if (!albumDoc.exists()) {
          console.error('Album not found');
          setPhotos([]);
          return;
        }
        
        const album = albumDoc.data() as Album;
        setAlbumTitle(album.title || 'Album');
        
        if (!album.memoryIds || album.memoryIds.length === 0) {
          setPhotos([]);
          return;
        }
        
        // Fetch all memories and collect photos
        const allPhotos: string[] = [];
        for (const memoryId of album.memoryIds) {
          const memoryDoc = await getDoc(doc(db, MEMORIES_COLLECTION, memoryId));
          if (memoryDoc.exists()) {
            const memory = memoryDoc.data() as Memory;
            if (memory.photos && memory.photos.length > 0) {
              allPhotos.push(...memory.photos);
            }
          }
        }
        
        setPhotos(allPhotos);
        setCurrentIndex(0);
      } catch (error) {
        console.error('Error fetching memories for slideshow:', error);
      } finally {
        // Add delay to show book opening animation
        setTimeout(() => setLoading(false), 800);
      }
    };

    fetchMemories();
  }, [isOpen, albumId]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        goToPrevious();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === ' ') {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, photos.length]);

  const goToNext = () => {
    if (isAnimating || photos.length === 0) return;
    setDirection('left');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
      setDirection(null);
      setIsAnimating(false);
    }, 700);
  };

  const goToPrevious = () => {
    if (isAnimating || photos.length === 0) return;
    setDirection('right');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
      setDirection(null);
      setIsAnimating(false);
    }, 700);
  };
  // Swipe gesture detection
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentIndex < photos.length - 1) {
      goToNext();
    }
    if (isRightSwipe && currentIndex > 0) {
      goToPrevious();
    }
  };

  // Preload adjacent images
  useEffect(() => {
    if (photos.length === 0) return;
    
    const preloadImage = (index: number) => {
      if (index < 0 || index >= photos.length || imageLoadStates[index]) return;
      
      const img = new Image();
      img.onload = () => {
        setImageLoadStates(prev => ({ ...prev, [index]: true }));
      };
      img.onerror = () => {
        setImageErrors(prev => ({ ...prev, [index]: true }));
      };
      img.src = photos[index];
    };
    
    // Preload current and adjacent images
    preloadImage(currentIndex);
    preloadImage(currentIndex + 1);
    preloadImage(currentIndex - 1);
  }, [currentIndex, photos]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-20 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all duration-300 hover:scale-110 group"
        aria-label="Close album"
      >
        <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Album Title */}
      {!loading && photos.length > 0 && (
        <div className="absolute top-6 left-6 z-20 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full">
          <h2 className="text-white font-semibold text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {albumTitle}
          </h2>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
          {/* Book Opening Animation */}
          <div className="relative">
            <div className="w-32 h-32 relative">
              {/* Left page */}
              <div className="absolute left-0 top-0 w-16 h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-l-lg origin-right animate-[swing_1.5s_ease-in-out_infinite] shadow-2xl" 
                   style={{ transformStyle: 'preserve-3d' }}>
              </div>
              {/* Right page */}
              <div className="absolute right-0 top-0 w-16 h-32 bg-gradient-to-l from-purple-500 to-pink-500 rounded-r-lg origin-left animate-[swing_1.5s_ease-in-out_infinite_0.75s] shadow-2xl"
                   style={{ transformStyle: 'preserve-3d' }}>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
              <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
            </div>
            <p className="text-white text-lg font-medium animate-pulse">Opening album...</p>
            <p className="text-gray-400 text-sm">Loading memories</p>
          </div>
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <div className="mb-6">
            <BookOpen className="w-20 h-20 text-gray-400 mx-auto mb-4 animate-pulse" />
          </div>
          <p className="text-white text-2xl font-semibold mb-2">No photos in this album</p>
          <p className="text-gray-400 text-lg">Add some memories to view the slideshow</p>
        </div>
      ) : (
        <>
          {/* 3D Book Container */}
          <div 
            className="relative w-full h-full flex items-center justify-center py-8 px-4 sm:px-8 md:px-16"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="book-container" style={{ perspective: '3000px' }}>
              <div className={`book ${isAnimating ? 'flipping' : ''}`}>
                {/* Left Page - Hidden on mobile */}
                <div className={`page left-page hidden md:block ${direction === 'left' ? 'flip-left' : direction === 'right' ? 'flip-right' : ''}`}>
                  <div className="page-content">
                    {/* Page texture background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-amber-50 opacity-95"></div>
                    
                    {/* Left page photo - previous photo */}
                    {currentIndex > 0 ? (
                      <div className="relative z-10 h-full flex flex-col items-center justify-center p-8">
                        <div className="polaroid-frame">
                          {/* Progressive loading for previous image */}
                          {!imageLoadStates[currentIndex - 1] && !imageErrors[currentIndex - 1] && (
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse rounded"></div>
                          )}
                          <img
                            src={photos[currentIndex - 1]}
                            alt={`Photo ${currentIndex}`}
                            className={`photo-img transition-opacity duration-300 ${
                              imageLoadStates[currentIndex - 1] ? 'opacity-100' : 'opacity-0'
                            }`}
                            loading="lazy"
                          />
                          <div className="polaroid-caption">
                            <p className="text-gray-700 text-sm font-handwriting">
                              Memory {currentIndex}
                            </p>
                          </div>
                        </div>
                        {/* Page number */}
                        <div className="absolute bottom-4 right-8 text-gray-500 text-sm font-serif">
                          {currentIndex}
                        </div>
                      </div>
                    ) : (
                      <div className="relative z-10 h-full flex items-center justify-center">
                        <div className="text-center p-8">
                          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 font-handwriting text-xl">{albumTitle}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Page edge shadow */}
                    <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-gray-400/20 to-transparent pointer-events-none"></div>
                  </div>
                </div>

                {/* Center Spine - Hidden on mobile */}
                <div className="spine hidden md:block"></div>

                {/* Right Page - Full width on mobile */}
                <div className={`page right-page md:w-1/2 w-full ${direction === 'left' ? 'flip-left' : direction === 'right' ? 'flip-right' : ''}`}>
                  <div className="page-content">
                    {/* Page texture background */}
                    <div className="absolute inset-0 bg-gradient-to-bl from-amber-50 via-white to-amber-50 opacity-95"></div>
                    
                    {/* Right page photo - current photo */}
                    <div className="relative z-10 h-full flex flex-col items-center justify-center p-4 sm:p-8">
                      <div className="polaroid-frame relative">
                        {/* Loading skeleton */}
                        {!imageLoadStates[currentIndex] && !imageErrors[currentIndex] && (
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-12 h-12 border-4 border-gray-300 border-t-amber-400 rounded-full animate-spin"></div>
                            </div>
                          </div>
                        )}
                        
                        {/* Error state */}
                        {imageErrors[currentIndex] && (
                          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded">
                            <div className="text-center p-4">
                              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-500 text-sm">Failed to load image</p>
                            </div>
                          </div>
                        )}
                        
                        <img
                          src={photos[currentIndex]}
                          alt={`Photo ${currentIndex + 1}`}
                          className={`photo-img transition-all duration-500 ${
                            imageLoadStates[currentIndex] ? 'opacity-100 blur-0' : 'opacity-0 blur-md'
                          }`}
                          loading="eager"
                          onLoad={() => setImageLoadStates(prev => ({ ...prev, [currentIndex]: true }))}
                          onError={() => setImageErrors(prev => ({ ...prev, [currentIndex]: true }))}
                        />
                        <div className="polaroid-caption">
                          <p className="text-gray-700 text-xs sm:text-sm font-handwriting">
                            Memory {currentIndex + 1}
                          </p>
                        </div>
                      </div>
                      {/* Page number */}
                      <div className="absolute bottom-4 left-4 sm:left-8 text-gray-500 text-xs sm:text-sm font-serif">
                        {currentIndex + 1}
                      </div>
                      
                      {/* Mobile: Page curl hint at corner */}
                      <div className="md:hidden absolute top-4 right-4 w-12 h-12 pointer-events-none">
                        <div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-r-[40px] border-t-amber-200/60 border-r-transparent rounded-tr-lg shadow-lg"></div>
                      </div>
                    </div>
                    
                    {/* Page edge shadow */}
                    <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-gray-400/20 to-transparent pointer-events-none"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Thumbnail Strip - Netflix Style */}
            {photos.length > 1 && showUI && (
              <div className="relative px-4 pb-6 pt-4">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory">
                  {photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (index !== currentIndex) {
                          setAnimationDirection(index > currentIndex ? 'right' : 'left');
                          setCurrentIndex(index);
                        }
                      }}
                      className={`thumbnail-item snap-center flex-shrink-0 transition-all duration-300 ${
                        index === currentIndex 
                          ? 'scale-110 ring-2 ring-white shadow-xl' 
                          : 'scale-100 opacity-60 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      <img
                        src={photo}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                        loading="lazy"
                      />
                      {index === currentIndex && (
                        <div className="absolute inset-0 border-2 border-white rounded-lg"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          {photos.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                disabled={isAnimating || currentIndex === 0}
                className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 p-3 sm:p-4 bg-amber-100/90 hover:bg-amber-200/90 backdrop-blur-md rounded-full transition-all duration-300 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed group shadow-xl"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 text-amber-900 group-hover:-translate-x-1 transition-transform duration-300" />
              </button>
              <button
                onClick={goToNext}
                disabled={isAnimating || currentIndex === photos.length - 1}
                className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-3 sm:p-4 bg-amber-100/90 hover:bg-amber-200/90 backdrop-blur-md rounded-full transition-all duration-300 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed group shadow-xl"
                aria-label="Next page"
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 text-amber-900 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </>
          )}

          {/* Keyboard Hints */}
          <div className="absolute bottom-6 right-6 flex gap-2 text-xs text-amber-200/80">
            <kbd className="px-2 py-1 bg-amber-100/20 backdrop-blur-sm rounded border border-amber-300/30">←→</kbd>
            <span>Turn page</span>
            <kbd className="px-2 py-1 bg-amber-100/20 backdrop-blur-sm rounded ml-2 border border-amber-300/30">ESC</kbd>
            <span>Close</span>
          </div>
        </>
      )}
    </div>
  );
}
