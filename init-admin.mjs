/**
 * Script to initialize the first SysAdmin user
 * This should be run once to set up the system administrator
 */

import { initializeApp, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { existsSync } from 'fs';

// Try to initialize Firebase Admin
let db;
try {
  // Check if Firebase Admin is already initialized
  try {
    getApp();
    console.log('Firebase Admin already initialized');
  } catch (e) {
    // Not initialized, so initialize it
    const serviceAccountPath = './firebase-service-account.json';
    
    if (!existsSync(serviceAccountPath)) {
      console.error('❌ Service account key not found');
      console.error('Please download from: Firebase Console > Project Settings > Service Accounts > Generate New Private Key');
      console.error(`Save it as: ${serviceAccountPath}`);
      console.error('Note: Add this file to .gitignore!');
      process.exit(1);
    }

    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    initializeApp({
      credential: cert(serviceAccount)
    });
  }
  
  db = getFirestore();
} catch (err) {
  console.error('Failed to initialize Firebase:', err);
  process.exit(1);
}

async function promoteUserToAdmin(userEmail) {
  try {
    console.log(`\n🔍 Searching for user: ${userEmail}`);

    // Search in dev_users first
    const devUsersQuery = await db.collection('dev_users')
      .where('email', '==', userEmail)
      .get();

    if (!devUsersQuery.empty) {
      const userDoc = devUsersQuery.docs[0];
      console.log(`✅ Found in dev_users: ${userDoc.id}`);
      
      await userDoc.ref.update({
        role: 'SysAdmin',
        updatedAt: new Date(),
        roleChangedAt: new Date(),
        roleChangedBy: 'system-init'
      });
      
      console.log(`✅ Promoted to SysAdmin!`);
      console.log(`   UID: ${userDoc.id}`);
      console.log(`   Email: ${userEmail}`);
      return;
    }

    // Search in users collection
    const usersQuery = await db.collection('users')
      .where('email', '==', userEmail)
      .get();

    if (!usersQuery.empty) {
      const userDoc = usersQuery.docs[0];
      console.log(`✅ Found in users: ${userDoc.id}`);
      
      await userDoc.ref.update({
        role: 'SysAdmin',
        updatedAt: new Date(),
        roleChangedAt: new Date(),
        roleChangedBy: 'system-init'
      });
      
      console.log(`✅ Promoted to SysAdmin!`);
      console.log(`   UID: ${userDoc.id}`);
      console.log(`   Email: ${userEmail}`);
      return;
    }

    console.error(`❌ User not found: ${userEmail}`);
    console.log('\n📋 Available users:');
    
    // List all users
    const allDevUsers = await db.collection('dev_users').get();
    allDevUsers.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.email} (${data.role})`);
    });

    process.exit(1);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.log('Usage: node init-admin.mjs <email>');
  console.log('Example: node init-admin.mjs hoang.nhanvo1705@gmail.com');
  console.log('\nNote: You need a service account key JSON file in the project root:');
  console.log('Firebase Console > Project Settings > Service Accounts > Generate New Private Key');
  process.exit(1);
}

console.log('🔐 Firebase Admin Initialization Script');
console.log(`📧 Target email: ${email}`);

promoteUserToAdmin(email).then(() => {
  console.log('\n✅ Done!\n');
  process.exit(0);
});
