/**
 * Offline Queue Manager
 * Stores pending memories in localStorage when offline
 * Auto-syncs when back online
 */

export interface PendingMemory {
  id: string; // Temporary ID
  title: string;
  text: string;
  date: string;
  location: string;
  images: string[]; // Base64 or URLs
  mood?: string;
  userId: string;
  createdAt: number; // Timestamp
  status: 'pending' | 'syncing' | 'synced' | 'error';
}

const QUEUE_KEY = 'offline_memories_queue';

export class OfflineQueue {
  /**
   * Add memory to offline queue
   */
  static addToQueue(memory: Omit<PendingMemory, 'id' | 'createdAt' | 'status'>): string {
    const queue = this.getQueue();
    const id = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const pendingMemory: PendingMemory = {
      ...memory,
      id,
      createdAt: Date.now(),
      status: 'pending'
    };
    
    queue.push(pendingMemory);
    this.saveQueue(queue);
    
    console.log('Added to offline queue:', id);
    return id;
  }

  /**
   * Get all pending memories
   */
  static getQueue(): PendingMemory[] {
    try {
      const data = localStorage.getItem(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading offline queue:', error);
      return [];
    }
  }

  /**
   * Get count of pending memories
   */
  static getPendingCount(): number {
    return this.getQueue().filter(m => m.status === 'pending').length;
  }

  /**
   * Update memory status in queue
   */
  static updateStatus(id: string, status: PendingMemory['status']) {
    const queue = this.getQueue();
    const index = queue.findIndex(m => m.id === id);
    
    if (index !== -1) {
      queue[index].status = status;
      this.saveQueue(queue);
      console.log(`Memory ${id} status: ${status}`);
    }
  }

  /**
   * Remove memory from queue (after successful sync)
   */
  static removeFromQueue(id: string) {
    const queue = this.getQueue();
    const filtered = queue.filter(m => m.id !== id);
    this.saveQueue(filtered);
    console.log('Removed from queue:', id);
  }

  /**
   * Clear all synced memories
   */
  static clearSynced() {
    const queue = this.getQueue();
    const pending = queue.filter(m => m.status !== 'synced');
    this.saveQueue(pending);
  }

  /**
   * Save queue to localStorage
   */
  private static saveQueue(queue: PendingMemory[]) {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  /**
   * Clear entire queue (use with caution!)
   */
  static clearAll() {
    localStorage.removeItem(QUEUE_KEY);
    console.log('Offline queue cleared');
  }
}
