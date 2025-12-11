import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

/**
 * OfflineDetector Component
 * 
 * Displays a banner when user goes offline
 * Auto-hides when connection is restored
 */
export const OfflineDetector = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      console.log('🟢 Online event triggered');
      setIsOnline(true);
      
      // Show "Back online" message briefly
      setShowBanner(true);
      setTimeout(() => {
        setShowBanner(false);
      }, 3000);
    };

    const handleOffline = () => {
      console.log('🔴 Offline event triggered');
      setIsOnline(false);
      setShowBanner(true);
    };

    // Poll navigator.onLine every second to catch changes
    // This is needed because DevTools offline mode doesn't trigger events
    const pollInterval = setInterval(() => {
      const currentOnline = navigator.onLine;
      if (currentOnline !== isOnline) {
        console.log('📡 Connection status changed:', currentOnline ? 'online' : 'offline');
        if (currentOnline) {
          handleOnline();
        } else {
          handleOffline();
        }
      }
    }, 1000);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline]);

  if (!showBanner) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        animation: 'slideDown 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
      
      <div
        style={{
          background: isOnline 
            ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
            : 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
          color: 'white',
          padding: '12px 20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}
        >
          {isOnline ? (
            <>
              <Wifi size={20} />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>
                ✅ Đã kết nối lại internet
              </span>
            </>
          ) : (
            <>
              <WifiOff size={20} />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>
                📡 Bạn đang offline - Một số tính năng có thể bị hạn chế
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * useOnlineStatus Hook
 * 
 * Returns current online/offline status
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
