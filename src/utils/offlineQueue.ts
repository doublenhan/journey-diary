/**
 * Offline Queue Manager
 * 
 * Queues actions when offline and syncs when back online
 */

export interface QueuedAction {
  id: string;
  type: 'CREATE_MEMORY' | 'UPDATE_MEMORY' | 'DELETE_MEMORY' | 'CREATE_ANNIVERSARY' | 'UPDATE_ANNIVERSARY' | 'DELETE_ANNIVERSARY';
  data: any;
  timestamp: number;
  userId: string;
  status: 'pending' | 'syncing' | 'success' | 'error';
  retryCount: number;
  error?: string;
}

const QUEUE_KEY = 'offline_action_queue';
const MAX_RETRIES = 3;

/**
 * Add action to offline queue
 */
export const queueAction = (action: Omit<QueuedAction, 'id' | 'timestamp' | 'status' | 'retryCount'>): string => {
  const queue = getQueue();
  const newAction: QueuedAction = {
    ...action,
    id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    status: 'pending',
    retryCount: 0,
  };
  
  queue.push(newAction);
  saveQueue(queue);
  
  console.log('📥 Queued action:', newAction.type, newAction.id);
  
  // Dispatch event for UI update
  window.dispatchEvent(new CustomEvent('offlineQueueChanged', { 
    detail: { queueLength: queue.length } 
  }));
  
  return newAction.id;
};

/**
 * Get all queued actions
 */
export const getQueue = (): QueuedAction[] => {
  try {
    const stored = localStorage.getItem(QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to get queue:', e);
    return [];
  }
};

/**
 * Save queue to localStorage
 */
const saveQueue = (queue: QueuedAction[]): void => {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to save queue:', e);
  }
};

/**
 * Get pending actions count
 */
export const getPendingCount = (): number => {
  return getQueue().filter(a => a.status === 'pending').length;
};

/**
 * Update action status
 */
export const updateActionStatus = (
  actionId: string, 
  status: QueuedAction['status'], 
  error?: string
): void => {
  const queue = getQueue();
  const action = queue.find(a => a.id === actionId);
  
  if (action) {
    action.status = status;
    if (error) action.error = error;
    if (status === 'error') action.retryCount++;
    
    saveQueue(queue);
    
    window.dispatchEvent(new CustomEvent('offlineQueueChanged', { 
      detail: { queueLength: queue.filter(a => a.status === 'pending').length } 
    }));
  }
};

/**
 * Remove action from queue
 */
export const removeAction = (actionId: string): void => {
  const queue = getQueue().filter(a => a.id !== actionId);
  saveQueue(queue);
  
  window.dispatchEvent(new CustomEvent('offlineQueueChanged', { 
    detail: { queueLength: queue.filter(a => a.status === 'pending').length } 
  }));
};

/**
 * Clear all completed actions
 */
export const clearCompleted = (): void => {
  const queue = getQueue().filter(a => a.status !== 'success');
  saveQueue(queue);
};

/**
 * Process queue when back online
 */
export const processQueue = async (): Promise<void> => {
  if (!navigator.onLine) {
    console.log('📡 Still offline, cannot process queue');
    return;
  }

  const queue = getQueue();
  const pending = queue.filter(a => 
    a.status === 'pending' && 
    a.retryCount < MAX_RETRIES
  );

  if (pending.length === 0) {
    console.log('✅ No pending actions to process');
    return;
  }

  console.log(`🔄 Processing ${pending.length} queued actions...`);

  for (const action of pending) {
    updateActionStatus(action.id, 'syncing');

    try {
      await executeAction(action);
      updateActionStatus(action.id, 'success');
      console.log('✅ Synced:', action.type, action.id);
      
      // Remove successful actions after 5 seconds
      setTimeout(() => removeAction(action.id), 5000);
    } catch (error) {
      console.error('❌ Failed to sync:', action.type, action.id, error);
      updateActionStatus(action.id, 'error', error instanceof Error ? error.message : 'Unknown error');
      
      // Remove actions that exceeded max retries
      if (action.retryCount >= MAX_RETRIES) {
        console.log('🗑️  Removing action after max retries:', action.id);
        setTimeout(() => removeAction(action.id), 10000);
      }
    }
  }

  console.log('✅ Queue processing complete');
};

/**
 * Execute queued action
 */
const executeAction = async (action: QueuedAction): Promise<void> => {
  // Dynamic imports to avoid circular dependencies
  switch (action.type) {
    case 'CREATE_MEMORY': {
      const { createMemory } = await import('../services/firebaseMemoriesService');
      await createMemory(action.data);
      break;
    }
    case 'UPDATE_MEMORY': {
      const { updateMemory } = await import('../services/firebaseMemoriesService');
      await updateMemory(action.data.id, action.data);
      break;
    }
    case 'DELETE_MEMORY': {
      const { deleteMemory } = await import('../services/firebaseMemoriesService');
      await deleteMemory(action.data.id);
      break;
    }
    case 'CREATE_ANNIVERSARY': {
      const { anniversaryApi } = await import('../apis/anniversaryApi');
      await anniversaryApi.create(action.data, action.userId);
      break;
    }
    case 'UPDATE_ANNIVERSARY': {
      const { anniversaryApi } = await import('../apis/anniversaryApi');
      await anniversaryApi.update(action.data.id, action.data, action.userId);
      break;
    }
    case 'DELETE_ANNIVERSARY': {
      const { anniversaryApi } = await import('../apis/anniversaryApi');
      await anniversaryApi.delete(action.data.id, action.userId);
      break;
    }
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
};

/**
 * Setup auto-sync when back online
 */
export const setupAutoSync = (): void => {
  window.addEventListener('online', () => {
    console.log('🟢 Back online, processing queue...');
    setTimeout(() => processQueue(), 1000);
  });
};
