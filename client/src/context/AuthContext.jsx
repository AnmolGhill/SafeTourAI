import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import socketService from '../services/socketService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for existing auth token on app load
    const checkAuthState = () => {
      const token = localStorage.getItem('authToken');
      const currentUser = authService.getCurrentUser();
      
      if (token) {
        setUser(currentUser || { email: 'demo@example.com', displayName: 'Demo User' });
        setIsAuthenticated(true);
        socketService.connect();
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      setLoading(false);
    };

    // Listen to auth state changes
    authService.onAuthStateChange((user) => {
      const token = localStorage.getItem('authToken');
      
      setUser(user);
      setIsAuthenticated(!!token);
      
      if (token) {
        socketService.connect();
      } else {
        socketService.disconnect();
      }
      
      setLoading(false);
    });

    // Initial auth check
    checkAuthState();
  }, []);

  const login = async (email, password) => {
    try {
      const result = await authService.login(email, password);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const result = await authService.register(userData);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
