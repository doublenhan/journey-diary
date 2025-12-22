/**
 * Firestore Migration Script
 * Updates existing users collection to have role field
 * 
 * Usage: Run this in Firebase Console > Firestore > Web Console or via Cloud Functions
 */

import { db, getCollectionName } from '../firebase/firebaseConfig';
import { collection, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';

/**
 * Add role field to all existing users
 * - If user doesn't have role field → assign 'User' role
 * - Set roleAssignedAt timestamp
 */
export const migrateUsersAddRole = async () => {
  try {
    console.log('🚀 Starting user migration...');
    
    const usersCollectionName = getCollectionName('users');
    console.log(`📁 Collection: ${usersCollectionName}`);
    
    const usersRef = collection(db, usersCollectionName);
    const querySnapshot = await getDocs(usersRef);
    
    let updated = 0;
    let skipped = 0;
    
    for (const docSnap of querySnapshot.docs) {
      const userData = docSnap.data();
      const userId = docSnap.id;
      
      // Check if user already has role
      if (userData.role && (userData.role === 'User' || userData.role === 'SysAdmin')) {
        console.log(`✅ ${userId}: Already has role "${userData.role}" - skipping`);
        skipped++;
        continue;
      }
      
      // Update user with default 'User' role
      const userDocRef = doc(db, usersCollectionName, userId);
      await updateDoc(userDocRef, {
        role: 'User',
        roleAssignedAt: Timestamp.now(),
        migratedAt: Timestamp.now()
      });
      
      console.log(`✏️ ${userId}: Updated with role "User"`);
      updated++;
    }
    
    console.log(`\n✅ Migration complete!`);
    console.log(`📊 Updated: ${updated} | Skipped: ${skipped} | Total: ${updated + skipped}`);
    
    return { success: true, updated, skipped, total: updated + skipped };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

/**
 * Move data from 'users' collection to 'dev_users' (for dev environment)
 * Use this if you need to separate dev data
 */
export const migrateUsersToDev = async () => {
  try {
    console.log('🚀 Starting migration from users → dev_users...');
    
    const prodUsersRef = collection(db, 'users');
    const devUsersCollectionName = getCollectionName('users'); // Will be 'dev_users' if VITE_ENV_PREFIX=dev_
    
    const querySnapshot = await getDocs(prodUsersRef);
    let migrated = 0;
    
    for (const docSnap of querySnapshot.docs) {
      const userData = docSnap.data();
      const userId = docSnap.id;
      
      // Copy to dev_users with role if missing
      const devUserDocRef = doc(db, devUsersCollectionName, userId);
      await updateDoc(devUserDocRef, {
        ...userData,
        role: userData.role || 'User',
        roleAssignedAt: userData.roleAssignedAt || Timestamp.now(),
        migratedAt: Timestamp.now()
      });
      
      console.log(`✏️ ${userId}: Migrated to ${devUsersCollectionName}`);
      migrated++;
    }
    
    console.log(`\n✅ Migration complete! Migrated ${migrated} users`);
    return { success: true, migrated };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

/**
 * Verify migration - check that all users have role field
 */
export const verifyUserMigration = async () => {
  try {
    console.log('🔍 Verifying user migration...');
    
    const usersCollectionName = getCollectionName('users');
    const usersRef = collection(db, usersCollectionName);
    const querySnapshot = await getDocs(usersRef);
    
    const stats: {
      total: number;
      withRole: number;
      withoutRole: number;
      users: Array<{uid: string; email: any; role: any; roleAssignedAt: any}>;
    } = {
      total: 0,
      withRole: 0,
      withoutRole: 0,
      users: []
    };
    
    for (const docSnap of querySnapshot.docs) {
      const userData = docSnap.data();
      stats.total++;
      
      const hasRole = userData.role && (userData.role === 'User' || userData.role === 'SysAdmin');
      
      if (hasRole) {
        stats.withRole++;
      } else {
        stats.withoutRole++;
      }
      
      stats.users.push({
        uid: docSnap.id,
        email: userData.email,
        role: userData.role || 'MISSING',
        roleAssignedAt: userData.roleAssignedAt?.toDate?.() || 'N/A'
      });
    }
    
    console.table(stats.users);
    console.log(`\n📊 Summary:`);
    console.log(`   Total users: ${stats.total}`);
    console.log(`   With role: ${stats.withRole}`);
    console.log(`   Without role: ${stats.withoutRole}`);
    
    if (stats.withoutRole === 0) {
      console.log('✅ All users have role field!');
    } else {
      console.log('⚠️ Some users missing role field. Run migrateUsersAddRole()');
    }
    
    return stats;
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
};
