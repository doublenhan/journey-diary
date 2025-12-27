import React from 'react';
import { Cloud, CheckCircle, AlertCircle, Loader, WifiOff } from 'lucide-react';

export type SyncStatusType = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

interface SyncStatusProps {
  status: SyncStatusType;
  lastSyncTime?: Date | null;
  errorMessage?: string;
  className?: string;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ 
  status, 
  lastSyncTime, 
  errorMessage,
  className = ''
}) => {
  const formatTime = (date?: Date | null) => {
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 10) return 'vừa xong';
    if (diff < 60) return `${diff} giây trước`;
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusContent = () => {
    switch (status) {
      case 'syncing':
        return {
          icon: (
            <div className="relative flex items-center justify-center w-6 h-6">
              <Cloud className="w-6 h-6 text-blue-500 animate-float" />
              <Loader className="absolute w-4 h-4 text-blue-400 animate-spin" />
            </div>
          ),
          text: 'Đang đồng bộ...',
          className: 'border-2 border-blue-500/20 bg-gradient-to-br from-blue-50/95 to-white/98 text-blue-600'
        };
      
      case 'synced':
        return {
          icon: (
            <div className="relative flex items-center justify-center w-6 h-6">
              <CheckCircle className="w-6 h-6 text-green-500 animate-bounce-in" />
              <div className="absolute w-full h-full rounded-full border-2 border-green-500 animate-[ripple_1s_ease-out]"></div>
            </div>
          ),
          text: `Đã đồng bộ ${formatTime(lastSyncTime)}`,
          className: 'border-2 border-green-500/20 bg-gradient-to-br from-green-50/95 to-white/98 text-green-600 animate-[pulse_0.6s_ease-out]'
        };
      
      case 'error':
        return {
          icon: (
            <div className="relative flex items-center justify-center w-6 h-6">
              <AlertCircle className="w-6 h-6 text-red-500 animate-[wiggle_0.5s_ease-in-out]" />
            </div>
          ),
          text: errorMessage || 'Lỗi đồng bộ',
          className: 'border-2 border-red-500/20 bg-gradient-to-br from-red-50/95 to-white/98 text-red-600 animate-[shake_0.5s_ease-in-out]'
        };
      
      case 'offline':
        return {
          icon: (
            <div className="relative flex items-center justify-center w-6 h-6">
              <WifiOff className="w-6 h-6 text-gray-500 animate-[fade_1.5s_ease-in-out_infinite]" />
            </div>
          ),
          text: 'Không có kết nối',
          className: 'border-2 border-gray-400/20 bg-gradient-to-br from-gray-50/95 to-white/98 text-gray-600'
        };
      
      default:
        return null;
    }
  };

  const content = getStatusContent();
  if (!content || status === 'idle') return null;

  return (
    <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-5 py-3 bg-white/98 backdrop-blur-xl rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)] text-sm font-medium z-[9999] animate-slideUp transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.15),0_4px_12px_rgba(0,0,0,0.1)] ${content.className} ${className}`}>
      {content.icon}
      <span>{content.text}</span>
    </div>
  );
};

export default SyncStatus;
