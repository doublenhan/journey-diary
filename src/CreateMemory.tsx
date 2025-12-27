import { useState, useRef, useEffect } from 'react';
import { useCurrentUserId } from './hooks/useCurrentUserId';
import { useMemoriesCache } from './hooks/useMemoriesCache';
import { useSyncStatus } from './hooks/useSyncStatus';
import { useLanguage } from './hooks/useLanguage';
import { useToastContext } from './contexts/ToastContext';
import { Heart, Camera, Calendar, Save, ArrowLeft, X, Upload, MapPin, Type, CheckCircle, AlertCircle, Navigation } from 'lucide-react';
import { MoodTheme, themes } from './config/themes';
import VisualEffects from './components/VisualEffects';
import SyncStatus from './components/SyncStatus';
import { UploadProgress, UploadProgressItem } from './components/UploadProgress';
import { updateCacheAndNotify, removeMemoryFromCache } from './utils/memoryCacheUtils';
import { usePlacesAutocomplete } from './hooks/usePlacesAutocomplete';
import CustomDatePicker from './components/CustomDatePicker';
import { validateImageFiles, IMAGE_VALIDATION } from './utils/imageValidation';
import { sanitizePlainText, sanitizeRichText } from './utils/sanitize';
import { createMemory } from './services/firebaseMemoriesService';
import { uploadToCloudinary } from './services/cloudinaryDirectService';
import { reverseGeocode } from './services/geoService';

interface CreateMemoryProps {
  onBack?: () => void;
  currentTheme: MoodTheme;
}

function CreateMemory({ onBack, currentTheme }: CreateMemoryProps) {
  const { userId, loading } = useCurrentUserId();
  useMemoriesCache(userId, loading);
  const { syncStatus, lastSyncTime, errorMessage, startSync, syncSuccess, syncError } = useSyncStatus();
  const { t } = useLanguage();
  const { success: showSuccess, error: showError } = useToastContext();
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
  const { place, suggestions, isLoading: isSearching, showDropdown, selectPlace, dropdownRef } = usePlacesAutocomplete(locationInputRef);
  
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
    if (!isFormValid) {
      return;
    }
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
          // Don't dispatch event here - it causes multiple fetches!
          // Cache will auto-refresh when user navigates to ViewMemory
          console.log('[CreateMemory] Optimistic cache updated, skipping fetch');
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
    showSuccess(`Memory "${title}" saved successfully! 💕`);
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
        console.log(`Uploading ${uploadedImages.length} images to Cloudinary...`);
        
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
            
            console.log('[CreateMemory Upload]');
            console.log('  hostname:', hostname);
            console.log('  isPreview:', isPreview);
            console.log('  envPrefix:', envPrefix);
            
            const baseFolder = `${envPrefix}/love-journal`;
            const folder = `${baseFolder}/users/${userId}/${year}/${month}/memories`;
            console.log('[DEBUG] Final folder path:', folder);
            
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
            );
            
            uploadedUrls.push(result.secure_url);
            
            // Mark this file as success
            setUploadProgress(prev => prev.map((item, idx) => {
              if (idx === currentIndex) {
                return { ...item, progress: 100, status: 'success' as const };
              }
              return item;
            }));
            
            console.log(`✓ Image ${i + 1}/${uploadedImages.length} uploaded:`, result.public_id);
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
      
      console.log('✅ [CreateMemory] Memory saved to Firestore:', newMemory.id);
      console.log(`📊 [CreateMemory] Total operations: 1 write (addDoc), ${uploadedImages.length} image uploads`);
      
      // Invalidate cache immediately to show new memory
      if (userId) {
        console.log('🔄 [CreateMemory] Invalidating memory cache...');
        window.dispatchEvent(new CustomEvent('memoryCacheInvalidated', { 
          detail: { userId } 
        }));
      }
      
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
        const errorMsg = error.message || 'Failed to save memory. Please try again.';
        setSaveMessage({
          type: 'error',
          text: errorMsg
        });
        showError(errorMsg);
      } else {
        syncError(t('errors.saveMemoryRetry'));
        const errorMsg = 'Failed to save memory. Network error or server unavailable.';
        setSaveMessage({
          type: 'error',
          text: errorMsg
        });
        showError(errorMsg);
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
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 border-b border-pink-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button 
              onClick={handleBack}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-pink-200 hover:bg-pink-50 hover:border-pink-300 transition-all duration-300 shadow-sm hover:shadow-md active:scale-90 active:shadow-inner"
              title={t('common.back')}
            >
              <ArrowLeft className="w-5 h-5 text-pink-600" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center shadow-md">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent hidden sm:block">
                Nhật Ký Tình Yêu
              </span>
            </div>
            
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-pink-100 overflow-hidden">
          {/* Page Header */}
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 px-6 sm:px-8 py-6 border-b border-pink-100">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center">
              {t('memory.createTitle')}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base text-center">
              {t('memory.createSubtitle')}
            </p>
          </div>

          {/* Form Content */}
          <div className="px-6 sm:px-8 py-6 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Type className="w-5 h-5 text-pink-500" />
                {t('memory.titlePlaceholder')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('memory.titlePlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none"
                required
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <MapPin className="w-5 h-5 text-pink-500" />
                Nơi này xảy ra ở đâu? <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="flex gap-2 items-start w-full">
                  <input
                    ref={locationInputRef}
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={t('memory.locationPlaceholder')}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className={`px-4 py-3 rounded-xl border-2 font-semibold whitespace-nowrap min-w-[110px] flex items-center justify-center gap-2 transition-all ${
                      coordinates 
                        ? 'bg-pink-500 border-pink-500 text-white hover:bg-pink-600' 
                        : 'bg-white border-pink-500 text-pink-500 hover:bg-pink-50'
                    } ${isGettingLocation ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
                    title="Sử dụng vị trí hiện tại (GPS)"
                  >
                    <Navigation className={`w-5 h-5 ${isGettingLocation ? 'animate-spin' : ''}`} />
                    {isGettingLocation ? 'Đang lấy...' : coordinates ? '✓ GPS' : 'GPS'}
                  </button>
                </div>
                
                {/* Autocomplete Dropdown */}
                {showDropdown && suggestions.length > 0 && (
                  <div 
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-[120px] mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-[300px] overflow-y-auto"
                  >
                    {suggestions.map((suggestion) => (
                      <div
                        key={suggestion.place_id}
                        onClick={() => selectPlace(suggestion)}
                        className="px-4 py-3 cursor-pointer border-b border-gray-100 flex items-center gap-2 hover:bg-gray-50 transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-pink-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">
                          {suggestion.display_name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                
                {isSearching && (
                  <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-pink-500 rounded-full animate-spin" />
                    Đang tìm kiếm...
                  </div>
                )}
              </div>
              
              {coordinates && (
                <div className="mt-2 px-3 py-2 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-300 rounded-lg text-sm text-green-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-500" />
                  <span className="font-semibold">Tọa độ:</span>
                  <span>{coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}</span>
                </div>
              )}
            </div>

            {/* Date Selection - manual dropdowns */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar className="w-5 h-5 text-pink-500" />
                Điều này xảy ra khi nào? <span className="text-red-500">*</span>
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
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Heart className="w-5 h-5 text-pink-500" />
                {t('memory.story')} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={memoryText}
                onChange={(e) => setMemoryText(e.target.value)}
                placeholder={t('memory.storyPlaceholder')}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none resize-none"
                required
              />
              <div className="text-xs text-gray-500 text-right">
                {memoryText.length} {t('memory.charactersRemaining')}
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Camera className="w-5 h-5 text-pink-500" />
                {t('memory.photos')} <span className="text-red-500">*</span>
              </label>
              
              {/* Upload Area */}
              <div className="relative">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  required
                  disabled={uploadedImages.length >= IMAGE_VALIDATION.MAX_IMAGES}
                />
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-pink-400 hover:bg-pink-50/50 transition-all">
                  <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-700 font-medium mb-1">
                    Nhấp để tải lên ảnh hoặc kéo và thả <span className="text-red-500">(bắt buộc)</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    JPG, PNG, WebP, HEIC - Tối đa {IMAGE_VALIDATION.MAX_IMAGES} ảnh, mỗi ảnh ≤ 10MB
                  </p>
                </div>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-pink-400 transition-all">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
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
            <div className="space-y-4 pt-4">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className={`w-full py-3 px-6 rounded-xl font-semibold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                  !isLoading 
                    ? 'bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 hover:shadow-xl transform hover:-translate-y-0.5' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
                  saveMessage.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-700' 
                    : saveMessage.type === 'error'
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : 'bg-blue-50 border border-blue-200 text-blue-700'
                }`}>
                  {saveMessage.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  )}
                  <span className="text-sm">{saveMessage.text}</span>
                </div>
              )}
              
              {validationErrors.length > 0 && (
                <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-bold mb-1">Lỗi validation ảnh:</div>
                    {validationErrors.map((err, idx) => (
                      <div key={idx} className="text-xs mt-1">• {err}</div>
                    ))}
                  </div>
                </div>
              )}
              
              {validationAttempted && !isFormValid && !saveMessage && !validationErrors.length && (
                <div className="px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                  <span className="font-bold text-sm block mb-2">{t('validation.required')}</span>
                  <ul className="space-y-1 text-sm">
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
        <div className="mt-6 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 border border-pink-100 shadow-sm">
          <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
            <Heart className="w-5 h-5 text-pink-500" />
            {t('memory.tips')}
          </h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <span className="text-pink-500 font-bold flex-shrink-0">•</span>
              <span className="text-gray-700 text-sm">{t('memory.tip1')}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-pink-500 font-bold flex-shrink-0">•</span>
              <span className="text-gray-700 text-sm">{t('memory.tip2')}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-pink-500 font-bold flex-shrink-0">•</span>
              <span className="text-gray-700 text-sm">{t('memory.tip3')}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-pink-500 font-bold flex-shrink-0">•</span>
              <span className="text-gray-700 text-sm">{t('memory.tip4')}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-pink-500 font-bold flex-shrink-0">•</span>
              <span className="text-gray-700 text-sm">{t('memory.tip5')}</span>
            </li>
          </ul>
        </div>
      </main>

      {/* Unsaved Changes Confirmation Modal */}
      {showUnsavedConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">{t('memory.unsavedChangesTitle')}</h3>
            <p className="text-gray-600 mb-6">{t('memory.unsavedChangesMessage')}</p>
            <div className="flex gap-3">
              <button
                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                onClick={() => setShowUnsavedConfirm(false)}
              >
                {t('memory.continueCreating')}
              </button>
              <button
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                onClick={() => {
                  setShowUnsavedConfirm(false);
                  onBack?.();
                }}
              >
                {t('memory.discardChanges')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateMemory;