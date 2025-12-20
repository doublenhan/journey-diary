/**
 * Database Migration Tool
 * Admin utility to migrate and verify Firestore data
 */

import React, { useState } from 'react';
import { useToastContext } from '../contexts/ToastContext';
import { migrateUsersAddRole, verifyUserMigration } from '../services/firebaseUserMigration';
import { ArrowLeft, Database, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import '../styles/MigrationTool.css';

interface MigrationStats {
  total?: number;
  updated?: number;
  skipped?: number;
  withRole?: number;
  withoutRole?: number;
  users?: any[];
}

interface MigrationToolProps {
  onBack?: () => void;
}

const MigrationTool: React.FC<MigrationToolProps> = ({ onBack }) => {
  const { success: showSuccess, error: showError, info: showInfo } = useToastContext();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<MigrationStats | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleMigrateUsers = async () => {
    if (!window.confirm('This will add role field to all users. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      setLog([]);
      addLog('Starting migration...');

      const result = await migrateUsersAddRole();

      setStats(result);
      addLog(`✅ Migration complete! Updated: ${result.updated}, Skipped: ${result.skipped}`);
      showSuccess(`Migration complete! Updated ${result.updated} users`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Migration failed';
      addLog(`❌ Error: ${errorMsg}`);
      showError(`Migration failed: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setLoading(true);
      setLog([]);
      addLog('Verifying migration...');

      const result = await verifyUserMigration();

      setStats(result);
      addLog(`✅ Verification complete!`);
      addLog(`Total users: ${result.total}`);
      addLog(`With role: ${result.withRole}`);
      addLog(`Without role: ${result.withoutRole}`);

      showSuccess('Verification complete');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Verification failed';
      addLog(`❌ Error: ${errorMsg}`);
      showError(`Verification failed: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLog = () => {
    setLog([]);
    setStats(null);
  };

  return (
    <div className="migration-tool">
      {/* Header */}
      <div className="migration-header">
        <button onClick={onBack} className="back-button">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="header-title">
          <Database className="w-6 h-6" />
          <h1>Database Migration Tool</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="migration-content">
        {/* Actions Section */}
        <div className="migration-actions">
          <div className="action-card">
            <h3>🔄 Add Role to Users</h3>
            <p>Update all existing users to have role field (default: 'User')</p>
            <button
              onClick={handleMigrateUsers}
              disabled={loading}
              className="action-button primary"
            >
              <RefreshCw className="w-4 h-4" />
              {loading ? 'Running...' : 'Migrate Users'}
            </button>
          </div>

          <div className="action-card">
            <h3>✅ Verify Migration</h3>
            <p>Check that all users have role field correctly set</p>
            <button
              onClick={handleVerify}
              disabled={loading}
              className="action-button"
            >
              <CheckCircle className="w-4 h-4" />
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </div>

        {/* Log Section */}
        <div className="migration-log">
          <div className="log-header">
            <h3>📋 Migration Log</h3>
            <button
              onClick={handleClearLog}
              className="clear-button"
              disabled={log.length === 0}
            >
              Clear
            </button>
          </div>

          <div className="log-content">
            {log.length === 0 ? (
              <div className="log-empty">No logs yet. Run a migration or verification.</div>
            ) : (
              <pre className="log-text">
                {log.map((msg, idx) => (
                  <div key={idx} className="log-line">
                    {msg}
                  </div>
                ))}
              </pre>
            )}
          </div>
        </div>

        {/* Stats Section */}
        {stats && (
          <div className="migration-stats">
            <h3>📊 Statistics</h3>
            <div className="stats-grid">
              {stats.total !== undefined && (
                <div className="stat">
                  <span className="stat-label">Total Users</span>
                  <span className="stat-value">{stats.total}</span>
                </div>
              )}
              {stats.updated !== undefined && (
                <div className="stat">
                  <span className="stat-label">Updated</span>
                  <span className="stat-value" style={{ color: '#22c55e' }}>
                    {stats.updated}
                  </span>
                </div>
              )}
              {stats.skipped !== undefined && (
                <div className="stat">
                  <span className="stat-label">Skipped</span>
                  <span className="stat-value" style={{ color: '#f59e0b' }}>
                    {stats.skipped}
                  </span>
                </div>
              )}
              {stats.withRole !== undefined && (
                <div className="stat">
                  <span className="stat-label">With Role</span>
                  <span className="stat-value" style={{ color: '#22c55e' }}>
                    {stats.withRole}
                  </span>
                </div>
              )}
              {stats.withoutRole !== undefined && (
                <div className="stat">
                  <span className="stat-label">Without Role</span>
                  <span className="stat-value" style={{ color: '#ef4444' }}>
                    {stats.withoutRole}
                  </span>
                </div>
              )}
            </div>

            {stats.users && stats.users.length > 0 && (
              <div className="users-table">
                <h4>User Details</h4>
                <table>
                  <thead>
                    <tr>
                      <th>UID</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Role Assigned At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.users.map((user) => (
                      <tr key={user.uid}>
                        <td className="uid-cell">{user.uid}</td>
                        <td>{user.email || 'N/A'}</td>
                        <td>
                          <span
                            className={`role-badge ${user.role.toLowerCase()}`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td>{user.roleAssignedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="migration-info">
          <h3>ℹ️ Information</h3>
          <div className="info-list">
            <div className="info-item">
              <strong>What does this tool do?</strong>
              <p>
                This tool migrates existing users to have a role field. If a user doesn't have a role, it assigns the
                default 'User' role.
              </p>
            </div>
            <div className="info-item">
              <strong>Collection</strong>
              <p>
                Data is saved to the correct collection based on environment:
                <br />
                <code>Dev: dev_users</code>
                <br />
                <code>Prod: users</code>
              </p>
            </div>
            <div className="info-item">
              <strong>Fields Added</strong>
              <ul>
                <li>
                  <code>role</code> - User or SysAdmin
                </li>
                <li>
                  <code>roleAssignedAt</code> - Timestamp when role was assigned
                </li>
                <li>
                  <code>migratedAt</code> - Timestamp of migration
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MigrationTool;
