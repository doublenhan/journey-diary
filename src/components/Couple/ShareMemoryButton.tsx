/**
 * ShareMemoryButton Component
 * 
 * Button to share/unshare memory with partner
 * Used in ViewMemory page
 */

import { useState } from 'react';
import { Share2, UserPlus, UserMinus, Check } from 'lucide-react';

interface ShareMemoryButtonProps {
  memoryId: string;
  isShared: boolean;
  partnerName?: string;
  onShare: () => Promise<void>;
  onUnshare: () => Promise<void>;
  disabled?: boolean;
}

export function ShareMemoryButton({
  memoryId: _memoryId,
  isShared,
  partnerName,
  onShare,
  onUnshare,
  disabled = false
}: ShareMemoryButtonProps) {
  const [showShareConfirm, setShowShareConfirm] = useState(false);
  const [showUnshareConfirm, setShowUnshareConfirm] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [unsharing, setUnsharing] = useState(false);

  const handleShare = async () => {
    try {
      setSharing(true);
      await onShare();
      setShowShareConfirm(false);
    } catch (err) {
      console.error('Failed to share memory:', err);
    } finally {
      setSharing(false);
    }
  };

  const handleUnshare = async () => {
    try {
      setUnsharing(true);
      await onUnshare();
      setShowUnshareConfirm(false);
    } catch (err) {
      console.error('Failed to unshare memory:', err);
    } finally {
      setUnsharing(false);
    }
  };

  if (!partnerName) {
    return null; // No partner connected
  }

  if (isShared) {
    // Already shared - show unshare button
    return (
      <>
        <button
          onClick={() => setShowUnshareConfirm(true)}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="w-4 h-4" />
          <span>Đã chia sẻ với {partnerName}</span>
        </button>

        {/* Unshare Confirmation Modal */}
        {showUnshareConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Hủy chia sẻ kỷ niệm?
              </h2>

              <p className="text-sm text-gray-600 mb-6">
                <strong>{partnerName}</strong> sẽ không thể xem kỷ niệm này nữa.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowUnshareConfirm(false)}
                  disabled={unsharing}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>

                <button
                  onClick={handleUnshare}
                  disabled={unsharing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {unsharing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang hủy...</span>
                    </>
                  ) : (
                    <>
                      <UserMinus className="w-4 h-4" />
                      <span>Hủy chia sẻ</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Not shared - show share button
  return (
    <>
      <button
        onClick={() => setShowShareConfirm(true)}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Share2 className="w-4 h-4" />
        <span>Chia sẻ với {partnerName}</span>
      </button>

      {/* Share Confirmation Modal */}
      {showShareConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Chia sẻ kỷ niệm
              </h2>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Chia sẻ kỷ niệm này với <strong>{partnerName}</strong>?
            </p>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
              <h4 className="text-sm font-semibold text-blue-900 mb-1">
                💡 Quyền truy cập
              </h4>
              <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                <li>{partnerName} chỉ có thể <strong>XEM</strong> kỷ niệm này</li>
                <li>Chỉ bạn mới có thể <strong>SỬA</strong> hoặc <strong>XÓA</strong></li>
                <li>Bạn có thể hủy chia sẻ bất kỳ lúc nào</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowShareConfirm(false)}
                disabled={sharing}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>

              <button
                onClick={handleShare}
                disabled={sharing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sharing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang chia sẻ...</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Chia sẻ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
