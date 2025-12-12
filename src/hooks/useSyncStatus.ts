import { useState, useCallback, useEffect } from 'react';
import { SyncStatusType } from '../components/SyncStatus';

interface UseSyncStatusReturn {
  syncStatus: SyncStatusType;
  lastSyncTime: Date | null;
  errorMessage: string | null;
  startSync: () => void;
  syncSuccess: () => void;
  syncError: (message: string) => void;
  checkOnlineStatus: () => void;
}

export const useSyncStatus = (): UseSyncStatusReturn => {
  const [syncStatus, setSyncStatus] = useState<SyncStatusType>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check online/offline status
  const checkOnlineStatus = useCallback(() => {
    if (!navigator.onLine) {
      setSyncStatus((current) => current === 'offline' ? current : 'offline');
    } else {
      setSyncStatus((current) => current === 'offline' ? 'idle' : current);
    }
  }, []); // Remove syncStatus dependency

  // Start syncing
  const startSync = useCallback(() => {
    setSyncStatus('syncing');
    setErrorMessage(null);
  }, []);

  // Sync success
  const syncSuccess = useCallback(() => {
    setSyncStatus('synced');
    setLastSyncTime(new Date());
    setErrorMessage(null);
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      setSyncStatus('idle');
    }, 3000);
  }, []);

  // Sync error
  const syncError = useCallback((message: string) => {
    setSyncStatus('error');
    setErrorMessage(message);
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      setSyncStatus('idle');
    }, 5000);
  }, []);

  // Listen to online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus((current) => current === 'offline' ? 'idle' : current);
    };

    const handleOffline = () => {
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkOnlineStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkOnlineStatus]); // Remove syncStatus dependency

  return {
    syncStatus,
    lastSyncTime,
    errorMessage,
    startSync,
    syncSuccess,
    syncError,
    checkOnlineStatus,
  };
};
