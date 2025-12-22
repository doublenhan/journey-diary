/**
 * Admin Dashboard - System Administrator Panel
 */

import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { useToastContext } from '../contexts/ToastContext';
import { useLanguage } from '../hooks/useLanguage';
import { ArrowLeft, Users, Lock, Shield, CheckCircle, X } from 'lucide-react';
import '../styles/AdminDashboard.css';

interface AdminDashboardProps {
  onBack?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const { users, fetchUsers, changeUserRole, currentUserRole, loading: contextLoading } = useAdmin();
  const { success: showSuccess, error: showError } = useToastContext();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [roleChangeInProgress, setRoleChangeInProgress] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    loadUsers(true); // true = initial load (no toast)
    setIsInitialLoad(false);
  }, []);

  const loadUsers = async (skipToast = false) => {
    try {
      setLoading(true);
      await fetchUsers();
      if (!skipToast) {
        showSuccess('Users loaded successfully');
      }
    } catch (err) {
      showError('Failed to load users: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

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
      <div className="admin-dashboard-loading">
        <div className="spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-dashboard-header">
        <div className="header-content">
          <button onClick={onBack} className="back-button">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="header-title">
            <Shield className="w-6 h-6" />
            <h1>System Administration Dashboard</h1>
          </div>
          <div className="header-info">
            <span className="admin-badge">
              <Lock className="w-4 h-4" />
              Admin Access
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-dashboard-content">
        {/* Stats Section */}
        <div className="stats-section">
          <div className="stat-card">
            <Users className="w-8 h-8" />
            <div>
              <p className="stat-label">Total Users</p>
              <p className="stat-value">{users.length}</p>
            </div>
          </div>
          <div className="stat-card">
            <Shield className="w-8 h-8" />
            <div>
              <p className="stat-label">Administrators</p>
              <p className="stat-value">{users.filter((u) => u.role === 'SysAdmin').length}</p>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="users-section">
          <div className="section-header">
            <h2>User Management</h2>
            <button onClick={() => loadUsers(false)} disabled={loading} className="refresh-button">
              🔄 Refresh
            </button>
          </div>

          {users.length === 0 ? (
            <div className="empty-state">
              <Users className="w-12 h-12" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="users-list">
              {users.map((user) => (
                <div key={user.uid} className={`user-row ${selectedUser === user.uid ? 'selected' : ''}`}>
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.displayName ? user.displayName[0].toUpperCase() : '👤'}
                    </div>
                    <div className="user-details">
                      <p className="user-name">{user.displayName || 'No name'}</p>
                      <p className="user-email">{user.email}</p>
                      <p className="user-dates">
                        Created: {formatDate(user.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="user-role">
                    <span className={`role-badge ${user.role.toLowerCase()}`}>
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
                  </div>

                  <div className="user-actions">
                    <button
                      className="action-button"
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

                  {/* Role Change Options */}
                  {selectedUser === user.uid && (
                    <div className="role-change-panel">
                      <p className="panel-title">Select new role:</p>
                      <div className="role-options">
                        <button
                          className={`role-option ${user.role === 'User' ? 'active' : ''}`}
                          onClick={() => handleChangeRole(user.uid, 'User')}
                          disabled={roleChangeInProgress === user.uid || user.role === 'User'}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Regular User
                          <span className="role-desc">Can manage personal data only</span>
                        </button>

                        <button
                          className={`role-option ${user.role === 'SysAdmin' ? 'active' : ''}`}
                          onClick={() => handleChangeRole(user.uid, 'SysAdmin')}
                          disabled={roleChangeInProgress === user.uid || user.role === 'SysAdmin'}
                        >
                          <Shield className="w-4 h-4" />
                          System Admin
                          <span className="role-desc">Full access to all users and system</span>
                        </button>
                      </div>
                      {roleChangeInProgress === user.uid && (
                        <div className="loading-indicator">
                          <div className="spinner-small"></div>
                          Updating role...
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
        <div className="admin-info-section">
          <h3>📋 Admin Panel Information</h3>
          <ul className="info-list">
            <li>
              <strong>User Role:</strong> You are logged in as a System Administrator with full access to all
              user data and system settings
            </li>
            <li>
              <strong>User Management:</strong> Change user roles between "User" and "SysAdmin"
            </li>
            <li>
              <strong>Access Control:</strong> Only users with SysAdmin role can access this dashboard
            </li>
            <li>
              <strong>Audit Trail:</strong> Role changes are logged with timestamp and admin user ID
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
