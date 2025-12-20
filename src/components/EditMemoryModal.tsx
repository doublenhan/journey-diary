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
import '../styles/components.css';

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
      setError('Title and text are required');
      return;
    }

    if (images.length === 0) {
      setError('At least one image is required');
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
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to update memory:', err);
      setError('Failed to update memory. Please try again.');
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
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to delete memory:', err);
      setError('Failed to delete memory. Please try again.');
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
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content edit-memory-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Memory</h2>
          <button className="close-button" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="error-message">{error}</div>
        )}

        {validationErrors.length > 0 && (
          <div className="error-message">
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Lỗi validation ảnh:</div>
            {validationErrors.map((err, idx) => (
              <div key={idx} style={{ marginBottom: '4px' }}>• {err}</div>
            ))}
          </div>
        )}

        <div className="modal-body">
          <div className="form-group">
            <label>
              <Type className="w-4 h-4" style={{ display: 'inline', marginRight: '8px' }} />
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Memory title"
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

          <div className="form-group">
            <label>Date *</label>
            <CustomDatePicker
              selected={date ? parseLocalDate(date) : null}
              onChange={(newDate) => setDate(newDate ? newDate.toISOString().split('T')[0] : '')}
              placeholder="Select date"
              required
              maxDate={new Date()}
            />
          </div>

          <div className="form-group">
            <label>
              <MapPin className="w-4 h-4" style={{ display: 'inline', marginRight: '8px' }} />
              Location
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <input
                  ref={locationInputRef}
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Where was this?"
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

          <div className="form-group">
            <label>Description *</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tell your story..."
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

          <div className="form-group">
            <label>Images (Drag to reorder) - Tối đa {IMAGE_VALIDATION.MAX_IMAGES} ảnh, mỗi ảnh ≤ 10MB</label>
            <div className="images-grid">
              {images.map((img, index) => (
                <div
                  key={img.public_id}
                  className={`image-item ${draggedIndex === index ? 'dragging' : ''}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <button
                    className="drag-handle"
                    title="Drag to reorder"
                  >
                    <GripVertical size={20} />
                  </button>
                  <img src={img.secure_url} alt={`Image ${index + 1}`} />
                  <button
                    className="delete-image-button"
                    onClick={() => handleDeleteImage(index)}
                    title="Delete image"
                  >
                    <X size={16} />
                  </button>
                  <span className="image-order">{index + 1}</span>
                </div>
              ))}

              {/* Upload Zone */}
              <div
                className={`upload-zone ${isUploading ? 'uploading' : ''}`}
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
                <label htmlFor="image-upload-input" className="upload-label">
                  {isUploading ? (
                    <>
                      <div className="upload-spinner"></div>
                      <span>Uploading... {uploadProgress}%</span>
                    </>
                  ) : (
                    <>
                      <Upload size={32} />
                      <span>Click or drag images here</span>
                      <span className="upload-hint">Support multiple images</span>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="delete-button-icon"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isSaving || isDeleting}
            title="Delete Memory"
          >
            <Trash2 size={20} />
          </button>
          
          <div className="action-buttons">
            <button
              className="cancel-icon-button"
              onClick={handleClose}
              disabled={isSaving || isDeleting}
              title="Cancel"
            >
              <X size={20} />
            </button>
            <button
              className="save-icon-button"
              onClick={handleSave}
              disabled={isSaving || isDeleting || images.length === 0}
              title={isSaving ? 'Saving...' : 'Save Changes'}
            >
              {isSaving ? <Save size={20} className="animate-spin" /> : <Check size={20} />}
            </button>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="delete-confirm-overlay">
            <div className="delete-confirm-box">
              <h3>Delete Memory?</h3>
              <p>This will permanently delete "{memory.title}" and all its images. This cannot be undone.</p>
              <div className="confirm-buttons">
                <button
                  className="cancel-button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  className="confirm-delete-button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showUnsavedConfirm && (
          <div className="delete-confirm-overlay">
            <div className="delete-confirm-box">
              <h3>Unsaved Changes</h3>
              <p>You have unsaved changes. Are you sure you want to close without saving?</p>
              <div className="confirm-buttons">
                <button
                  className="cancel-button"
                  onClick={() => setShowUnsavedConfirm(false)}
                >
                  Continue Editing
                </button>
                <button
                  className="confirm-delete-button"
                  onClick={() => {
                    setShowUnsavedConfirm(false);
                    onClose();
                  }}
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
