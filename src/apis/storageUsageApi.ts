/**
 * Storage Usage API - Track Firebase and Cloudinary usage
 */

import { collection, getDocs, getDoc, doc, query, where, getCountFromServer, AggregateField, count } from 'firebase/firestore';
import { db, auth } from '../firebase/firebaseConfig';

const ENV_PREFIX = import.meta.env.VITE_ENV_PREFIX || 'dev';

export interface FirebaseUsageStats {
  documentsCount: number;
  estimatedStorageMB: number;
  usersCount: number;
  memoriesCount: number;
  limit: {
    storageLimitMB: number;
    readsPerDay: number;
    writesPerDay: number;
  };
}

export interface AuthenticationUsageStats {
  totalUsers: number;
  limit: {
    monthlyActiveUsers: number;
  };
}

export interface CloudFunctionsUsageStats {
  totalFunctions: number;
  actualInvocationsPerDay?: number;
  estimatedInvocationsPerDay: number;
  isActualData?: boolean;
  limit: {
    invocationsPerMonth: number;
    gbSeconds: number;
    cpuSeconds: number;
  };
}

export interface FirestoreOperationsStats {
  estimatedReadsPerDay: number;
  estimatedWritesPerDay: number;
  limit: {
    readsPerDay: number;
    writesPerDay: number;
  };
}

export interface CloudinaryUsageStats {
  usedStorageMB: number;
  totalImages: number;
  limit: {
    storageLimitMB: number;
    transformationsPerMonth: number;
    bandwidthMB: number;
  };
}

export interface SystemStats {
  firebase: FirebaseUsageStats;
  authentication: AuthenticationUsageStats;
  cloudFunctions: CloudFunctionsUsageStats;
  firestoreOperations: FirestoreOperationsStats;
  cloudinary: CloudinaryUsageStats;
  lastUpdated: any;
  calculatedAt: string;
}

/**
 * Get system-wide storage statistics from pre-calculated stats
 * This reads from the system_stats collection which is updated by Cloud Functions
 */
export async function getSystemStorageStats(): Promise<SystemStats | null> {
  try {
    const statsDoc = await getDoc(doc(db, 'system_stats', 'storage'));
    
    if (!statsDoc.exists()) {
      console.warn('System stats not found. Cloud Function may not have run yet.');
      return null;
    }
    
    return statsDoc.data() as SystemStats;
  } catch (error) {
    console.error('Error fetching system storage stats:', error);
    throw error;
  }
}

/**
 * Manually trigger Cloud Function to update storage stats
 * Requires admin authentication
 */
export async function triggerStatsUpdate(): Promise<void> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    const idToken = await currentUser.getIdToken();
    
    // Get project ID from environment
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'love-journal-2025';
    const functionUrl = `https://us-central1-${projectId}.cloudfunctions.net/updateStorageStats`;
    
    console.log('Triggering stats update at:', functionUrl);
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to trigger stats update: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Stats update triggered:', result);
  } catch (error) {
    console.error('Error triggering stats update:', error);
    throw error;
  }
}

/**
 * Get Firebase Firestore usage statistics using aggregate queries
 * Fallback method if system stats are not available
 */
export async function getFirebaseUsage(): Promise<FirebaseUsageStats> {
  try {
    const usersCollection = `${ENV_PREFIX}_users`;
    const memoriesCollection = `${ENV_PREFIX}_memories`;

    // Use count aggregation queries instead of getDocs
    const usersCountSnapshot = await getCountFromServer(collection(db, usersCollection));
    const usersCount = usersCountSnapshot.data().count;

    // For memories, we can only count our own memories due to security rules
    // So we'll get an estimate by counting current user's memories
    const currentUser = auth.currentUser;
    let memoriesCount = 0;
    
    if (currentUser) {
      const memoriesQuery = query(
        collection(db, memoriesCollection),
        where('userId', '==', currentUser.uid)
      );
      const memoriesCountSnapshot = await getCountFromServer(memoriesQuery);
      memoriesCount = memoriesCountSnapshot.data().count;
    }

    // Estimate storage (rough calculation based on document count)
    // Average document size: ~5KB for users, ~10KB for memories with metadata
    const estimatedStorageMB = ((usersCount * 5) + (memoriesCount * 10)) / 1024;

    const totalDocuments = usersCount + memoriesCount;

    return {
      documentsCount: totalDocuments,
      estimatedStorageMB: parseFloat(estimatedStorageMB.toFixed(2)),
      usersCount,
      memoriesCount,
      limit: {
        storageLimitMB: 1024, // Firebase free tier: 1GB = 1024MB
        readsPerDay: 50000, // 50K reads/day
        writesPerDay: 20000, // 20K writes/day
      }
    };
  } catch (error) {
    console.error('Error fetching Firebase usage:', error);
    throw error;
  }
}

/**
 * Get Cloudinary usage statistics from current user's memories
 * Fallback method if system stats are not available
 */
export async function getCloudinaryUsage(): Promise<CloudinaryUsageStats> {
  try {
    const memoriesCollection = `${ENV_PREFIX}_memories`;
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Only get current user's memories (allowed by security rules)
    const memoriesQuery = query(
      collection(db, memoriesCollection),
      where('userId', '==', currentUser.uid)
    );
    const memoriesSnapshot = await getDocs(memoriesQuery);

    let totalImages = 0;
    let estimatedStorageMB = 0;

    memoriesSnapshot.forEach((doc) => {
      const data = doc.data();
      const images = data.cloudinaryPublicIds || data.photos || [];
      totalImages += images.length;
      
      // Estimate: Average optimized image ~500KB (WebP compression)
      estimatedStorageMB += (images.length * 0.5);
    });

    return {
      usedStorageMB: parseFloat(estimatedStorageMB.toFixed(2)),
      totalImages,
      limit: {
        storageLimitMB: 25600, // Cloudinary free tier: 25GB = 25600MB
        transformationsPerMonth: 25000, // 25K transformations/month
        bandwidthMB: 25600, // 25GB = 25600MB bandwidth/month
      }
    };
  } catch (error) {
    console.error('Error fetching Cloudinary usage:', error);
    throw error;
  }
}

/**
 * Get combined storage usage statistics
 * Tries to get system-wide stats first, falls back to user-specific stats
 */
export async function getAllStorageUsage() {
  try {
    // Try to get pre-calculated system stats first
    const systemStats = await getSystemStorageStats();
    
    if (systemStats) {
      console.log('Using system-wide storage stats');
      return {
        firebase: systemStats.firebase,
        authentication: systemStats.authentication,
        cloudFunctions: systemStats.cloudFunctions,
        firestoreOperations: systemStats.firestoreOperations,
        cloudinary: systemStats.cloudinary,
        timestamp: systemStats.calculatedAt,
        source: 'system' as const
      };
    }
    
    // Fallback to calculating from current user's data
    console.log('System stats not available, using fallback method');
    const [firebaseUsage, cloudinaryUsage] = await Promise.all([
      getFirebaseUsage(),
      getCloudinaryUsage()
    ]);

    return {
      firebase: firebaseUsage,
      authentication: { totalUsers: 0, limit: { monthlyActiveUsers: 50000 } },
      cloudFunctions: { totalFunctions: 3, estimatedInvocationsPerDay: 0, limit: { invocationsPerMonth: 125000, gbSeconds: 40000, cpuSeconds: 200000 } },
      firestoreOperations: { estimatedReadsPerDay: 0, estimatedWritesPerDay: 0, limit: { readsPerDay: 50000, writesPerDay: 20000 } },
      cloudinary: cloudinaryUsage,
      timestamp: new Date().toISOString(),
      source: 'fallback' as const
    };
  } catch (error) {
    console.error('Error fetching all storage usage:', error);
    throw error;
  }
}
