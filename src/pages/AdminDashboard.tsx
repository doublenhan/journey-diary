/**
 * Admin Dashboard - System Administrator Panel
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { useToastContext } from '../contexts/ToastContext';
import { useLanguage } from '../hooks/useLanguage';
import { ArrowLeft, Users, Lock, Shield, CheckCircle, X, RefreshCw, Crown, UserCog } from 'lucide-react';
import { getAllStorageUsage, FirebaseUsageStats, CloudinaryUsageStats, AuthenticationUsageStats, CloudFunctionsUsageStats, FirestoreOperationsStats, triggerStatsUpdate } from '../apis/storageUsageApi';
import StorageUsageChart from '../components/StorageUsageChart';

interface AdminDashboardProps {
  onBack?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const { users, fetchUsers, changeUserRole, currentUserRole, loading: contextLoading, hasLoadedUsers } = useAdmin();
  const { success: showSuccess, error: showError } = useToastContext();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [roleChangeInProgress, setRoleChangeInProgress] = useState<string | null>(null);
  const [firebaseUsage, setFirebaseUsage] = useState<FirebaseUsageStats | null>(null);
  const [cloudinaryUsage, setCloudinaryUsage] = useState<CloudinaryUsageStats | null>(null);
  const [authUsage, setAuthUsage] = useState<AuthenticationUsageStats | null>(null);
  const [functionsUsage, setFunctionsUsage] = useState<CloudFunctionsUsageStats | null>(null);
  const [firestoreOps, setFirestoreOps] = useState<FirestoreOperationsStats | null>(null);
  const [storageLoading, setStorageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'usage' | 'users'>('usage');
  const [storageError, setStorageError] = useState<string | null>(null);

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

  const handleChangeRole = async (userId: string, newRole: 'User' | 'SysAdmin') => {
    try {
      setRoleChangeInProgress(userId);
      await changeUserRole(userId, newRole);
      showSuccess(`User role changed to ${newRole}`);
      setSelectedUser(null);
    } catch (err) {
      showError('Failed to change role: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setRoleChangeInProgress(null);
    }
  };

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

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading admin dashboard...</p>
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
                    </div>
                  </div>
                </div>
              )}
              
              {storageLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                  <span className="ml-3 text-gray-600">{t('settings.admin.loading')}</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Firebase Storage */}
              {firebaseUsage && (
                <StorageUsageChart
                  used={firebaseUsage.estimatedStorageMB / 1024}
                  limit={firebaseUsage.limit.storageLimitGB}
                  unit="GB"
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
                  used={functionsUsage.estimatedInvocationsPerDay * 30}
                  limit={functionsUsage.limit.invocationsPerMonth}
                  unit={t('settings.admin.units.calls')}
                  label={t('settings.admin.charts.cloudFunctions')}
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
                  used={cloudinaryUsage.usedStorageMB / 1024}
                  limit={cloudinaryUsage.limit.storageLimitGB}
                  unit="GB"
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
                    <p className="text-gray-500 text-sm font-medium">Total Users</p>
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
                    <p className="text-gray-500 text-sm font-medium">Administrators</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {users.filter((u) => u.role === 'SysAdmin').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-2xl shadow-xl p-6 backdrop-blur-sm bg-opacity-90">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <UserCog className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              Refresh
            </button>
          </div>

          {users.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
                <Users className="w-16 h-16 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">No users found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.uid}
                  className={`border-2 rounded-xl p-5 transition-all duration-300 ${
                    selectedUser === user.uid
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
                          {user.displayName || 'No name'}
                        </p>
                        <p className="text-gray-500 text-sm">{user.email}</p>
                        <p className="text-gray-400 text-xs mt-1">
                          Created: {formatDate(user.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
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
                            Admin
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            User
                          </>
                        )}
                      </span>

                      <button
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          selectedUser === user.uid
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                        }`}
                        onClick={() => setSelectedUser(selectedUser === user.uid ? null : user.uid)}
                        disabled={roleChangeInProgress === user.uid}
                      >
                        {selectedUser === user.uid ? (
                          <>
                            <X className="w-4 h-4" />
                            Close
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            Change Role
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Role Change Options */}
                  {selectedUser === user.uid && (
                    <div className="mt-4 pt-4 border-t border-purple-200">
                      <p className="text-sm font-semibold text-gray-700 mb-3">Select new role:</p>
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
                            <span className="font-semibold text-gray-800">Regular User</span>
                          </div>
                          <span className="text-xs text-gray-500">Can manage personal data only</span>
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
                            <span className="font-semibold text-gray-800">System Admin</span>
                          </div>
                          <span className="text-xs text-gray-500">Full access to all users and system</span>
                        </button>
                      </div>
                      {roleChangeInProgress === user.uid && (
                        <div className="flex items-center justify-center gap-2 mt-4 text-purple-600">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                          <span className="text-sm font-medium">Updating role...</span>
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
            Admin Panel Information
          </h3>
          <ul className="space-y-3 text-purple-100">
            <li className="flex items-center gap-3">
              <span className="text-2xl">🔐</span>
              <div>
                <strong className="text-white">User Role:</strong> You are logged in as a System Administrator
                with full access to all user data and system settings
              </div>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl">👥</span>
              <div>
                <strong className="text-white">User Management:</strong> Change user roles between "User" and
                "SysAdmin"
              </div>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl">🛡️</span>
              <div>
                <strong className="text-white">Access Control:</strong> Only users with SysAdmin role can access
                this dashboard
              </div>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <strong className="text-white">Audit Trail:</strong> Role changes are logged with timestamp and
                admin user ID
              </div>
            </li>
          </ul>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
