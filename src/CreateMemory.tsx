import { useState } from 'react';
import { useCurrentUserId } from './hooks/useCurrentUserId';
import { useMemoriesCache } from './hooks/useMemoriesCache';
import { Heart, Camera, Calendar, Save, ArrowLeft, X, Upload, MapPin, Type, CheckCircle, AlertCircle } from 'lucide-react';
import type { MemoryData } from './apis/cloudinaryGalleryApi';
import './styles/CreateMemory.css';

interface CreateMemoryProps {
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

function CreateMemory({ onBack, currentTheme }: CreateMemoryProps) {
  const { userId, loading } = useCurrentUserId();
  useMemoriesCache(userId, loading);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [memoryText, setMemoryText] = useState('');
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-based
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [validationAttempted, setValidationAttempted] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviews(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
        setUploadedImages(prev => [...prev, file]);
      }
    });
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
      uploadedImages.forEach((file) => {
        formData.append('images', file);
      });
      const response = await fetch('/api/cloudinary/memory', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to save memory');
      const data = await response.json();
      setSaveMessage({
        type: 'success',
        text: `Memory "${title}" saved successfully! 💕`
      });
      // Clear form after successful save
      setTimeout(() => {
        setTitle('');
        setLocation('');
        setMemoryText('');
        setSelectedDay(new Date().getDate());
        setSelectedMonth(new Date().getMonth() + 1);
        setSelectedYear(new Date().getFullYear());
        setUploadedImages([]);
        setImagePreviews([]);
        setSaveMessage(null);
        setValidationAttempted(false);
        // Remove cache so next view reloads from API
        if (userId) {
          localStorage.removeItem(`memoriesCache_${userId}`);
          // Dispatch custom event to notify other components
          window.dispatchEvent(new CustomEvent('memoryCacheInvalidated', { detail: { userId } }));
        }
      }, 2000);
    } catch (error) {
      console.error('Failed to save memory:', error);
      // Enhanced error reporting
      if (error instanceof Error) {
        setSaveMessage({
          type: 'error',
          text: error.message || 'Failed to save memory. Please try again.'
        });
      } else {
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
  return (
    <div className="create-memory-page" style={{ background: theme.background, color: theme.textPrimary }}>  
      {/* Header */}
      <header className="create-memory-header">
        <div className="create-memory-header-container">
          <div className="create-memory-header-content">
            <button 
              onClick={onBack}
              className="back-button"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="back-button-text">Back</span>
            </button>
            
            <div className="header-logo">
              <div className="header-logo-icon">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="header-logo-text">
                Love Journal
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
              Create New Memory
            </h1>
            <p className="memory-card-subtitle">
              Capture this beautiful moment forever
            </p>
          </div>

          {/* Form Content */}
          <div className="form-content">
            {/* Title */}
            <div className="form-section">
              <label className="form-label">
                <span className="form-label-row">
                  <Type className="w-5 h-5 form-label-icon" />
                  Give this memory a title <span className="required-field">*</span>
                </span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Our first date, Anniversary dinner, Weekend getaway..."
                className="form-input"
                required
              />
            </div>

            {/* Location */}
            <div className="form-section">
              <label className="form-label">
                <span className="form-label-row">
                  <MapPin className="w-5 h-5 form-label-icon" />
                  Where did this happen? <span className="required-field">*</span>
                </span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Central Park, Eiffel Tower, Our favorite café..."
                className="form-input"
                required
              />
            </div>

            {/* Date Selection - manual dropdowns */}
            <div className="form-section">
              <label className="form-label">
                <span className="form-label-row">
                  <Calendar className="w-5 h-5 form-label-icon" />
                  When did this happen? <span className="required-field">*</span>
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
                  Tell your story <span className="required-field">*</span>
                </span>
              </label>
              <textarea
                value={memoryText}
                onChange={(e) => setMemoryText(e.target.value)}
                placeholder="Write about this special moment... What made it magical? How did it make you feel?"
                rows={8}
                className="form-textarea"
                required
              />
              <div className="character-counter">
                {memoryText.length} characters
              </div>
            </div>

            {/* Image Upload */}
            <div className="upload-section">
              <label className="form-label">
                <span className="form-label-row">
                  <Camera className="w-5 h-5 form-label-icon" />
                  Add photos <span className="required-field">*</span>
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
                    Click to upload photos or drag and drop <span className="required-field">(required)</span>
                  </p>
                  <p className="upload-subtext">
                    PNG, JPG, GIF up to 10MB each
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
                    <span>Saving Memory...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Memory</span>
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
                  <span className="validation-heading">Please complete all required fields:</span>
                  <ul className="validation-list">
                    {title.trim().length === 0 && <li>• Add a title for your memory</li>}
                    {location.trim().length === 0 && <li>• Specify the location</li>}
                    {memoryText.trim().length === 0 && <li>• Write your memory text</li>}
                    {selectedDay <= 0 && <li>• Select a valid day</li>}
                    {selectedMonth <= 0 && <li>• Select a valid month</li>}
                    {selectedYear <= 1900 && <li>• Select a valid year</li>}
                    {uploadedImages.length === 0 && <li>• Upload at least one photo</li>}
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
            Tips for capturing memories
          </h3>
          <ul className="tips-list">
            <li className="tips-item">
              <span className="tips-bullet">•</span>
              <span className="tips-text">Choose a meaningful title that captures the essence of your memory</span>
            </li>
            <li className="tips-item">
              <span className="tips-bullet">•</span>
              <span className="tips-text">Include the location to help you remember where it happened</span>
            </li>
            <li className="tips-item">
              <span className="tips-bullet">•</span>
              <span className="tips-text">Include details about what made this moment special</span>
            </li>
            <li className="tips-item">
              <span className="tips-bullet">•</span>
              <span className="tips-text">Describe your feelings and emotions in that moment</span>
            </li>
            <li className="tips-item">
              <span className="tips-bullet">•</span>
              <span className="tips-text">Add photos to bring your memory to life</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default CreateMemory;