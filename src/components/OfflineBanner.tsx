import { useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import '../styles/OfflineBanner.css';

export function OfflineBanner() {
  const isOnline = useOfflineStatus();

  useEffect(() => {
    if (!isOnline) {
      document.body.classList.add('has-offline-banner');
    } else {
      document.body.classList.remove('has-offline-banner');
    }
    
    return () => {
      document.body.classList.remove('has-offline-banner');
    };
  }, [isOnline]);

  if (isOnline) return null;

  return (
    <div 
      className="offline-banner"
      style={{
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000
      }}
    >
      <WifiOff className="offline-icon" />
      <span>Bạn đang offline. Hãy check lại kết nối.</span>
    </div>
  );
}
