/**
 * User Account Deletion API
 * Handles marking accounts for permanent deletion with 7-day grace period
 * and restoration of removed accounts
 */

import { doc, updateDoc, serverTimestamp, deleteField } from 'firebase/firestore';
import { db, getCollectionName, auth } from '../firebase/firebaseConfig';
import { signOut } from 'firebase/auth';

/**
 * Mark user account for deletion (status = 'Removed')
 * Account will be permanently deleted by cron job after 7 days
 */
export const markAccountForDeletion = async (userId: string): Promise<void> => {
  try {
    const userDocRef = doc(db, getCollectionName('users'), userId);
    
    await updateDoc(userDocRef, {
      status: 'Removed',
      removedAt: serverTimestamp(),
      statusUpdatedAt: serverTimestamp(),
      statusUpdatedBy: userId // Self-delete
    });
    
    console.log('✅ Account marked for deletion:', userId);
  } catch (error) {
    console.error('❌ Error marking account for deletion:', error);
    throw error;
  }
};

/**
 * Complete account deletion flow:
 * 1. Mark account as Removed in Firestore
 * 2. Wait for update to complete
 * 3. Logout user immediately
 */
export const deleteAccount = async (): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('No authenticated user');
    }
    
    console.log('🗑️ Starting account deletion for:', currentUser.uid);
    
    // 1. Mark account for deletion (WAIT for completion)
    await markAccountForDeletion(currentUser.uid);
    
    console.log('✅ Account marked as Removed, waiting before logout...');
    
    // 2. Small delay to ensure Firestore update is propagated
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 3. Logout immediately
    console.log('🚪 Logging out user...');
    await signOut(auth);
    
    console.log('✅ Account deletion flow completed');
  } catch (error) {
    console.error('❌ Error in account deletion flow:', error);
    throw error;
  }
};

/**
 * Restore account from Removed status back to Active
 * Can be called by Admin within 7-day grace period
 */
export const restoreAccount = async (userId: string, adminUserId: string): Promise<void> => {
  try {
    const userDocRef = doc(db, getCollectionName('users'), userId);
    
    await updateDoc(userDocRef, {
      status: 'Active',
      removedAt: deleteField(), // Remove the removedAt timestamp
      statusUpdatedAt: serverTimestamp(),
      statusUpdatedBy: adminUserId,
      restoredAt: serverTimestamp(),
      restoredBy: adminUserId
    });
    
    console.log('✅ Account restored:', userId);
  } catch (error) {
    console.error('❌ Error restoring account:', error);
    throw error;
  }
};
