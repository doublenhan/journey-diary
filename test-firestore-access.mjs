#!/usr/bin/env node
/**
 * Test Firebase Firestore access
 * Run: node test-firestore-access.mjs
 */
import admin from 'firebase-admin';
import fs from 'fs';

// Check if service account file exists
const serviceAccountPath = './firebase-service-account.json';

if (!fs.existsSync(serviceAccountPath)) {
  console.log(`\n❌ Service account file not found: ${serviceAccountPath}`);
  console.log('\nTo use this script, please:');
  console.log('1. Download service account JSON from Firebase Console');
  console.log('2. Save it as firebase-service-account.json in the project root');
  console.log('3. Add it to .gitignore (already in place)');
  console.log('\nAlternatively, use:');
  console.log('firebase shell -- and run firestore queries\n');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testFirestore() {
  try {
    console.log('\n🔍 Testing Firestore Access...\n');

    // List all collections
    console.log('📚 Collections in Firestore:');
    const collections = await db.listCollections();
    collections.forEach(col => {
      console.log(`  - ${col.id}`);
    });

    // Try to read dev_users
    console.log('\n📖 Reading dev_users collection...');
    const devUsersQuery = await db.collection('dev_users').get();
    console.log(`  Found: ${devUsersQuery.size} documents`);
    
    devUsersQuery.forEach(doc => {
      console.log(`\n  📄 Document: ${doc.id}`);
      console.log(`     Data:`, JSON.stringify(doc.data(), null, 2));
    });

    // Try to read users
    console.log('\n📖 Reading users collection...');
    const usersQuery = await db.collection('users').get();
    console.log(`  Found: ${usersQuery.size} documents`);
    
    usersQuery.forEach(doc => {
      console.log(`\n  📄 Document: ${doc.id}`);
      console.log(`     Data:`, JSON.stringify(doc.data(), null, 2));
    });

    console.log('\n✅ Firestore access test completed\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err);
    process.exit(1);
  }
}

testFirestore();
