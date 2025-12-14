import React from 'react';
import { Cloud, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import '../styles/SyncStatus.css';

export type SyncStatusType = 'idle' | 'syncing' | 'synced' | 'error';

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
            <div className="sync-icon-wrapper syncing">
              <Cloud className="sync-cloud" />
              <Loader className="sync-loader" />
            </div>
          ),
          text: 'Đang đồng bộ...',
          className: 'syncing'
        };
      
      case 'synced':
        return {
          icon: (
            <div className="sync-icon-wrapper synced">
              <CheckCircle className="sync-check" />
              <div className="success-ripple"></div>
            </div>
          ),
          text: `Đã đồng bộ ${formatTime(lastSyncTime)}`,
          className: 'synced'
        };
      
      case 'error':
        return {
          icon: (
            <div className="sync-icon-wrapper error">
              <AlertCircle className="sync-alert" />
            </div>
          ),
          text: errorMessage || 'Lỗi đồng bộ',
          className: 'error'
        };
      
      default:
        return null;
    }
  };

  const content = getStatusContent();
  if (!content || status === 'idle') return null;

  return (
    <div className={`sync-status ${content.className} ${className}`}>
      {content.icon}
      <span className="sync-status-text">{content.text}</span>
    </div>
  );
};

export default SyncStatus;
