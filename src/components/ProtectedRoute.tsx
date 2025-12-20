/**
 * ProtectedRoute - Only allows access to admin users
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'SysAdmin' | 'User';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole = 'SysAdmin'
}) => {
  const { currentUserRole, loading } = useAdmin();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!currentUserRole) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === 'SysAdmin' && currentUserRole !== 'SysAdmin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You do not have permission to access this page</p>
          <a href="/" className="text-pink-600 hover:underline mt-4 inline-block">
            Go back to home
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
