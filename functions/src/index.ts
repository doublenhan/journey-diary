import * as functions from 'firebase-functions';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { v2 as cloudinary } from 'cloudinary';
import cors from 'cors';

// Export cleanup function
export { cleanupCronHistory } from './cleanupCronHistory';
export { deleteRemovedAccounts } from './deleteRemovedAccounts';

// Initialize Firebase Admin
admin.initializeApp();

// Cloudinary credentials stored as Firebase Secrets (secure)
const cloudinaryCloudName = defineSecret('CLOUDINARY_CLOUD_NAME');
const cloudinaryApiKey = defineSecret('CLOUDINARY_API_KEY');
const cloudinaryApiSecret = defineSecret('CLOUDINARY_API_SECRET');

const getCloudinaryConfig = () => ({
  cloud_name: cloudinaryCloudName.value().trim(),
  api_key: cloudinaryApiKey.value().trim(),
  api_secret: cloudinaryApiSecret.value().trim(),
});

// Get environment prefix: 'dev_' for development/preview, '' for production
const getEnvPrefix = () => {
  const project = process.env.GCLOUD_PROJECT || '';
  const firebaseConfig = process.env.FIREBASE_CONFIG || '';
  
  // Production: no dev or preview in project name
  if (project && !project.includes('dev') && !project.includes('preview') && !project.includes('test')) {
    return '';
  }
  
  // Check Firebase config for prod
  if (firebaseConfig.includes('prod')) {
    return '';
  }
  
  // Default to dev_ for all non-production
  return 'dev_';
};

// Configure CORS
const corsHandler = cors({ origin: true });

/**
 * Track function invocation to Firestore
 * This increments a counter in system_stats/function_calls document
 */
const trackFunctionCall = async (functionName: string): Promise<void> => {
  try {
    const db = admin.firestore();
    const ENV_PREFIX = getEnvPrefix();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const docRef = db.collection(`${ENV_PREFIX}system_stats`).doc('function_calls');
    
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);
      const data = doc.exists ? doc.data() : {};
      
      // Initialize if not exists
      if (!data) {
        transaction.set(docRef, {
          [today]: { [functionName]: 1, total: 1 },
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
        return;
      }
      
      // Update counters
      const dayData = data[today] || {};
      const currentCount = dayData[functionName] || 0;
      const currentTotal = dayData.total || 0;
      
      transaction.update(docRef, {
        [`${today}.${functionName}`]: currentCount + 1,
        [`${today}.total`]: currentTotal + 1,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
    });
  } catch (error) {
    console.error('Error tracking function call:', error);
    // Don't throw - tracking failure shouldn't break the function
  }
};

/**
 * Extract publicId from Cloudinary URL
 * Example: https://res.cloudinary.com/dhelefhv1/image/upload/v1765358332/dev/love-journal/users/.../image.jpg
 * Returns: dev/love-journal/users/.../image (without extension)
 */
const extractPublicIdFromUrl = (urlOrPublicId: string): string => {
  // If it's not a URL, return as-is
  if (!urlOrPublicId.startsWith('http://') && !urlOrPublicId.startsWith('https://')) {
    return urlOrPublicId;
  }

  try {
    const url = new URL(urlOrPublicId);
    const pathParts = url.pathname.split('/');
    
    // Find the index of 'upload' in the path
    const uploadIndex = pathParts.indexOf('upload');
    if (uploadIndex === -1) {
      throw new Error('Invalid Cloudinary URL format');
    }
    
    // Get everything after 'upload' and version (v1234567890)
    // Skip the version part (starts with 'v' followed by numbers)
    let startIndex = uploadIndex + 1;
    if (pathParts[startIndex]?.match(/^v\d+$/)) {
      startIndex++;
    }
    
    // Join the remaining parts
    const publicIdWithExtension = pathParts.slice(startIndex).join('/');
    
    // Remove file extension
    const lastDotIndex = publicIdWithExtension.lastIndexOf('.');
    const publicId = lastDotIndex > 0 
      ? publicIdWithExtension.substring(0, lastDotIndex)
      : publicIdWithExtension;
    
    return publicId;
  } catch (error) {
    console.error('Error extracting publicId from URL:', error);
    return urlOrPublicId; // Return original if parsing fails
  }
};

/**
 * Delete an image from Cloudinary
 * Requires Firebase Authentication
 */
export const deleteCloudinaryImage = onRequest({ 
  cors: true,
  secrets: [cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret]
}, async (req, res) => {
  try {
    // Track function invocation
    await trackFunctionCall('deleteCloudinaryImage');
    
    // Parse request body
    const { data } = req.body;
    const { publicId: publicIdOrUrl } = data || {};

    // Get auth token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No auth token provided');
      res.status(401).json({
        error: {
          message: 'Unauthenticated',
          status: 'UNAUTHENTICATED'
        }
      });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('Authenticated user:', decodedToken.uid);

    // Validate input
    if (!publicIdOrUrl || typeof publicIdOrUrl !== 'string') {
      console.error('Invalid publicId:', publicIdOrUrl);
      res.status(400).json({
        error: {
          message: 'Invalid argument: publicId is required',
          status: 'INVALID_ARGUMENT'
        }
      });
      return;
    }

    // Extract publicId from URL if necessary
    const publicId = extractPublicIdFromUrl(publicIdOrUrl);
    console.log('Original input:', publicIdOrUrl);
    console.log('Extracted publicId:', publicId);

    // Configure Cloudinary with environment variables
    const cloudinaryConfig = getCloudinaryConfig();
    console.log('Cloudinary config CHECK:', {
      cloud_name: cloudinaryConfig.cloud_name,
      api_key: cloudinaryConfig.api_key,
      api_secret_length: cloudinaryConfig.api_secret?.length || 0,
      api_secret_first_5: cloudinaryConfig.api_secret?.substring(0, 5) || 'MISSING'
    });
    
    cloudinary.config(cloudinaryConfig);

    console.log(`Attempting to delete: ${publicId}`);

    // Delete the image from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });

    console.log('Cloudinary response:', result);

    console.log('Cloudinary response:', result);

    if (result.result === 'ok' || result.result === 'not found') {
      res.status(200).json({
        result: {
          success: true,
          result: result.result,
          message: result.result === 'not found' 
            ? 'Image already deleted or not found' 
            : 'Image deleted successfully',
        }
      });
    } else {
      res.status(500).json({
        error: {
          message: `Failed to delete image: ${result.result}`,
          status: 'INTERNAL'
        }
      });
    }
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Internal error',
        status: 'INTERNAL'
      }
    });
  }
});

/**
 * Scheduled function to calculate and store system-wide storage statistics
 * Runs every 1 hour to update stats for admin dashboard
 */
export const calculateStorageStats = onSchedule({
  schedule: 'every 1 hours',
  timeZone: 'Asia/Ho_Chi_Minh',
  timeoutSeconds: 300,
  memory: '256MiB'
}, async () => {
  const startTime = Date.now();
  
  try {
    // Track function invocation
    await trackFunctionCall('calculateStorageStats');
    
    console.log('🔍 Starting storage stats calculation for ALL environments...');
    
    const db = admin.firestore();
    
    // Process BOTH dev_ and production environments
    const environments = ['dev_', ''];
    
    for (const ENV_PREFIX of environments) {
      console.log(`\n📊 Calculating stats for ${ENV_PREFIX || 'production'} environment...`);
    
    // Get all collections
    const usersCollection = `${ENV_PREFIX}users`;
    const memoriesCollection = `${ENV_PREFIX}memories`;
    
    // Count documents
    const [usersSnapshot, memoriesSnapshot] = await Promise.all([
      db.collection(usersCollection).get(),
      db.collection(memoriesCollection).get()
    ]);
    
    const usersCount = usersSnapshot.size;
    const memoriesCount = memoriesSnapshot.size;
    
    // Calculate Cloudinary usage
    let totalImages = 0;
    let estimatedImageStorageMB = 0;
    
    memoriesSnapshot.forEach((doc) => {
      const data = doc.data();
      const images = data.cloudinaryPublicIds || data.photos || [];
      totalImages += images.length;
      // Estimate: Average optimized image ~500KB (WebP compression)
      estimatedImageStorageMB += (images.length * 0.5);
    });
    
    // Calculate Firebase storage estimate
    // Average: ~5KB for users, ~10KB for memories with metadata
    const estimatedDbStorageMB = ((usersCount * 5) + (memoriesCount * 10)) / 1024;
    
    // Estimate Firestore operations per day
    // Assumptions:
    // - Each user logs in ~2 times/day (2 reads: user doc + auth check)
    // - Each user views ~5 memories/day (5 reads)
    // - Each user creates ~0.5 memories/day (1 write every 2 days)
    // - Dashboard and list views cause additional reads
    const estimatedReadsPerDay = (usersCount * 7) + (memoriesCount * 0.1); // Login + views + misc
    const estimatedWritesPerDay = (usersCount * 0.5); // Create/update memories
    
    // Get actual function invocations from tracking data
    let actualInvocationsPerDay = 0;
    try {
      const functionCallsDoc = await db.collection(`${ENV_PREFIX}system_stats`).doc('function_calls').get();
      if (functionCallsDoc.exists) {
        const callsData = functionCallsDoc.data();
        if (callsData) {
          // Get last 7 days of data
          const last7Days: string[] = [];
          for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push(date.toISOString().split('T')[0]);
          }
          
          // Calculate average calls per day from last 7 days
          let totalCalls = 0;
          let daysWithData = 0;
          
          last7Days.forEach(day => {
            if (callsData[day] && callsData[day].total) {
              totalCalls += callsData[day].total;
              daysWithData++;
            }
          });
          
          if (daysWithData > 0) {
            actualInvocationsPerDay = Math.round(totalCalls / daysWithData);
          }
        }
      }
    } catch (error) {
      console.error('Error reading function calls data:', error);
      // Fall back to estimate if reading fails
      actualInvocationsPerDay = memoriesCount * 2;
    }
    
    // Use actual data if available, otherwise use estimate
    const invocationsPerDay = actualInvocationsPerDay > 0 ? actualInvocationsPerDay : (memoriesCount * 2);
    
    // Prepare stats object
    const stats = {
      firebase: {
        documentsCount: usersCount + memoriesCount,
        estimatedStorageMB: parseFloat(estimatedDbStorageMB.toFixed(2)),
        usersCount,
        memoriesCount,
        limit: {
          storageLimitMB: 1024,
          readsPerDay: 50000,
          writesPerDay: 20000
        }
      },
      authentication: {
        totalUsers: usersCount,
        limit: {
          monthlyActiveUsers: 50000 // Spark plan limit
        }
      },
      cloudFunctions: {
        totalFunctions: 3, // deleteCloudinaryImage, calculateStorageStats, updateStorageStats
        actualInvocationsPerDay: actualInvocationsPerDay,
        estimatedInvocationsPerDay: invocationsPerDay,
        isActualData: actualInvocationsPerDay > 0,
        limit: {
          invocationsPerMonth: 125000, // Spark plan limit
          gbSeconds: 40000,
          cpuSeconds: 200000
        }
      },
      firestoreOperations: {
        estimatedReadsPerDay: Math.round(estimatedReadsPerDay),
        estimatedWritesPerDay: Math.round(estimatedWritesPerDay),
        limit: {
          readsPerDay: 50000,
          writesPerDay: 20000
        }
      },
      cloudinary: {
        usedStorageMB: parseFloat(estimatedImageStorageMB.toFixed(2)),
        totalImages,
        limit: {
          storageLimitMB: 25600,
          transformationsPerMonth: 25000,
          bandwidthMB: 25600
        }
      },
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      calculatedAt: new Date().toISOString()
    };
    
    // Store in system_stats collection
    await db.collection(`${ENV_PREFIX}system_stats`).doc('storage').set(stats);
    
    console.log('Storage stats calculated and stored:', {
      users: usersCount,
      memories: memoriesCount,
      images: totalImages,
      dbStorageMB: estimatedDbStorageMB,
      imageStorageMB: estimatedImageStorageMB
    });

    const executionTimeMs = Date.now() - startTime;
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // 1. Update current status
    await db.collection(`${ENV_PREFIX}system_stats`).doc('cron_jobs').set({
      calculateStorageStats: {
        lastRun: admin.firestore.FieldValue.serverTimestamp(),
        status: 'success',
        executionTimeMs: executionTimeMs,
        schedule: 'every 1 hours',
        lastError: null
      }
    }, { merge: true });

    // 2. Add to detailed history (24h only)
    await db.collection(`${ENV_PREFIX}cron_history`).add({
      jobName: 'calculateStorageStats',
      status: 'success',
      error: null,
      startTime: admin.firestore.Timestamp.fromMillis(startTime),
      endTime: admin.firestore.FieldValue.serverTimestamp(),
      executionTimeMs: executionTimeMs,
      triggeredBy: 'auto',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 3. Update daily aggregate
    const dailyDocId = `${today}_calculateStorageStats`;
    const dailyStatsRef = db.collection(`${ENV_PREFIX}cron_stats_daily`).doc(dailyDocId);
    const dailyDoc = await dailyStatsRef.get();
    
    if (dailyDoc.exists) {
      const data = dailyDoc.data()!;
      const totalRuns = (data.totalRuns || 0) + 1;
      const successes = (data.successes || 0) + 1;
      const prevAvg = data.avgExecutionTimeMs || 0;
      const newAvg = ((prevAvg * (totalRuns - 1)) + executionTimeMs) / totalRuns;
      
      await dailyStatsRef.update({
        totalRuns: totalRuns,
        successes: successes,
        avgExecutionTimeMs: Math.round(newAvg),
        minExecutionTimeMs: Math.min(data.minExecutionTimeMs || executionTimeMs, executionTimeMs),
        maxExecutionTimeMs: Math.max(data.maxExecutionTimeMs || executionTimeMs, executionTimeMs),
        lastRunTime: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await dailyStatsRef.set({
        date: today,
        jobName: 'calculateStorageStats',
        totalRuns: 1,
        successes: 1,
        failures: 0,
        avgExecutionTimeMs: executionTimeMs,
        minExecutionTimeMs: executionTimeMs,
        maxExecutionTimeMs: executionTimeMs,
        failureDetails: [],
        lastRunTime: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    } // End of environment loop
    
    console.log(`\n✅ Storage stats calculation completed for all environments`);
    
  } catch (error) {
    console.error('❌ Fatal error calculating storage stats:', error);
    
    // Track error in BOTH environments
    const db = admin.firestore();
    const executionTimeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const environments = ['dev_', ''];
    for (const ENV_PREFIX of environments) {
    
    // 1. Update current status
    await db.collection(`${ENV_PREFIX}system_stats`).doc('cron_jobs').set({
      calculateStorageStats: {
        lastRun: admin.firestore.FieldValue.serverTimestamp(),
        status: 'failed',
        lastError: errorMessage,
        schedule: 'every 1 hours'
      }
    }, { merge: true });

    // 2. Add to detailed history
    await db.collection(`${ENV_PREFIX}cron_history`).add({
      jobName: 'calculateStorageStats',
      status: 'failed',
      error: errorMessage,
      startTime: admin.firestore.Timestamp.fromMillis(startTime),
      endTime: admin.firestore.FieldValue.serverTimestamp(),
      executionTimeMs: executionTimeMs,
      triggeredBy: 'auto',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 3. Update daily aggregate
    const dailyDocId = `${today}_calculateStorageStats`;
    const dailyStatsRef = db.collection(`${ENV_PREFIX}cron_stats_daily`).doc(dailyDocId);
    const dailyDoc = await dailyStatsRef.get();
    
    if (dailyDoc.exists) {
      await dailyStatsRef.update({
        totalRuns: admin.firestore.FieldValue.increment(1),
        failures: admin.firestore.FieldValue.increment(1),
        failureDetails: admin.firestore.FieldValue.arrayUnion({
          time: now.toISOString(),
          error: errorMessage,
          executionTimeMs: executionTimeMs
        }),
        lastRunTime: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await db.collection(`${ENV_PREFIX}cron_stats_daily`).doc(dailyDocId).set({
        date: today,
        jobName: 'calculateStorageStats',
        totalRuns: 1,
        successes: 0,
        failures: 1,
        avgExecutionTimeMs: executionTimeMs,
        minExecutionTimeMs: executionTimeMs,
        maxExecutionTimeMs: executionTimeMs,
        failureDetails: [{
          time: now.toISOString(),
          error: errorMessage,
          executionTimeMs: executionTimeMs
        }],
        lastRunTime: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    } // End of error handling environment loop
    
    throw error;
  }
});

/**
 * HTTP function to manually trigger storage stats calculation
 * Can be called by admins to get fresh stats immediately
 */
export const updateStorageStats = onRequest({ 
  cors: true
}, async (req, res) => {
  const startTime = Date.now();
  let ENV_PREFIX = ''; // Define at function level for access in catch block
  
  try {
    // Track function invocation
    await trackFunctionCall('updateStorageStats');
    
    // Get environment prefix from request data if provided
    const requestEnvPrefix = req.body?.data?.envPrefix;
    if (requestEnvPrefix !== undefined) {
      ENV_PREFIX = requestEnvPrefix;
      console.log('Using ENV_PREFIX from request:', ENV_PREFIX);
    }
    
    // Verify admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    console.log('User authenticated:', decodedToken.uid);
    
    // Check if user is admin - try both with and without dev_ prefix
    const db = admin.firestore();
    let userData = null;
    
    // If ENV_PREFIX not provided via request, detect from user's collection
    if (requestEnvPrefix === undefined) {
      // Try dev_ prefix first (development/local)
      let userDoc = await db.collection('dev_users').doc(decodedToken.uid).get();
      if (userDoc.exists) {
        userData = userDoc.data();
        ENV_PREFIX = 'dev_';
        console.log('Found user in dev_users collection');
      } else {
        // Try without prefix (production)
        userDoc = await db.collection('users').doc(decodedToken.uid).get();
        if (userDoc.exists) {
          userData = userDoc.data();
          ENV_PREFIX = '';
          console.log('Found user in users collection');
        }
      }
    } else {
      // ENV_PREFIX already set from request, just fetch user data
      const userCollection = `${ENV_PREFIX}users`;
      const userDoc = await db.collection(userCollection).doc(decodedToken.uid).get();
      if (userDoc.exists) {
        userData = userDoc.data();
      }
    }
    
    console.log('ENV_PREFIX:', ENV_PREFIX);
    console.log('User role:', userData?.role);
    
    if (!userData || userData.role !== 'SysAdmin') {
      console.log('Access denied - User role:', userData?.role);
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return;
    }
    
    console.log('Admin access granted');
    
    // Calculate and store stats (same logic as scheduled function)
    const usersCollection = `${ENV_PREFIX}users`;
    const memoriesCollection = `${ENV_PREFIX}memories`;
      
    
    const [usersSnapshot, memoriesSnapshot] = await Promise.all([
      db.collection(usersCollection).get(),
      db.collection(memoriesCollection).get()
    ]);
    
    const usersCount = usersSnapshot.size;
    const memoriesCount = memoriesSnapshot.size;
    
    let totalImages = 0;
    let estimatedImageStorageMB = 0;
    
    memoriesSnapshot.forEach((doc) => {
      const data = doc.data();
      const images = data.cloudinaryPublicIds || data.photos || [];
      totalImages += images.length;
      estimatedImageStorageMB += (images.length * 0.5);
    });
    
    const estimatedDbStorageMB = ((usersCount * 5) + (memoriesCount * 10)) / 1024;
    
    const estimatedReadsPerDay = (usersCount * 7) + (memoriesCount * 0.1);
    const estimatedWritesPerDay = (usersCount * 0.5);
    
    // Get actual function invocations
    let actualInvocationsPerDay = 0;
    try {
      const functionCallsDoc = await db.collection(`${ENV_PREFIX}system_stats`).doc('function_calls').get();
      if (functionCallsDoc.exists) {
        const callsData = functionCallsDoc.data();
        if (callsData) {
          const last7Days: string[] = [];
          for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push(date.toISOString().split('T')[0]);
          }
          
          let totalCalls = 0;
          let daysWithData = 0;
          
          last7Days.forEach(day => {
            if (callsData[day] && callsData[day].total) {
              totalCalls += callsData[day].total;
              daysWithData++;
            }
          });
          
          if (daysWithData > 0) {
            actualInvocationsPerDay = Math.round(totalCalls / daysWithData);
          }
        }
      }
    } catch (error) {
      console.error('Error reading function calls data:', error);
      actualInvocationsPerDay = memoriesCount * 2;
    }
    
    const invocationsPerDay = actualInvocationsPerDay > 0 ? actualInvocationsPerDay : (memoriesCount * 2);
    
    const stats = {
      firebase: {
        documentsCount: usersCount + memoriesCount,
        estimatedStorageMB: parseFloat(estimatedDbStorageMB.toFixed(2)),
        usersCount,
        memoriesCount,
        limit: {
          storageLimitMB: 1024,
          readsPerDay: 50000,
          writesPerDay: 20000
        }
      },
      authentication: {
        totalUsers: usersCount,
        limit: {
          monthlyActiveUsers: 50000
        }
      },
      cloudFunctions: {
        totalFunctions: 3,
        actualInvocationsPerDay: actualInvocationsPerDay,
        estimatedInvocationsPerDay: invocationsPerDay,
        isActualData: actualInvocationsPerDay > 0,
        limit: {
          invocationsPerMonth: 125000,
          gbSeconds: 40000,
          cpuSeconds: 200000
        }
      },
      firestoreOperations: {
        estimatedReadsPerDay: Math.round(estimatedReadsPerDay),
        estimatedWritesPerDay: Math.round(estimatedWritesPerDay),
        limit: {
          readsPerDay: 50000,
          writesPerDay: 20000
        }
      },
      cloudinary: {
        usedStorageMB: parseFloat(estimatedImageStorageMB.toFixed(2)),
        totalImages,
        limit: {
          storageLimitMB: 25600,
          transformationsPerMonth: 25000,
          bandwidthMB: 25600
        }
      },
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      calculatedAt: new Date().toISOString()
    };
    
    await db.collection(`${ENV_PREFIX}system_stats`).doc('storage').set(stats);
    
    const executionTimeMs = Date.now() - startTime;
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Track cron job execution (manual trigger) with hybrid tracking
    // 1. Update current status
    await db.collection(`${ENV_PREFIX}system_stats`).doc('cron_jobs').set({
      calculateStorageStats: {
        lastRun: admin.firestore.FieldValue.serverTimestamp(),
        status: 'success',
        executionTimeMs: executionTimeMs,
        schedule: 'every 1 hours (manual trigger)',
        lastError: null
      }
    }, { merge: true });

    // 2. Add to detailed history
    await db.collection(`${ENV_PREFIX}cron_history`).add({
      jobName: 'calculateStorageStats',
      status: 'success',
      error: null,
      startTime: admin.firestore.Timestamp.fromMillis(startTime),
      endTime: admin.firestore.FieldValue.serverTimestamp(),
      executionTimeMs: executionTimeMs,
      triggeredBy: 'manual',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 3. Update daily aggregate
    const dailyDocId = `${today}_calculateStorageStats`;
    const dailyStatsRef = db.collection(`${ENV_PREFIX}cron_stats_daily`).doc(dailyDocId);
    const dailyDoc = await dailyStatsRef.get();
    
    if (dailyDoc.exists) {
      const data = dailyDoc.data()!;
      const totalRuns = (data.totalRuns || 0) + 1;
      const successes = (data.successes || 0) + 1;
      const prevAvg = data.avgExecutionTimeMs || 0;
      const newAvg = ((prevAvg * (totalRuns - 1)) + executionTimeMs) / totalRuns;
      
      await dailyStatsRef.update({
        totalRuns: totalRuns,
        successes: successes,
        avgExecutionTimeMs: Math.round(newAvg),
        minExecutionTimeMs: Math.min(data.minExecutionTimeMs || executionTimeMs, executionTimeMs),
        maxExecutionTimeMs: Math.max(data.maxExecutionTimeMs || executionTimeMs, executionTimeMs),
        lastRunTime: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await dailyStatsRef.set({
        date: today,
        jobName: 'calculateStorageStats',
        totalRuns: 1,
        successes: 1,
        failures: 0,
        avgExecutionTimeMs: executionTimeMs,
        minExecutionTimeMs: executionTimeMs,
        maxExecutionTimeMs: executionTimeMs,
        failureDetails: [],
        lastRunTime: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    res.status(200).json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error('Error updating storage stats:', error);
    
    // Track failed execution with hybrid tracking
    try {
      const db = admin.firestore();
      const executionTimeMs = Date.now() - startTime;
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const errorMessage = error.message || 'Unknown error';
      
      // 1. Update current status
      await db.collection(`${ENV_PREFIX}system_stats`).doc('cron_jobs').set({
        calculateStorageStats: {
          lastRun: admin.firestore.FieldValue.serverTimestamp(),
          status: 'failed',
          lastError: errorMessage,
          schedule: 'every 1 hours (manual trigger)'
        }
      }, { merge: true });

      // 2. Add to detailed history
      await db.collection(`${ENV_PREFIX}cron_history`).add({
        jobName: 'calculateStorageStats',
        status: 'failed',
        error: errorMessage,
        startTime: admin.firestore.Timestamp.fromMillis(startTime),
        endTime: admin.firestore.FieldValue.serverTimestamp(),
        executionTimeMs: executionTimeMs,
        triggeredBy: 'manual',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 3. Update daily aggregate
      const dailyDocId = `${today}_calculateStorageStats`;
      const dailyStatsRef = db.collection(`${ENV_PREFIX}cron_stats_daily`).doc(dailyDocId);
      const dailyDoc = await dailyStatsRef.get();
      
      if (dailyDoc.exists) {
        await dailyStatsRef.update({
          totalRuns: admin.firestore.FieldValue.increment(1),
          failures: admin.firestore.FieldValue.increment(1),
          failureDetails: admin.firestore.FieldValue.arrayUnion({
            time: now.toISOString(),
            error: errorMessage,
            executionTimeMs: executionTimeMs,
            triggeredBy: 'manual'
          }),
          lastRunTime: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        await db.collection(`${ENV_PREFIX}cron_stats_daily`).doc(dailyDocId).set({
          date: today,
          jobName: 'calculateStorageStats',
          totalRuns: 1,
          successes: 0,
          failures: 1,
          avgExecutionTimeMs: executionTimeMs,
          minExecutionTimeMs: executionTimeMs,
          maxExecutionTimeMs: executionTimeMs,
          failureDetails: [{
            time: now.toISOString(),
            error: errorMessage,
            executionTimeMs: executionTimeMs,
            triggeredBy: 'manual'
          }],
          lastRunTime: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    } catch (trackError) {
      console.error('Failed to track error:', trackError);
    }
    
    res.status(500).json({
      error: {
        message: error.message || 'Internal error',
        status: 'INTERNAL'
      }
    });
  }
});
