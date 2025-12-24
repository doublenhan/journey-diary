/**
 * Admin Dashboard - System Administrator Panel
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { useToastContext } from '../contexts/ToastContext';
import { useLanguage } from '../hooks/useLanguage';
import { ArrowLeft, Users, Lock, Shield, CheckCircle, X, RefreshCw, Crown, UserCog, Search, Filter, SortAsc, SortDesc, Calendar, Info, Ban, UserX, UserCheck, AlertCircle } from 'lucide-react';
import { getAllStorageUsage, FirebaseUsageStats, CloudinaryUsageStats, AuthenticationUsageStats, CloudFunctionsUsageStats, FirestoreOperationsStats, triggerStatsUpdate } from '../apis/storageUsageApi';
import StorageUsageChart from '../components/StorageUsageChart';
import UserDetailsModal from '../components/UserDetailsModal';
import { SkeletonChart, SkeletonUserCard } from '../components/Skeleton';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/firebaseConfig';

type UserStatus = 'Active' | 'Suspended' | 'Removed';

const ENV_PREFIX = import.meta.env.VITE_ENV_PREFIX || '';

interface AdminDashboardProps {
  onBack?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const { users, fetchUsers, changeUserRole, currentUserRole, loading: contextLoading, hasLoadedUsers } = useAdmin();
  const { success: showSuccess, error: showError } = useToastContext();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [roleChangeInProgress, setRoleChangeInProgress] = useState<string | null>(null);
  const [statusChangeInProgress, setStatusChangeInProgress] = useState<string | null>(null);
  
  // User Details Modal state
  const [detailsModalUser, setDetailsModalUser] = useState<any | null>(null);
  
  // Active panel management - only one panel open at a time
  const [activePanel, setActivePanel] = useState<{
    userId: string;
    type: 'role' | 'status';
  } | null>(null);
  
  // Status Confirmation Modal state
  const [statusConfirmModal, setStatusConfirmModal] = useState<{
    show: boolean;
    userId: string;
    userName: string;
    newStatus: UserStatus;
  } | null>(null);
  
  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'User' | 'SysAdmin'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [firebaseUsage, setFirebaseUsage] = useState<FirebaseUsageStats | null>(null);
  const [cloudinaryUsage, setCloudinaryUsage] = useState<CloudinaryUsageStats | null>(null);
  const [authUsage, setAuthUsage] = useState<AuthenticationUsageStats | null>(null);
  const [functionsUsage, setFunctionsUsage] = useState<CloudFunctionsUsageStats | null>(null);
  const [firestoreOps, setFirestoreOps] = useState<FirestoreOperationsStats | null>(null);
  const [storageLoading, setStorageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'usage' | 'users'>('usage');
  const [storageError, setStorageError] = useState<string | null>(null);
  const [lastCalculated, setLastCalculated] = useState<string | null>(null);

  const loadStorageUsage = async () => {
    try {
      setStorageLoading(true);
      setStorageError(null);
      const usage = await getAllStorageUsage();
      setFirebaseUsage(usage.firebase);
      setCloudinaryUsage(usage.cloudinary);
      setAuthUsage(usage.authentication);
      setFunctionsUsage(usage.cloudFunctions);
      setFirestoreOps(usage.firestoreOperations);
      setLastCalculated(usage.timestamp || null);
    } catch (error) {
      console.error('Error loading storage usage:', error);
      setStorageError('Storage stats not available yet. Click "Calculate Stats" to generate them.');
    } finally {
      setStorageLoading(false);
    }
  };

  const handleCalculateStats = async () => {
    try {
      setStorageLoading(true);
      setStorageError(null);
      
      showSuccess('Calculating storage stats...');
      
      // Trigger Cloud Function to calculate stats
      await triggerStatsUpdate();
      
      // Wait a bit for the function to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Load the newly calculated stats
      await loadStorageUsage();
      
      showSuccess('Storage stats calculated successfully!');
    } catch (error) {
      console.error('Error calculating storage stats:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to calculate stats';
      setStorageError(errorMessage);
      showError(errorMessage);
    } finally {
      setStorageLoading(false);
    }
  };

  // Log users whenever they change
  useEffect(() => {
    if (users.length > 0) {
      console.log(`✅ Users loaded: ${users.length} users`);
    }
  }, [users]);

  // Load users ONLY ONCE on component mount
  useEffect(() => {
    console.log(`🔍 AdminDashboard mount check - hasLoadedUsers: ${hasLoadedUsers}`);
    
    // Call fetchUsers - it has internal guards to prevent re-fetching
    fetchUsers();
  }, []); // Only on mount

  // Load storage usage data
  useEffect(() => {
    loadStorageUsage();
  }, []);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await fetchUsers(true); // Force refresh
      showSuccess('Users reloaded successfully');
    } catch (err) {
      showError('Failed to reload users: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user => 
        (user.email?.toLowerCase() || '').includes(query) ||
        (user.displayName?.toLowerCase() || '').includes(query)
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          const nameA = a.displayName?.toLowerCase() || '';
          const nameB = b.displayName?.toLowerCase() || '';
          comparison = nameA.localeCompare(nameB);
          break;
        case 'email':
          const emailA = a.email || '';
          const emailB = b.email || '';
          comparison = emailA.localeCompare(emailB);
          break;
        case 'date':
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          comparison = dateA - dateB;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [users, searchQuery, roleFilter, sortBy, sortOrder]);

  const handleChangeRole = async (userId: string, newRole: 'User' | 'SysAdmin') => {
    try {
      setRoleChangeInProgress(userId);
      await changeUserRole(userId, newRole);
      showSuccess(`User role updated to ${newRole}`);
      setActivePanel(null);
    } catch (error: any) {
      showError(error.message || 'Failed to update user role');
    } finally {
      setRoleChangeInProgress(null);
    }
  }

  const handleChangeStatus = async (userId: string, newStatus: UserStatus) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      showError('Not authenticated');
      return;
    }

    // Prevent admin from suspending/removing their own account
    if (userId === currentUser.uid) {
      if (newStatus === 'Suspended') {
        showError(t('notification.cannotSuspendSelf'));
        return;
      }
      if (newStatus === 'Removed') {
        showError(t('notification.cannotRemoveSelf'));
        return;
      }
    }

    // Show confirmation modal for all status changes
    const targetUser = users.find(u => u.uid === userId);
    const userName = targetUser?.displayName || targetUser?.email || 'this user';
    
    setStatusConfirmModal({
      show: true,
      userId,
      userName,
      newStatus
    });
  }

  const executeStatusChange = async (userId: string, newStatus: UserStatus) => {
    try {
      setStatusChangeInProgress(userId);
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Not authenticated');
      }

      const userCollection = `${ENV_PREFIX}users`;
      const userRef = doc(db, userCollection, userId);
      
      await updateDoc(userRef, {
        status: newStatus,
        statusUpdatedAt: serverTimestamp(),
        statusUpdatedBy: currentUser.uid
      });
      
      // Force refresh users list from Firestore (no cache)
      await fetchUsers(true);
      
      const statusText = newStatus === 'Active' ? t('settings.admin.userManagement.active') :
                        newStatus === 'Suspended' ? t('settings.admin.userManagement.suspended') :
                        t('settings.admin.userManagement.removed');
      showSuccess(`${t('settings.admin.userManagement.statusUpdated')} ${statusText}`);
      setActivePanel(null);
      setStatusConfirmModal(null);
    } catch (error: any) {
      console.error('Error updating user status:', error);
      showError(error.message || 'Failed to update user status');
    } finally {
      setStatusChangeInProgress(null);
    }
  }

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-200 animate-pulse"></div>
              <div className="flex-1">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
          
          {/* User Cards Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonUserCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 backdrop-blur-sm bg-opacity-90">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 group"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600 group-hover:text-purple-600 transition-colors" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    System Administration
                  </h1>
                  <p className="text-gray-500 text-sm">Manage users and permissions</p>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
              <Crown className="w-5 h-5 text-purple-600" />
              <span className="text-purple-700 font-semibold text-sm">Admin Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-2 flex gap-2">
          <button
            onClick={() => setActiveTab('usage')}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === 'usage'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📊 {t('settings.admin.tabs.usage')}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            👥 {t('settings.admin.tabs.users')}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Usage Tab Content */}
        {activeTab === 'usage' && (
          <>
            {/* Storage Usage Section */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  📊 {t('settings.admin.storageTitle')}
                </h2>
                <button
                  onClick={handleCalculateStats}
                  disabled={storageLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <RefreshCw className={`w-4 h-4 ${storageLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                  {t('settings.admin.calculateStats')}
                </button>
              </div>
              
              {storageError && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="font-semibold text-yellow-800 mb-1">{t('settings.admin.statsNotAvailable')}</p>
                      <p className="text-sm text-yellow-700">{storageError}</p>
                      <p className="text-xs text-yellow-600 mt-2">
                        {t('settings.admin.statsNote')}
                      </p>
                      {lastCalculated && (
                        <p className="text-xs text-yellow-600 mt-1">
                          {t('settings.admin.lastCalculated')}: {new Date(lastCalculated).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {storageLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <SkeletonChart key={i} />
                  ))}
                </div>
              ) : (
                <>
                  {/* Last Calculated Timestamp */}
                  {lastCalculated && !storageError && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                      <div className="flex items-center gap-3">
                        <Info className="w-5 h-5 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm text-blue-800">
                            {t('settings.admin.lastCalculated')}: <span className="font-semibold">{new Date(lastCalculated).toLocaleString()}</span>
                          </p>
                          <p className="text-xs text-blue-600 mt-1">{t('settings.admin.statsNote')}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Firebase Storage */}
              {firebaseUsage && (
                <StorageUsageChart
                  used={firebaseUsage.estimatedStorageMB}
                  limit={firebaseUsage.limit.storageLimitMB}
                  unit="MB"
                  label={t('settings.admin.charts.firebaseDatabase')}
                  icon="database"
                  color={{ from: 'from-blue-500', to: 'to-blue-600' }}
                />
              )}

              {/* Authentication Users */}
              {authUsage && (
                <StorageUsageChart
                  used={authUsage.totalUsers}
                  limit={authUsage.limit.monthlyActiveUsers}
                  unit={t('settings.admin.units.users')}
                  label={t('settings.admin.charts.authentication')}
                  icon="users"
                  color={{ from: 'from-purple-500', to: 'to-purple-600' }}
                />
              )}

              {/* Cloud Functions */}
              {functionsUsage && (
                <StorageUsageChart
                  used={(functionsUsage.isActualData && functionsUsage.actualInvocationsPerDay 
                    ? functionsUsage.actualInvocationsPerDay 
                    : functionsUsage.estimatedInvocationsPerDay) * 30}
                  limit={functionsUsage.limit.invocationsPerMonth}
                  unit={t('settings.admin.units.calls')}
                  label={functionsUsage.isActualData 
                    ? `${t('settings.admin.charts.cloudFunctions')} (Actual)` 
                    : `${t('settings.admin.charts.cloudFunctions')} (Estimated)`}
                  icon="zap"
                  color={{ from: 'from-yellow-500', to: 'to-yellow-600' }}
                />
              )}

              {/* Firestore Reads */}
              {firestoreOps && (
                <StorageUsageChart
                  used={firestoreOps.estimatedReadsPerDay}
                  limit={firestoreOps.limit.readsPerDay}
                  unit={t('settings.admin.units.readsPerDay')}
                  label={t('settings.admin.charts.firestoreReads')}
                  icon="database"
                  color={{ from: 'from-cyan-500', to: 'to-cyan-600' }}
                />
              )}

              {/* Firestore Writes */}
              {firestoreOps && (
                <StorageUsageChart
                  used={firestoreOps.estimatedWritesPerDay}
                  limit={firestoreOps.limit.writesPerDay}
                  unit={t('settings.admin.units.writesPerDay')}
                  label={t('settings.admin.charts.firestoreWrites')}
                  icon="edit"
                  color={{ from: 'from-pink-500', to: 'to-pink-600' }}
                />
              )}

              {/* Cloudinary Storage */}
              {cloudinaryUsage && (
                <StorageUsageChart
                  used={cloudinaryUsage.usedStorageMB}
                  limit={cloudinaryUsage.limit.storageLimitMB}
                  unit="MB"
                  label={t('settings.admin.charts.cloudinaryImages')}
                  icon="image"
                  color={{ from: 'from-green-500', to: 'to-green-600' }}
                />
              )}

              {/* Total Images Count */}
              {cloudinaryUsage && (
                <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">{t('settings.admin.charts.totalImages')}</h3>
                      <p className="text-sm text-gray-500">Cloudinary</p>
                    </div>
                  </div>
                  <p className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-2">
                    {cloudinaryUsage.totalImages}
                  </p>
                  <p className="text-sm text-gray-500">{t('settings.admin.charts.imagesStored')}</p>
                  
                  {firebaseUsage && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500">{t('settings.admin.charts.users')}</p>
                          <p className="font-semibold text-gray-800">{firebaseUsage.usersCount}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{t('settings.admin.charts.memories')}</p>
                          <p className="font-semibold text-gray-800">{firebaseUsage.memoriesCount}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Users Tab Content */}
        {activeTab === 'users' && (
          <>
            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm font-medium">{t('settings.admin.userManagement.totalUsers')}</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      {users.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm font-medium">{t('settings.admin.userManagement.admins')}</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {users.filter((u) => u.role === 'SysAdmin').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-2xl shadow-xl p-6 backdrop-blur-sm bg-opacity-90">
          <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserCog className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-800">{t('settings.admin.userManagement.title')}</h2>
              </div>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                {t('common.refresh')}
              </button>
            </div>

            {/* Search & Filters Bar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Search Input */}
              <div className="md:col-span-5 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('settings.admin.userManagement.searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Role Filter */}
              <div className="md:col-span-3 relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as 'all' | 'User' | 'SysAdmin')}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none appearance-none bg-white cursor-pointer"
                >
                  <option value="all">{t('settings.admin.userManagement.allRoles')}</option>
                  <option value="User">{t('settings.admin.userManagement.usersOnly')}</option>
                  <option value="SysAdmin">{t('settings.admin.userManagement.adminOnly')}</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="md:col-span-3 relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'email' | 'date')}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none appearance-none bg-white cursor-pointer"
                >
                  <option value="date">{t('settings.admin.userManagement.sortByDate')}</option>
                  <option value="name">{t('settings.admin.userManagement.sortByName')}</option>
                  <option value="email">{t('settings.admin.userManagement.sortByEmail')}</option>
                </select>
              </div>

              {/* Sort Order */}
              <div className="md:col-span-1">
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="w-full h-full px-3 py-2.5 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
                  title={sortOrder === 'asc' ? t('settings.admin.userManagement.ascending') : t('settings.admin.userManagement.descending')}
                >
                  {sortOrder === 'asc' ? (
                    <SortAsc className="w-5 h-5 text-gray-600 group-hover:text-purple-600 mx-auto" />
                  ) : (
                    <SortDesc className="w-5 h-5 text-gray-600 group-hover:text-purple-600 mx-auto" />
                  )}
                </button>
              </div>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between text-sm">
              <p className="text-gray-600">
                {filteredUsers.length} {t('settings.admin.userManagement.results')}
              </p>
              {(searchQuery || roleFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setRoleFilter('all');
                  }}
                  className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  {t('settings.admin.userManagement.clearFilters')}
                </button>
              )}
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
                <Users className="w-16 h-16 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg font-medium mb-2">
                {searchQuery || roleFilter !== 'all' ? t('settings.admin.userManagement.noUsersFiltered') : t('settings.admin.userManagement.noUsers')}
              </p>
              {(searchQuery || roleFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setRoleFilter('all');
                  }}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  {t('settings.admin.userManagement.clearFilters')}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4 mt-6">
              {filteredUsers.map((user) => (
                <div
                  key={user.uid}
                  className={`border-2 rounded-xl p-5 transition-all duration-300 ${
                    activePanel?.userId === user.uid
                      ? 'border-purple-500 bg-purple-50 shadow-lg'
                      : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {user.displayName ? user.displayName[0].toUpperCase() : '👤'}
                      </div>
                      <div>
                        <p className="font-semibold text-lg text-gray-800">
                          {user.displayName || t('settings.admin.userManagement.noName')}
                        </p>
                        <p className="text-gray-500 text-sm">{user.email}</p>
                        <p className="text-gray-400 text-xs mt-1">
                          {t('settings.admin.userManagement.created')}: {formatDate(user.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Role Badge */}
                      <span
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${
                          user.role === 'SysAdmin'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {user.role === 'SysAdmin' ? (
                          <>
                            <Shield className="w-4 h-4" />
                            {t('settings.admin.userManagement.admin')}
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            {t('settings.admin.userManagement.user')}
                          </>
                        )}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${
                          (user as any).status === 'Removed'
                            ? 'bg-red-100 text-red-700 border-2 border-red-300'
                            : (user as any).status === 'Suspended'
                            ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
                            : 'bg-green-100 text-green-700 border-2 border-green-300'
                        }`}
                      >
                        {(user as any).status === 'Removed' ? (
                          <>
                            <Ban className="w-4 h-4" />
                            {t('settings.admin.userManagement.removed')}
                          </>
                        ) : (user as any).status === 'Suspended' ? (
                          <>
                            <UserX className="w-4 h-4" />
                            {t('settings.admin.userManagement.suspended')}
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4" />
                            {t('settings.admin.userManagement.active')}
                          </>
                        )}
                      </span>

                      <button
                        onClick={() => setDetailsModalUser(user)}
                        className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all group"
                        title={t('settings.admin.userManagement.viewDetails')}
                      >
                        <Info className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </button>

                      <button
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          activePanel?.userId === user.uid && activePanel?.type === 'role'
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                        }`}
                        onClick={() => setActivePanel(activePanel?.userId === user.uid && activePanel?.type === 'role' ? null : { userId: user.uid, type: 'role' })}
                        disabled={roleChangeInProgress === user.uid}
                      >
                        {activePanel?.userId === user.uid && activePanel?.type === 'role' ? (
                          <>
                            <X className="w-4 h-4" />
                            {t('settings.admin.userManagement.close')}
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            {t('settings.admin.userManagement.changeRole')}
                          </>
                        )}
                      </button>

                      <button
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          activePanel?.userId === user.uid && activePanel?.type === 'status'
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                        }`}
                        onClick={() => setActivePanel(activePanel?.userId === user.uid && activePanel?.type === 'status' ? null : { userId: user.uid, type: 'status' })}
                        disabled={statusChangeInProgress === user.uid}
                      >
                        {activePanel?.userId === user.uid && activePanel?.type === 'status' ? (
                          <>
                            <X className="w-4 h-4" />
                            {t('settings.admin.userManagement.close')}
                          </>
                        ) : (
                          <>
                            <UserCog className="w-4 h-4" />
                            {t('settings.admin.userManagement.manageStatus')}
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Status Change Options */}
                  {activePanel?.userId === user.uid && activePanel?.type === 'status' && (
                    <div className="mt-4 pt-4 border-t border-blue-200 bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-5 h-5 text-blue-600" />
                        <p className="text-sm font-semibold text-gray-700">{t('settings.admin.userManagement.updateUserStatus')}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            (user as any).status === 'Active' || !(user as any).status
                              ? 'border-green-400 bg-green-50 ring-2 ring-green-300 shadow-md'
                              : 'border-green-300 hover:border-green-500 hover:shadow-md bg-white'
                          }`}
                          onClick={() => handleChangeStatus(user.uid, 'Active')}
                          disabled={statusChangeInProgress === user.uid || (user as any).status === 'Active' || !(user as any).status}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <UserCheck className="w-5 h-5 text-green-600" />
                            <span className="font-semibold text-gray-800">{t('settings.admin.userManagement.active')}</span>
                            {((user as any).status === 'Active' || !(user as any).status) && (
                              <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{t('settings.admin.userManagement.activeDesc')}</span>
                        </button>

                        <button
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            (user as any).status === 'Suspended'
                              ? 'border-yellow-400 bg-yellow-50 ring-2 ring-yellow-300 shadow-md'
                              : 'border-yellow-300 hover:border-yellow-500 hover:shadow-md bg-white'
                          }`}
                          onClick={() => handleChangeStatus(user.uid, 'Suspended')}
                          disabled={statusChangeInProgress === user.uid || (user as any).status === 'Suspended'}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <UserX className="w-5 h-5 text-yellow-600" />
                            <span className="font-semibold text-gray-800">{t('settings.admin.userManagement.suspended')}</span>
                            {(user as any).status === 'Suspended' && (
                              <CheckCircle className="w-5 h-5 text-yellow-600 ml-auto" />
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{t('settings.admin.userManagement.suspendedDesc')}</span>
                        </button>

                        <button
                          className="p-4 rounded-xl border-2 border-gray-300 bg-gray-100 cursor-not-allowed opacity-60 transition-all duration-200"
                          disabled={true}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <Ban className="w-5 h-5 text-gray-500" />
                            <span className="font-semibold text-gray-600">{t('settings.admin.userManagement.removed')}</span>
                          </div>
                          <span className="text-xs text-gray-500">{t('settings.admin.userManagement.removedDesc')} (Coming Soon)</span>
                        </button>
                      </div>
                      {statusChangeInProgress === user.uid && (
                        <div className="flex items-center justify-center gap-2 mt-4 text-blue-600">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          <span className="text-sm font-medium">{t('settings.admin.userManagement.updatingStatus')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Role Change Options */}
                  {activePanel?.userId === user.uid && activePanel?.type === 'role' && (
                    <div className="mt-4 pt-4 border-t border-purple-200">
                      <p className="text-sm font-semibold text-gray-700 mb-3">{t('settings.admin.userManagement.selectNewRole')}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            user.role === 'User'
                              ? 'border-gray-400 bg-gray-100 cursor-not-allowed'
                              : 'border-gray-300 hover:border-blue-500 hover:shadow-md'
                          }`}
                          onClick={() => handleChangeRole(user.uid, 'User')}
                          disabled={roleChangeInProgress === user.uid || user.role === 'User'}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                            <span className="font-semibold text-gray-800">{t('settings.admin.userManagement.regularUser')}</span>
                          </div>
                          <span className="text-xs text-gray-500">{t('settings.admin.userManagement.regularUserDesc')}</span>
                        </button>

                        <button
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            user.role === 'SysAdmin'
                              ? 'border-purple-400 bg-purple-100 cursor-not-allowed'
                              : 'border-purple-300 hover:border-purple-500 hover:shadow-md'
                          }`}
                          onClick={() => handleChangeRole(user.uid, 'SysAdmin')}
                          disabled={roleChangeInProgress === user.uid || user.role === 'SysAdmin'}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <Shield className="w-5 h-5 text-purple-600" />
                            <span className="font-semibold text-gray-800">{t('settings.admin.userManagement.systemAdmin')}</span>
                          </div>
                          <span className="text-xs text-gray-500">{t('settings.admin.userManagement.systemAdminDesc')}</span>
                        </button>
                      </div>
                      {roleChangeInProgress === user.uid && (
                        <div className="flex items-center justify-center gap-2 mt-4 text-purple-600">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                          <span className="text-sm font-medium">{t('settings.admin.userManagement.updatingRole')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin Info Section */}
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 text-white">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6" />
            {t('settings.admin.panelInfo.title')}
          </h3>
          <ul className="space-y-3 text-purple-100">
            <li className="flex items-center gap-3">
              <span className="text-2xl">🔐</span>
              <div>
                <strong className="text-white">{t('settings.admin.panelInfo.userRole')}</strong> {t('settings.admin.panelInfo.userRoleDesc')}
              </div>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl">👥</span>
              <div>
                <strong className="text-white">{t('settings.admin.panelInfo.userManagement')}</strong> {t('settings.admin.panelInfo.userManagementDesc')}
              </div>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl">🛡️</span>
              <div>
                <strong className="text-white">{t('settings.admin.panelInfo.accessControl')}</strong> {t('settings.admin.panelInfo.accessControlDesc')}
              </div>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <strong className="text-white">{t('settings.admin.panelInfo.auditTrail')}</strong> {t('settings.admin.panelInfo.auditTrailDesc')}
              </div>
            </li>
          </ul>
        </div>
          </>
        )}
      </div>

      {/* User Details Modal */}
      {detailsModalUser && (
        <UserDetailsModal
          user={detailsModalUser}
          onClose={() => setDetailsModalUser(null)}
        />
      )}

      {/* Status Confirmation Modal */}
      {statusConfirmModal?.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className={`p-6 ${
              statusConfirmModal.newStatus === 'Active'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : statusConfirmModal.newStatus === 'Suspended' 
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                : 'bg-gradient-to-r from-red-500 to-pink-600'
            }`}>
              <div className="flex items-center gap-3 text-white">
                <div className="p-3 bg-white/20 rounded-full">
                  {statusConfirmModal.newStatus === 'Active' ? (
                    <UserCheck className="w-6 h-6" />
                  ) : statusConfirmModal.newStatus === 'Suspended' ? (
                    <AlertCircle className="w-6 h-6" />
                  ) : (
                    <UserX className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {statusConfirmModal.newStatus === 'Active'
                      ? t('settings.language') === 'vi' ? 'Xác Nhận Kích Hoạt' : 'Confirm Activation'
                      : statusConfirmModal.newStatus === 'Suspended' 
                      ? t('settings.language') === 'vi' ? 'Xác Nhận Tạm Ngưng' : 'Confirm Suspension'
                      : t('settings.language') === 'vi' ? 'Xác Nhận Xóa' : 'Confirm Removal'
                    }
                  </h3>
                  <p className="text-white/90 text-sm mt-1">
                    {t('settings.language') === 'vi' ? 'Hành động này sẽ có hiệu lực ngay lập tức' : 'This action will take effect immediately'}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700 mb-3">
                  {t('settings.language') === 'vi' 
                    ? `Bạn có chắc chắn muốn ${
                        statusConfirmModal.newStatus === 'Active' ? 'kích hoạt' :
                        statusConfirmModal.newStatus === 'Suspended' ? 'tạm ngưng' : 'xóa'
                      } tài khoản của:`
                    : `Are you sure you want to ${
                        statusConfirmModal.newStatus === 'Active' ? 'activate' :
                        statusConfirmModal.newStatus === 'Suspended' ? 'suspend' : 'remove'
                      } the account of:`
                  }
                </p>
                <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                  <p className="font-semibold text-gray-900 text-lg">{statusConfirmModal.userName}</p>
                </div>
              </div>

              {statusConfirmModal.newStatus !== 'Active' && (
                <div className={`rounded-lg p-4 mb-4 ${
                  statusConfirmModal.newStatus === 'Suspended' 
                    ? 'bg-yellow-50 border-2 border-yellow-200' 
                    : 'bg-red-50 border-2 border-red-200'
                }`}>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <AlertCircle className={`w-5 h-5 ${
                        statusConfirmModal.newStatus === 'Suspended' ? 'text-yellow-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div>
                      <p className={`font-medium mb-1 ${
                        statusConfirmModal.newStatus === 'Suspended' ? 'text-yellow-900' : 'text-red-900'
                      }`}>
                        {t('settings.language') === 'vi' ? 'Cảnh báo:' : 'Warning:'}
                      </p>
                      <p className={`text-sm ${
                        statusConfirmModal.newStatus === 'Suspended' ? 'text-yellow-800' : 'text-red-800'
                      }`}>
                        {t('settings.language') === 'vi' 
                          ? 'Người dùng này sẽ bị đăng xuất ngay lập tức và không thể truy cập hệ thống.'
                          : 'This user will be immediately logged out and cannot access the system.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() => setStatusConfirmModal(null)}
                disabled={statusChangeInProgress !== null}
                className="px-6 py-2.5 rounded-lg font-medium text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('settings.language') === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button
                onClick={() => executeStatusChange(statusConfirmModal.userId, statusConfirmModal.newStatus)}
                disabled={statusChangeInProgress !== null}
                className={`px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                  statusConfirmModal.newStatus === 'Active'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/30'
                    : statusConfirmModal.newStatus === 'Suspended'
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg shadow-yellow-500/30'
                    : 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-lg shadow-red-500/30'
                }`}
              >
                {statusChangeInProgress !== null && (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                )}
                {t('settings.language') === 'vi' ? 'Xác Nhận' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
