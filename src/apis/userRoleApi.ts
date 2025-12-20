/**
 * User Role API
 * Handles role assignment and management
 */

import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { UserRole } from '../config/roles';
import { isValidRole } from '../utils/roleUtils';

const getCollectionName = (name: string): string => {
  const prefix = process.env.REACT_APP_USE_V3 === 'true' ? 'v3_' : '';
  return `${prefix}${name}`;
};

/**
 * Create user with default role
 * Called when user signs up
 */
export const createUserWithRole = async (
  userId: string,
  userData: {
    email: string;
    displayName?: string;
    phone?: string;
  },
  role: UserRole = 'User'
): Promise<void> => {
  try {
    if (!isValidRole(role)) {
      throw new Error('Invalid role');
    }

    const userDocRef = doc(db, getCollectionName('users'), userId);
    
    await setDoc(
      userDocRef,
      {
        email: userData.email,
        displayName: userData.displayName || '',
        phone: userData.phone || '',
        role, // Assign role (default: 'User')
        createdAt: new Date(),
        updatedAt: new Date(),
        roleAssignedAt: new Date()
      },
      { merge: true }
    );

    console.log(`User ${userId} created with role: ${role}`);
  } catch (error) {
    console.error('Error creating user with role:', error);
    throw new Error('Failed to create user: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

/**
 * Get user role
 */
export const getUserRole = async (userId: string): Promise<UserRole> => {
  try {
    const userDocRef = doc(db, getCollectionName('users'), userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const role = userDocSnap.data().role;
      return isValidRole(role) ? role : 'User';
    }

    return 'User'; // Default role
  } catch (error) {
    console.error('Error fetching user role:', error);
    return 'User';
  }
};

/**
 * Update user role (admin only in production)
 */
export const updateUserRole = async (userId: string, newRole: UserRole): Promise<void> => {
  try {
    if (!isValidRole(newRole)) {
      throw new Error('Invalid role');
    }

    const userDocRef = doc(db, getCollectionName('users'), userId);
    
    await updateDoc(userDocRef, {
      role: newRole,
      updatedAt: new Date(),
      roleChangedAt: new Date()
    });

    console.log(`User ${userId} role updated to: ${newRole}`);
  } catch (error) {
    console.error('Error updating user role:', error);
    throw new Error('Failed to update user role: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

/**
 * Verify admin code and promote user to admin
 * This is for manual admin assignment without email/dashboard
 */
export const promoteUserToAdmin = async (userId: string, adminCode: string): Promise<boolean> => {
  try {
    const ADMIN_CODE = process.env.REACT_APP_ADMIN_CODE || 'ADMIN_SECRET_2024';
    
    if (adminCode !== ADMIN_CODE) {
      throw new Error('Invalid admin code');
    }

    await updateUserRole(userId, 'SysAdmin');
    return true;
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    return false;
  }
};

/**
 * Check if user is admin
 */
export const isUserAdmin = async (userId: string): Promise<boolean> => {
  try {
    const role = await getUserRole(userId);
    return role === 'SysAdmin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};
