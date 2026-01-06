/**
 * SendCoupleInvitationModal Component
 * 
 * Modal to send couple invitation by email
 */

import { useState } from 'react';
import { Heart, X, Send, Mail } from 'lucide-react';

interface SendCoupleInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (email: string, message: string) => Promise<void>;
}

export function SendCoupleInvitationModal({
  isOpen,
  onClose,
  onSend
}: SendCoupleInvitationModalProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSend = async () => {
    // Validate email
    if (!email.trim()) {
      setError('Vui lòng nhập email');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email không hợp lệ');
      return;
    }

    // Validate message (required)
    if (!message.trim()) {
      setError('Vui lòng nhập lời nhắn');
      return;
    }

    try {
      setSending(true);
      setError(null);
      
      await onSend(email.trim(), message.trim());
      
      // Success - close modal
      setEmail('');
      setMessage('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Không thể gửi lời mời');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (sending) return;
    setEmail('');
    setMessage('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Kết nối với người thân
            </h2>
          </div>
          
          <button
            onClick={handleClose}
            disabled={sending}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Gửi lời mời kết nối để chia sẻ kỷ niệm với người thân của bạn.
            Họ sẽ nhận được email thông báo.
          </p>

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email người nhận <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="partner@example.com"
                disabled={sending}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Message Input (Required) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lời nhắn <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setError(null);
              }}
              placeholder="Nhập lời nhắn của bạn..."
              disabled={sending}
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-gray-500">
                Lời nhắn sẽ được gửi kèm email
              </p>
              <span className="text-xs text-gray-400">
                {message.length}/500
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 mb-1">
              💡 Lưu ý
            </h4>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>Lời mời có hiệu lực trong 7 ngày</li>
              <li>Người nhận cần có tài khoản trong hệ thống</li>
              <li>Mỗi lần chỉ kết nối với 1 người</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={sending}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy
          </button>
          
          <button
            onClick={handleSend}
            disabled={sending || !email.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang gửi...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Gửi lời mời</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
