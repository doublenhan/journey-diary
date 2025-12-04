import { useState, useEffect } from 'react';
import { X, Save, Trash2, GripVertical, Upload, Check, Type, MapPin } from 'lucide-react';
import { updateMemory, deleteMemory } from '../utils/memoryOperations';
import CustomDatePicker from './CustomDatePicker';
import TextInput from './TextInput';
import TextArea from './TextArea';
import '../styles/components.css';

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
    latitude: number;
    longitude: number;
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

  // Debug date mismatch
  console.log('[EditMemory] Memory date:', memory.date);
  console.log('[EditMemory] Date state:', date);
  console.log('[EditMemory] Date parsed:', date ? new Date(date) : null);

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
      // Delete removed images from Cloudinary first
      if (deletedImageIds.length > 0) {
        await fetch('/api/cloudinary/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicIds: deletedImageIds }),
        });
      }

      await updateMemory({
        id: memory.id,
        userId,
        title: title.trim(),
        text: text.trim(),
        location: location.trim() || undefined,
        date,
        latitude: memory.coordinates?.latitude,
        longitude: memory.coordinates?.longitude,
        cloudinaryPublicIds: images.map(img => img.public_id)
      });

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
    setUploadProgress(0);

    try {
      const uploadedImages: MemoryImage[] = [];
      
      // Generate folder path matching CreateMemory logic
      // Structure: love-journal/users/{userId}/{year}/{month}/memories
      const memoryDate = new Date(date);
      const year = memoryDate.getFullYear();
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];
      const month = monthNames[memoryDate.getMonth()];
      const folder = `love-journal/users/${userId}/${year}/${month}/memories`;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);
        formData.append('tags', `memory,${memory.id}`);
        
        // Add context metadata so API can group images properly
        const context = {
          memory_id: memory.id,
          userId: userId,
          title: title,
          memory_text: text,
          memory_date: date,
          location: location || ''
        };
        formData.append('context', JSON.stringify(context));

        const response = await fetch('/api/cloudinary/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to upload ${file.name}`);
        }

        const data = await response.json();
        uploadedImages.push({
          public_id: data.public_id,
          secure_url: data.secure_url,
          width: data.width,
          height: data.height,
        });

        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      setImages(prev => [...prev, ...uploadedImages]);
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

        <div className="modal-body">
          <div className="form-group">
            <label>Title *</label>
            <TextInput
              value={title}
              onChange={setTitle}
              placeholder="Memory title"
              maxLength={100}
              icon={Type}
              required
            />
          </div>

          <div className="form-group">
            <label>Date *</label>
            <CustomDatePicker
              selected={date ? new Date(date) : null}
              onChange={(newDate) => setDate(newDate ? newDate.toISOString().split('T')[0] : '')}
              placeholder="Select date"
              required
              maxDate={new Date()}
            />
          </div>

          <div className="form-group">
            <label>Location</label>
            <TextInput
              value={location}
              onChange={setLocation}
              placeholder="Where was this?"
              icon={MapPin}
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <TextArea
              value={text}
              onChange={setText}
              placeholder="Tell your story..."
              rows={6}
              maxLength={2000}
              showCounter
              required
            />
          </div>

          <div className="form-group">
            <label>Images (Drag to reorder)</label>
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
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  disabled={isUploading}
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
