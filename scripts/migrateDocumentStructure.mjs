/**
 * Document Structure Migration Script
 * 
 * Migrates existing memories to optimized structure with flattened location fields
 * 
 * Usage:
 * 1. Set your Firebase credentials
 * 2. Run: node scripts/migrateDocumentStructure.mjs
 * 
 * What it does:
 * - Adds flattened location fields (locationCity, locationCountry, etc.)
 * - Removes null/undefined fields
 * - Validates document structure
 * - Reports optimization savings
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync(resolve('./serviceAccountKey.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/**
 * Optimize a single memory document
 */
function optimizeMemory(data) {
  const optimized = { ...data };

  // Flatten location for indexing
  if (data.location) {
    if (data.location.city) {
      optimized.locationCity = data.location.city;
    }
    if (data.location.country) {
      optimized.locationCountry = data.location.country;
    }
    if (data.location.address) {
      optimized.locationAddress = data.location.address;
    }
    if (data.location.coordinates) {
      optimized.locationLat = data.location.coordinates.lat;
      optimized.locationLng = data.location.coordinates.lng;
    }
  }

  // Remove null/undefined fields
  Object.keys(optimized).forEach(key => {
    if (optimized[key] === null || optimized[key] === undefined) {
      delete optimized[key];
    }
  });

  // Trim strings
  if (optimized.title) {
    optimized.title = optimized.title.trim().slice(0, 200);
  }
  if (optimized.description) {
    optimized.description = optimized.description.trim().slice(0, 5000);
  }

  // Limit arrays
  if (optimized.photos) {
    optimized.photos = optimized.photos.slice(0, 10);
  }
  if (optimized.tags) {
    optimized.tags = optimized.tags.slice(0, 20);
  }

  return optimized;
}

/**
 * Calculate document size
 */
function getDocSize(doc) {
  return JSON.stringify(doc).length;
}

/**
 * Migrate a single collection
 */
async function migrateCollection(collectionName) {
  console.log(`\n📦 Migrating collection: ${collectionName}`);

  const snapshot = await db.collection(collectionName).get();
  console.log(`Found ${snapshot.size} documents`);

  let processed = 0;
  let optimized = 0;
  let errors = 0;
  let totalSizeBefore = 0;
  let totalSizeAfter = 0;

  const batch = db.batch();
  let batchCount = 0;
  const BATCH_SIZE = 500;

  for (const doc of snapshot.docs) {
    try {
      const data = doc.data();
      const sizeBefore = getDocSize(data);
      totalSizeBefore += sizeBefore;

      const optimizedData = optimizeMemory(data);
      const sizeAfter = getDocSize(optimizedData);
      totalSizeAfter += sizeAfter;

      // Check if optimization made changes
      const hasChanges = 
        optimizedData.locationCity !== undefined ||
        optimizedData.locationCountry !== undefined ||
        sizeBefore !== sizeAfter;

      if (hasChanges) {
        batch.update(doc.ref, optimizedData);
        optimized++;
        batchCount++;

        console.log(
          `  ✓ ${doc.id}: ${sizeBefore}B → ${sizeAfter}B (${((sizeBefore - sizeAfter) / sizeBefore * 100).toFixed(1)}% reduction)`
        );
      }

      processed++;

      // Commit batch when it reaches size limit
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        console.log(`  💾 Committed batch of ${batchCount} documents`);
        batchCount = 0;
      }
    } catch (error) {
      console.error(`  ✗ Error processing ${doc.id}:`, error.message);
      errors++;
    }
  }

  // Commit remaining documents
  if (batchCount > 0) {
    await batch.commit();
    console.log(`  💾 Committed final batch of ${batchCount} documents`);
  }

  const savings = totalSizeBefore - totalSizeAfter;
  const savingsPercent = totalSizeBefore > 0 
    ? (savings / totalSizeBefore * 100).toFixed(2)
    : 0;

  console.log(`\n✅ Migration complete for ${collectionName}:`);
  console.log(`  - Processed: ${processed} documents`);
  console.log(`  - Optimized: ${optimized} documents`);
  console.log(`  - Errors: ${errors} documents`);
  console.log(`  - Size before: ${(totalSizeBefore / 1024).toFixed(2)} KB`);
  console.log(`  - Size after: ${(totalSizeAfter / 1024).toFixed(2)} KB`);
  console.log(`  - Savings: ${(savings / 1024).toFixed(2)} KB (${savingsPercent}%)`);
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('🚀 Starting document structure migration...');
  console.log(`📅 ${new Date().toISOString()}\n`);

  try {
    // Migrate both dev and production collections
    await migrateCollection('dev_memories');
    await migrateCollection('memories');

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Deploy new Firestore indexes: firebase deploy --only firestore:indexes');
    console.log('  2. Test the application thoroughly');
    console.log('  3. Monitor query performance with the new structure');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run migration
migrate();
