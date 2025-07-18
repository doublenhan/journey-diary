import React, { useState } from 'react';
import { Heart, Camera, Calendar, Save, ArrowLeft, X, Upload, MapPin, Type, CheckCircle, AlertCircle } from 'lucide-react';
import { cloudinaryApi, type MemoryData } from './api/cloudinaryGalleryApi';
import './styles/CreateMemory.css';

interface CreateMemoryProps {
  onBack?: () => void;
}

function CreateMemory({ onBack }: CreateMemoryProps) {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [memoryText, setMemoryText] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
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
    setValidationAttempted(true);
    
    if (!isFormValid) return;

    setIsLoading(true);
    setSaveMessage(null);

    try {
      // Add debug console log
      console.log('Starting memory save with data:', {
        title: title.trim(),
        location: location.trim() || undefined,
        text: `${memoryText.trim().substring(0, 50)}...`,
        date: selectedDate,
        imageCount: uploadedImages.length
      });

      const memoryData: MemoryData = {
        title: title.trim(),
        location: location.trim() || undefined,
        text: memoryText.trim(),
        date: selectedDate,
        tags: ['memory', 'love-journal']
      };

      // Log API URL
      console.log(`Sending request to: ${cloudinaryApi.getApiUrl()}/memory`);
      
      const response = await cloudinaryApi.saveMemory(memoryData, uploadedImages);
      
      console.log('Memory saved successfully:', response.memory);
      
      setSaveMessage({
        type: 'success',
        text: `Memory "${title}" saved successfully! 💕`
      });

      // Clear form after successful save
      setTimeout(() => {
        setTitle('');
        setLocation('');
        setMemoryText('');
        setSelectedDate(new Date().toISOString().split('T')[0]);
        setUploadedImages([]);
        setImagePreviews([]);
        setSaveMessage(null);
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
    selectedDate && 
    uploadedImages.length > 0;

  return (
    <div className="create-memory-page">
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
                <Type className="w-5 h-5 form-label-icon" />
                <span>Give this memory a title <span className="required-field">*</span></span>
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
                <MapPin className="w-5 h-5 form-label-icon" />
                <span>Where did this happen? <span className="required-field">*</span></span>
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

            {/* Date Selection */}
            <div className="form-section">
              <label className="form-label">
                <Calendar className="w-5 h-5 form-label-icon" />
                <span>When did this happen? <span className="required-field">*</span></span>
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="form-input"
                required
              />
            </div>

            {/* Memory Text */}
            <div className="form-section">
              <label className="form-label">
                <Heart className="w-5 h-5 form-label-icon" />
                <span>Tell your story <span className="required-field">*</span></span>
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
                <Camera className="w-5 h-5 form-label-icon" />
                <span>Add photos <span className="required-field">*</span></span>
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
                    {!selectedDate && <li>• Select a date</li>}
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