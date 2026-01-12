import { useState } from 'react';
import { X, Copy, Check, QrCode, ExternalLink } from 'lucide-react';
import * as QRCode from 'qrcode';

interface ShareAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  albumId: string;
  albumTitle: string;
  privacy: string;
}

export default function ShareAlbumModal({ isOpen, onClose, albumId, albumTitle, privacy }: ShareAlbumModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showQR, setShowQR] = useState(false);

  if (!isOpen) return null;

  // Generate share URL based on privacy
  const baseUrl = window.location.origin;
  const shareUrl = privacy === 'public' 
    ? `${baseUrl}/public/album/${albumId}`
    : `${baseUrl}/shared/album/${albumId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const generateQRCode = async () => {
    try {
      const url = await QRCode.toDataURL(shareUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#7C3AED',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(url);
      setShowQR(true);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    }
  };

  const openInNewTab = () => {
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">Chia sẻ Album</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-purple-100">{albumTitle}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Privacy Info */}
          <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
            {privacy === 'public' ? (
              <>
                <div className="p-2 bg-purple-600 rounded-lg">
                  <ExternalLink className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Album công khai</p>
                  <p className="text-sm text-gray-600">Bất kỳ ai có link đều có thể xem</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 bg-blue-600 rounded-lg">
                  <ExternalLink className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Album chia sẻ</p>
                  <p className="text-sm text-gray-600">Chỉ người có link mới xem được</p>
                </div>
              </>
            )}
          </div>

          {/* Share URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Link chia sẻ</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 select-all focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
              <button
                onClick={copyToClipboard}
                className={`px-4 py-3 rounded-xl transition-all flex items-center gap-2 ${
                  copied 
                    ? 'bg-green-500 text-white' 
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span className="hidden sm:inline">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={generateQRCode}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all"
            >
              <QrCode className="w-5 h-5" />
              <span>QR Code</span>
            </button>
            <button
              onClick={openInNewTab}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
            >
              <ExternalLink className="w-5 h-5" />
              <span>Mở</span>
            </button>
          </div>

          {/* QR Code Display */}
          {showQR && qrCodeUrl && (
            <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl text-center space-y-3">
              <p className="text-sm font-medium text-gray-700">Quét để xem album</p>
              <div className="bg-white p-4 rounded-xl inline-block shadow-lg">
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
              </div>
              <p className="text-xs text-gray-500">
                Quét mã QR này để mở album trên điện thoại
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="p-4 bg-blue-50 rounded-xl space-y-2">
            <p className="text-sm font-semibold text-blue-900">💡 Hướng dẫn:</p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Copy link và gửi cho bạn bè</li>
              <li>Tạo QR code để dễ chia sẻ</li>
              <li>Link sẽ hoạt động ngay lập tức</li>
              {privacy !== 'public' && (
                <li className="text-orange-700">⚠️ Chỉ người có link mới xem được</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
