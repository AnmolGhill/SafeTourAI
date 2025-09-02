import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const location = useLocation();

  // Check authentication from localStorage
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    return !!(token && userData);
  };

  // Get current user from localStorage
  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  };

  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const user = getCurrentUser();

  // Check role-based access
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
          <p className="text-sm text-gray-500 mt-2">Required: {requiredRole}, Your role: {user?.role || 'unknown'}</p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
