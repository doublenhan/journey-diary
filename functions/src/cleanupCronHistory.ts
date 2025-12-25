import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

// Get environment prefix: 'dev_' for development/preview, '' for production  
const getEnvPrefix = () => {
  const project = process.env.GCLOUD_PROJECT || '';
  const firebaseConfig = process.env.FIREBASE_CONFIG || '';
  
  if (project && !project.includes('dev') && !project.includes('preview') && !project.includes('test')) {
    return '';
  }
  
  if (firebaseConfig.includes('prod')) {
    return '';
  }
  
  return 'dev_';
};

/**
 * Scheduled function to cleanup old cron data
 * - Deletes cron_history records older than 24h
 * - Deletes cron_stats_daily records older than 7 days
 * Runs every 6 hours to keep collections lean
 */
export const cleanupCronHistory = onSchedule({
  schedule: 'every 6 hours',
  timeZone: 'Asia/Ho_Chi_Minh',
  timeoutSeconds: 60,
  memory: '256MiB'
}, async (event) => {
  const startTime = Date.now();
  console.log('Starting cron cleanup...');
  
  try {
    const db = admin.firestore();
    const envPrefix = getEnvPrefix();
    const twentyFourHoursAgo = new Date(Date.now() - (24 * 60 * 60 * 1000));
    const sevenDaysAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
    
    // 1. Cleanup cron_history (older than 24h)
    const oldHistoryQuery = db.collection(`${envPrefix}cron_history`)
      .where('createdAt', '<', admin.firestore.Timestamp.fromDate(twentyFourHoursAgo))
      .limit(500); // Process in batches to avoid timeout
    
    const oldHistory = await oldHistoryQuery.get();
    let historyDeleteCount = 0;
    
    if (!oldHistory.empty) {
      const batch1 = db.batch();
      oldHistory.forEach((doc) => {
        batch1.delete(doc.ref);
        historyDeleteCount++;
      });
      await batch1.commit();
      console.log(`Deleted ${historyDeleteCount} old history records (>24h)`);
    }
    
    // 2. Cleanup cron_stats_daily (older than 7 days)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
    const oldStatsQuery = db.collection(`${envPrefix}cron_stats_daily`)
      .where('date', '<', sevenDaysAgoStr)
      .limit(500);
    
    const oldStats = await oldStatsQuery.get();
    let statsDeleteCount = 0;
    
    if (!oldStats.empty) {
      const batch2 = db.batch();
      oldStats.forEach((doc) => {
        batch2.delete(doc.ref);
        statsDeleteCount++;
      });
      await batch2.commit();
      console.log(`Deleted ${statsDeleteCount} old daily stats (>7 days)`);
    }
    
    const executionTimeMs = Date.now() - startTime;
    const totalDeleted = historyDeleteCount + statsDeleteCount;
    console.log(`Total cleanup: ${totalDeleted} records in ${executionTimeMs}ms`);
    
    // Track this cleanup job too
    await db.collection('system_stats').doc('cron_jobs').set({
      cleanupCronHistory: {
        lastRun: admin.firestore.FieldValue.serverTimestamp(),
        status: 'success',
        executionTimeMs: executionTimeMs,
        recordsDeleted: totalDeleted,
        historyDeleted: historyDeleteCount,
        statsDeleted: statsDeleteCount,
        schedule: 'every 6 hours',
        lastError: null
      }
    }, { merge: true });
    
  } catch (error) {
    console.error('Error cleaning up cron history:', error);
    
    const db = admin.firestore();
    await db.collection('system_stats').doc('cron_jobs').set({
      cleanupCronHistory: {
        lastRun: admin.firestore.FieldValue.serverTimestamp(),
        status: 'failed',
        lastError: error instanceof Error ? error.message : 'Unknown error',
        schedule: 'every 6 hours'
      }
    }, { merge: true });
    
    throw error;
  }
});
