import { useState, useRef, useEffect } from 'react';
import { useCurrentUserId } from './hooks/useCurrentUserId';
import { useMemoriesCache } from './hooks/useMemoriesCache';
import { useSyncStatus } from './hooks/useSyncStatus';
import { useLanguage } from './hooks/useLanguage';
import { Heart, Camera, Calendar, Save, ArrowLeft, X, Upload, MapPin, Type, CheckCircle, AlertCircle, Navigation } from 'lucide-react';
import type { MemoryData } from './apis/cloudinaryGalleryApi';
import { MoodTheme, themes } from './config/themes';
import VisualEffects from './components/VisualEffects';
import SyncStatus from './components/SyncStatus';
import { UploadProgress, UploadProgressItem } from './components/UploadProgress';
import { addMemoryToCache, updateCacheAndNotify, removeMemoryFromCache } from './utils/memoryCacheUtils';
import type { Memory } from './hooks/useMemoriesCache';
import { usePlacesAutocomplete } from './hooks/usePlacesAutocomplete';
import { saveMemoryToFirestore } from './utils/memoryFirestore';
import CustomDatePicker from './components/CustomDatePicker';
import { validateImageFiles, IMAGE_VALIDATION } from './utils/imageValidation';
import { sanitizePlainText, sanitizeRichText } from './utils/sanitize';
import { createMemory } from './services/firebaseMemoriesService';
import { uploadToCloudinary, uploadMultipleImages } from './services/cloudinaryDirectService';
import { reverseGeocode } from './services/geoService';
import './styles/CreateMemory.css';
import './styles/components.css';

interface CreateMemoryProps {
  onBack?: () => void;
  currentTheme: MoodTheme;
}

function CreateMemory({ onBack, currentTheme }: CreateMemoryProps) {
  const { userId, loading } = useCurrentUserId();
  useMemoriesCache(userId, loading);
  const { syncStatus, lastSyncTime, errorMessage, startSync, syncSuccess, syncError } = useSyncStatus();
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [memoryText, setMemoryText] = useState('');
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-based
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressItem[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  
  // OpenStreetMap Nominatim Autocomplete (FREE!)
  const locationInputRef = useRef<HTMLInputElement>(null);
  const { place, suggestions, isLoading: isSearching, showDropdown, selectPlace, dropdownRef, isLoaded: isPlacesLoaded } = usePlacesAutocomplete(locationInputRef);
  
  // Update location and coordinates when place is selected
  useEffect(() => {
    if (place) {
      setLocation(place.address);
      setCoordinates({ lat: place.lat, lng: place.lng });
      setSaveMessage({
        type: 'success',
        text: `✓ Đã chọn: ${place.address}`
      });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }, [place]);

  // Get current location using browser Geolocation API + Nominatim reverse geocoding
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSaveMessage({
        type: 'error',
        text: 'Trình duyệt của bạn không hỗ trợ định vị GPS'
      });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    setIsGettingLocation(true);
    setSaveMessage({
      type: 'info',
      text: '📍 Đang yêu cầu quyền truy cập vị trí...'
    });

    // Tăng timeout lên 30 giây
    const timeoutId = setTimeout(() => {
      setIsGettingLocation(false);
      setSaveMessage({
        type: 'error',
        text: 'Timeout! GPS mất quá lâu. Vui lòng thử lại hoặc nhập địa chỉ thủ công.'
      });
      setTimeout(() => setSaveMessage(null), 5000);
    }, 30000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(timeoutId);
        
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCoordinates(coords);
        
        setSaveMessage({
          type: 'info',
          text: '🌍 Đang chuyển đổi tọa độ thành địa chỉ...'
        });
        
        // Reverse geocode using direct Nominatim API (V3.0: no proxy)
        try {
          // Check online status before making API call
          if (!navigator.onLine) {
            setIsGettingLocation(false);
            setSaveMessage({
              type: 'success',
              text: `✓ Đã lấy GPS (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}). Offline - nhập địa chỉ thủ công.`
            });
            setTimeout(() => setSaveMessage(null), 4000);
            return;
          }

          const data = await reverseGeocode(coords.lat, coords.lng);
          
          setLocation(data.display_name);
          setIsGettingLocation(false);
          setSaveMessage({
            type: 'success',
            text: `✓ Đã lấy vị trí thành công!`
          });
          setTimeout(() => setSaveMessage(null), 3000);
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          setIsGettingLocation(false);
          setSaveMessage({
            type: 'success',
            text: `✓ Đã lấy GPS (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}). Nhập địa chỉ thủ công.`
          });
          setTimeout(() => setSaveMessage(null), 4000);
        }
      },
      (error) => {
        clearTimeout(timeoutId);
        setIsGettingLocation(false);
        let errorMsg = 'Không thể lấy vị trí';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = '❌ Bạn đã từ chối quyền truy cập vị trí. Hãy bật GPS trong cài đặt trình duyệt.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = '❌ Vị trí không khả dụng. Kiểm tra GPS/wifi của thiết bị.';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = '❌ Hết thời gian lấy vị trí. Kiểm tra kết nối GPS.';
        }
        setSaveMessage({ type: 'error', text: errorMsg });
        setTimeout(() => setSaveMessage(null), 5000);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    );
  };

  // Check if there are unsaved changes
  const hasChanges = () => {
    return title.trim() !== '' ||
           memoryText.trim() !== '' ||
           location.trim() !== '' ||
           uploadedImages.length > 0;
  };

  // Handle back with unsaved changes check
  const handleBack = () => {
    if (hasChanges()) {
      setShowUnsavedConfirm(true);
    } else {
      onBack?.();
    }
  };

  // Compress image before upload
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          
          // Max dimensions
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1920;
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = (height * MAX_WIDTH) / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = (width * MAX_HEIGHT) / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with quality 0.8
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            0.8
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setValidationErrors([]);
    
    // Validate files before processing
    const { validFiles, errors } = validateImageFiles(files, uploadedImages.length);
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      // Clear the input so the same file can be selected again
      event.target.value = '';
      return;
    }
    
    if (validFiles.length === 0) {
      event.target.value = '';
      return;
    }
    
    for (const file of validFiles) {
      // Compress image first
      const compressedFile = await compressImage(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(compressedFile);
      setUploadedImages(prev => [...prev, compressedFile]);
    }
    
    // Clear the input so the same file can be selected again
    event.target.value = '';
  };

  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    // Invalidate cache after save
    setValidationAttempted(true);
    if (!isFormValid) return;

    setIsLoading(true);
    setSaveMessage(null);
    startSync(); // Start sync animation
    
    // Initialize upload progress for each image
    const progressItems: UploadProgressItem[] = uploadedImages.map((file, index) => ({
      id: `upload-${index}-${Date.now()}`,
      filename: file.name,
      progress: 0,
      status: 'pending' as const
    }));
    setUploadProgress(progressItems);
    
    // Create optimistic memory object
    const optimisticMemory = {
      id: `temp-${Date.now()}`,
      title: title.trim(),
      location: location.trim() || undefined,
      text: memoryText.trim(),
      date: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`,
      images: imagePreviews.map((preview, index) => ({
        public_id: `temp-${index}`,
        secure_url: preview,
        width: 800,
        height: 600,
        format: 'jpg',
        created_at: new Date().toISOString(),
        tags: ['memory', 'love-journal']
      })),
      created_at: new Date().toISOString(),
      tags: ['memory', 'love-journal']
    };
    
    // Optimistically update cache
    if (userId) {
      const cacheKey = `memoriesCache_${userId}`;
      const cache = localStorage.getItem(cacheKey);
      if (cache) {
        try {
          const { memories, timestamp } = JSON.parse(cache);
          const updatedMemories = [optimisticMemory, ...memories];
          localStorage.setItem(cacheKey, JSON.stringify({ 
            memories: updatedMemories, 
            timestamp 
          }));
          // Dispatch event to update UI immediately
          window.dispatchEvent(new CustomEvent('memoryCacheInvalidated', { detail: { userId } }));
        } catch (e) {
          console.error('Failed to update cache optimistically:', e);
        }
      }
    }
    
    // Show success message immediately (optimistic)
    setSaveMessage({
      type: 'success',
      text: `Memory "${title}" saved successfully! 💕`
    });
    syncSuccess(); // Show sync success animation
    
    try {
      // Sanitize user inputs before processing
      const sanitizedTitle = sanitizePlainText(title.trim());
      const sanitizedLocation = sanitizePlainText(location.trim());
      const sanitizedText = sanitizeRichText(memoryText.trim());
      
      // Update progress as "uploading"
      setUploadProgress(prev => prev.map(item => ({
        ...item,
        status: 'uploading' as const,
        progress: 10
      })));
      
      // Step 1: Upload images to Cloudinary directly from client
      const uploadedUrls: string[] = [];
      
      if (uploadedImages.length > 0) {
        // Check online status before attempting upload
        if (!navigator.onLine) {
          throw new Error('📡 Không có kết nối internet. Vui lòng kết nối và thử lại.');
        }
        
        for (let i = 0; i < uploadedImages.length; i++) {
          const file = uploadedImages[i];
          const currentIndex = i;
          
          try {
            // Build folder structure: dev/love-journal/users/{userId}/{year}/{month}/memories
            const now = new Date();
            const year = now.getFullYear();
            const month = now.toLocaleString('en-US', { month: 'long' }).toLowerCase();
            
            // Environment detection for Vercel deployments
            const hostname = window.location.hostname;
            // Preview deployments: journey-diary-git-dev-*.vercel.app OR journey-diary-*-doublenhans-projects.vercel.app
            // Production: journey-diary.vercel.app (custom domain hoặc main branch)
            const isPreview = hostname.includes('git-dev') || 
                             hostname.includes('doublenhans-projects.vercel.app') ||
                             hostname.includes('localhost');
            const envPrefix = isPreview ? 'dev' : 'production';
            
            const baseFolder = `${envPrefix}/love-journal`;
            const folder = `${baseFolder}/users/${userId}/${year}/${month}/memories`;
            
            // Double-check online status before each upload
            if (!navigator.onLine) {
              throw new Error('Connection lost during upload');
            }

            const result = await uploadToCloudinary(
              file,
              {
                folder,
                tags: ['memory', 'love-journal', userId || 'anonymous'],
                userId: userId || undefined,
              },
              (progress) => {
                // Update individual file progress
                setUploadProgress(prev => prev.map((item, idx) => {
                  if (idx === currentIndex) {
                    return { ...item, progress, status: 'uploading' as const };
                  }
                  return item;
                }));
              }
            ).catch((err) => {
              // Suppress console errors for network failures
              if (!navigator.onLine) {
                throw new Error('Lost connection during upload');
              }
              throw err;
            });
            
            uploadedUrls.push(result.secure_url);
            
            // Mark this file as success
            setUploadProgress(prev => prev.map((item, idx) => {
              if (idx === currentIndex) {
                return { ...item, progress: 100, status: 'success' as const };
              }
              return item;
            }));
          } catch (error) {
            console.error(`Failed to upload image ${i + 1}:`, error);
            // Mark as error and throw to stop the process
            setUploadProgress(prev => prev.map((item, idx) => {
              if (idx === currentIndex) {
                return { 
                  ...item, 
                  progress: 0, 
                  status: 'error' as const,
                  error: error instanceof Error ? error.message : 'Upload failed'
                };
              }
              return item;
            }));
            // Stop the entire save process if any image fails
            throw new Error(`Failed to upload image ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }
      
      // Validate: Must have at least one uploaded image
      if (uploadedImages.length > 0 && uploadedUrls.length === 0) {
        throw new Error('No images were successfully uploaded. Please try again.');
      }
      
      // Step 2: Save memory to Firestore with uploaded image URLs
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Format date as YYYY-MM-DD
      const formattedDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
      
      const newMemory = await createMemory({
        userId: userId,
        title: sanitizedTitle,
        description: sanitizedText,
        mood: 'happy', // Default mood, can be made dynamic
        photos: uploadedUrls,
        date: formattedDate,
        location: sanitizedLocation ? {
          city: sanitizedLocation,
          coordinates: coordinates ? {
            lat: coordinates.lat,
            lng: coordinates.lng,
          } : undefined,
        } : undefined,
        tags: ['memory', 'love-journal'],
      });
      
      // Success! Clear form and update cache
      setTimeout(() => {
        setTitle('');
        setLocation('');
        setCoordinates(null);
        setMemoryText('');
        setSelectedDay(new Date().getDate());
        setSelectedMonth(new Date().getMonth() + 1);
        setSelectedYear(new Date().getFullYear());
        setUploadedImages([]);
        setImagePreviews([]);
        setUploadProgress([]);
        setSaveMessage(null);
        setValidationAttempted(false);
        // Refresh cache from API to get real data with updated images
        if (userId) {
          removeMemoryFromCache(userId, optimisticMemory.id);
          updateCacheAndNotify(userId);
        }
      }, 2000);
    } catch (error) {
      console.error('Failed to save memory:', error);
      
      // Rollback optimistic update
      if (userId) {
        try {
          removeMemoryFromCache(userId, optimisticMemory.id);
          updateCacheAndNotify(userId);
        } catch (e) {
          console.error('Failed to rollback cache:', e);
        }
      }
      
      // Enhanced error reporting
      if (error instanceof Error) {
        syncError(error.message || t('errors.saveMemory'));
        setSaveMessage({
          type: 'error',
          text: error.message || 'Failed to save memory. Please try again.'
        });
      } else {
        syncError(t('errors.saveMemoryRetry'));
        setSaveMessage({
          type: 'error',
          text: 'Failed to save memory. Network error or server unavailable.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = 
    title.trim().length > 0 && 
    location.trim().length > 0 && 
    memoryText.trim().length > 0 && 
    selectedDay > 0 && selectedMonth > 0 && selectedYear > 1900 && 
    uploadedImages.length > 0;

  const theme = themes[currentTheme];
  
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
    <div className="create-memory-page" style={{ background: theme.background, color: theme.textPrimary }}>  
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
      <header className="create-memory-header">
        <div className="create-memory-header-container">
          <div className="create-memory-header-content">
            <button 
              onClick={handleBack}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-pink-200 hover:bg-pink-50 hover:border-pink-300 transition-all duration-300 shadow-sm hover:shadow-md active:scale-90 active:shadow-inner"
              title={t('common.back')}
            >
              <ArrowLeft className="w-5 h-5 text-pink-600" />
            </button>
            
            <div className="header-logo">
              <div className="header-logo-icon">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="header-logo-text">
                Nhật Ký Tình Yêu
              </span>
            </div>
            
            <div className="w-16"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="create-memory-main">
        <div className="memory-card">
          {/* Page Header */}
          <div className="memory-card-header">
            <h1 className="memory-card-title">
              {t('memory.createTitle')}
            </h1>
            <p className="memory-card-subtitle">
              {t('memory.createSubtitle')}
            </p>
          </div>

          {/* Form Content */}
          <div className="form-content">
            {/* Title */}
            <div className="form-section">
              <label className="form-label">
                <span className="form-label-row">
                  <Type className="w-5 h-5 form-label-icon" />
                  {t('memory.titlePlaceholder')} <span className="required-field">*</span>
                </span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('memory.titlePlaceholder')}
                className="form-input"
                required
              />
            </div>

            {/* Location */}
            <div className="form-section">
              <label className="form-label">
                <span className="form-label-row">
                  <MapPin className="w-5 h-5 form-label-icon" />
                  Nơi này xảy ra ở đâu? <span className="required-field">*</span>
                </span>
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', width: '100%' }}>
                  <input
                    ref={locationInputRef}
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={t('memory.locationPlaceholder')}
                    className="form-input"
                    style={{ flex: 1 }}
                    required
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className={`location-btn ${coordinates ? 'has-coordinates' : ''}`}
                    title="Sử dụng vị trí hiện tại (GPS)"
                  >
                    <Navigation className="w-5 h-5" style={{ 
                      animation: isGettingLocation ? 'spin 1s linear infinite' : 'none' 
                    }} />
                    {isGettingLocation ? 'Đang lấy...' : coordinates ? '✓ GPS' : 'GPS'}
                  </button>
                </div>
                
                {/* Autocomplete Dropdown */}
                {showDropdown && suggestions.length > 0 && (
                  <div 
                    ref={dropdownRef}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: '120px',
                      marginTop: '0.5rem',
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                      zIndex: 1000,
                      maxHeight: '300px',
                      overflowY: 'auto'
                    }}
                  >
                    {suggestions.map((suggestion) => (
                      <div
                        key={suggestion.place_id}
                        onClick={() => selectPlace(suggestion)}
                        style={{
                          padding: '0.75rem 1rem',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f3f4f6',
                          transition: 'background 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                      >
                        <MapPin className="w-4 h-4" style={{ color: '#ec4899', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                          {suggestion.display_name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                
                {isSearching && (
                  <div style={{
                    marginTop: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{ 
                      width: '16px', 
                      height: '16px', 
                      border: '2px solid #e5e7eb', 
                      borderTopColor: '#ec4899',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite'
                    }} />
                    Đang tìm kiếm...
                  </div>
                )}
              </div>
              
              {coordinates && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  border: '1px solid #86efac',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: '#166534',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <MapPin className="w-4 h-4" style={{ color: '#22c55e' }} />
                  <span style={{ fontWeight: '600' }}>Tọa độ:</span>
                  <span>{coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}</span>
                </div>
              )}
            </div>

            {/* Date Selection - manual dropdowns */}
            <div className="form-section">
              <label className="form-label">
                <span className="form-label-row">
                  <Calendar className="w-5 h-5 form-label-icon" />
                  Điều này xảy ra khi nào? <span className="required-field">*</span>
                </span>
              </label>
              <CustomDatePicker
                selected={new Date(selectedYear, selectedMonth - 1, selectedDay)}
                onChange={(date) => {
                  if (date) {
                    setSelectedYear(date.getFullYear());
                    setSelectedMonth(date.getMonth() + 1);
                    setSelectedDay(date.getDate());
                  }
                }}
                placeholder="Select date"
                required
                maxDate={new Date()}
              />
            </div>

            {/* Memory Text */}
            <div className="form-section">
              <label className="form-label">
                <span className="form-label-row">
                  <Heart className="w-5 h-5 form-label-icon" />
                  {t('memory.story')} <span className="required-field">*</span>
                </span>
              </label>
              <textarea
                value={memoryText}
                onChange={(e) => setMemoryText(e.target.value)}
                placeholder={t('memory.storyPlaceholder')}
                rows={8}
                className="form-textarea"
                required
              />
              <div className="character-counter">
                {memoryText.length} {t('memory.charactersRemaining')}
              </div>
            </div>

            {/* Image Upload */}
            <div className="upload-section">
              <label className="form-label">
                <span className="form-label-row">
                  <Camera className="w-5 h-5 form-label-icon" />
                  {t('memory.photos')} <span className="required-field">*</span>
                </span>
              </label>
              
              {/* Upload Area */}
              <div className="upload-area">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                  onChange={handleImageUpload}
                  className="upload-input"
                  required
                  disabled={uploadedImages.length >= IMAGE_VALIDATION.MAX_IMAGES}
                />
                <div className="upload-dropzone">
                  <Upload className="upload-icon" />
                  <p className="upload-text">
                    Nhấp để tải lên ảnh hoặc kéo và thả <span className="required-field">(bắt buộc)</span>
                  </p>
                  <p className="upload-subtext">
                    JPG, PNG, WebP, HEIC - Tối đa {IMAGE_VALIDATION.MAX_IMAGES} ảnh, mỗi ảnh ≤ 10MB
                  </p>
                </div>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="image-previews">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="image-preview">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="image-preview-img"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="image-remove-button"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {uploadProgress.length > 0 && (
              <UploadProgress items={uploadProgress} />
            )}

            {/* Save Button */}
            <div className="save-section">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className={`save-button ${
                  !isLoading ? 'save-button-enabled' : 'save-button-disabled'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner" />
                    <span>{t('memory.saving')}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>{t('common.save')}</span>
                  </>
                )}
              </button>
              
              {saveMessage && (
                <div className={`save-message ${saveMessage.type === 'success' ? 'save-message-success' : 'save-message-error'}`}>
                  {saveMessage.type === 'success' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span>{saveMessage.text}</span>
                </div>
              )}
              
              {validationErrors.length > 0 && (
                <div className="save-message save-message-error">
                  <AlertCircle className="w-5 h-5" />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>Lỗi validation ảnh:</div>
                    {validationErrors.map((err, idx) => (
                      <div key={idx} style={{ fontSize: '0.9em', marginTop: '4px' }}>• {err}</div>
                    ))}
                  </div>
                </div>
              )}
              
              {validationAttempted && !isFormValid && !saveMessage && !validationErrors.length && (
                <div className="save-validation-message">
                  <span className="validation-heading">{t('validation.required')}</span>
                  <ul className="validation-list">
                    {title.trim().length === 0 && <li>• {t('memory.memoryTitle')}</li>}
                    {location.trim().length === 0 && <li>• {t('memory.location')}</li>}
                    {memoryText.trim().length === 0 && <li>• {t('memory.story')}</li>}
                    {selectedDay <= 0 && <li>• {t('memory.date')}</li>}
                    {selectedMonth <= 0 && <li>• {t('memory.date')}</li>}
                    {selectedYear <= 1900 && <li>• {t('memory.date')}</li>}
                    {uploadedImages.length === 0 && <li>• {t('memory.photos')}</li>}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="tips-section">
          <h3 className="tips-title">
            <Heart className="w-5 h-5 tips-title-icon" />
            {t('memory.tips')}
          </h3>
          <ul className="tips-list">
            <li className="tips-item">
              <span className="tips-bullet">•</span>
              <span className="tips-text">{t('memory.tip1')}</span>
            </li>
            <li className="tips-item">
              <span className="tips-bullet">•</span>
              <span className="tips-text">{t('memory.tip2')}</span>
            </li>
            <li className="tips-item">
              <span className="tips-bullet">•</span>
              <span className="tips-text">{t('memory.tip3')}</span>
            </li>
            <li className="tips-item">
              <span className="tips-bullet">•</span>
              <span className="tips-text">{t('memory.tip4')}</span>
            </li>
            <li className="tips-item">
              <span className="tips-bullet">•</span>
              <span className="tips-text">{t('memory.tip5')}</span>
            </li>
          </ul>
        </div>
      </main>

      {/* Unsaved Changes Confirmation Modal */}
      {showUnsavedConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-box">
            <h3>Unsaved Changes</h3>
            <p>You have unsaved changes. Are you sure you want to leave without saving?</p>
            <div className="confirm-buttons">
              <button
                className="cancel-button"
                onClick={() => setShowUnsavedConfirm(false)}
              >
                Continue Creating
              </button>
              <button
                className="confirm-delete-button"
                onClick={() => {
                  setShowUnsavedConfirm(false);
                  onBack?.();
                }}
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateMemory;