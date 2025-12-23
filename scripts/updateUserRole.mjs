import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

// Initialize Firebase Admin
const serviceAccountPath = './functions/service-account-key.json';

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`❌ Service account key not found at: ${serviceAccountPath}`);
  console.error('Please download it from Firebase Console > Project Settings > Service Accounts');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function updateUserRole(userId, role) {
  try {
    // Try dev_users first
    const devUserRef = db.collection('dev_users').doc(userId);
    const devUserSnap = await devUserRef.get();

    if (devUserSnap.exists) {
      console.log(`Found user in dev_users: ${userId}`);
      await devUserRef.update({
        role: role,
        updatedAt: new Date(),
        roleChangedAt: new Date()
      });
      console.log(`✅ Updated user role to '${role}' in dev_users`);
      return;
    }

    // Try users collection
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (userSnap.exists) {
      console.log(`Found user in users: ${userId}`);
      await userRef.update({
        role: role,
        updatedAt: new Date(),
        roleChangedAt: new Date()
      });
      console.log(`✅ Updated user role to '${role}' in users`);
      return;
    }

    console.error(`❌ User not found in dev_users or users: ${userId}`);
  } catch (err) {
    console.error('❌ Error updating user role:', err);
    process.exit(1);
  }
}

// Get user ID and role from command line
const userId = process.argv[2];
const role = process.argv[3];

if (!userId || !role) {
  console.log('Usage: npm run update-user-role <userId> <role>');
  console.log('Example: npm run update-user-role uBFqWwuS69WUMxuZMpkRZ3iIWDf1 SysAdmin');
  process.exit(1);
}

if (!['User', 'SysAdmin'].includes(role)) {
  console.error(`❌ Invalid role. Must be 'User' or 'SysAdmin', got: ${role}`);
  process.exit(1);
}

console.log(`Updating user ${userId} to role: ${role}...`);
updateUserRole(userId, role).then(() => {
  console.log('✅ Done');
  process.exit(0);
});
