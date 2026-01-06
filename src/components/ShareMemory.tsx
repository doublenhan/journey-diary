import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Share2, Download, X, Loader, Image as ImageIcon, Heart, Calendar, MapPin } from 'lucide-react';
import { WebPImage } from './WebPImage';

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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-[600px] w-full max-h-[90vh] overflow-y-auto shadow-[0_25px_50px_rgba(0,0,0,0.25)] animate-slideUp" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-pink-100">
          <h3 className="text-xl font-bold text-gray-700 m-0">Chia Sẻ Kỷ Niệm</h3>
          <button 
            onClick={onClose} 
            className="bg-pink-100 border-none rounded-full w-10 h-10 flex items-center justify-center cursor-pointer transition-all duration-200 text-pink-500 hover:bg-pink-500 hover:text-white hover:rotate-90" 
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Card */}
        <div className="p-8 bg-gradient-to-br from-[#fef3f9] to-pink-100 flex justify-center items-center">
          <div ref={cardRef} className="w-full max-w-[500px] mx-auto bg-white rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(236,72,153,0.2)] border-[3px]" style={{ borderColor: primaryColor }}>
            {/* Card Header with gradient */}
            <div className="p-6 flex items-center gap-4" style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`
            }}>
              <Heart className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white m-0 flex-1">{memory.title}</h2>
            </div>

            {/* Card Content */}
            <div className="p-4">
              {/* Date and Location */}
              <div className="flex flex-wrap gap-3 mb-3.5">
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                  <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
                  <span>{formatDate(memory.date)}</span>
                </div>
                {memory.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                    <MapPin className="w-4 h-4" style={{ color: primaryColor }} />
                    <span>{memory.location}</span>
                  </div>
                )}
              </div>

              {/* Image Grid */}
              {memory.images && memory.images.length > 0 && (
                <div className={`grid gap-2 mb-4 p-0 ${memory.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {memory.images.slice(0, 4).map((img, idx) => (
                    <div key={idx} className="relative w-full aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
                      <WebPImage
                        src={img.secure_url}
                        alt={`Memory ${idx + 1}`}
                      />
                      {memory.images.length > 4 && idx === 3 && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-2xl font-bold">
                          <ImageIcon className="w-8 h-8" />
                          <span>+{memory.images.length - 4}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Description */}
              <div className="mb-6">
                <p className="text-[0.95rem] leading-relaxed text-gray-700 m-0">
                  {memory.text.slice(0, 200)}{memory.text.length > 200 ? '...' : ''}
                </p>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t-2 border-pink-100 flex justify-center">
                <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: primaryColor }}>
                  <Heart className="w-4 h-4" />
                  <span>Love Diary</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-8 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 px-8 pt-6 pb-8">
          <button
            onClick={handleCapture}
            disabled={isCapturing}
            className="flex-1 flex items-center justify-center gap-3 px-6 py-4 border-none rounded-2xl text-base font-semibold text-white cursor-pointer transition-all duration-300 shadow-[0_4px_12px_rgba(236,72,153,0.3)] hover:translate-y-[-2px] hover:shadow-[0_8px_20px_rgba(236,72,153,0.4)] disabled:cursor-not-allowed disabled:opacity-70"
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
            className="flex-1 flex items-center justify-center gap-3 px-6 py-4 border-none rounded-2xl text-base font-semibold text-white cursor-pointer transition-all duration-300 shadow-[0_4px_12px_rgba(236,72,153,0.3)] hover:translate-y-[-2px] hover:shadow-[0_8px_20px_rgba(236,72,153,0.4)] disabled:cursor-not-allowed disabled:opacity-70"
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
