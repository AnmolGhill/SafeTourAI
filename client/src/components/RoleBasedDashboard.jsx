import React, { useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../utils/auth';
import Dashboard from '../dashboard/dashboard-user';
import SubAdminDashboard from '../dashboard/dashboard-sub-admin';
import AdminDashboard from '../dashboard/dashboard-main-admin';

const RoleBasedDashboard = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [loading, isAuthenticated, navigate]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return null; // Will be redirected by useEffect
  }

  // Get user role from localStorage or user object
  const getUserRole = () => {
    // First check user object
    if (user?.role) {
      return user.role;
    }
    
    // Check localStorage for stored user data
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        return parsedUser.role || 'user';
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }
    
    // Default to user role
    return 'user';
  };

  const userRole = getUserRole();

  // Redirect based on user role
  if (userRole === 'admin') {
    return <Navigate to="/dashboard/admin" replace />;
  } else if (userRole === 'subadmin') {
    return <Navigate to="/dashboard/sub-admin" replace />;
  } else {
    // Default to user dashboard
    return <Navigate to="/dashboard-user" replace />;
  }
};

export default RoleBasedDashboard;
