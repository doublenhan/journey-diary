/**
 * Migration Script: Add dev_ prefix to cron/system collections
 * 
 * Migrates:
 * - cron_history → dev_cron_history
 * - cron_stats_daily → dev_cron_stats_daily
 * - system_stats → dev_system_stats
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Firebase config from .env
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const BATCH_SIZE = 500;

/**
 * Copy collection to new collection with prefix
 */
async function migrateCollection(sourceCollection, targetCollection) {
  console.log(`\n📦 Migrating: ${sourceCollection} → ${targetCollection}`);
  
  try {
    // Get all documents from source
    const sourceRef = collection(db, sourceCollection);
    const snapshot = await getDocs(sourceRef);
    
    if (snapshot.empty) {
      console.log(`  ℹ️  No documents found in ${sourceCollection}`);
      return { copied: 0, errors: 0 };
    }
    
    console.log(`  📊 Found ${snapshot.size} documents`);
    
    let copied = 0;
    let errors = 0;
    
    // Process in batches
    const batches = [];
    let currentBatch = writeBatch(db);
    let batchCount = 0;
    
    snapshot.forEach((docSnap) => {
      const targetRef = doc(db, targetCollection, docSnap.id);
      currentBatch.set(targetRef, docSnap.data());
      batchCount++;
      
      if (batchCount >= BATCH_SIZE) {
        batches.push(currentBatch);
        currentBatch = writeBatch(db);
        batchCount = 0;
      }
    });
    
    // Add remaining batch
    if (batchCount > 0) {
      batches.push(currentBatch);
    }
    
    // Commit all batches
    console.log(`  ⏳ Committing ${batches.length} batch(es)...`);
    for (let i = 0; i < batches.length; i++) {
      try {
        await batches[i].commit();
        const docsInBatch = Math.min(BATCH_SIZE, snapshot.size - (i * BATCH_SIZE));
        copied += docsInBatch;
        console.log(`  ✅ Batch ${i + 1}/${batches.length} committed (${docsInBatch} docs)`);
      } catch (error) {
        console.error(`  ❌ Error in batch ${i + 1}:`, error.message);
        errors += BATCH_SIZE;
      }
    }
    
    return { copied, errors, total: snapshot.size };
    
  } catch (error) {
    console.error(`  ❌ Error migrating ${sourceCollection}:`, error.message);
    return { copied: 0, errors: 1, total: 0 };
  }
}

/**
 * Verify migration was successful
 */
async function verifyMigration(targetCollection, expectedCount) {
  const targetRef = collection(db, targetCollection);
  const snapshot = await getDocs(targetRef);
  const actualCount = snapshot.size;
  
  if (actualCount === expectedCount) {
    console.log(`  ✅ Verification passed: ${actualCount} documents`);
    return true;
  } else {
    console.log(`  ⚠️  Count mismatch: expected ${expectedCount}, got ${actualCount}`);
    return false;
  }
}

/**
 * Delete old collection (backup first!)
 */
async function deleteOldCollection(collectionName, confirm = false) {
  if (!confirm) {
    console.log(`  ⏭️  Skipping deletion of ${collectionName} (set confirm=true to delete)`);
    return;
  }
  
  console.log(`  🗑️  Deleting old collection: ${collectionName}`);
  
  const collRef = collection(db, collectionName);
  const snapshot = await getDocs(collRef);
  
  if (snapshot.empty) {
    console.log(`  ℹ️  Collection ${collectionName} is already empty`);
    return;
  }
  
  // Delete in batches
  const batches = [];
  let currentBatch = writeBatch(db);
  let count = 0;
  
  snapshot.forEach((docSnap) => {
    currentBatch.delete(docSnap.ref);
    count++;
    
    if (count >= BATCH_SIZE) {
      batches.push(currentBatch);
      currentBatch = writeBatch(db);
      count = 0;
    }
  });
  
  if (count > 0) {
    batches.push(currentBatch);
  }
  
  for (const batch of batches) {
    await batch.commit();
  }
  
  console.log(`  ✅ Deleted ${snapshot.size} documents from ${collectionName}`);
}

/**
 * Main migration
 */
async function main() {
  console.log('🚀 Starting Cron Collections Migration');
  console.log('=====================================\n');
  
  const migrations = [
    { source: 'cron_history', target: 'dev_cron_history' },
    { source: 'cron_stats_daily', target: 'dev_cron_stats_daily' },
    { source: 'system_stats', target: 'dev_system_stats' }
  ];
  
  const results = [];
  
  // Step 1: Migrate all collections
  for (const { source, target } of migrations) {
    const result = await migrateCollection(source, target);
    results.push({ source, target, ...result });
  }
  
  console.log('\n\n📊 Migration Summary:');
  console.log('=====================');
  
  let totalCopied = 0;
  let totalErrors = 0;
  
  for (const result of results) {
    console.log(`\n${result.source} → ${result.target}:`);
    console.log(`  ✅ Copied: ${result.copied}/${result.total}`);
    if (result.errors > 0) {
      console.log(`  ❌ Errors: ${result.errors}`);
    }
    totalCopied += result.copied;
    totalErrors += result.errors;
  }
  
  console.log(`\n📈 Total: ${totalCopied} documents migrated`);
  if (totalErrors > 0) {
    console.log(`⚠️  Total errors: ${totalErrors}`);
  }
  
  // Step 2: Verify migrations
  console.log('\n\n🔍 Verifying migrations...');
  console.log('=========================');
  
  let allVerified = true;
  for (const result of results) {
    console.log(`\n${result.target}:`);
    const verified = await verifyMigration(result.target, result.total);
    allVerified = allVerified && verified;
  }
  
  if (allVerified && totalErrors === 0) {
    console.log('\n\n✅ All migrations successful!');
    console.log('\n⚠️  NEXT STEPS:');
    console.log('1. Verify data in Firebase Console');
    console.log('2. Test app functionality with new collections');
    console.log('3. Run this script again with DELETE_OLD=true to cleanup:');
    console.log('   DELETE_OLD=true node scripts/migrateCronCollections.mjs');
  } else {
    console.log('\n\n⚠️  Some migrations had issues. Please review above.');
  }
  
  // Step 3: Delete old collections (only if DELETE_OLD=true)
  if (process.env.DELETE_OLD === 'true') {
    console.log('\n\n🗑️  Deleting old collections...');
    console.log('==============================');
    
    for (const { source } of migrations) {
      await deleteOldCollection(source, true);
    }
    
    console.log('\n✅ Old collections deleted!');
  }
  
  console.log('\n🎉 Migration complete!\n');
}

// Run migration
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
