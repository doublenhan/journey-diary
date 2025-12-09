import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Share2, Download, X, Loader, Image as ImageIcon, Heart, Calendar, MapPin } from 'lucide-react';
import '../styles/ShareMemory.css';

interface Memory {
  id: string;
  title: string;
  date: string;
  text: string;
  location?: string | null;
  images: Array<{
    secure_url: string;
  }>;
}

interface ShareMemoryProps {
  memory: Memory;
  onClose: () => void;
  theme?: {
    colors: {
      primary: string;
      secondary: string;
      background: string;
    };
  };
}

export function ShareMemory({ memory, onClose, theme }: ShareMemoryProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return dateString;
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    
    return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
  };

  const handleCapture = async () => {
    if (!cardRef.current) return;

    setIsCapturing(true);
    setError(null);

    try {
      // Wait a bit for any animations to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Use optimized settings for high-quality download
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2.5,
        useCORS: true,
        allowTaint: false,
        logging: false,
        imageTimeout: 15000,
        removeContainer: true,
        windowWidth: cardRef.current.scrollWidth,
        windowHeight: cardRef.current.scrollHeight,
        width: cardRef.current.offsetWidth,
        height: cardRef.current.offsetHeight,
        scrollX: 0,
        scrollY: -window.scrollY,
        x: 0,
        y: 0,
      });

      // Convert to blob with maximum quality
      canvas.toBlob((blob) => {
        if (!blob) {
          setError('Không thể tạo ảnh. Vui lòng thử lại.');
          setIsCapturing(false);
          return;
        }

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `memory-${memory.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setIsCapturing(false);
        
        // Show success and close after delay
        setTimeout(() => {
          onClose();
        }, 1000);
      }, 'image/png', 1.0); // Max quality
    } catch (err) {
      console.error('Error capturing memory:', err);
      setError('Đã xảy ra lỗi khi tạo ảnh. Vui lòng thử lại.');
      setIsCapturing(false);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;

    setIsCapturing(true);
    setError(null);

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: cardRef.current.scrollWidth,
        windowHeight: cardRef.current.scrollHeight,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setError('Không thể tạo ảnh. Vui lòng thử lại.');
          setIsCapturing(false);
          return;
        }

        // Check if Web Share API is available
        if (navigator.share && navigator.canShare) {
          const file = new File([blob], `memory-${Date.now()}.png`, { type: 'image/png' });
          
          if (navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                title: memory.title,
                text: `Kỷ niệm: ${memory.title}`,
                files: [file]
              });
              setIsCapturing(false);
              onClose();
            } catch (shareError: any) {
              if (shareError.name !== 'AbortError') {
                console.error('Share failed:', shareError);
                // Fallback to download
                handleCapture();
              } else {
                setIsCapturing(false);
              }
            }
          } else {
            // Fallback to download
            handleCapture();
          }
        } else {
          // Fallback to download
          handleCapture();
        }
      }, 'image/png');
    } catch (err) {
      console.error('Error sharing memory:', err);
      setError('Đã xảy ra lỗi. Vui lòng thử lại.');
      setIsCapturing(false);
    }
  };

  const primaryColor = theme?.colors?.primary || '#ec4899';

  return (
    <div className="share-memory-overlay" onClick={onClose}>
      <div className="share-memory-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="share-memory-header">
          <h3 className="share-memory-title">Chia Sẻ Kỷ Niệm</h3>
          <button onClick={onClose} className="share-memory-close" title="Đóng">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Card */}
        <div className="share-memory-preview">
          <div ref={cardRef} className="memory-share-card" style={{ borderColor: primaryColor }}>
            {/* Card Header with gradient */}
            <div className="memory-card-header" style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`
            }}>
              <Heart className="w-6 h-6 text-white" />
              <h2 className="memory-card-title">{memory.title}</h2>
            </div>

            {/* Card Content */}
            <div className="memory-card-content">
              {/* Date and Location */}
              <div className="memory-card-meta">
                <div className="memory-meta-item">
                  <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
                  <span>{formatDate(memory.date)}</span>
                </div>
                {memory.location && (
                  <div className="memory-meta-item">
                    <MapPin className="w-4 h-4" style={{ color: primaryColor }} />
                    <span>{memory.location}</span>
                  </div>
                )}
              </div>

              {/* Image Grid */}
              {memory.images && memory.images.length > 0 && (
                <div className={`memory-card-images ${memory.images.length === 1 ? 'single' : ''}`}>
                  {memory.images.slice(0, 4).map((img, idx) => (
                    <div key={idx} className="memory-card-image">
                      <img 
                        src={img.secure_url} 
                        alt={`Memory ${idx + 1}`}
                        crossOrigin="anonymous"
                      />
                      {memory.images.length > 4 && idx === 3 && (
                        <div className="image-overlay">
                          <ImageIcon className="w-8 h-8" />
                          <span>+{memory.images.length - 4}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Description */}
              <div className="memory-card-text">
                <p>{memory.text.slice(0, 200)}{memory.text.length > 200 ? '...' : ''}</p>
              </div>

              {/* Footer */}
              <div className="memory-card-footer">
                <div className="app-branding" style={{ color: primaryColor }}>
                  <Heart className="w-4 h-4" />
                  <span>Love Diary</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="share-error-message">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="share-memory-actions">
          <button
            onClick={handleCapture}
            disabled={isCapturing}
            className="share-action-btn download"
            style={{ background: isCapturing ? '#d1d5db' : primaryColor }}
          >
            {isCapturing ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Tải Xuống</span>
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            disabled={isCapturing}
            className="share-action-btn share"
            style={{ background: isCapturing ? '#d1d5db' : `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
          >
            {isCapturing ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Share2 className="w-5 h-5" />
                <span>Chia Sẻ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
