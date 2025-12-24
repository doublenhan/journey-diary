/**
 * User Details Modal Component
 * Displays detailed information about a user
 */

import React, { useState, useEffect } from 'react';
import { X, User, Calendar, Image, Database, Activity, Mail, Shield, Clock } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase/firebaseConfig';
import { SkeletonModal } from './Skeleton';

interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  role: 'User' | 'SysAdmin';
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserStats {
  totalMemories: number;
  totalImages: number;
  estimatedStorageMB: number;
  lastMemoryDate?: Date;
}

interface UserDetailsModalProps {
  user: UserData;
  onClose: () => void;
}

const ENV_PREFIX = import.meta.env.VITE_ENV_PREFIX || 'dev';

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ user, onClose }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      const memoriesCollection = `${ENV_PREFIX}memories`;
      
      console.log('🔍 DEBUG INFO:');
      console.log('- ENV_PREFIX:', ENV_PREFIX);
      console.log('- Collection name:', memoriesCollection);
      console.log('- User UID:', user.uid);
      console.log('- DB instance:', db.app.options.projectId);
      
      // Wait for auth to be ready
      const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
        if (!currentUser) {
          console.error('❌ No authenticated user');
          setStats({
            totalMemories: 0,
            totalImages: 0,
            estimatedStorageMB: 0,
            lastMemoryDate: undefined
          });
          setLoading(false);
          return;
        }
        
        console.log('✅ Auth ready, user:', currentUser.uid);
        console.log('📁 Fetching from collection:', memoriesCollection);
        console.log('👤 Target user stats:', user.uid);
        
        setLoading(true);
        
        const memoriesRef = collection(db, memoriesCollection);
        console.log('📂 Collection path:', memoriesRef.path);
        
        getDocs(memoriesRef)
          .then((memoriesSnapshot) => {
            console.log('✅ Fetched', memoriesSnapshot.size, 'total memories');
            
            const userMemories = memoriesSnapshot.docs.filter(doc => doc.data().userId === user.uid);
            console.log('📊 User has', userMemories.length, 'memories');
            
            const totalMemories = userMemories.length;
            let totalImages = 0;
            let estimatedStorageMB = 0;
            let lastMemoryDate: Date | undefined;
            
            userMemories.forEach((doc) => {
              const data = doc.data();
              const images = data.cloudinaryPublicIds || data.photos || [];
              totalImages += images.length;
              estimatedStorageMB += (images.length * 0.5);
              
              if (data.createdAt) {
                const memoryDate = data.createdAt.toDate();
                if (!lastMemoryDate || memoryDate > lastMemoryDate) {
                  lastMemoryDate = memoryDate;
                }
              }
            });
            
            console.log('✅ Stats calculated:', { totalMemories, totalImages, estimatedStorageMB });
            
            setStats({
              totalMemories,
              totalImages,
              estimatedStorageMB: parseFloat(estimatedStorageMB.toFixed(2)),
              lastMemoryDate
            });
            setLoading(false);
          })
          .catch((error) => {
            console.error('❌ Error fetching memories:', error);
            console.error('❌ Error code:', error.code);
            console.error('❌ Error message:', error.message);
            console.error('❌ Full error:', JSON.stringify(error, null, 2));
            
            setStats({
              totalMemories: 0,
              totalImages: 0,
              estimatedStorageMB: 0,
              lastMemoryDate: undefined
            });
            setLoading(false);
          });
      });
      
      return () => unsubscribe();
    };

    fetchUserStats();
  }, [user.uid]);

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

  const getTimeSince = (date?: Date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-xl border-2 border-white border-opacity-30">
              {user.displayName ? user.displayName[0].toUpperCase() : <User className="w-8 h-8" />}
            </div>
            <div className="text-white">
              <h2 className="text-2xl font-bold">{user.displayName || 'No Name'}</h2>
              <p className="text-purple-100 text-sm">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {loading ? (
            <SkeletonModal />
          ) : (
            <>
              {/* Role Badge */}
              <div className="mb-6">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-500 font-medium">Role</span>
            </div>
            <div className="mt-2">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${
                user.role === 'SysAdmin'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {user.role === 'SysAdmin' && <Shield className="w-4 h-4" />}
                {user.role}
              </span>
            </div>
          </div>

          {/* Account Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Account Created</span>
              </div>
              <p className="text-blue-800 font-semibold">{formatDate(user.createdAt)}</p>
              <p className="text-blue-600 text-xs mt-1">{getTimeSince(user.createdAt)}</p>
            </div>

            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">Last Updated</span>
              </div>
              <p className="text-green-800 font-semibold">{formatDate(user.updatedAt)}</p>
              <p className="text-green-600 text-xs mt-1">{getTimeSince(user.updatedAt)}</p>
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-gray-700" />
              <h3 className="text-lg font-bold text-gray-800">Usage Statistics</h3>
            </div>

            {stats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">Total Memories</span>
                  </div>
                  <p className="text-3xl font-bold text-purple-800">{stats.totalMemories}</p>
                </div>

                <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Image className="w-5 h-5 text-pink-600" />
                    <span className="text-sm font-medium text-pink-900">Total Images</span>
                  </div>
                  <p className="text-3xl font-bold text-pink-800">{stats.totalImages}</p>
                </div>

                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-900">Storage Used</span>
                  </div>
                  <p className="text-3xl font-bold text-indigo-800">{stats.estimatedStorageMB}</p>
                  <p className="text-indigo-600 text-xs mt-1">MB</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Failed to load statistics
              </div>
            )}
          </div>

          {/* Last Activity */}
          {stats?.lastMemoryDate && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">Last Memory Created</span>
              </div>
              <p className="text-orange-800 font-semibold">{formatDate(stats.lastMemoryDate)}</p>
              <p className="text-orange-600 text-sm mt-1">{getTimeSince(stats.lastMemoryDate)}</p>
            </div>
          )}

          {/* User ID for reference */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500 font-medium">User ID</span>
            </div>
            <code className="text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded font-mono break-all block">
              {user.uid}
            </code>
          </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
