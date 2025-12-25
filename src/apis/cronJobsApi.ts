/**
 * Cron Jobs API - Track and monitor scheduled Cloud Functions
 */

import { doc, getDoc, collection, query, orderBy, limit, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

// Get environment prefix from Vite env
const ENV_PREFIX = import.meta.env.VITE_ENV_PREFIX || '';

export interface CronJobStatus {
  lastRun: any; // Firestore Timestamp
  status: 'success' | 'failed' | 'running' | 'never-run';
  executionTimeMs?: number;
  schedule: string;
  lastError?: string | null;
  recordsDeleted?: number; // For cleanup job
}

export interface CronJobsData {
  calculateStorageStats?: CronJobStatus;
  cleanupCronHistory?: CronJobStatus;
  [key: string]: CronJobStatus | undefined;
}

export interface CronHistoryRecord {
  id: string;
  jobName: string;
  status: 'success' | 'failed';
  error: string | null;
  startTime: any;
  endTime: any;
  executionTimeMs: number;
  triggeredBy?: string;
  createdAt: any;
}

export interface DailyStats {
  date: string;
  jobName: string;
  totalRuns: number;
  successes: number;
  failures: number;
  avgExecutionTimeMs: number;
  minExecutionTimeMs: number;
  maxExecutionTimeMs: number;
  failureDetails: Array<{
    time: string;
    error: string;
    executionTimeMs: number;
    triggeredBy?: string;
  }>;
  lastRunTime: any;
}

/**
 * Get all cron jobs status from Firestore
 */
export async function getCronJobsStatus(): Promise<CronJobsData | null> {
  try {
    const cronJobsDoc = await getDoc(doc(db, `${ENV_PREFIX}system_stats`, 'cron_jobs'));
    
    if (!cronJobsDoc.exists()) {
      console.warn('Cron jobs stats not found. Functions may not have run yet.');
      return null;
    }
    
    return cronJobsDoc.data() as CronJobsData;
  } catch (error) {
    console.error('Error fetching cron jobs status:', error);
    throw error;
  }
}

/**
 * Get recent cron history (last 24 hours)
 */
export async function getRecentCronHistory(jobName?: string): Promise<CronHistoryRecord[]> {
  try {
    let q = query(
      collection(db, `${ENV_PREFIX}cron_history`),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    if (jobName) {
      q = query(
        collection(db, `${ENV_PREFIX}cron_history`),
        where('jobName', '==', jobName),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CronHistoryRecord));
  } catch (error) {
    console.error('Error fetching cron history:', error);
    throw error;
  }
}

/**
 * Get daily aggregated stats (last 7 days)
 */
export async function getDailyStats(jobName?: string): Promise<DailyStats[]> {
  try {
    const last7Days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push(date.toISOString().split('T')[0]);
    }
    
    const statsPromises = last7Days.map(async (date) => {
      const docId = jobName ? `${date}_${jobName}` : `${date}_calculateStorageStats`;
      const docRef = doc(db, `${ENV_PREFIX}cron_stats_daily`, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as DailyStats;
      }
      return null;
    });
    
    const results = await Promise.all(statsPromises);
    return results.filter(r => r !== null) as DailyStats[];
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    throw error;
  }
}

/**
 * Subscribe to realtime cron history updates
 */
export function subscribeToCronHistory(
  callback: (history: CronHistoryRecord[]) => void,
  jobName?: string
): () => void {
  let q = query(
    collection(db, `${ENV_PREFIX}cron_history`),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  
  if (jobName) {
    q = query(
      collection(db, `${ENV_PREFIX}cron_history`),
      where('jobName', '==', jobName),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }
  
  return onSnapshot(q, (snapshot) => {
    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CronHistoryRecord));
    callback(history);
  });
}

/**
 * Calculate next run time based on schedule
 */
export function calculateNextRun(lastRun: any, schedule: string): Date | null {
  if (!lastRun || !lastRun.toDate) return null;
  
  const lastRunDate = lastRun.toDate();
  const now = new Date();
  
  // Parse schedule string (e.g., "every 1 hours")
  const hourMatch = schedule.match(/every (\d+) hours?/);
  if (hourMatch) {
    const hours = parseInt(hourMatch[1]);
    const nextRun = new Date(lastRunDate.getTime() + hours * 60 * 60 * 1000);
    
    // If next run is in the past, calculate from now
    if (nextRun < now) {
      return new Date(now.getTime() + hours * 60 * 60 * 1000);
    }
    return nextRun;
  }
  
  return null;
}

/**
 * Format execution time
 */
export function formatExecutionTime(ms?: number): string {
  if (!ms) return 'N/A';
  
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}
