import { useState, useRef, useEffect } from 'react';
import { useCurrentUserId } from './hooks/useCurrentUserId';
import { useMemoriesCache } from './hooks/useMemoriesCache';
import { useSyncStatus } from './hooks/useSyncStatus';
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
import './styles/CreateMemory.css';

interface CreateMemoryProps {
  onBack?: () => void;
  currentTheme: MoodTheme;
}

function CreateMemory({ onBack, currentTheme }: CreateMemoryProps) {
  const { userId, loading } = useCurrentUserId();
  useMemoriesCache(userId, loading);
  const { syncStatus, lastSyncTime, errorMessage, startSync, syncSuccess, syncError } = useSyncStatus();
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
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressItem[]>([]);
  
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
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCoordinates(coords);
        
        // Reverse geocode using Nominatim (FREE!)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?` +
            `format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`,
            {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'LoveJournalApp/1.0'
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            setLocation(data.display_name);
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
        }
        
        setIsGettingLocation(false);
        setSaveMessage({
          type: 'success',
          text: `✓ Đã lấy vị trí GPS: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
        });
        setTimeout(() => setSaveMessage(null), 3000);
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMsg = 'Không thể lấy vị trí';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Bạn đã từ chối quyền truy cập vị trí';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'Vị trí không khả dụng';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'Hết thời gian lấy vị trí';
        }
        setSaveMessage({ type: 'error', text: errorMsg });
        setTimeout(() => setSaveMessage(null), 3000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
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
    
    // Limit to 10 images total
    const remainingSlots = 10 - uploadedImages.length;
    if (remainingSlots <= 0) {
      setSaveMessage({
        type: 'error',
        text: 'Tối đa 10 ảnh. Vui lòng xóa ảnh cũ trước khi thêm ảnh mới.'
      });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }
    
    const filesToProcess = files.slice(0, remainingSlots);
    
    for (const file of filesToProcess) {
      if (file.type.startsWith('image/')) {
        // Check file size (max 20MB before compression)
        if (file.size > 20 * 1024 * 1024) {
          setSaveMessage({
            type: 'error',
            text: `File ${file.name} quá lớn (>20MB). Vui lòng chọn ảnh nhỏ hơn.`
          });
          setTimeout(() => setSaveMessage(null), 3000);
          continue;
        }
        
        // Compress image first
        const compressedFile = await compressImage(file);
        
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviews(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(compressedFile);
        setUploadedImages(prev => [...prev, compressedFile]);
      }
    }
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
      const memoryData: MemoryData & { userId?: string } = {
        title: title.trim(),
        location: location.trim() || undefined,
        text: memoryText.trim(),
        date: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`,
        tags: ['memory', 'love-journal'],
        userId: userId || undefined
      };
      // Gửi dữ liệu memory và ảnh qua serverless API
      const formData = new FormData();
      formData.append('title', memoryData.title);
      if (memoryData.location) formData.append('location', memoryData.location);
      formData.append('text', memoryData.text);
      formData.append('date', memoryData.date);
      if (memoryData.tags?.length) formData.append('tags', memoryData.tags.join(','));
      if (memoryData.userId) formData.append('userId', memoryData.userId);
      
      // Update progress as "uploading"
      setUploadProgress(prev => prev.map(item => ({
        ...item,
        status: 'uploading' as const,
        progress: 10
      })));
      
      uploadedImages.forEach((file) => {
        formData.append('images', file);
      });
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => prev.map(item => {
          if (item.status === 'uploading' && item.progress < 90) {
            return { ...item, progress: Math.min(item.progress + 10, 90) };
          }
          return item;
        }));
      }, 300);
      
      const response = await fetch('/api/cloudinary/memory', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        // Mark all as error
        setUploadProgress(prev => prev.map(item => ({
          ...item,
          status: 'error' as const,
          error: 'Upload failed',
          progress: 0
        })));
        throw new Error('Failed to save memory');
      }
      
      // Mark all as success
      setUploadProgress(prev => prev.map(item => ({
        ...item,
        status: 'success' as const,
        progress: 100
      })));
      
      const data = await response.json();
      
      // Save to Firestore with coordinates
      if (userId && data.memory) {
        try {
          await saveMemoryToFirestore({
            id: data.memory.id,
            userId: userId,
            title: data.memory.title,
            text: data.memory.text,
            date: data.memory.date,
            location: data.memory.location,
            latitude: coordinates?.lat,
            longitude: coordinates?.lng,
            cloudinaryPublicIds: data.memory.images.map((img: any) => img.public_id),
            cloudinaryFolder: data.memory.folder,
            tags: data.memory.tags || ['memory', 'love-journal']
          });
          console.log('✓ Memory saved to Firestore with coordinates');
        } catch (firestoreError) {
          console.error('Failed to save to Firestore:', firestoreError);
          // Don't fail the whole operation if Firestore fails
        }
      }
      
      // API succeeded - clear form
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
          removeMemoryFromCache(userId, optimisticMemoryId);
          updateCacheAndNotify(userId);
        }
      }, 2000);
    } catch (error) {
      console.error('Failed to save memory:', error);
      
      // Rollback optimistic update
      if (userId) {
        try {
          removeMemoryFromCache(userId, optimisticMemoryId);
          updateCacheAndNotify(userId);
        } catch (e) {
          console.error('Failed to rollback cache:', e);
        }
      }
      
      // Enhanced error reporting
      if (error instanceof Error) {
        syncError(error.message || 'Lỗi lưu kỷ niệm');
        setSaveMessage({
          type: 'error',
          text: error.message || 'Failed to save memory. Please try again.'
        });
      } else {
        syncError('Lỗi lưu kỷ niệm. Vui lòng thử lại.');
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
              onClick={onBack}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-pink-200 hover:bg-pink-50 hover:border-pink-300 transition-all duration-300 shadow-sm hover:shadow-md active:scale-90 active:shadow-inner"
              title="Quay Lại"
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
              Tạo Kỷ Niệm Mới
            </h1>
            <p className="memory-card-subtitle">
              Lưu giữ khoảnh khắc đẹp đẽ này mãi mãi
            </p>
          </div>

          {/* Form Content */}
          <div className="form-content">
            {/* Title */}
            <div className="form-section">
              <label className="form-label">
                <span className="form-label-row">
                  <Type className="w-5 h-5 form-label-icon" />
                  Đặt tiêu đề cho kỷ niệm này <span className="required-field">*</span>
                </span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Ngày hẹn hò đầu tiên, Bữa tối sinh nhật, Tuần cuối cùng..."
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
                    placeholder="Gõ để tìm kiếm địa điểm... (VD: Hanoi, Vietnam)"
                    className="form-input"
                    style={{ flex: 1 }}
                    required
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="location-btn"
                    title="Sử dụng vị trí hiện tại (GPS)"
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      border: '2px solid #ec4899',
                      background: coordinates ? '#ec4899' : 'white',
                      color: coordinates ? 'white' : '#ec4899',
                      cursor: isGettingLocation ? 'wait' : 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      opacity: isGettingLocation ? 0.6 : 1,
                      minWidth: '110px',
                      justifyContent: 'center'
                    }}
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
              <input
                type="date"
                value={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`}
                onChange={e => {
                  const [year, month, day] = e.target.value.split('-').map(Number);
                  setSelectedYear(year);
                  setSelectedMonth(month);
                  setSelectedDay(day);
                }}
                className="form-input date-select"
                required
                max={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`}
              />
            </div>

            {/* Memory Text */}
            <div className="form-section">
              <label className="form-label">
                <span className="form-label-row">
                  <Heart className="w-5 h-5 form-label-icon" />
                  Kể câu chuyện của bạn <span className="required-field">*</span>
                </span>
              </label>
              <textarea
                value={memoryText}
                onChange={(e) => setMemoryText(e.target.value)}
                placeholder="Viết về khoảnh khắc đặc biệt này... Điều gì làm cho nó trở nên kỳ diệu? Nó làm cho bạn cảm thấy thế nào?"
                rows={8}
                className="form-textarea"
                required
              />
              <div className="character-counter">
                {memoryText.length} ký tự
              </div>
            </div>

            {/* Image Upload */}
            <div className="upload-section">
              <label className="form-label">
                <span className="form-label-row">
                  <Camera className="w-5 h-5 form-label-icon" />
                  Thêm ảnh <span className="required-field">*</span>
                </span>
              </label>
              
              {/* Upload Area */}
              <div className="upload-area">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="upload-input"
                  required
                />
                <div className="upload-dropzone">
                  <Upload className="upload-icon" />
                  <p className="upload-text">
                    Nhấp để tải lên ảnh hoặc kéo và thả <span className="required-field">(bắt buộc)</span>
                  </p>
                  <p className="upload-subtext">
                    PNG, JPG, GIF tối đa 10MB mỗi cái
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
                    <span>Đang Lưu Kỷ Niệm...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Lưu Kỷ Niệm</span>
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
              
              {validationAttempted && !isFormValid && !saveMessage && (
                <div className="save-validation-message">
                  <span className="validation-heading">Vui lòng hoàn thành tất cả các trường bắt buộc:</span>
                  <ul className="validation-list">
                    {title.trim().length === 0 && <li>• Thêm tiêu đề cho kỷ niệm của bạn</li>}
                    {location.trim().length === 0 && <li>• Chỉ định vị trí</li>}
                    {memoryText.trim().length === 0 && <li>• Viết văn bản kỷ niệm của bạn</li>}
                    {selectedDay <= 0 && <li>• Chọn một ngày hợp lệ</li>}
                    {selectedMonth <= 0 && <li>• Chọn một tháng hợp lệ</li>}
                    {selectedYear <= 1900 && <li>• Chọn một năm hợp lệ</li>}
                    {uploadedImages.length === 0 && <li>• Tải lên ít nhất một ảnh</li>}
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
            Mẹo để ghi lại những kỷ niệm
          </h3>
          <ul className="tips-list">
            <li className="tips-item">
              <span className="tips-bullet">•</span>
              <span className="tips-text">Chọn một tiêu đề có ý nghĩa phản ánh bản chất của kỷ niệm của bạn</span>
            </li>
            <li className="tips-item">
              <span className="tips-bullet">•</span>
              <span className="tips-text">Bao gồm vị trí để giúp bạn nhớ nơi nó xảy ra</span>
            </li>
            <li className="tips-item">
              <span className="tips-bullet">•</span>
              <span className="tips-text">Bao gồm chi tiết về những gì làm cho khoảnh khắc này trở nên đặc biệt</span>
            </li>
            <li className="tips-item">
              <span className="tips-bullet">•</span>
              <span className="tips-text">Mô tả cảm xúc và tình cảm của bạn lúc đó</span>
            </li>
            <li className="tips-item">
              <span className="tips-bullet">•</span>
              <span className="tips-text">Thêm ảnh để làm cho kỷ niệm của bạn sống động</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default CreateMemory;