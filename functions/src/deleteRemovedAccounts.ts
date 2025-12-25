/**
 * Delete Removed Accounts - Scheduled Cloud Function
 * 
 * Runs daily to permanently delete accounts that have been marked as "Removed"
 * for more than 7 days (grace period).
 * 
 * Deletion includes:
 * - Firebase Authentication user
 * - Firestore user document
 * - All user memories
 * - Cloudinary images (via deleteCloudinaryImage function)
 * - Anniversary events
 * - User effects
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { v2 as cloudinary } from 'cloudinary';
import { defineSecret } from 'firebase-functions/params';

// Cloudinary credentials stored as Firebase Secrets (secure)
const cloudinaryCloudName = defineSecret('CLOUDINARY_CLOUD_NAME');
const cloudinaryApiKey = defineSecret('CLOUDINARY_API_KEY');
const cloudinaryApiSecret = defineSecret('CLOUDINARY_API_SECRET');

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
 * Scheduled function to delete accounts marked as "Removed" > 7 days ago
 * Runs every day at 2:00 AM (Vietnam time)
 * 
 * NOTE: This function checks BOTH dev_ and production collections
 * since it's a scheduled job that runs on Firebase production project
 */
export const deleteRemovedAccounts = onSchedule({
  schedule: 'every day 02:00',
  timeZone: 'Asia/Ho_Chi_Minh',
  timeoutSeconds: 540,
  memory: '512MiB',
  secrets: [cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret]
}, async (event) => {
  const startTime = Date.now();
  
  console.log('🗑️ Starting deletion of removed accounts (7+ days old)...');
  
  try {
    const db = admin.firestore();
    const auth = admin.auth();
    
    // Calculate 7 days ago timestamp
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoTimestamp = admin.firestore.Timestamp.fromDate(sevenDaysAgo);
    
    console.log(`📅 Deleting accounts removed before: ${sevenDaysAgo.toISOString()}`);
    
    // ⚠️ TEST MODE: Only process DEV environment
    // Change to ['dev_', ''] for production to handle both environments
    const environments = ['dev_']; // ONLY DEV for testing
    let totalDeleted = 0;
    let totalErrors = 0;
    const allErrors: string[] = [];
    
    for (const ENV_PREFIX of environments) {
      console.log(`\n🔍 Checking ${ENV_PREFIX || 'production'} environment...`);
      
      // Query users with status='Removed' and removedAt < 7 days ago
      const removedUsersQuery = db.collection(`${ENV_PREFIX}users`)
        .where('status', '==', 'Removed')
        .where('removedAt', '<=', sevenDaysAgoTimestamp)
        .limit(50); // Process in batches to avoid timeout
      
      const removedUsers = await removedUsersQuery.get();
      
      if (removedUsers.empty) {
        console.log(`✅ No accounts to delete in ${ENV_PREFIX || 'production'} (grace period not expired)`);
        continue;
      }
      
      console.log(`📝 Found ${removedUsers.size} accounts to delete in ${ENV_PREFIX || 'production'}`);
      
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      
      // Process each removed user
    for (const userDoc of removedUsers.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      console.log(`🗑️ Deleting user: ${userId} (${userData.email})`);
      
      try {
        // Configure Cloudinary
        cloudinary.config({
          cloud_name: cloudinaryCloudName.value().trim(),
          api_key: cloudinaryApiKey.value().trim(),
          api_secret: cloudinaryApiSecret.value().trim()
        });
        
        // STEP 1: Delete ALL Cloudinary images FIRST
        console.log(`  📸 Step 1/5: Deleting Cloudinary images...`);
        const memoriesQuery = db.collection(`${ENV_PREFIX}memories`)
          .where('userId', '==', userId);
        const memories = await memoriesQuery.get();
        
        console.log(`  - Found ${memories.size} memories to process`);
        
        // Helper function to extract publicId from Cloudinary URL
        const extractPublicIdFromUrl = (urlOrPublicId: string): string => {
          if (!urlOrPublicId.startsWith('http://') && !urlOrPublicId.startsWith('https://')) {
            return urlOrPublicId;
          }
          try {
            const url = new URL(urlOrPublicId);
            const pathParts = url.pathname.split('/');
            const uploadIndex = pathParts.indexOf('upload');
            if (uploadIndex === -1) return urlOrPublicId;
            let startIndex = uploadIndex + 1;
            if (pathParts[startIndex]?.match(/^v\d+$/)) {
              startIndex++;
            }
            const publicIdWithExtension = pathParts.slice(startIndex).join('/');
            const lastDotIndex = publicIdWithExtension.lastIndexOf('.');
            return lastDotIndex > 0 
              ? publicIdWithExtension.substring(0, lastDotIndex)
              : publicIdWithExtension;
          } catch (error) {
            console.error('Error extracting publicId:', error);
            return urlOrPublicId;
          }
        };
        
        // Extract all Cloudinary publicIds
        const allPublicIds: string[] = [];
        memories.forEach((memoryDoc) => {
          const memoryData = memoryDoc.data();
          const rawIds = memoryData.cloudinaryPublicIds || memoryData.photos || [];
          // Extract publicId from each URL/publicId
          const extractedIds = rawIds.map((id: string) => extractPublicIdFromUrl(id));
          allPublicIds.push(...extractedIds);
        });
        
        console.log(`  - Total Cloudinary images to delete: ${allPublicIds.length}`);
        
        // Delete each image from Cloudinary
        const failedImages: string[] = [];
        let deletedImagesCount = 0;
        
        for (const publicId of allPublicIds) {
          try {
            console.log(`    • Deleting: ${publicId}`);
            const result = await cloudinary.uploader.destroy(publicId, {
              invalidate: true
            });
            
            if (result.result === 'ok' || result.result === 'not found') {
              deletedImagesCount++;
              console.log(`    ✓ Deleted: ${publicId}`);
            } else {
              failedImages.push(publicId);
              console.error(`    ✗ Failed: ${publicId} - ${result.result}`);
            }
          } catch (imageError: any) {
            failedImages.push(publicId);
            console.error(`    ✗ Error deleting ${publicId}:`, imageError.message);
          }
        }
        
        // ❌ CRITICAL: If ANY image failed to delete, STOP and throw error
        if (failedImages.length > 0) {
          const errorMessage = `Failed to delete ${failedImages.length}/${allPublicIds.length} Cloudinary images for user ${userId}. Failed images: ${failedImages.join(', ')}`;
          console.error(`  ❌ ${errorMessage}`);
          throw new Error(errorMessage);
        }
        
        console.log(`  ✅ All ${deletedImagesCount} Cloudinary images deleted successfully`);
        
        // STEP 2: Delete Firestore memories (only after all images deleted)
        console.log(`  🗂️ Step 2/5: Deleting ${memories.size} memories from Firestore...`);
        
        const memoryBatch = db.batch();
        memories.forEach((memoryDoc) => {
          memoryBatch.delete(memoryDoc.ref);
        });
        await memoryBatch.commit();
        console.log(`  ✅ Memories deleted from Firestore`);
        
        // STEP 3: Delete anniversary events
        // STEP 3: Delete anniversary events
        console.log(`  🎉 Step 3/5: Deleting anniversary events...`);
        const anniversaryQuery = db.collection(`${ENV_PREFIX}AnniversaryEvent`)
          .where('userId', '==', userId);
        const anniversaries = await anniversaryQuery.get();
        
        console.log(`  - Deleting ${anniversaries.size} anniversaries...`);
        
        const anniversaryBatch = db.batch();
        anniversaries.forEach((annDoc) => {
          anniversaryBatch.delete(annDoc.ref);
        });
        await anniversaryBatch.commit();
        console.log(`  ✅ Anniversaries deleted`);
        
        // STEP 4: Delete user effects
        console.log(`  ⚙️ Step 4/5: Deleting user effects...`);
        const userEffectsRef = db.collection(`${ENV_PREFIX}userEffects`).doc(userId);
        const userEffectsDoc = await userEffectsRef.get();
        if (userEffectsDoc.exists) {
          await userEffectsRef.delete();
          console.log(`  ✅ User effects deleted`);
        }
        
        // STEP 5: Delete user document
        console.log(`  👤 Step 5/5: Deleting user document...`);
        await userDoc.ref.delete();
        console.log(`  ✅ User document deleted`);
        
        // STEP 6: Delete Firebase Authentication user
        console.log(`  🔐 Final step: Deleting Auth user...`);
        try {
          await auth.deleteUser(userId);
          console.log(`  - Deleted Auth user`);
        } catch (authError: any) {
          // User might already be deleted from Auth
          if (authError.code === 'auth/user-not-found') {
            console.log(`  - Auth user already deleted`);
          } else {
            throw authError;
          }
        }
        
        console.log(`✅ Successfully deleted user: ${userId}`);
        successCount++;
        
      } catch (error: any) {
        console.error(`❌ Error deleting user ${userId}:`, error);
        errorCount++;
        errors.push(`${userId}: ${error.message}`);
      }
    }
    
    console.log(`✅ Deletion complete for ${ENV_PREFIX || 'production'}:`);
    console.log(`  - Success: ${successCount}`);
    console.log(`  - Errors: ${errorCount}`);
    
    // Track execution in system_stats for this environment
    await db.collection(`${ENV_PREFIX}system_stats`).doc('cron_jobs').set({
      deleteRemovedAccounts: {
        lastRun: admin.firestore.FieldValue.serverTimestamp(),
        status: errorCount === 0 ? 'success' : 'partial_success',
        accountsDeleted: successCount,
        accountsFailed: errorCount,
        executionTimeMs: Date.now() - startTime,
        schedule: 'every day 02:00',
        lastError: errors.length > 0 ? errors.join(', ') : null
      }
    }, { merge: true });
    
    // Add to cron history for this environment
    await db.collection(`${ENV_PREFIX}cron_history`).add({
      jobName: 'deleteRemovedAccounts',
      status: errorCount === 0 ? 'success' : 'partial_success',
      error: errors.length > 0 ? errors.join(', ') : null,
      startTime: admin.firestore.Timestamp.fromMillis(startTime),
      endTime: admin.firestore.FieldValue.serverTimestamp(),
      executionTimeMs: Date.now() - startTime,
      accountsDeleted: successCount,
      accountsFailed: errorCount,
      triggeredBy: 'auto',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    totalDeleted += successCount;
    totalErrors += errorCount;
    allErrors.push(...errors);
  }
  
  const totalExecutionTimeMs = Date.now() - startTime;
  console.log(`\n🎯 Total deletion summary:`);
  console.log(`  - Total deleted: ${totalDeleted}`);
  console.log(`  - Total errors: ${totalErrors}`);
  console.log(`  - Total execution time: ${totalExecutionTimeMs}ms`);
    
  } catch (error: any) {
    console.error('❌ Fatal error in deleteRemovedAccounts:', error);
    
    const executionTimeMs = Date.now() - startTime;
    const db = admin.firestore();
    
    // Track failed execution in BOTH environments
    const environments = ['dev_', ''];
    for (const ENV_PREFIX of environments) {
      await db.collection(`${ENV_PREFIX}system_stats`).doc('cron_jobs').set({
        deleteRemovedAccounts: {
          lastRun: admin.firestore.FieldValue.serverTimestamp(),
          status: 'failed',
          lastError: error.message,
          executionTimeMs: executionTimeMs,
          schedule: 'every day 02:00'
        }
      }, { merge: true });
      
      await db.collection(`${ENV_PREFIX}cron_history`).add({
        jobName: 'deleteRemovedAccounts',
        status: 'failed',
        error: error.message,
        startTime: admin.firestore.Timestamp.fromMillis(startTime),
        endTime: admin.firestore.FieldValue.serverTimestamp(),
        executionTimeMs: executionTimeMs,
        triggeredBy: 'auto',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    throw error;
  }
});
