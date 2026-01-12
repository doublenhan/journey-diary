import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

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
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right'>('right');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [imageLoadStates, setImageLoadStates] = useState<Record<number, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [showUI, setShowUI] = useState(true);
  const [swipeOffset, setSwipeOffset] = useState(0);

  useEffect(() => {
    if (!isOpen || !albumId) return;

    const fetchMemories = async () => {
      try {
        setLoading(true);
        
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
        setLoading(false);
      }
    };

    fetchMemories();
  }, [isOpen, albumId]);

  // Preload images for smooth experience
  useEffect(() => {
    const imagesToPreload = [
      currentIndex - 2,
      currentIndex - 1,
      currentIndex,
      currentIndex + 1,
      currentIndex + 2
    ].filter(idx => idx >= 0 && idx < photos.length);

    imagesToPreload.forEach(idx => {
      if (!imageLoadStates[idx] && !imageErrors[idx]) {
        const img = new Image();
        img.onload = () => {
          setImageLoadStates(prev => ({ ...prev, [idx]: true }));
        };
        img.onerror = () => {
          setImageErrors(prev => ({ ...prev, [idx]: true }));
        };
        img.src = photos[idx];
      }
    });
  }, [currentIndex, photos, imageLoadStates, imageErrors]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, photos.length]);

  const goToNext = () => {
    if (isAnimating || currentIndex >= photos.length - 1) return;
    setAnimationDirection('right');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setIsAnimating(false);
    }, 300);
  };

  const goToPrevious = () => {
    if (isAnimating || currentIndex === 0) return;
    setAnimationDirection('left');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(prev => prev - 1);
      setIsAnimating(false);
    }, 300);
  };

  // Touch handlers for swipe with 3D tilt
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setSwipeOffset(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    
    if (touchStart) {
      const offset = currentTouch - touchStart;
      setSwipeOffset(offset);
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setSwipeOffset(0);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;
    
    if (distance > minSwipeDistance) {
      goToNext();
    } else if (distance < -minSwipeDistance) {
      goToPrevious();
    }
    
    setSwipeOffset(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred Background */}
      {photos.length > 0 && imageLoadStates[currentIndex] && (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-500"
          style={{ 
            backgroundImage: `url(${photos[currentIndex]})`,
            filter: 'blur(40px)',
            transform: 'scale(1.1)'
          }}
        />
      )}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Content */}
      {photos.length > 0 ? (
        <>
          {/* MOBILE UI - Instagram Stories Style */}
          <div className="md:hidden relative w-full h-full flex flex-col">
            {/* Progress Bars */}
            {showUI && (
              <div className="absolute top-0 left-0 right-0 flex gap-1 p-4 z-20">
                {photos.map((_, index) => (
                  <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-white transition-all duration-300 ${
                        index < currentIndex ? 'w-full' : 
                        index === currentIndex ? 'w-full animate-progress' : 'w-0'
                      }`}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Top Bar */}
            {showUI && (
              <div className="absolute top-12 left-0 right-0 flex items-center justify-between px-4 z-20">
                <div className="text-white text-sm font-medium drop-shadow-lg">
                  {albumTitle}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="p-2 bg-black/20 backdrop-blur-md rounded-full transition-all duration-200"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            )}

            {/* Photo - Full Screen */}
            <div 
              className="flex-1 flex items-center justify-center relative"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onClick={() => setShowUI(!showUI)}
            >
              {/* Tap zones for navigation */}
              <div className="absolute inset-0 flex">
                <div 
                  className="w-1/3 h-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                />
                <div className="w-1/3 h-full" />
                <div 
                  className="w-1/3 h-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                />
              </div>

              <div 
                className="w-full h-full flex items-center justify-center px-4"
                style={{
                  transform: swipeOffset !== 0 
                    ? `translateX(${swipeOffset}px) scale(${1 - Math.abs(swipeOffset) * 0.0005})`
                    : 'translateX(0) scale(1)',
                  transition: swipeOffset !== 0 ? 'none' : 'all 0.3s ease-out',
                  opacity: swipeOffset !== 0 ? 1 - Math.abs(swipeOffset) * 0.002 : 1
                }}
              >
                {!imageLoadStates[currentIndex] && !imageErrors[currentIndex] && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
                )}

                <img
                  src={photos[currentIndex]}
                  alt={`Memory ${currentIndex + 1}`}
                  className={`max-w-full max-h-full object-contain transition-opacity duration-500 ${
                    imageLoadStates[currentIndex] ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImageLoadStates(prev => ({ ...prev, [currentIndex]: true }))}
                  onError={() => setImageErrors(prev => ({ ...prev, [currentIndex]: true }))}
                />
              </div>
            </div>

            {/* Bottom Counter */}
            {showUI && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full z-20">
                <span className="text-white text-sm font-medium">
                  {currentIndex + 1} / {photos.length}
                </span>
              </div>
            )}
          </div>

          {/* DESKTOP UI - Netflix Carousel Style */}
          <div 
            className="hidden md:flex relative w-full h-full flex-col"
            onClick={() => setShowUI(!showUI)}
          >
            {/* Top Bar */}
            {showUI && (
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/60 to-transparent z-20 pointer-events-none">
                <div className="text-white text-sm sm:text-base font-medium drop-shadow-lg">
                  {currentIndex + 1} / {photos.length}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all duration-200 pointer-events-auto"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </button>
              </div>
            )}

            {/* Main Photo - Polaroid Style with 3D Tilt */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-16 sm:py-20 perspective-1000 overflow-hidden">
              <div className="relative max-w-5xl w-full max-h-full flex items-center justify-center">
                <div 
                  className={`polaroid-photo-card max-h-[85vh] w-auto max-w-full transition-all duration-300 ${
                    animationDirection === 'left' ? 'animate-slide-left-3d' : 
                    animationDirection === 'right' ? 'animate-slide-right-3d' : ''
                  }`}
                  style={{
                    transform: 'translateX(0) rotateY(0deg) rotateX(0deg) scale(1)',
                    transition: 'all 0.3s ease-out'
                  }}
                >
                  {/* Loading skeleton */}
                  {!imageLoadStates[currentIndex] && !imageErrors[currentIndex] && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg animate-pulse">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Error state */}
                  {imageErrors[currentIndex] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-lg">
                      <div className="text-gray-500 text-center">
                        <svg className="w-16 h-16 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm">Image unavailable</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Photo */}
                  <img
                    src={photos[currentIndex]}
                    alt={`Memory ${currentIndex + 1}`}
                    className={`w-auto max-w-full h-auto max-h-[calc(85vh-120px)] object-contain rounded-t-lg transition-all duration-500 ${
                      imageLoadStates[currentIndex] ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => setImageLoadStates(prev => ({ ...prev, [currentIndex]: true }))}
                    onError={() => setImageErrors(prev => ({ ...prev, [currentIndex]: true }))}
                  />
                  
                  {/* Polaroid caption bar */}
                  <div className="polaroid-caption-bar">
                    <p className="text-sm text-gray-600 font-handwriting text-center truncate px-4">
                      {albumTitle} - Photo {currentIndex + 1}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Thumbnail Strip - Netflix Style */}
            {photos.length > 1 && showUI && (
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-8 bg-gradient-to-t from-black/60 to-transparent z-20">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-2">
                  {photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (index !== currentIndex && !isAnimating) {
                          setAnimationDirection(index > currentIndex ? 'right' : 'left');
                          setCurrentIndex(index);
                        }
                      }}
                      className={`thumbnail-card snap-center flex-shrink-0 transition-all duration-300 ${
                        index === currentIndex 
                          ? 'scale-110 ring-2 ring-white shadow-2xl' 
                          : 'scale-100 opacity-60 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={photo}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                          loading="lazy"
                        />
                        {index === currentIndex && (
                          <div className="absolute inset-0 border-2 border-white rounded-lg pointer-events-none"></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons - Desktop Only */}
          {photos.length > 1 && showUI && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                disabled={isAnimating || currentIndex === 0}
                className="hidden md:block absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all duration-200 disabled:opacity-0 disabled:pointer-events-none z-20"
                aria-label="Previous"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-lg" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                disabled={isAnimating || currentIndex === photos.length - 1}
                className="hidden md:block absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all duration-200 disabled:opacity-0 disabled:pointer-events-none z-20"
                aria-label="Next"
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-lg" />
              </button>
            </>
          )}
        </>
      ) : loading ? (
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading memories...</p>
        </div>
      ) : (
        <div className="text-white text-center">
          <p className="text-xl">No photos in this album</p>
        </div>
      )}
    </div>
  );
}
