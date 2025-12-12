import { useState, useEffect } from 'react';
import { Cloud, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { OfflineQueue, PendingMemory } from '../utils/offlineQueue';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import '../styles/OfflineQueueStatus.css';

export function OfflineQueueStatus() {
  const [queue, setQueue] = useState<PendingMemory[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const isOnline = useOfflineStatus();
  
  useEffect(() => {
    // Load queue on mount and when online status changes
    const loadQueue = () => {
      setQueue(OfflineQueue.getQueue());
    };
    
    loadQueue();
    
    // Refresh every 5 seconds
    const interval = setInterval(loadQueue, 5000);
    
    return () => clearInterval(interval);
  }, [isOnline]);
  
  const pendingCount = queue.filter(m => m.status === 'pending').length;
  
  if (queue.length === 0) return null;
  
  return (
    <div className="offline-queue-status">
      <div 
        className="offline-queue-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Clock className="queue-icon" />
        <span className="queue-count">{pendingCount} memory chờ đồng bộ</span>
        {isOnline && <span className="queue-sync-hint">Đang chờ...</span>}
      </div>
      
      {isExpanded && (
        <div className="offline-queue-list">
          {queue.map(memory => (
            <div key={memory.id} className={`queue-item status-${memory.status}`}>
              <div className="queue-item-info">
                <div className="queue-item-title">{memory.title}</div>
                <div className="queue-item-date">{new Date(memory.createdAt).toLocaleString('vi-VN')}</div>
              </div>
              <div className="queue-item-status">
                {memory.status === 'pending' && <Clock size={16} />}
                {memory.status === 'syncing' && <Cloud size={16} className="spinning" />}
                {memory.status === 'synced' && <CheckCircle size={16} />}
                {memory.status === 'error' && <AlertCircle size={16} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
