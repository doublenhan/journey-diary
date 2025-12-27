import { useState, useEffect, useRef } from 'react';
import { X, Save, Trash2, GripVertical, Upload, Check, Type, MapPin, Navigation } from 'lucide-react';
import { updateMemory, deleteMemory } from '../utils/memoryOperations';
import CustomDatePicker from './CustomDatePicker';
import TextInput from './TextInput';
import TextArea from './TextArea';
import { validateImageFiles, IMAGE_VALIDATION } from '../utils/imageValidation';
import { updateMemory as updateMemoryFirestore } from '../services/firebaseMemoriesService';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinaryDirectService';
import { reverseGeocode } from '../services/geoService';
import { usePlacesAutocomplete } from '../hooks/usePlacesAutocomplete';
import { useToastContext } from '../contexts/ToastContext';
import { useLanguage } from '../hooks/useLanguage';
import { WebPImage } from './WebPImage';

// Parse date string (YYYY-MM-DD) as local date to avoid timezone offset
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

interface MemoryImage {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
}

interface Memory {
  id: string;
  title: string;
  date: string;
  text: string;
  location?: string | null;
  images: MemoryImage[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface EditMemoryModalProps {
  memory: Memory;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditMemoryModal({ memory, userId, onClose, onSuccess }: EditMemoryModalProps) {
  const { t } = useLanguage();
  const { success: showSuccess, error: showError } = useToastContext();
  const [title, setTitle] = useState(memory.title);
  const [text, setText] = useState(memory.text);
  const [location, setLocation] = useState(memory.location || '');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(
    memory.coordinates ? { lat: memory.coordinates.lat, lng: memory.coordinates.lng } : null
  );
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [date, setDate] = useState(memory.date);
  const [images, setImages] = useState(memory.images);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Places autocomplete
  const locationInputRef = useRef<HTMLInputElement>(null);
  const { place, suggestions, isLoading: isSearching, showDropdown, selectPlace, dropdownRef } = usePlacesAutocomplete(locationInputRef);
  
  // Update location and coordinates when place is selected
  useEffect(() => {
    if (place) {
      setLocation(place.address);
      setCoordinates({ lat: place.lat, lng: place.lng });
    }
  }, [place]);

  // Get current location using GPS
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ GPS');
      return;
    }

    setIsGettingLocation(true);
    setError(null);

    const timeoutId = setTimeout(() => {
      setIsGettingLocation(false);
      setError('GPS timeout. Vui lòng thử lại.');
    }, 30000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(timeoutId);
        
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCoordinates(coords);
        
        try {
          const data = await reverseGeocode(coords.lat, coords.lng);
          setLocation(data.display_name);
          setIsGettingLocation(false);
          setError(null);
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          setIsGettingLocation(false);
          // GPS coordinates saved, but address lookup failed due to CORS/network
          setError('✓ GPS lấy được tọa độ. Vui lòng nhập địa chỉ thủ công.');
          setTimeout(() => setError(null), 5000);
        }
      },
      (error) => {
        clearTimeout(timeoutId);
        setIsGettingLocation(false);
        setError('Không lấy được vị trí GPS. Kiểm tra quyền truy cập.');
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    );
  };

  // Track if there are unsaved changes
  const hasChanges = () => {
    return title !== memory.title ||
           text !== memory.text ||
           location !== (memory.location || '') ||
           date !== memory.date ||
           images.length !== memory.images.length ||
           images.some((img, i) => img.public_id !== memory.images[i]?.public_id);
  };

  const handleClose = () => {
    if (hasChanges()) {
      setShowUnsavedConfirm(true);
    } else {
      onClose();
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !text.trim()) {
      const errorMsg = 'Title and text are required';
      setError(errorMsg);
      showError(errorMsg);
      return;
    }

    if (images.length === 0) {
      const errorMsg = 'At least one image is required';
      setError(errorMsg);
      showError(errorMsg);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Delete removed images from Cloudinary
      if (deletedImageIds.length > 0) {
        console.log('Deleting images from Cloudinary:', deletedImageIds);
        for (const publicId of deletedImageIds) {
          try {
            await deleteFromCloudinary(publicId);
            console.log('✓ Deleted image:', publicId);
          } catch (error) {
            console.warn('Failed to delete image:', publicId, error);
            // Continue even if deletion fails
          }
        }
      }

      // Update memory in Firestore using new service
      const locationData = location.trim() ? {
        city: location.trim(),
        ...(coordinates && {
          coordinates: {
            lat: coordinates.lat,
            lng: coordinates.lng,
          }
        })
      } : undefined;
      
      await updateMemoryFirestore(memory.id, {
        title: title.trim(),
        description: text.trim(),
        photos: images.map(img => img.secure_url),
        location: locationData,
      });

      console.log('✓ Memory updated in Firestore:', memory.id);

      // Invalidate cache to force refresh
      window.dispatchEvent(new CustomEvent('memoryCacheInvalidated', { detail: { userId } }));
      
      showSuccess('Memory updated successfully! 💕');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to update memory:', err);
      const errorMsg = 'Failed to update memory. Please try again.';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const publicIds = memory.images.map(img => img.public_id);
      await deleteMemory(memory.id, userId, publicIds);
      
      showSuccess('Memory deleted successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to delete memory:', err);
      const errorMsg = 'Failed to delete memory. Please try again.';
      setError(errorMsg);
      showError(errorMsg);
      setIsDeleting(false);
    }
  };

  const handleDeleteImage = async (index: number) => {
    const imageToDelete = images[index];
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    
    // Track deleted image for cleanup on save
    setDeletedImageIds(prev => [...prev, imageToDelete.public_id]);
    setError(null);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);

    setImages(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    await uploadImages(Array.from(files));
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length === 0) return;
    
    await uploadImages(files);
  };

  const uploadImages = async (files: File[]) => {
    setIsUploading(true);
    setError(null);
    setValidationErrors([]);
    setUploadProgress(0);

    // Validate files before upload
    const { validFiles, errors } = validateImageFiles(files, images.length);
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      setIsUploading(false);
      return;
    }

    if (validFiles.length === 0) {
      setIsUploading(false);
      return;
    }

    try {
      const uploadedImages: MemoryImage[] = [];
      
      // Environment detection for Vercel deployments
      const hostname = window.location.hostname;
      const isPreview = hostname.includes('git-dev') || 
                       hostname.includes('doublenhans-projects.vercel.app') ||
                       hostname.includes('localhost');
      const envPrefix = isPreview ? 'dev' : 'production';
      
      // Generate folder path matching CreateMemory logic
      // Structure: {env}/love-journal/users/{userId}/{year}/{month}/memories
      const memoryDate = parseLocalDate(date);
      const year = memoryDate.getFullYear();
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];
      const month = monthNames[memoryDate.getMonth()];
      const folder = `${envPrefix}/love-journal/users/${userId}/${year}/${month}/memories`;
      
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        
        try {
          console.log(`Uploading image ${i + 1}/${validFiles.length}...`);
          
          const result = await uploadToCloudinary(
            file,
            {
              folder: folder,
              tags: ['memory', memory.id, userId],
              userId: userId,
              format: 'auto',
              quality: 'auto',
            },
            (progress) => {
              // Update progress for this specific file
              const overallProgress = Math.round(
                ((i + (progress / 100)) / validFiles.length) * 100
              );
              setUploadProgress(overallProgress);
            }
          );

          uploadedImages.push({
            public_id: result.public_id,
            secure_url: result.secure_url,
            width: result.width,
            height: result.height,
          });

          console.log(`✓ Image ${i + 1}/${validFiles.length} uploaded:`, result.public_id);
        } catch (err) {
          console.error(`Failed to upload ${file.name}:`, err);
          throw new Error(`Failed to upload ${file.name}`);
        }
      }

      setImages(prev => [...prev, ...uploadedImages]);
      console.log('✓ All images uploaded successfully');
    } catch (err) {
      console.error('Failed to upload images:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-5" onClick={handleClose}>
      <div className="bg-gradient-to-br from-pink-50/95 via-white to-pink-50/95 rounded-[20px] max-w-[650px] w-full max-h-[90vh] overflow-hidden flex flex-col shadow-[0_25px_70px_rgba(236,72,153,0.2),0_10px_30px_rgba(0,0,0,0.15)] border border-pink-200/50" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 px-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold m-0 text-gray-800 text-pink-600">{t('editMemory.title')}</h2>
          <button className="bg-transparent border-none cursor-pointer p-2 rounded-lg transition-all duration-200 text-gray-500 hover:bg-gray-100 hover:text-gray-800" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 px-4 rounded-lg mx-6 mt-4 text-sm">{error}</div>
        )}

        {validationErrors.length > 0 && (
          <div className="bg-red-100 text-red-600 p-3 px-4 rounded-lg mx-6 mt-4 text-sm">
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{t('editMemory.validationError')}</div>
            {validationErrors.map((err, idx) => (
              <div key={idx} style={{ marginBottom: '4px' }}>• {err}</div>
            ))}
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-5">
            <label className="font-semibold mb-2 text-gray-700 text-sm block">
              <Type className="w-4 h-4" style={{ display: 'inline', marginRight: '8px' }} />
              {t('editMemory.titleLabel')} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('editMemory.titlePlaceholder')}
              maxLength={100}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '12px',
                border: '2px solid #fbcfe8',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.3s ease',
              }}
              onFocus={(e) => e.target.style.borderColor = '#ec4899'}
              onBlur={(e) => e.target.style.borderColor = '#fbcfe8'}
            />
          </div>

          <div className="mb-5">
            <label className="font-semibold mb-2 text-gray-700 text-sm block">{t('editMemory.dateLabel')} *</label>
            <CustomDatePicker
              selected={date ? parseLocalDate(date) : null}
              onChange={(newDate) => setDate(newDate ? newDate.toISOString().split('T')[0] : '')}
              placeholder={t('editMemory.datePlaceholder')}
              required
              maxDate={new Date()}
            />
          </div>

          <div className="mb-5">
            <label className="font-semibold mb-2 text-gray-700 text-sm block">
              <MapPin className="w-4 h-4" style={{ display: 'inline', marginRight: '8px' }} />
              {t('editMemory.locationLabel')}
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <input
                  ref={locationInputRef}
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('editMemory.locationPlaceholder')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: '2px solid #fbcfe8',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#ec4899'}
                  onBlur={(e) => e.target.style.borderColor = '#fbcfe8'}
                />
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  title="Use current GPS location"
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
                >  <Navigation className="w-5 h-5" style={{ 
                    animation: isGettingLocation ? 'spin 1s linear infinite' : 'none' 
                  }} />
                  {isGettingLocation ? t('editMemory.gettingLocation') : coordinates ? `✓ ${t('editMemory.gps')}` : t('editMemory.gps')}
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
                  <span style={{ fontWeight: '600' }}>GPS:</span>
                  <span>{coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mb-5">
            <label className="font-semibold mb-2 text-gray-700 text-sm block">{t('editMemory.descriptionLabel')} *</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('editMemory.descriptionPlaceholder')}
              rows={6}
              maxLength={2000}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '12px',
                border: '2px solid #fbcfe8',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.3s ease',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => e.target.style.borderColor = '#ec4899'}
              onBlur={(e) => e.target.style.borderColor = '#fbcfe8'}
            />
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280', textAlign: 'right' }}>
              {text.length} / 2000
            </div>
          </div>

          <div className="mb-5">
            <label className="font-semibold mb-2 text-gray-700 text-sm block">{t('editMemory.imagesLabel')} - {t('editMemory.maxImagesPrefix')} {IMAGE_VALIDATION.MAX_IMAGES} {t('editMemory.maxImagesSuffix')}</label>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3 mt-3">
              {images.map((img, index) => (
                <div
                  key={img.public_id}
                  className={`group relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200 cursor-move transition-all duration-200 hover:border-pink-500 hover:scale-105 ${draggedIndex === index ? 'opacity-50 scale-95' : ''}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <button
                    className="absolute top-1 left-1 bg-white/90 border-none rounded-md p-1 cursor-move z-[2] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    title={t('editMemory.dragToReorder')}
                  >
                    <GripVertical size={20} />
                  </button>
                  <WebPImage src={img.secure_url} alt={`Image ${index + 1}`} />
                  <button
                    className="absolute top-1 right-1 bg-red-600/90 text-white border-none rounded-md p-1 cursor-pointer z-[2] opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity duration-200"
                    onClick={() => handleDeleteImage(index)}
                    title={t('editMemory.deleteImage')}
                  >
                    <X size={16} />
                  </button>
                  <span className="absolute bottom-1 right-1 bg-black/70 text-white px-2 py-0.5 rounded text-xs font-semibold">{index + 1}</span>
                </div>
              ))}

              {/* Upload Zone */}
              <div
                className={`relative aspect-square border-2 border-dashed border-pink-200 rounded-xl bg-pink-50/50 flex items-center justify-center cursor-pointer transition-all duration-300 ${isUploading ? 'cursor-not-allowed opacity-70' : 'hover:border-pink-500 hover:bg-pink-100 hover:scale-[1.02]'}`}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                style={{ display: images.length >= IMAGE_VALIDATION.MAX_IMAGES ? 'none' : 'flex' }}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                  multiple
                  onChange={handleFileSelect}
                  disabled={isUploading || images.length >= IMAGE_VALIDATION.MAX_IMAGES}
                  style={{ display: 'none' }}
                  id="image-upload-input"
                />
                <label htmlFor="image-upload-input" className="flex flex-col items-center gap-2 p-5 cursor-pointer text-center">
                  {isUploading ? (
                    <>
                      <div className="w-8 h-8 border-[3px] border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
                      <span className="text-pink-900 font-medium text-sm">{t('editMemory.uploading')} {uploadProgress}%</span>
                    </>
                  ) : (
                    <>
                      <Upload size={32} className="text-pink-500" />
                      <span className="text-pink-900 font-medium text-sm">{t('editMemory.uploadPrompt')}</span>
                      <span className="text-xs text-gray-400 font-normal">{t('editMemory.uploadHint')}</span>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-5 px-6 border-t border-gray-200 gap-3">
          <button
            className="flex items-center justify-center p-2.5 bg-white text-red-600 border-2 border-red-600 rounded-[10px] cursor-pointer transition-all duration-200 hover:bg-red-600 hover:text-white hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isSaving || isDeleting}
            title={t('editMemory.deleteMemory')}
          >
            <Trash2 size={20} />
          </button>
          
          <div className="flex gap-3">
            <button
              className="flex items-center justify-center p-2.5 bg-white text-gray-500 border-2 border-gray-300 rounded-[10px] cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:border-gray-400 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleClose}
              disabled={isSaving || isDeleting}
              title={t('common.cancel')}
            >
              <X size={20} />
            </button>
            <button
              className="flex items-center justify-center p-2.5 bg-gradient-to-br from-pink-500 to-pink-600 text-white border-none rounded-[10px] cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-[0_4px_12px_rgba(236,72,153,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSave}
              disabled={isSaving || isDeleting || images.length === 0}
              title={isSaving ? t('editMemory.saving') : t('editMemory.saveChanges')}
            >
              {isSaving ? <Save size={20} className="animate-spin" /> : <Check size={20} />}
            </button>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-5">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold mb-3 text-gray-900">{t('editMemory.deleteConfirmTitle')}</h3>
              <p className="text-gray-600 mb-6">{t('editMemory.deleteConfirmMessage')} "{memory.title}" {t('editMemory.deleteConfirmMessageSuffix')}</p>
              <div className="flex gap-3 justify-end">
                <button
                  className="px-5 py-2.5 bg-white text-gray-500 border border-gray-300 rounded-lg font-semibold cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  {t('common.cancel')}
                </button>
                <button
                  className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-200 hover:from-red-600 hover:to-red-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? t('editMemory.deleting') : t('editMemory.deleteButton')}
                </button>
              </div>
            </div>
          </div>
        )}

        {showUnsavedConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-5">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold mb-3 text-gray-900">{t('editMemory.unsavedTitle')}</h3>
              <p className="text-gray-600 mb-6">{t('editMemory.unsavedMessage')}</p>
              <div className="flex gap-3 justify-end">
                <button
                  className="px-5 py-2.5 bg-white text-gray-500 border border-gray-300 rounded-lg font-semibold cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setShowUnsavedConfirm(false)}
                >
                  {t('editMemory.continueEditing')}
                </button>
                <button
                  className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-200 hover:from-red-600 hover:to-red-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    setShowUnsavedConfirm(false);
                    onClose();
                  }}
                >
                  {t('editMemory.discardChanges')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
