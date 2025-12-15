/**
 * Client-Side Document Migration
 * 
 * Migrates user's own documents to optimized structure
 * Uses Firebase Client SDK (no admin key needed)
 * Runs in browser when user logs in
 */

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch,
  doc 
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { optimizeMemoryDocument } from './documentOptimizer';

interface MigrationResult {
  success: boolean;
  processed: number;
  optimized: number;
  errors: number;
  message: string;
}

/**
 * Migrate user's memories to optimized structure
 */
export async function migrateUserDocuments(
  userId: string,
  collectionName: string = 'memories'
): Promise<MigrationResult> {
  console.log('🚀 Starting document migration for user:', userId);
  
  const result: MigrationResult = {
    success: false,
    processed: 0,
    optimized: 0,
    errors: 0,
    message: ''
  };

  try {
    // Fetch all user's memories
    const q = query(
      collection(db, collectionName),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    console.log(`📦 Found ${snapshot.size} documents to check`);

    if (snapshot.empty) {
      result.success = true;
      result.message = 'No documents to migrate';
      return result;
    }

    // Process in batches of 500 (Firestore limit)
    const BATCH_SIZE = 500;
    let batch = writeBatch(db);
    let batchCount = 0;
    let totalOptimized = 0;

    for (const docSnap of snapshot.docs) {
      try {
        const data = docSnap.data();
        result.processed++;

        // Check if document needs optimization
        const needsOptimization = 
          !data.locationCity && data.location?.city ||
          !data.locationCountry && data.location?.country ||
          !data.locationLat && data.location?.coordinates?.lat;

        if (needsOptimization) {
          // Optimize document structure
          const optimizedData = optimizeMemoryDocument(data);
          
          // Update document
          const docRef = doc(db, collectionName, docSnap.id);
          batch.update(docRef, optimizedData);
          
          batchCount++;
          totalOptimized++;

          console.log(`  ✓ Queued ${docSnap.id} for optimization`);

          // Commit batch when it reaches size limit
          if (batchCount >= BATCH_SIZE) {
            await batch.commit();
            console.log(`  💾 Committed batch of ${batchCount} documents`);
            batch = writeBatch(db);
            batchCount = 0;
          }
        }
      } catch (error) {
        console.error(`  ✗ Error processing ${docSnap.id}:`, error);
        result.errors++;
      }
    }

    // Commit remaining documents
    if (batchCount > 0) {
      await batch.commit();
      console.log(`  💾 Committed final batch of ${batchCount} documents`);
    }

    result.optimized = totalOptimized;
    result.success = true;
    result.message = `Successfully migrated ${totalOptimized} documents`;
    
    console.log('✅ Migration complete:', result);
    return result;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    result.success = false;
    result.message = `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    return result;
  }
}

/**
 * Check if user's documents need migration
 */
export async function checkMigrationNeeded(
  userId: string,
  collectionName: string = 'memories'
): Promise<{ needed: boolean; count: number }> {
  try {
    const q = query(
      collection(db, collectionName),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    
    let needsMigration = 0;
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      
      // Check if missing flattened fields
      if (
        (!data.locationCity && data.location?.city) ||
        (!data.locationCountry && data.location?.country) ||
        (!data.locationLat && data.location?.coordinates?.lat)
      ) {
        needsMigration++;
      }
    }

    return {
      needed: needsMigration > 0,
      count: needsMigration
    };
  } catch (error) {
    console.error('Error checking migration status:', error);
    return { needed: false, count: 0 };
  }
}

/**
 * Get migration status from localStorage
 */
export function getMigrationStatus(userId: string): {
  completed: boolean;
  timestamp?: number;
} {
  try {
    const status = localStorage.getItem(`migration_status_${userId}`);
    if (status) {
      return JSON.parse(status);
    }
  } catch (e) {
    console.warn('Failed to get migration status:', e);
  }
  return { completed: false };
}

/**
 * Save migration status to localStorage
 */
export function saveMigrationStatus(userId: string): void {
  try {
    localStorage.setItem(
      `migration_status_${userId}`,
      JSON.stringify({
        completed: true,
        timestamp: Date.now()
      })
    );
  } catch (e) {
    console.warn('Failed to save migration status:', e);
  }
}

/**
 * Auto-run migration on app load (if needed)
 */
export async function autoMigrate(userId: string): Promise<void> {
  // Check if already migrated
  const status = getMigrationStatus(userId);
  if (status.completed) {
    console.log('✅ Migration already completed for this user');
    return;
  }

  // Check if migration needed
  const { needed, count } = await checkMigrationNeeded(userId);
  
  if (!needed) {
    console.log('✅ No migration needed');
    saveMigrationStatus(userId);
    return;
  }

  console.log(`🔄 Auto-migration needed for ${count} documents`);
  
  // Run migration
  const result = await migrateUserDocuments(userId);
  
  if (result.success) {
    saveMigrationStatus(userId);
    console.log('✅ Auto-migration completed:', result);
  } else {
    console.error('❌ Auto-migration failed:', result);
  }
}

export default {
  migrateUserDocuments,
  checkMigrationNeeded,
  getMigrationStatus,
  saveMigrationStatus,
  autoMigrate
};
