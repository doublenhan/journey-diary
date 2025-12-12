import { WifiOff } from 'lucide-react';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import '../styles/OfflineBanner.css';

export function OfflineBanner() {
  const isOnline = useOfflineStatus();

  if (isOnline) return null;

  return (
    <div className="offline-banner">
      <WifiOff className="offline-icon" />
      <span>Bạn đang offline. Xem dữ liệu đã lưu.</span>
    </div>
  );
}
