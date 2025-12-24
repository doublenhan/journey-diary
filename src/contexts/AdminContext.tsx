/**
 * Admin Context - Global state management for admin/role features
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db, getCollectionName, ENV_PREFIX } from '../firebase/firebaseConfig';
import { UserRole } from '../config/roles';
import { isValidRole } from '../utils/roleUtils';

export interface UserWithRole {
  uid: string;
  email?: string;
  displayName?: string;
  role: UserRole;
  status?: 'Active' | 'Suspended' | 'Removed';
  createdAt?: Date;
  updatedAt?: Date;
}

interface AdminContextType {
  currentUserRole: UserRole | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  users: UserWithRole[];
  fetchUsers: (forceRefresh?: boolean) => Promise<void>;
  changeUserRole: (userId: string, newRole: UserRole) => Promise<void>;
  hasLoadedUsers: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const isFetchingRef = useRef(false);
  const hasLoadedUsersRef = useRef(false);

  // Load current user's role
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const userDocRef = doc(db, getCollectionName('users'), user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const role: UserRole = isValidRole(userData.role) ? userData.role : 'User';
            setCurrentUserRole(role);
            setIsAdmin(role === 'SysAdmin');
          } else {
            // User doc doesn't exist yet, default to User role
            setCurrentUserRole('User');
            setIsAdmin(false);
          }
        } else {
          setCurrentUserRole(null);
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Error loading user role:', err);
        setError('Failed to load user role');
        setCurrentUserRole('User');
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch all users (admin only)
  const fetchUsers = useCallback(async (forceRefresh = false) => {
    // Prevent concurrent fetch calls
    if (isFetchingRef.current) {
      console.log('⏭️ Fetch already in progress, skipping');
      return;
    }

    // Check if already loaded (unless forcing refresh)
    if (hasLoadedUsersRef.current && !forceRefresh) {
      console.log('⏭️ Users already loaded, skipping fetch');
      return;
    }

    isFetchingRef.current = true;
    hasLoadedUsersRef.current = true;

    try {
      setError(null);

      const collectionName = getCollectionName('users');
      const usersRef = collection(db, collectionName);
      const q = query(usersRef);
      const querySnapshot = await getDocs(q);

      const usersList: UserWithRole[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        usersList.push({
          uid: doc.id,
          email: data.email || '',
          displayName: data.displayName || '',
          role: isValidRole(data.role) ? data.role : 'User',
          status: data.status || 'Active',
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        });
      });

      console.log(`✅ Fetched ${usersList.length} users from ${collectionName}`);
      setUsers(usersList);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Error fetching users:', errorMsg);
      setError(`Failed to fetch users: ${errorMsg}`);
      hasLoadedUsersRef.current = false; // Reset on error so can retry
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Change user role (admin only)
  const changeUserRole = useCallback(async (userId: string, newRole: UserRole) => {
    if (!isAdmin) {
      throw new Error('Only admins can change user roles');
    }

    if (!isValidRole(newRole)) {
      throw new Error('Invalid role');
    }

    try {
      const userDocRef = doc(db, getCollectionName('users'), userId);
      await updateDoc(userDocRef, {
        role: newRole,
        updatedAt: new Date(),
        roleChangedAt: new Date(),
        roleChangedBy: getAuth().currentUser?.uid
      });

      // Update local users list
      setUsers((prev) =>
        prev.map((u) => (u.uid === userId ? { ...u, role: newRole, updatedAt: new Date() } : u))
      );
    } catch (err) {
      console.error('Error changing user role:', err);
      throw new Error('Failed to change user role');
    }
  }, [isAdmin]);

  const value: AdminContextType = {
    currentUserRole,
    isAdmin,
    loading,
    error,
    users,
    fetchUsers,
    changeUserRole,
    hasLoadedUsers: hasLoadedUsersRef.current
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};
