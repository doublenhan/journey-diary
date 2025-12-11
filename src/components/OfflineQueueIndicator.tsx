import { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getQueue, getPendingCount, processQueue, clearCompleted, type QueuedAction } from '../utils/offlineQueue';

/**
 * OfflineQueueIndicator
 * 
 * Shows pending offline actions and allows manual sync
 */
export const OfflineQueueIndicator = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [queue, setQueue] = useState<QueuedAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Initial load
    updateQueue();

    // Listen for queue changes
    const handleQueueChange = () => {
      updateQueue();
    };

    window.addEventListener('offlineQueueChanged', handleQueueChange);
    
    return () => {
      window.removeEventListener('offlineQueueChanged', handleQueueChange);
    };
  }, []);

  const updateQueue = () => {
    const allQueue = getQueue();
    setQueue(allQueue);
    setPendingCount(getPendingCount());
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await processQueue();
      updateQueue();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearCompleted = () => {
    clearCompleted();
    updateQueue();
  };

  if (pendingCount === 0 && queue.length === 0) {
    return null;
  }

  const getActionIcon = (status: QueuedAction['status']) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} className="text-yellow-500" />;
      case 'syncing':
        return <RefreshCw size={16} className="text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'error':
        return <XCircle size={16} className="text-red-500" />;
    }
  };

  const getActionLabel = (type: QueuedAction['type']) => {
    switch (type) {
      case 'CREATE_MEMORY':
        return 'Tạo kỷ niệm';
      case 'UPDATE_MEMORY':
        return 'Cập nhật kỷ niệm';
      case 'DELETE_MEMORY':
        return 'Xóa kỷ niệm';
      case 'CREATE_ANNIVERSARY':
        return 'Tạo kỷ niệm';
      case 'UPDATE_ANNIVERSARY':
        return 'Cập nhật kỷ niệm';
      case 'DELETE_ANNIVERSARY':
        return 'Xóa kỷ niệm';
      default:
        return type;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
      }}
    >
      {/* Floating button */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        style={{
          background: pendingCount > 0 ? 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' : 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '999px',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: 600,
        }}
      >
        {pendingCount > 0 ? (
          <>
            <CloudOff size={20} />
            <span>{pendingCount} chờ đồng bộ</span>
          </>
        ) : (
          <>
            <Cloud size={20} />
            <span>Đã đồng bộ</span>
          </>
        )}
      </button>

      {/* Details panel */}
      {showDetails && (
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            right: 0,
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            minWidth: '320px',
            maxWidth: '400px',
            maxHeight: '400px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
              Hàng đợi đồng bộ
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              {navigator.onLine && pendingCount > 0 && (
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: isSyncing ? 'not-allowed' : 'pointer',
                    padding: '4px',
                  }}
                  title="Đồng bộ ngay"
                >
                  <RefreshCw 
                    size={18} 
                    className={isSyncing ? 'animate-spin' : ''} 
                    style={{ color: '#ec4899' }}
                  />
                </button>
              )}
              {queue.some(a => a.status === 'success') && (
                <button
                  onClick={handleClearCompleted}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    fontSize: '12px',
                    color: '#6b7280',
                  }}
                  title="Xóa đã hoàn thành"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>

          {/* Queue list */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '8px',
            }}
          >
            {queue.length === 0 ? (
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: '#9ca3af',
                }}
              >
                <Cloud size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '14px' }}>
                  Không có thao tác nào đang chờ
                </p>
              </div>
            ) : (
              queue.map((action) => (
                <div
                  key={action.id}
                  style={{
                    padding: '12px',
                    marginBottom: '8px',
                    background: action.status === 'error' ? '#fef2f2' : '#f9fafb',
                    borderRadius: '8px',
                    borderLeft: `3px solid ${
                      action.status === 'success' ? '#10b981' :
                      action.status === 'error' ? '#ef4444' :
                      action.status === 'syncing' ? '#3b82f6' :
                      '#f59e0b'
                    }`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                    }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>
                      {getActionLabel(action.type)}
                    </span>
                    {getActionIcon(action.status)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {new Date(action.timestamp).toLocaleString('vi-VN')}
                  </div>
                  {action.error && (
                    <div
                      style={{
                        marginTop: '8px',
                        fontSize: '12px',
                        color: '#ef4444',
                      }}
                    >
                      {action.error}
                    </div>
                  )}
                  {action.retryCount > 0 && (
                    <div
                      style={{
                        marginTop: '4px',
                        fontSize: '11px',
                        color: '#f59e0b',
                      }}
                    >
                      Thử lại: {action.retryCount}/{3}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {!navigator.onLine && (
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid #f3f4f6',
                background: '#fef2f2',
                fontSize: '12px',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CloudOff size={14} />
              <span>Không có kết nối. Sẽ tự động đồng bộ khi online.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
