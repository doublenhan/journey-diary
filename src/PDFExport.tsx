import { useState, useRef } from 'react';
import { Heart, Calendar, ArrowLeft, Download, Mail, FileText, Image, Palette, Settings, Check, X, Loader2, Star, Sparkles, BookOpen } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './styles/PDFExport.css';
import useCloudinary from './hooks/useCloudinary';
import { useCurrentUserId } from './hooks/useCurrentUserId';
import PDFReview from './PDFReview';
import React from 'react';

interface Memory {
  id: string;
  date: string;
  content: string;
  photos: string[];
  mood: string;
  moodEmoji: string;
}


interface PDFExportProps {
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

interface ExportSettings {
  dateRange: {
    start: string;
    end: string;
  };
  selectedMemories: string[];
  template: 'romantic' | 'elegant' | 'scrapbook';
  includeImages: boolean;
  includeMoods: boolean;
  coverPage: {
    enabled: boolean;
    title: string;
    names: string;
    featuredImage: string;
  };
}

function PDFExport({ onBack, currentTheme }: PDFExportProps) {
  const theme = themes[currentTheme];
  const [memories, setMemories] = useState<Memory[]>([]);
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    dateRange: {
      start: '2024-01-01',
      end: new Date().toISOString().split('T')[0]
    },
    selectedMemories: [],
    template: 'romantic',
    includeImages: true,
    includeMoods: true,
    coverPage: {
      enabled: true,
      title: 'Our Love Story',
      names: 'Sarah & Michael',
      featuredImage: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=600'
    }
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [showPhotoReview, setShowPhotoReview] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  // State for expanded memories
  const [expandedMemories, setExpandedMemories] = useState<string[]>([]);

  // Fetch memories using useCloudinary
  const { fetchMemories } = useCloudinary();
  const { userId } = useCurrentUserId();
  React.useEffect(() => {
    async function loadMemories() {
      try {
        console.log('userId:', userId);
        if (!userId) {
          console.warn('userId is empty. Please login or set userId before using PDFExport.');
          setMemories([]);
          return;
        }
        const data = await fetchMemories(userId);
        console.log('Fetched memories:', data);
        // Filter by date range
        const filteredMemories = data.filter((memory: any) => {
          const memoryDate = new Date(memory.date);
          const startDate = new Date(exportSettings.dateRange.start);
          const endDate = new Date(exportSettings.dateRange.end);
          return memoryDate >= startDate && memoryDate <= endDate;
        }).map((memory: any) => ({
          ...memory,
          content:
            typeof memory.content === 'string' && memory.content.trim().length > 0
              ? memory.content
              : (typeof memory.text === 'string' && memory.text.trim().length > 0
                ? memory.text
                : ''),
          photos: Array.isArray(memory.photos) && memory.photos.length > 0
            ? memory.photos
            : (Array.isArray(memory.images) ? memory.images.map((img: any) => img.secure_url) : []),
          mood: typeof memory.mood === 'string' ? memory.mood : '',
          moodEmoji: typeof memory.moodEmoji === 'string' ? memory.moodEmoji : '',
        }));
        console.log('Filtered memories:', filteredMemories);
        setMemories(filteredMemories);
      } catch (error) {
        console.error('Error loading memories:', error);
        setMemories([]);
      }
    }
    loadMemories();
  }, [exportSettings.dateRange, userId]);

  // Update selectedMemories only when memories change
  React.useEffect(() => {
    setExportSettings(prev => ({
      ...prev,
      selectedMemories: memories.map((m: Memory) => m.id)
    }));
  }, [memories]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTemplateStyles = (template: string) => {
    switch (template) {
      case 'romantic':
        return {
          background: 'linear-gradient(135deg, #fdf2f8, #fef7ed)',
          primaryColor: '#ec4899',
          secondaryColor: '#f43f5e',
          fontFamily: 'Georgia, serif',
          decorativeElements: true
        };
      case 'elegant':
        return {
          background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
          primaryColor: '#475569',
          secondaryColor: '#64748b',
          fontFamily: 'Times New Roman, serif',
          decorativeElements: false
        };
      case 'scrapbook':
        return {
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          primaryColor: '#d97706',
          secondaryColor: '#f59e0b',
          fontFamily: 'Comic Sans MS, cursive',
          decorativeElements: true
        };
      default:
        return {
          background: 'white',
          primaryColor: '#000000',
          secondaryColor: '#666666',
          fontFamily: 'Arial, sans-serif',
          decorativeElements: false
        };
    }
  };

  const convertImageToBase64 = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return '';
    }
  };

  const generatePDF = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      
      let yPosition = margin;
      const templateStyles = getTemplateStyles(exportSettings.template);

      // Add cover page if enabled
      if (exportSettings.coverPage.enabled) {
        setExportProgress(10);
        
        // Cover page background
        pdf.setFillColor(236, 72, 153);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
        
        // Cover page content
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(32);
        pdf.setFont('helvetica', 'bold');
        
        const titleLines = pdf.splitTextToSize(exportSettings.coverPage.title, contentWidth);
        const titleHeight = titleLines.length * 12;
        pdf.text(titleLines, pageWidth / 2, pageHeight / 2 - 30, { align: 'center' });
        
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'normal');
        pdf.text(exportSettings.coverPage.names, pageWidth / 2, pageHeight / 2 + 10, { align: 'center' });
        
        // Add featured image if available
        if (exportSettings.coverPage.featuredImage && exportSettings.includeImages) {
          try {
            const base64Image = await convertImageToBase64(exportSettings.coverPage.featuredImage);
            if (base64Image) {
              const imgWidth = 60;
              const imgHeight = 40;
              pdf.addImage(base64Image, 'JPEG', (pageWidth - imgWidth) / 2, pageHeight / 2 + 30, imgWidth, imgHeight);
            }
          } catch (error) {
            console.error('Error adding cover image:', error);
          }
        }
        
        // Add decorative elements
        if (templateStyles.decorativeElements) {
          pdf.setDrawColor(255, 255, 255);
          pdf.setLineWidth(2);
          pdf.rect(margin, margin, contentWidth, pageHeight - (margin * 2));
        }
        
        pdf.addPage();
        yPosition = margin;
      }

      setExportProgress(20);

      // Filter selected memories
      const selectedMemories = memories.filter(memory => 
        exportSettings.selectedMemories.includes(memory.id)
      );

      // Add memories
      for (let i = 0; i < selectedMemories.length; i++) {
        const memory = selectedMemories[i];
        setExportProgress(20 + (i / selectedMemories.length) * 70);

        // Check if we need a new page
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = margin;
        }

        // Memory date header
        pdf.setFillColor(236, 72, 153);
        pdf.rect(margin, yPosition, contentWidth, 15, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        
        let dateText = formatDate(memory.date);
        if (exportSettings.includeMoods) {
          dateText += ` ${memory.moodEmoji}`;
        }
        
        pdf.text(dateText, margin + 5, yPosition + 10);
        yPosition += 20;

        // Memory content
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        
        const contentLines = pdf.splitTextToSize(memory.content, contentWidth);
        pdf.text(contentLines, margin, yPosition);
        yPosition += contentLines.length * 5 + 10;

        // Add images if enabled
        if (exportSettings.includeImages && memory.photos.length > 0) {
          for (const photo of memory.photos) {
            try {
              const base64Image = await convertImageToBase64(photo);
              if (base64Image) {
                // Check if image fits on current page
                const imgHeight = 60;
                if (yPosition + imgHeight > pageHeight - margin) {
                  pdf.addPage();
                  yPosition = margin;
                }
                
                const imgWidth = Math.min(contentWidth, 80);
                pdf.addImage(base64Image, 'JPEG', margin, yPosition, imgWidth, imgHeight);
                yPosition += imgHeight + 10;
              }
            } catch (error) {
              console.error('Error adding image:', error);
            }
          }
        }

        yPosition += 15; // Space between memories
      }

      setExportProgress(95);

      // Add footer to all pages
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setTextColor(150, 150, 150);
        pdf.setFontSize(8);
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        pdf.text('Generated by Love Journal', pageWidth - margin, pageHeight - 10, { align: 'right' });
      }

      setExportProgress(100);

      // Save the PDF
      const fileName = `${exportSettings.coverPage.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const toggleMemorySelection = (memoryId: string) => {
    setExportSettings(prev => ({
      ...prev,
      selectedMemories: prev.selectedMemories.includes(memoryId)
        ? prev.selectedMemories.filter(id => id !== memoryId)
        : [...prev.selectedMemories, memoryId]
    }));
  };

  // Toggle expand/collapse for memory content
  const toggleExpandMemory = (memoryId: string) => {
    setExpandedMemories(prev =>
      prev.includes(memoryId)
        ? prev.filter(id => id !== memoryId)
        : [...prev, memoryId]
    );
  };

  const selectAllMemories = () => {
    setExportSettings(prev => ({
      ...prev,
      selectedMemories: memories.map(m => m.id)
    }));
  };

  const deselectAllMemories = () => {
    setExportSettings(prev => ({
      ...prev,
      selectedMemories: []
    }));
  };

  const getTemplateIcon = (template: string) => {
    switch (template) {
      case 'romantic':
        return <Heart className="w-6 h-6" />;
      case 'elegant':
        return <Star className="w-6 h-6" />;
      case 'scrapbook':
        return <BookOpen className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  return (
    <div className="pdf-export-page" style={{ background: theme.background, color: theme.textPrimary }}>
      {showPhotoReview ? (
        <PDFReview
          images={memories
            .filter(m => exportSettings.selectedMemories.includes(m.id))
            .flatMap(m => Array.isArray(m.photos) ? m.photos : [])}
        />
      ) : (
        <>
          {/* Header */}
          <header className="pdf-export-header">
            <div className="pdf-export-header-container">
              <div className="pdf-export-header-content">
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
                  <span className="header-logo-text">Love Journal</span>
                </div>
                
                <div className="w-16"></div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="pdf-export-main">
            {/* Page Header */}
            <div className="page-header">
              <h1 className="page-title">
                Export to
                <span className="gradient-text"> PDF</span>
              </h1>
              <p className="page-subtitle">
                Create a beautiful PDF book of your love memories to print and treasure forever
              </p>
            </div>

            <div className="export-container">
              {/* Settings Panel */}
              <div className="settings-panel">
                <div className="settings-card">
                  <div className="settings-header">
                    <Settings className="w-6 h-6 text-pink-500" />
                    <h2 className="settings-title">Export Settings</h2>
                  </div>

                  {/* Date Range */}
                  <div className="setting-group">
                    <label className="setting-label">
                      <Calendar className="w-5 h-5" />
                      Date Range
                    </label>
                    <div className="date-range-inputs">
                      <input
                        type="date"
                        value={exportSettings.dateRange.start}
                        onChange={(e) => setExportSettings(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, start: e.target.value }
                        }))}
                        className="date-input"
                      />
                      <span className="date-separator">to</span>
                      <input
                        type="date"
                        value={exportSettings.dateRange.end}
                        onChange={(e) => setExportSettings(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, end: e.target.value }
                        }))}
                        className="date-input"
                      />
                    </div>
                  </div>

                  {/* Template Selection */}
                  <div className="setting-group">
                    <label className="setting-label">
                      <Palette className="w-5 h-5" />
                      Template Style
                    </label>
                    <div className="template-grid">
                      {[
                        { id: 'romantic', name: 'Romantic', description: 'Pink hearts & elegant fonts' },
                        { id: 'elegant', name: 'Elegant', description: 'Clean & sophisticated' },
                        { id: 'scrapbook', name: 'Scrapbook', description: 'Fun & colorful design' }
                      ].map((template) => (
                        <button
                          key={template.id}
                          onClick={() => setExportSettings(prev => ({ ...prev, template: template.id as any }))}
                          className={`template-option ${exportSettings.template === template.id ? 'selected' : ''}`}
                        >
                          <div className="template-icon">
                            {getTemplateIcon(template.id)}
                          </div>
                          <div className="template-info">
                            <h3 className="template-name">{template.name}</h3>
                            <p className="template-description">{template.description}</p>
                          </div>
                          {exportSettings.template === template.id && (
                            <Check className="w-5 h-5 text-pink-500 template-check" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Content Options */}
                  <div className="setting-group">
                    <label className="setting-label">Content Options</label>
                    <div className="checkbox-group">
                      <label className="checkbox-option">
                        <input
                          type="checkbox"
                          checked={exportSettings.includeImages}
                          onChange={(e) => setExportSettings(prev => ({ ...prev, includeImages: e.target.checked }))}
                          className="checkbox-input"
                        />
                        <Image className="w-5 h-5" />
                        <span>Include Photos</span>
                      </label>
                      <label className="checkbox-option">
                        <input
                          type="checkbox"
                          checked={exportSettings.includeMoods}
                          onChange={(e) => setExportSettings(prev => ({ ...prev, includeMoods: e.target.checked }))}
                          className="checkbox-input"
                        />
                        <Sparkles className="w-5 h-5" />
                        <span>Include Mood Indicators</span>
                      </label>
                    </div>
                  </div>

                  {/* Cover Page Settings */}
                  <div className="setting-group">
                    <label className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={exportSettings.coverPage.enabled}
                        onChange={(e) => setExportSettings(prev => ({
                          ...prev,
                          coverPage: { ...prev.coverPage, enabled: e.target.checked }
                        }))}
                        className="checkbox-input"
                      />
                      <FileText className="w-5 h-5" />
                      <span>Include Cover Page</span>
                    </label>

                    {exportSettings.coverPage.enabled && (
                      <div className="cover-page-settings">
                        <input
                          type="text"
                          placeholder="Book Title"
                          value={exportSettings.coverPage.title}
                          onChange={(e) => setExportSettings(prev => ({
                            ...prev,
                            coverPage: { ...prev.coverPage, title: e.target.value }
                          }))}
                          className="cover-input"
                        />
                        <input
                          type="text"
                          placeholder="Your Names"
                          value={exportSettings.coverPage.names}
                          onChange={(e) => setExportSettings(prev => ({
                            ...prev,
                            coverPage: { ...prev.coverPage, names: e.target.value }
                          }))}
                          className="cover-input"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Memory Selection */}
              <div className="memory-selection-panel">
                <div className="memory-selection-card">
                  <div className="memory-selection-header">
                    <div className="memory-selection-title">
                      <Heart className="w-6 h-6 text-pink-500" />
                      <h2>Select Memories</h2>
                      <span className="memory-count">
                        {exportSettings.selectedMemories.length} of {memories.length} selected
                      </span>
                    </div>
                    <div className="selection-actions">
                      <button onClick={selectAllMemories} className="select-action">
                        Select All
                      </button>
                      <button onClick={deselectAllMemories} className="select-action">
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="memory-list">
                    {memories.map((memory) => {
                      const isExpanded = expandedMemories.includes(memory.id);
                      return (
                        <div
                          key={memory.id}
                          className={`memory-item ${exportSettings.selectedMemories.includes(memory.id) ? 'selected' : ''}`}
                        >
                          <div className="memory-checkbox" onClick={() => toggleMemorySelection(memory.id)}>
                            {exportSettings.selectedMemories.includes(memory.id) ? (
                              <Check className="w-5 h-5 text-white" />
                            ) : (
                              <div className="checkbox-empty"></div>
                            )}
                          </div>
                          <div className="memory-content">
                            <div className="memory-header">
                              <span className="memory-date">{formatDate(memory.date)}</span>
                              {exportSettings.includeMoods && (
                                <span className="memory-mood">{memory.moodEmoji || ''}</span>
                              )}
                            </div>
                            <p className="memory-text" style={{ marginBottom: '4px' }}>
                              {typeof memory.content === 'string' && memory.content.trim().length > 0
                                ? memory.content.length > 120
                                  ? memory.content.substring(0, 120) + '...'
                                  : memory.content
                                : <span style={{ color: '#bbb', fontStyle: 'italic' }}>(No content)</span>}
                            </p>
                            {Array.isArray(memory.photos) && memory.photos.length > 0 && (
                              <div className="memory-photos-indicator">
                                <Image className="w-4 h-4" />
                                <span>{memory.photos.length} photo{memory.photos.length !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {memories.length === 0 && (
                    <div className="empty-memories">
                      <Heart className="w-12 h-12 text-pink-200" />
                      <p>No memories found in the selected date range</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Export Actions */}
            <div className="export-actions">
              <div className="export-actions-card">
                <div className="export-info">
                  <h3 className="export-info-title">Ready to Export</h3>
                  <p className="export-info-text">
                    {exportSettings.selectedMemories.length} memories selected • 
                    {exportSettings.template} template • 
                    {exportSettings.includeImages ? 'With' : 'Without'} photos
                  </p>
                </div>

                <div className="export-buttons">
                  <button
                    onClick={generatePDF}
                    disabled={exportSettings.selectedMemories.length === 0 || isExporting}
                    className="export-button primary"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Generating PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        <span>Download PDF</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    disabled={exportSettings.selectedMemories.length === 0}
                    className="export-button secondary"
                  >
                    <FileText className="w-5 h-5" />
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={() => setShowPhotoReview(true)}
                    disabled={memories.filter(m => exportSettings.selectedMemories.includes(m.id)).flatMap(m => Array.isArray(m.photos) ? m.photos : []).length === 0}
                    className="export-button secondary"
                    style={{ marginLeft: '8px', background: '#fdf2f8', color: '#ec4899', border: '1px solid #ec4899' }}
                  >
                    <Image className="w-5 h-5" />
                    <span>Photo Review</span>
                  </button>
                </div>

                {isExporting && (
                  <div className="export-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${exportProgress}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{exportProgress}% Complete</span>
                  </div>
                )}
              </div>
            </div>
          </main>
        </>
      )}
    </div>
  );
}

export default PDFExport;