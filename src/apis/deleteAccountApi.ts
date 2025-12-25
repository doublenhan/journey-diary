/**
 * User Account Deletion API
 * Handles marking accounts for permanent deletion with 7-day grace period
 */

import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
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
 * 2. Logout user immediately
 */
export const deleteAccount = async (): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('No authenticated user');
    }
    
    // 1. Mark account for deletion
    await markAccountForDeletion(currentUser.uid);
    
    // 2. Logout immediately
    await signOut(auth);
    
    console.log('✅ Account deletion flow completed');
  } catch (error) {
    console.error('❌ Error in account deletion flow:', error);
    throw error;
  }
};
